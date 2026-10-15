import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Search,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Smartphone,
  PhoneCall,
  UserCheck,
  Wrench,
  AlertCircle,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface PanduanModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminWhatsapp?: string;
  onOpenRegister?: () => void;
  onOpenInstall?: () => void;
}

export const PanduanModal: React.FC<PanduanModalProps> = ({
  isOpen,
  onClose,
  adminWhatsapp = '08179015181',
  onOpenRegister,
  onOpenInstall,
}) => {
  const [activeTab, setActiveTab] = useState<'user' | 'provider' | 'faq'>('user');

  if (!isOpen) return null;

  const waHelpUrl = `https://wa.me/${adminWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
    'Halo Admin JasaDekat, saya ingin bertanya seputar panduan penggunaan aplikasi JasaDekat.'
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-0 sm:my-6 animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2 sm:hidden shrink-0" />

        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/40 text-blue-400 flex items-center justify-center shadow-inner">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Panduan Penggunaan JasaDekat</span>
                <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                  Resmi
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Langkah mudah cari tukang, daftar mitra, & tips keamanan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="p-2 sm:p-3 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('user')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'user'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Untuk Pencari Jasa</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('provider')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'provider'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Untuk Mitra Tukang</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'faq'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Tanya Jawab</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-slate-700">
          {/* TAB 1: USER GUIDE */}
          {activeTab === 'user' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 leading-relaxed">
                  <span className="font-bold">100% Bebas Komisi Perantara:</span> Anda langsung terhubung ke nomor WhatsApp tukang/teknisi tanpa biaya tambahan dari JasaDekat.
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                  <span>Cari Layanan & Tentukan Lokasi Anda</span>
                </h3>
                <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                  Ketik kata kunci kebutuhan Anda (misal: <em>Service AC, pipa bocor, instalasi listrik</em>) di kolom pencarian, atau pilih kategori cepat di bawahnya. Anda juga dapat memilih <strong>Kota dan Kecamatan</strong> terdekat untuk melihat teknisi yang siap datang ke lokasi Anda.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                  <span>Periksa Detail Profil & Portofolio Tukang</span>
                </h3>
                <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                  Klik kartu tukang untuk melihat deskripsi keahlian, estimasi rentang harga, daftar kecamatan jangkauan layanan, foto profil teknisi, dan galeri hasil pekerjaan yang pernah diselesaikan.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                  <span>Hubungi Langsung via WhatsApp</span>
                </h3>
                <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                  Tekan tombol hijau <strong>&ldquo;Chat WhatsApp&rdquo;</strong>. Aplikasi akan otomatis membuka WhatsApp dengan draf pesan sopan yang sudah menyebutkan layanan yang Anda perlukan.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">4</span>
                  <span>Konsultasi, Sepakati Biaya, & Jadwal</span>
                </h3>
                <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                  Kirimkan foto atau video kerusakan rumah kepada tukang agar estimasi biaya perbaikan dan kebutuhan suku cadang lebih akurat sebelum tukang meluncur ke rumah.
                </p>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Tips Keamanan & Kenyamanan Bertransaksi</span>
                </div>
                <ul className="text-[11px] text-amber-800 list-disc list-inside space-y-1 pl-1">
                  <li>Lakukan pembayaran setelah pekerjaan selesai dan Anda telah memeriksa hasilnya dengan baik.</li>
                  <li>Tanyakan garansi pengerjaan (umumnya tukang memberikan garansi 7–30 hari untuk servis tertentu).</li>
                  <li>Simpan nomor WhatsApp teknisi terpercaya Anda untuk kebutuhan darurat di masa mendatang.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: PROVIDER GUIDE */}
          {activeTab === 'provider' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <UserCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 leading-relaxed">
                  <span className="font-bold">Peluang Tambahan Penghasilan:</span> Bergabunglah sebagai mitra teknisi JasaDekat secara gratis dan dapatkan order langsung dari warga di sekitar lokasi Anda.
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                  <span>Daftar Melalui Formulir Online</span>
                </h3>
                <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                  Klik tombol <strong>&ldquo;Daftar Sebagai Tukang&rdquo;</strong> di menu atas. Masukkan nama lengkap/usaha, nomor WhatsApp aktif, pilih kategori jasa, dan centang keahlian spesifik Anda.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                  <span>Tentukan Wilayah Operasional Kerja</span>
                </h3>
                <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                  Pilih Provinsi, Kota, dan centang beberapa Kecamatan yang sanggup Anda jangkau. Profil Anda akan muncul bagi pengguna yang mencari di area tersebut.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                  <span>Lengkapi Foto Profil & Galeri Bukti Kerja</span>
                </h3>
                <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                  Upload foto diri atau seragam kerja yang rapi, serta foto-foto hasil pekerjaan yang pernah Anda selesaikan. Calon pelanggan lebih tertarik memilih tukang dengan foto hasil kerja nyata.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">4</span>
                  <span>Verifikasi & Dasbor Mitra</span>
                </h3>
                <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                  Setelah disetujui tim admin, profil Anda langsung aktif di beranda. Anda dapat memantau statistik jumlah pengunjung dan total calon pelanggan yang menekan tombol WhatsApp melalui <strong>Dasbor Mitra</strong>.
                </p>
              </div>

              {onOpenRegister && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRegister();
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <span>Daftar Sekarang Sebagai Mitra Tukang</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Apakah mencari tukang di JasaDekat dipungut biaya?</span>
                </div>
                <p className="text-xs text-slate-600 pl-5.5 leading-relaxed">
                  Tidak. Layanan pencarian tukang di JasaDekat 100% gratis untuk masyarakat. Biaya perbaikan disepakati dan dibayarkan langsung kepada tukang yang bersangkutan.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Bagaimana cara memasang aplikasi di HP Android?</span>
                </div>
                <p className="text-xs text-slate-600 pl-5.5 leading-relaxed">
                  Cukup klik tombol <strong>&ldquo;Pasang App HP&rdquo;</strong> di menu atas atau saat muncul notifikasi pop up. Atau buka menu browser Google Chrome (titik tiga ⋮ di pojok kanan atas) lalu pilih <strong>&ldquo;Tambahkan ke Layar Utama&rdquo; / &ldquo;Install App&rdquo;</strong>.
                </p>
                {onOpenInstall && (
                  <div className="pl-5.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenInstall();
                      }}
                      className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Buka Pop up Pasang Aplikasi Sekarang</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Bagaimana jika pekerjaan tukang tidak sesuai?</span>
                </div>
                <p className="text-xs text-slate-600 pl-5.5 leading-relaxed">
                  Sebelum tukang pulang, pastikan Anda telah menguji hasil perbaikan bersama teknisi. Jika ada kendala dalam masa garansi yang disepakati, Anda dapat langsung menghubungi kembali nomor teknisi tersebut.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Bagaimana jika nomor WhatsApp tukang tidak aktif?</span>
                </div>
                <p className="text-xs text-slate-600 pl-5.5 leading-relaxed">
                  Anda dapat mencoba menghubungi teknisi lain di kategori yang sama, atau laporkan kepada kami melalui menu WhatsApp Admin agar profil tersebut dapat ditindaklanjuti.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer with WhatsApp Support */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 pb-[max(env(safe-area-inset-bottom,0px),12px)]">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            Butuh bantuan lebih lanjut? Tim kami siap membantu Anda.
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={waHelpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-white/20" />
              <span>Tanya Admin via WhatsApp</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
