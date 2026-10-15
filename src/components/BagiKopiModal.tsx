import React, { useState } from 'react';
import {
  Coffee,
  Copy,
  Check,
  MessageCircle,
  X,
  Heart,
  Sparkles,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Gift,
} from 'lucide-react';

interface BagiKopiModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminWhatsapp?: string;
}

export const BagiKopiModal: React.FC<BagiKopiModalProps> = ({
  isOpen,
  onClose,
  adminWhatsapp = '08179015181',
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedNominal, setSelectedNominal] = useState<number | null>(10000);

  if (!isOpen) return null;

  const gopayNumber = '08179015181';
  // Standardize target WhatsApp number for wa.me link
  const cleanPhone = adminWhatsapp.replace(/\D/g, '');
  const waTarget = cleanPhone.startsWith('0')
    ? '62' + cleanPhone.slice(1)
    : cleanPhone.startsWith('62')
    ? cleanPhone
    : '628179015181';

  const nominalLabels: { [key: number]: string } = {
    5000: 'Rp 5.000 (Segelas Kopi Hitam ☕)',
    10000: 'Rp 10.000 (Kopi Susu Mantap ☕🥛)',
    20000: 'Rp 20.000 (Kopi + Cemilan ☕🥐)',
    50000: 'Rp 50.000 (Dukungan Server Sebulan 🚀)',
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(gopayNumber);
      } else {
        // Fallback for iframe / older browser
        const textArea = document.createElement('textarea');
        textArea.value = gopayNumber;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy', err);
      // Fallback
      prompt('Salin nomor GoPay berikut:', gopayNumber);
    }
  };

  const nominalText = selectedNominal
    ? nominalLabels[selectedNominal] || `Rp ${selectedNominal.toLocaleString('id-ID')}`
    : 'Bebas Seikhlasnya';

  const waMessage = encodeURIComponent(
    `Halo Mas Jamhur / Pengembang JasaDekat! 👋\n\nSaya baru saja bagi/traktir kopi via GoPay ke nomor *${gopayNumber}* (a.n. *Jamhur* - ${nominalText}) untuk mendukung operasional layanan JasaDekat.\n\nSemoga aplikasi JasaDekat makin sukses, bermanfaat bagi banyak orang dan para mitra tukang! Semangat selalu! ☕✨`
  );

  const waUrl = `https://wa.me/${waTarget}?text=${waMessage}`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-slate-900 border-t sm:border border-amber-500/40 rounded-t-3xl sm:rounded-2xl shadow-2xl shadow-amber-950/50 overflow-hidden text-slate-100 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ambient Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400" />

        {/* Android Drag Handle Indicator */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden">
          <div className="w-12 h-1.5 rounded-full bg-slate-700" />
        </div>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors z-10"
          title="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-5 sm:p-7 overflow-y-auto space-y-4 sm:space-y-5 pb-8 sm:pb-7">
          {/* Hero Section */}
          <div className="text-center space-y-1.5 pt-1">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 ring-4 ring-amber-500/20">
              <Coffee className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div className="flex items-center justify-center gap-1.5 text-amber-400 font-semibold text-[11px] sm:text-xs tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dukung Aplikasi JasaDekat</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Bagi Kopi untuk Tim ☕
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
              JasaDekat 100% gratis tanpa potongan bagi tukang & pencari jasa. 
              Traktiran secangkir kopi dari Anda sangat berarti untuk operasional server & pengembangan!
            </p>
          </div>

          {/* GoPay Exclusive Card */}
          <div className="relative rounded-2xl bg-gradient-to-br from-sky-900/90 via-blue-900/70 to-slate-900/95 border border-sky-400/40 p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between pb-2.5 border-b border-sky-400/20">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-[#00AED6] text-white font-extrabold text-xs tracking-wide shadow-xs">
                  gopay
                </span>
                <span className="text-xs text-sky-200 font-semibold">Pembayaran Resmi</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" /> Terverifikasi
              </span>
            </div>

            <div className="pt-3 space-y-1.5">
              <span className="text-[11px] text-slate-300 uppercase tracking-wider font-semibold">
                Nomor Akun GoPay:
              </span>
              <div className="flex items-center justify-between gap-2.5 bg-slate-950/80 border border-sky-500/40 rounded-xl p-2.5 sm:p-3">
                <div className="font-mono text-xl sm:text-2xl font-bold tracking-wider text-amber-300 select-all">
                  {gopayNumber}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer ${
                    copied
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 scale-105'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95'
                  }`}
                  title="Salin nomor ke clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Nomor</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Recipient Account Name: JAMHUR */}
            <div className="mt-3 pt-2.5 border-t border-sky-400/20 flex flex-wrap items-center justify-between gap-1.5 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-300">Penerima GoPay:</span>
                <span className="font-extrabold text-white text-sm bg-sky-950/90 px-2.5 py-0.5 rounded-lg border border-sky-400/50 tracking-wider">
                  a.n. JAMHUR
                </span>
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                ✓ Akun Terverifikasi
              </span>
            </div>
          </div>

          {/* Quick Amount Suggestion (Inspirasi Traktir) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              <span>Pilihan Traktir Kopi:</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { amount: 5000, label: '☕ Kopi Hitam', price: 'Rp 5.000' },
                { amount: 10000, label: '☕🥛 Kopi Susu', price: 'Rp 10.000' },
                { amount: 20000, label: '☕🥐 Kopi + Snack', price: 'Rp 20.000' },
                { amount: 50000, label: '🚀 Server Support', price: 'Rp 50.000' },
              ].map((item) => (
                <button
                  key={item.amount}
                  type="button"
                  onClick={() => setSelectedNominal(item.amount)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between text-xs cursor-pointer ${
                    selectedNominal === item.amount
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-semibold ring-1 ring-amber-400/50'
                      : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="font-mono text-[11px] opacity-90">{item.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Simple Step Guide */}
          <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-3 sm:p-3.5 text-[11px] text-slate-300 space-y-1">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-sky-400" />
              <span>Cara Traktir via GoPay / Gojek:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1 leading-relaxed">
              <li>Salin nomor GoPay: <strong className="text-amber-300">08179015181</strong> (a.n. <strong>Jamhur</strong>).</li>
              <li>Buka aplikasi GoPay / Gojek / BCA / Bank Anda.</li>
              <li>Transfer saldo ke nomor HP tersebut.</li>
              <li>Klik tombol <strong>Konfirmasi ke WhatsApp</strong> di bawah ini agar kami dapat mengucapkan terima kasih!</li>
            </ol>
          </div>

          {/* Action WhatsApp Confirmation */}
          <div className="space-y-2 pt-1">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 active:from-emerald-700 active:to-green-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-[0.98] min-h-[48px]"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>Konfirmasi ke WhatsApp (Kirim Bukti / Pesan)</span>
              <ExternalLink className="w-4 h-4 opacity-75" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Nanti Saja, Kembali ke Aplikasi
            </button>
          </div>

          {/* Heart Note */}
          <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1 pt-1">
            <span>Dibuat dengan rasa terima kasih</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>untuk Anda semua.</span>
          </div>
        </div>
      </div>
    </div>
  );
};


