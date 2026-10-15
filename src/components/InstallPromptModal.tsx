import React, { useState, useEffect } from 'react';
import {
  Download,
  X,
  Smartphone,
  Zap,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Share2,
} from 'lucide-react';

interface InstallPromptModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  forceOpen?: boolean;
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  forceOpen = false,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // 1. Check if running in standalone mode (already installed on phone)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    const alreadyInstalled = checkStandalone();

    // 2. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 3. Listen for Android/Chrome beforeinstallprompt event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // If not already installed and not dismissed in this session, show prompt
      if (!alreadyInstalled) {
        const dismissed = sessionStorage.getItem('jasadekat_install_prompt_dismissed');
        if (!dismissed) {
          setTimeout(() => {
            setInternalIsOpen(true);
          }, 1200);
        }
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Also if not standalone and not dismissed, show popup even if beforeinstallprompt didn't fire yet (common in mobile browsers)
    if (!alreadyInstalled) {
      const dismissed = sessionStorage.getItem('jasadekat_install_prompt_dismissed');
      const installedFlag = localStorage.getItem('jasadekat_app_installed');
      if (!dismissed && installedFlag !== 'true') {
        const timer = setTimeout(() => {
          setInternalIsOpen(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const isModalVisible = forceOpen || (controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen);

  const handleClose = () => {
    sessionStorage.setItem('jasadekat_install_prompt_dismissed', 'true');
    setInternalIsOpen(false);
    if (controlledOnClose) {
      controlledOnClose();
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        setIsInstalling(true);
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          localStorage.setItem('jasadekat_app_installed', 'true');
          handleClose();
        }
      } catch (err) {
        console.error('Install prompt error:', err);
      } finally {
        setIsInstalling(false);
        setDeferredPrompt(null);
      }
    } else {
      // Browser doesn't support direct trigger, guide the user
      // We keep the modal open to show the 3 steps below
    }
  };

  if (!isModalVisible || isStandalone) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-0 sm:my-6 animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Hero Banner Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white relative overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3.5 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/30 flex items-center justify-center shrink-0">
              <img
                src="/icon.svg"
                alt="JasaDekat"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Rekomendasi Terbaik</span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                Pasang JasaDekat di Layar Utama HP
              </h2>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Akses cepat tukang & teknisi rumah terdekat langsung dari layar depan tanpa ribet buka browser!
          </p>
        </div>

        {/* Benefits list */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Akses Cepat 1-Ketuk</div>
                <div className="text-[11px] text-slate-500 leading-normal">
                  Buka aplikasi seperti aplikasi bawaan HP langsung dari layar beranda.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Ringan & Hemat Kuota</div>
                <div className="text-[11px] text-slate-500 leading-normal">
                  Ukuran super kecil (&lt; 1MB), tidak membebani memori HP Android Anda.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Langsung Kontak WhatsApp</div>
                <div className="text-[11px] text-slate-500 leading-normal">
                  Tukang AC, listrik, ledeng, & bangunan siap dipanggil kapan saja saat darurat.
                </div>
              </div>
            </div>
          </div>

          {/* If browser cannot trigger directly (or iOS), show instructions */}
          {!deferredPrompt && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                {isIOS ? <Share2 className="w-4 h-4 text-blue-600" /> : <Smartphone className="w-4 h-4 text-slate-700" />}
                <span>Langkah Mudah Memasang:</span>
              </div>
              <ol className="text-[11px] text-slate-600 list-decimal list-inside space-y-1 leading-relaxed pl-1">
                {isIOS ? (
                  <>
                    <li>Tekan tombol <strong>Bagikan / Share</strong> di bawah layar Safari.</li>
                    <li>Geser ke bawah dan pilih <strong>&ldquo;Tambah ke Layar Utama&rdquo;</strong>.</li>
                    <li>Tekan <strong>&ldquo;Tambah&rdquo;</strong> di pojok kanan atas.</li>
                  </>
                ) : (
                  <>
                    <li>Buka menu browser Chrome (titik tiga <strong>⋮</strong> di kanan atas).</li>
                    <li>Pilih <strong>&ldquo;Tambahkan ke Layar Utama&rdquo;</strong> atau <strong>&ldquo;Install Aplikasi&rdquo;</strong>.</li>
                    <li>Konfirmasi pemasangan, selesai!</li>
                  </>
                )}
              </ol>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 space-y-2 pb-[max(env(safe-area-inset-bottom,0px),8px)]">
            <button
              type="button"
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 animate-bounce" />
              <span>{isInstalling ? 'Memproses Pemasangan...' : deferredPrompt ? 'Pasang Sekarang (Install Gratis)' : 'Sudah Paham / Mengerti'}</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 px-4 text-slate-500 hover:text-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer text-center"
            >
              Nanti Saja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
