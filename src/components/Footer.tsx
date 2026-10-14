import React from 'react';
import { Wrench, Heart, Shield, MessageCircle, Phone, Smartphone } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: 'home' | 'categories' | 'register') => void;
  onOpenRegister: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenRegister }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Purpose */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white">
                <Wrench className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                Jasa<span className="text-emerald-400">Dekat</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-md">
              Marketplace penghubung masyarakat yang memerlukan jasa perbaikan rumah dengan tukang dan teknisi handal di wilayah terdekat. Komunikasi langsung, cepat, dan transparan via WhatsApp tanpa biaya perantara.
            </p>
            <div className="flex items-center gap-4 pt-1 text-slate-300">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                Data Terverifikasi Admin
              </span>
              <span className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                Kontak Langsung wa.me
              </span>
            </div>
          </div>

          {/* Navigasi Layanan */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Navigasi Cepat
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-white transition-colors"
                >
                  Beranda Pencarian
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('categories')}
                  className="hover:text-white transition-colors"
                >
                  Daftar Kategori Jasa
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenRegister}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Daftar Sebagai Tukang
                </button>
              </li>
            </ul>
          </div>

          {/* Panduan PWA Android */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Aplikasi HP Android (PWA)</span>
            </h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              JasaDekat dapat dipasang langsung di layar utama HP Android tanpa perlu download dari PlayStore:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
              <li>Buka Chrome di HP</li>
              <li>Tekan tombol titik 3 (menu)</li>
              <li>Pilih <strong>"Tambahkan ke Layar Utama"</strong></li>
            </ol>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div>
            &copy; {new Date().getFullYear()} JasaDekat Indonesia. Hak Cipta Dilindungi.
          </div>
          <div className="text-slate-500">
            Dibuat untuk memudahkan kebutuhan perbaikan rumah di Indonesia
          </div>
        </div>
      </div>
    </footer>
  );
};
