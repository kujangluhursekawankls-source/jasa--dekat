import React from 'react';
import {
  Home,
  Search,
  Layers,
  BookOpen,
  PlusCircle,
  ShieldCheck,
  Briefcase,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface MobileBottomNavProps {
  currentView: 'home' | 'categories' | 'register' | 'provider-dashboard' | 'admin-panel';
  onNavigate: (view: 'home' | 'categories' | 'register' | 'provider-dashboard' | 'admin-panel') => void;
  onOpenPanduan: () => void;
  onOpenRegister: () => void;
  onOpenLogin: () => void;
  onFocusSearch?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenPanduan,
  onOpenRegister,
  onOpenLogin,
  onFocusSearch,
}) => {
  const { currentUser, isAdmin, isProvider } = useAuth();

  const handleSearchClick = () => {
    if (currentView !== 'home') {
      onNavigate('home');
    }
    if (onFocusSearch) {
      setTimeout(() => {
        onFocusSearch();
      }, 100);
    } else {
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  };

  return (
    <nav
      aria-label="Navigasi Bawah Mobile Android"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-[0_-4px_24px_rgba(0,0,0,0.35)] select-none pb-[max(env(safe-area-inset-bottom,0px),6px)]"
    >
      <div className="grid grid-cols-5 items-center justify-between px-1.5 py-1 max-w-lg mx-auto">
        {/* 1. Beranda */}
        <button
          type="button"
          onClick={() => {
            onNavigate('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer relative min-h-[50px] ${
            currentView === 'home'
              ? 'text-blue-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {currentView === 'home' && (
            <span className="absolute top-0.5 w-7 h-0.5 bg-blue-500 rounded-full" />
          )}
          <Home className={`w-5 h-5 ${currentView === 'home' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-1 tracking-tight">Beranda</span>
        </button>

        {/* 2. Cari Cepat */}
        <button
          type="button"
          onClick={handleSearchClick}
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer min-h-[50px]"
        >
          <Search className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] mt-1 tracking-tight">Cari Jasa</span>
        </button>

        {/* 3. Panduan Penggunaan (Center Highlighted Android Thumb Button) */}
        <button
          type="button"
          onClick={onOpenPanduan}
          title="Panduan Penggunaan JasaDekat"
          className="flex flex-col items-center justify-center -mt-3.5 transition-transform active:scale-95 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 ring-3 ring-slate-900 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] mt-1 font-extrabold text-blue-400 tracking-tight flex items-center gap-0.5">
            <span>Panduan</span>
          </span>
        </button>

        {/* 4. Kategori Jasa */}
        <button
          type="button"
          onClick={() => {
            onNavigate('categories');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer relative min-h-[50px] ${
            currentView === 'categories'
              ? 'text-blue-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {currentView === 'categories' && (
            <span className="absolute top-0.5 w-7 h-0.5 bg-blue-500 rounded-full" />
          )}
          <Layers className={`w-5 h-5 ${currentView === 'categories' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-1 tracking-tight">Kategori</span>
        </button>

        {/* 5. Menu Akun / Admin / Mitra */}
        {isAdmin ? (
          <button
            type="button"
            onClick={() => onNavigate('admin-panel')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer relative min-h-[50px] ${
              currentView === 'admin-panel'
                ? 'text-purple-400 font-bold'
                : 'text-purple-300/80 hover:text-purple-200'
            }`}
          >
            {currentView === 'admin-panel' && (
              <span className="absolute top-0.5 w-7 h-0.5 bg-purple-500 rounded-full" />
            )}
            <ShieldCheck className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px] mt-1 tracking-tight">Admin</span>
          </button>
        ) : isProvider ? (
          <button
            type="button"
            onClick={() => onNavigate('provider-dashboard')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer relative min-h-[50px] ${
              currentView === 'provider-dashboard'
                ? 'text-amber-400 font-bold'
                : 'text-amber-300/80 hover:text-amber-200'
            }`}
          >
            {currentView === 'provider-dashboard' && (
              <span className="absolute top-0.5 w-7 h-0.5 bg-amber-500 rounded-full" />
            )}
            <Briefcase className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px] mt-1 tracking-tight">Mitra</span>
          </button>
        ) : currentUser ? (
          <button
            type="button"
            onClick={onOpenRegister}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer relative min-h-[50px] ${
              currentView === 'register'
                ? 'text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {currentView === 'register' && (
              <span className="absolute top-0.5 w-7 h-0.5 bg-emerald-500 rounded-full" />
            )}
            <PlusCircle className="w-5 h-5 stroke-[1.8] text-emerald-400" />
            <span className="text-[10px] mt-1 tracking-tight">Daftar</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenLogin}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer min-h-[50px]"
          >
            <UserIcon className="w-5 h-5 stroke-[1.8]" />
            <span className="text-[10px] mt-1 tracking-tight">Masuk</span>
          </button>
        )}
      </div>
    </nav>
  );
};
