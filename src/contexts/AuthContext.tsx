import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db, ADMIN_EMAIL, OperationType, handleFirestoreError } from '../lib/firebase';
import { Provider, UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  providerProfile: Provider | null;
  userRole: UserRole;
  isAdmin: boolean;
  isProvider: boolean;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<User>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProviderProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [providerProfile, setProviderProfile] = useState<Provider | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('visitor');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUserData = async (user: User) => {
    try {
      // 1. Check if user is Admin (STRICTLY ONLY 1 ACCOUNT: jamhur48229@gmail.com)
      const isDesignatedAdmin =
        user.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();

      if (isDesignatedAdmin) {
        setUserRole('admin');
        setUserProfile({
          id: user.uid,
          email: user.email || '',
          role: 'admin',
          displayName: user.displayName || 'Administrator Utama',
          createdAt: new Date().toISOString(),
        });

        // Ensure admin document exists for rules
        try {
          await setDoc(
            doc(db, 'admins', user.uid),
            {
              uid: user.uid,
              email: user.email || '',
              role: 'admin',
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch {
          // Rule bootstrap fallback
        }
        return;
      }

      // 2. Fetch or load User Profile (FOR NON-ADMIN ACCOUNTS)
      let role: UserRole = 'visitor';
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const uData = userSnap.data() as UserProfile;
        // Strictly prevent any non-admin account from obtaining admin role
        const safeRole = uData.role === 'admin' ? 'provider' : (uData.role || 'provider');
        setUserProfile({ ...uData, role: safeRole });
        role = safeRole;
      } else {
        // Initial user record
        const newProfile: UserProfile = {
          id: user.uid,
          email: user.email || '',
          role: 'provider',
          displayName: user.displayName || '',
          createdAt: new Date().toISOString(),
        };
        try {
          await setDoc(userRef, newProfile);
          setUserProfile(newProfile);
          role = 'provider';
        } catch {
          setUserProfile(newProfile);
        }
      }

      // 3. Check for associated Provider record
      const providersRef = collection(db, 'providers');
      const q = query(providersRef, where('userId', '==', user.uid));
      const providerSnap = await getDocs(q);

      if (!providerSnap.empty) {
        const pDoc = providerSnap.docs[0];
        setProviderProfile({ id: pDoc.id, ...pDoc.data() } as Provider);
        role = 'provider';
      } else {
        setProviderProfile(null);
      }

      setUserRole(role);
    } catch (err) {
      console.warn('Error loading user profile:', err);
    }
  };

  const refreshProviderProfile = async () => {
    if (!currentUser) return;
    try {
      const providersRef = collection(db, 'providers');
      const q = query(providersRef, where('userId', '==', currentUser.uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const pDoc = snap.docs[0];
        setProviderProfile({ id: pDoc.id, ...pDoc.data() } as Provider);
      } else {
        setProviderProfile(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'providers');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserData(user);
      } else {
        setUserProfile(null);
        setProviderProfile(null);
        setUserRole('visitor');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (name) {
      await updateProfile(cred.user, { displayName: name });
    }
    return cred.user;
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
    setProviderProfile(null);
    setUserRole('visitor');
  };

  const isAdmin =
    userRole === 'admin' &&
    currentUser?.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
  const isProvider = userRole === 'provider' || !!providerProfile;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        providerProfile,
        userRole,
        isAdmin,
        isProvider,
        loading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        refreshProviderProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
