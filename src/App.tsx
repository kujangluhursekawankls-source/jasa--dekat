import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  addDoc,
  doc,
} from 'firebase/firestore';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import {
  db,
  testConnection,
  handleFirestoreError,
  OperationType,
} from './lib/firebase';
import {
  Category,
  FilterState,
  Provider,
  UserLocationState,
  AdminContactSettings,
} from './types';
import { INITIAL_CATEGORIES, DEFAULT_CATEGORIES, INITIAL_PROVIDERS } from './data/initialData';
import { detectUserLocation, getProviderDistance } from './lib/location';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SearchAndFilter } from './components/SearchAndFilter';
import { CategoryList } from './components/CategoryList';
import { ProviderCard } from './components/ProviderCard';
import { ProviderDetailModal } from './components/ProviderDetailModal';
import { RegisterProviderModal } from './components/RegisterProviderModal';
import { AuthModal } from './components/AuthModal';
import { ProviderDashboard } from './components/ProviderDashboard';
import { AdminPanel } from './components/AdminPanel';
import { BagiKopiModal } from './components/BagiKopiModal';
import {
  Wrench,
  Search,
  PlusCircle,
  HelpCircle,
  AlertCircle,
  Sparkles,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  Coffee,
} from 'lucide-react';

function MainContent() {
  const { currentUser, isAdmin, isProvider } = useAuth();

  const [currentView, setCurrentView] = useState<
    'home' | 'categories' | 'register' | 'provider-dashboard' | 'admin-panel'
  >('home');

  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // User detected GPS location state
  const [userLocation, setUserLocation] = useState<UserLocationState | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string>('');

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    categoryId: '',
    province: '',
    city: '',
    district: '',
    sortByDistance: false,
  });

  // Modal states
  const [selectedProviderForDetail, setSelectedProviderForDetail] = useState<Provider | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isBagiKopiModalOpen, setIsBagiKopiModalOpen] = useState<boolean>(false);

  // Admin Contact Settings state (WA & FB)
  const [adminSettings, setAdminSettings] = useState<AdminContactSettings>({
    adminWhatsapp: '08179015181',
    adminFacebook: 'https://facebook.com/jasadekat',
  });

  // Real-time listener for Admin Contact Settings
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'contact'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as AdminContactSettings;
          setAdminSettings({
            adminWhatsapp: data.adminWhatsapp || '08179015181',
            adminFacebook: data.adminFacebook || 'https://facebook.com/jasadekat',
            updatedAt: data.updatedAt,
          });
        }
      },
      (err) => {
        console.warn('Settings listener error:', err);
      }
    );
    return () => unsub();
  }, []);

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    setLocationError('');
    try {
      const loc = await detectUserLocation();
      setUserLocation({
        latitude: loc.latitude,
        longitude: loc.longitude,
        cityName: loc.cityName,
        provinceName: loc.provinceName,
        districtName: loc.districtName,
        displayName: loc.displayName,
      });

      // Enable distance sorting from closest to furthest across all providers
      setFilters((prev) => ({
        ...prev,
        province: '',
        city: '',
        district: '',
        sortByDistance: true,
      }));
    } catch (err) {
      console.warn('Geolocation detection:', err);
      setLocationError(
        err instanceof Error
          ? err.message
          : 'Gagal mendeteksi lokasi GPS. Silakan pilih wilayah secara manual.'
      );
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleClearLocation = () => {
    setUserLocation(null);
    setLocationError('');
    setFilters((prev) => ({
      ...prev,
      sortByDistance: false,
    }));
  };

  // 1. Initial Connection test & PWA Service Worker Registration
  useEffect(() => {
    testConnection();

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('JasaDekat ServiceWorker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('ServiceWorker registration error:', err);
          });
      });
    }
  }, []);

  // 2. Fetch or seed Categories from Firestore
  const fetchCategories = async () => {
    try {
      const snap = await getDocs(collection(db, 'categories'));
      if (snap.empty) {
        // If logged in as admin, auto-seed into Firestore
        if (isAdmin) {
          try {
            const seededList: Category[] = [];
            for (const c of INITIAL_CATEGORIES) {
              const docRef = await addDoc(collection(db, 'categories'), {
                ...c,
                createdAt: new Date().toISOString(),
              });
              seededList.push({ id: docRef.id, ...c });
            }
            setCategories(seededList.sort((a, b) => a.order - b.order));
            return;
          } catch (seedError) {
            console.warn('Admin auto-seed notice:', seedError);
          }
        }
        // Fallback for public visitors: display default categories without write attempt
        setCategories(DEFAULT_CATEGORIES);
      } else {
        const loaded: Category[] = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Category[];
        setCategories(loaded.sort((a, b) => a.order - b.order));
      }
    } catch (error) {
      console.warn('Loading fallback categories due to network or permission state:', error);
      setCategories(DEFAULT_CATEGORIES);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [isAdmin]);

  // 3. Real-time listener for Providers (Cloud Firestore)
  useEffect(() => {
    setLoadingData(true);
    const providersRef = collection(db, 'providers');

    // If Admin, subscribe to all providers (for approval queue and performance analytics)
    // If Visitor or regular user, subscribe only to 'approved' providers
    const q = isAdmin
      ? query(providersRef)
      : query(providersRef, where('status', '==', 'approved'));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const loaded: Provider[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Provider[];

        if (loaded.length === 0) {
          // If logged in as admin and Firestore collection is empty, auto-seed sample providers
          if (isAdmin) {
            try {
              for (const prov of INITIAL_PROVIDERS) {
                const { id: _, ...provData } = prov;
                await addDoc(collection(db, 'providers'), provData);
              }
              return;
            } catch (seedErr) {
              console.warn('Auto-seed providers notice:', seedErr);
            }
          }
          // Public visitor fallback ensures the directory always has data to read
          setProviders(INITIAL_PROVIDERS);
        } else {
          setProviders(loaded);
        }
        setLoadingData(false);
      },
      (error) => {
        console.warn('Providers subscription fallback notice:', error);
        setProviders(INITIAL_PROVIDERS);
        setLoadingData(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  // Filtering logic: only approved providers shown in public directory
  const publicProviders = providers.filter((p) => p.status === 'approved');

  const filteredProviders = publicProviders.filter((p) => {
    // 1. Category filter
    if (filters.categoryId && p.categoryId !== filters.categoryId) {
      return false;
    }

    // 2. Province filter
    if (filters.province && p.province.toLowerCase() !== filters.province.toLowerCase()) {
      return false;
    }

    // 3. City filter
    if (filters.city && p.city.toLowerCase() !== filters.city.toLowerCase()) {
      return false;
    }

    // 4. District filter (checks both provider city and array of coverage districts)
    if (filters.district) {
      const matchDistrict =
        p.districts?.some((d) =>
          d.toLowerCase().includes(filters.district.toLowerCase())
        ) || p.city.toLowerCase().includes(filters.district.toLowerCase());
      if (!matchDistrict) return false;
    }

    // 5. Text search query (matches name, description, category, or city)
    if (filters.searchQuery) {
      const qLower = filters.searchQuery.toLowerCase();
      const matchQuery =
        p.name.toLowerCase().includes(qLower) ||
        p.categoryName.toLowerCase().includes(qLower) ||
        p.city.toLowerCase().includes(qLower) ||
        p.description.toLowerCase().includes(qLower) ||
        p.subServices?.some((s) => s.toLowerCase().includes(qLower));

      if (!matchQuery) return false;
    }

    return true;
  });

  // Sort providers: closest distance first if userLocation is active
  const sortedProviders = [...filteredProviders].sort((a, b) => {
    if (userLocation) {
      const distA = getProviderDistance(userLocation.latitude, userLocation.longitude, a.city) ?? 9999;
      const distB = getProviderDistance(userLocation.latitude, userLocation.longitude, b.city) ?? 9999;
      return distA - distB;
    }
    return 0;
  });

  const handleResetFilters = () => {
    setUserLocation(null);
    setLocationError('');
    setFilters({
      searchQuery: '',
      categoryId: '',
      province: '',
      city: '',
      district: '',
      sortByDistance: false,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <Header
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenRegister={() => setIsRegisterModalOpen(true)}
        onOpenBagiKopi={() => setIsBagiKopiModalOpen(true)}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1">
        {currentView === 'admin-panel' && isAdmin ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <AdminPanel
              providers={providers}
              categories={categories}
              adminSettings={adminSettings}
              onRefreshData={() => fetchCategories()}
              onBackToHome={() => setCurrentView('home')}
            />
          </div>
        ) : currentView === 'provider-dashboard' && isProvider ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <ProviderDashboard
              categories={categories}
              onBackToHome={() => setCurrentView('home')}
            />
          </div>
        ) : currentView === 'categories' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Pilih Kategori Layanan Rumah
              </h1>
              <p className="text-sm text-slate-600">
                Temukan teknisi ahli sesuai spesialisasi pekerjaan rumah Anda
              </p>
            </div>

            <CategoryList
              categories={categories}
              selectedCategoryId={filters.categoryId}
              onSelectCategory={(id) => {
                setFilters({ ...filters, categoryId: id });
                setCurrentView('home');
              }}
            />
          </div>
        ) : (
          /* HOME VIEW */
          <div>
            {/* Hero Section */}
            <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
              <div className="max-w-4xl mx-auto text-center space-y-4 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-semibold backdrop-blur-xs">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Marketplace Jasa Perbaikan Rumah Indonesia</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                  Tukang & Teknisi Terdekat, <br />
                  <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                    Langsung Chat WhatsApp
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                  Service AC, tukang listrik, ledeng, atap bocor, dan renovasi rumah di wilayah Anda. Tanpa komisi perantara, hubungi teknisi secara langsung.
                </p>

                {/* Hero Fast Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={handleDetectLocation}
                    disabled={isDetectingLocation}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02]"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>
                      {isDetectingLocation
                        ? 'Mencari Lokasi GPS...'
                        : userLocation
                        ? `📍 Terdekat di ${userLocation.cityName}`
                        : '📍 Tukang Terdekat dari Saya'}
                    </span>
                  </button>

                  <a
                    href="#pencarian"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
                  >
                    <Search className="w-4 h-4" />
                    <span>Pilih Wilayah Manual</span>
                  </a>

                  <button
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="px-6 py-3 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all hover:scale-[1.02]"
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-400" />
                    <span>Daftarkan Diri Sebagai Tukang</span>
                  </button>
                </div>
              </div>

              {/* Decorative background glows */}
              <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            </section>

            {/* Container for Search, Categories, and Directory */}
            <div id="pencarian" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 space-y-8 pb-16">
              {/* Search and Filters Box */}
              <SearchAndFilter
                categories={categories}
                filters={filters}
                onFilterChange={setFilters}
                onReset={handleResetFilters}
                totalResults={sortedProviders.length}
                userLocation={userLocation}
                onDetectLocation={handleDetectLocation}
                isDetectingLocation={isDetectingLocation}
                locationError={locationError}
                onClearLocation={handleClearLocation}
              />

              {/* Categories Grid */}
              <CategoryList
                categories={categories}
                selectedCategoryId={filters.categoryId}
                onSelectCategory={(id) => setFilters({ ...filters, categoryId: id })}
              />

              {/* Providers Directory Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                      <span>Daftar Teknisi & Tukang Terverifikasi</span>
                      {userLocation && (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Terdekat dari {userLocation.cityName}
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Disetujui oleh admin JasaDekat dan siap melayani lokasi Anda
                    </p>
                  </div>
                </div>

                {loadingData ? (
                  /* Loading skeleton */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((idx) => (
                      <div
                        key={idx}
                        className="p-5 bg-white rounded-2xl border border-slate-200 animate-pulse space-y-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 bg-slate-200 rounded-xl"></div>
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                          </div>
                        </div>
                        <div className="h-10 bg-slate-100 rounded-xl"></div>
                      </div>
                    ))}
                  </div>
                ) : sortedProviders.length === 0 ? (
                  /* Empty state */
                  <div className="py-14 px-4 bg-white rounded-3xl border border-dashed border-slate-300 text-center space-y-3 max-w-lg mx-auto">
                    <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <HelpCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      Belum Ada Teknisi di Wilayah Tersebut
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Tidak ada penyedia jasa yang cocok dengan filter atau lokasi Anda saat ini. Coba pilih provinsi atau kota lain, atau reset filter pencarian.
                    </p>
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                      <button
                        onClick={handleResetFilters}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
                      >
                        Tampilkan Semua Wilayah
                      </button>
                      <button
                        onClick={() => setIsRegisterModalOpen(true)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                      >
                        Daftar Sebagai Tukang Pertama
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Results grid */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {sortedProviders.map((provider) => (
                      <ProviderCard
                        key={provider.id}
                        provider={provider}
                        onOpenDetail={setSelectedProviderForDetail}
                        selectedArea={filters.city || filters.province}
                        userLocation={userLocation}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigate={setCurrentView}
        onOpenRegister={() => setIsRegisterModalOpen(true)}
        onOpenBagiKopi={() => setIsBagiKopiModalOpen(true)}
      />

      {/* Floating Bagi Kopi Button */}
      <div className="fixed bottom-5 left-5 z-40">
        <button
          onClick={() => setIsBagiKopiModalOpen(true)}
          title="Bagi Kopi / Dukung Operasional JasaDekat via GoPay"
          className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-full shadow-xl shadow-amber-950/25 border-2 border-white/60 hover:scale-105 active:scale-95 transition-all text-xs sm:text-sm group cursor-pointer"
        >
          <span className="p-1 rounded-full bg-slate-950 text-amber-400 group-hover:rotate-12 transition-transform shadow-xs">
            <Coffee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </span>
          <span className="font-extrabold tracking-tight">Bagi Kopi ☕</span>
          <span className="hidden sm:inline-block text-[10px] bg-slate-950/20 text-slate-950 px-1.5 py-0.5 rounded-full font-mono font-bold">
            GoPay
          </span>
        </button>
      </div>

      {/* Modals */}
      <ProviderDetailModal
        provider={selectedProviderForDetail}
        onClose={() => setSelectedProviderForDetail(null)}
        selectedArea={filters.city || filters.province}
      />

      <RegisterProviderModal
        categories={categories}
        adminSettings={adminSettings}
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={() => {
          fetchCategories();
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {}}
      />

      <BagiKopiModal
        isOpen={isBagiKopiModalOpen}
        onClose={() => setIsBagiKopiModalOpen(false)}
        adminWhatsapp={adminSettings.adminWhatsapp || '08179015181'}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
