import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Menu,
  X,
  User as UserIcon,
  ShieldCheck,
  Briefcase,
  LogOut,
  Download,
  PlusCircle,
  Home,
  Layers,
  Sparkles,
  Coffee,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  currentView: 'home' | 'categories' | 'register' | 'provider-dashboard' | 'admin-panel';
  onNavigate: (view: 'home' | 'categories' | 'register' | 'provider-dashboard' | 'admin-panel') => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenBagiKopi: () => void;
  onOpenPanduan?: () => void;
  onOpenInstall?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenLogin,
  onOpenRegister,
  onOpenBagiKopi,
  onOpenPanduan,
  onOpenInstall,
}) => {
  const { currentUser, isAdmin, isProvider, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Listen for PWA beforeinstallprompt event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (onOpenInstall) {
      onOpenInstall();
      return;
    }
    if (!deferredPrompt) {
      alert('Untuk memasang JasaDekat di HP Android, buka menu browser (titik 3 di kanan atas) dan pilih "Tambahkan ke Layar Utama" atau "Install App".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-500/25 ring-1 ring-white/10 group-hover:scale-105 transition-transform bg-slate-950 flex items-center justify-center">
              <img
                src="/icon.svg"
                alt="JasaDekat Icon"
                className="w-full h-full object-contain p-0.5"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  Jasa<span className="text-emerald-400">Dekat</span>
                </span>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  ID
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Tukang & Teknisi Rumah Langsung WhatsApp
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentView === 'home'
                  ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Home className="w-4 h-4" />
              Beranda
            </button>

            <button
              onClick={() => onNavigate('categories')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentView === 'categories'
                  ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              Kategori Jasa
            </button>

            <button
              onClick={onOpenRegister}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentView === 'register'
                  ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              Daftar Sebagai Tukang
            </button>

            {onOpenPanduan && (
              <button
                type="button"
                onClick={onOpenPanduan}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-blue-400" />
                Panduan
              </button>
            )}

            {isProvider && (
              <button
                onClick={() => onNavigate('provider-dashboard')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  currentView === 'provider-dashboard'
                    ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Briefcase className="w-4 h-4 text-amber-400" />
                Dasbor Mitra
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => onNavigate('admin-panel')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  currentView === 'admin-panel'
                    ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30'
                    : 'text-purple-300 hover:text-white hover:bg-purple-900/30'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                Panel Admin
              </button>
            )}
          </nav>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Tombol Bagi Kopi */}
            <button
              onClick={onOpenBagiKopi}
              title="Bagi Kopi / Dukung JasaDekat via GoPay"
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 hover:text-amber-200 rounded-lg text-xs font-bold border border-amber-500/40 flex items-center gap-1.5 transition-all shadow-sm hover:scale-105 cursor-pointer"
            >
              <Coffee className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Bagi Kopi</span>
            </button>

            {/* PWA Install Button */}
            <button
              onClick={handleInstallClick}
              title="Pasang aplikasi JasaDekat di layar utama"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isInstallable ? 'Pasang App HP' : 'Info Pasang PWA'}</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-white max-w-[120px] truncate">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize">
                    {isAdmin ? 'Admin JasaDekat' : isProvider ? 'Mitra Teknisi' : 'Pengguna'}
                  </span>
                </div>
                <button
                  onClick={() => logout()}
                  title="Keluar"
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-500/20"
              >
                <UserIcon className="w-3.5 h-3.5" />
                Masuk / Login
              </button>
            )}
          </div>

          {/* Mobile buttons */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenBagiKopi}
              className="p-2 text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Bagi Kopi"
            >
              <Coffee className="w-5 h-5" />
            </button>
            <button
              onClick={handleInstallClick}
              className="p-2 text-emerald-400 hover:bg-slate-800 rounded-lg"
              title="Pasang Aplikasi"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-6 space-y-2 animate-in slide-in-from-top-2">
          <button
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 ${
              currentView === 'home' ? 'bg-blue-600/30 text-blue-400' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Home className="w-4 h-4" />
            Beranda
          </button>

          <button
            onClick={() => {
              onNavigate('categories');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 ${
              currentView === 'categories' ? 'bg-blue-600/30 text-blue-400' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Kategori Jasa
          </button>

          <button
            onClick={() => {
              onOpenRegister();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 text-emerald-400 hover:bg-slate-800"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            Daftar Sebagai Tukang / Teknisi
          </button>

          {isProvider && (
            <button
              onClick={() => {
                onNavigate('provider-dashboard');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 text-amber-300 hover:bg-slate-800"
            >
              <Briefcase className="w-4 h-4 text-amber-400" />
              Dasbor Mitra & Analitik
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => {
                onNavigate('admin-panel');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 text-purple-300 hover:bg-slate-800"
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              Panel Admin & Moderasi
            </button>
          )}

          {/* Panduan Mobile Drawer Button */}
          {onOpenPanduan && (
            <button
              onClick={() => {
                onOpenPanduan();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 text-blue-300 hover:bg-slate-800 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-blue-400" />
              Panduan Penggunaan JasaDekat
            </button>
          )}

          {/* Bagi Kopi Mobile Drawer Button */}
          <button
            onClick={() => {
              onOpenBagiKopi();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3.5 py-3 rounded-xl text-sm font-bold flex items-center gap-3 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-bold shadow">
              <Coffee className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span>Bagi Kopi Tim (GoPay)</span>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-mono px-1.5 py-0.5 rounded font-bold">08179015181</span>
              </div>
              <p className="text-[11px] font-normal text-amber-400/80">Traktir kopi dukung server JasaDekat tetap gratis</p>
            </div>
          </button>

          <div className="pt-3 border-t border-slate-800">
            {currentUser ? (
              <div className="flex items-center justify-between px-3 py-2 bg-slate-800/60 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-white truncate max-w-[200px]">
                    {currentUser.displayName || currentUser.email}
                  </div>
                  <div className="text-xs text-slate-400">
                    {isAdmin ? 'Admin' : isProvider ? 'Mitra' : 'Akun Pengguna'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded text-xs font-semibold"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenLogin();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              >
                <UserIcon className="w-4 h-4" />
                Masuk / Login Akun
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
