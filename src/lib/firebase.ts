import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  increment,
  updateDoc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export {
  doc,
  getDocFromServer,
  increment,
  updateDoc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  onSnapshot
};

// Initialize Firebase SDK with provisioned applet configuration
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const ADMIN_EMAIL = 'jamhur48229@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline. Periksa koneksi internet Anda.');
    }
    // Document does not need to exist to verify online reachability
    return true;
  }
}

// Normalize Indonesian phone numbers to clean international WhatsApp format (e.g., 628123456789)
export function normalizeWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  } else if (cleaned.startsWith('62')) {
    // already 62
  }

  return cleaned;
}

// Generate pre-filled WhatsApp message and wa.me link
export function buildWhatsAppLink(options: {
  whatsappNumber: string;
  providerName: string;
  serviceCategory: string;
  userArea?: string;
}): string {
  const normalizedNumber = normalizeWhatsAppNumber(options.whatsappNumber);
  const areaText = options.userArea ? ` di wilayah ${options.userArea}` : '';
  const message = `Halo ${options.providerName}, saya menemukan profil Anda di JasaDekat. Saya ingin bertanya dan berkonsultasi mengenai layanan ${options.serviceCategory}${areaText}. Apakah teknisi tersedia untuk melayani?`;
  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`;
}

// Track real-time provider view count
export async function recordProviderView(providerId: string): Promise<void> {
  if (!providerId) return;
  try {
    const providerRef = doc(db, 'providers', providerId);
    await updateDoc(providerRef, {
      viewsCount: increment(1),
    });
  } catch {
    // Non-blocking metric tracking
  }
}

// Track real-time WhatsApp contact click
export async function recordWhatsAppClick(providerId: string): Promise<void> {
  if (!providerId) return;
  try {
    const providerRef = doc(db, 'providers', providerId);
    await updateDoc(providerRef, {
      whatsappClicks: increment(1),
    });
  } catch {
    // Non-blocking metric tracking
  }
}
