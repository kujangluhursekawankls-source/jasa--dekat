import React from 'react';
import { Provider } from '../types';
import {
  X,
  MapPin,
  MessageCircle,
  Tag,
  Wrench,
  CheckCircle,
  Clock,
  ShieldAlert,
  Phone,
  Image as ImageIcon,
} from 'lucide-react';
import {
  buildWhatsAppLink,
  recordWhatsAppClick,
} from '../lib/firebase';

interface ProviderDetailModalProps {
  provider: Provider | null;
  onClose: () => void;
  selectedArea?: string;
}

export const ProviderDetailModal: React.FC<ProviderDetailModalProps> = ({
  provider,
  onClose,
  selectedArea,
}) => {
  if (!provider) return null;

  const whatsappUrl = buildWhatsAppLink({
    whatsappNumber: provider.whatsapp,
    providerName: provider.name,
    serviceCategory: provider.categoryName,
    userArea: selectedArea || provider.city,
  });

  const handleWhatsAppClick = () => {
    recordWhatsAppClick(provider.id);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
              {provider.categoryName}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Tersedia
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Technician Profile Card Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center">
              {provider.photoUrl ? (
                <img
                  src={provider.photoUrl}
                  alt={provider.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Wrench className="w-10 h-10" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                {provider.name}
              </h2>

              <div className="flex items-center gap-1.5 text-slate-600 text-sm mt-1.5">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="font-medium">
                  {provider.city}, {provider.province}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp: {provider.whatsapp}</span>
              </div>
            </div>
          </div>

          {/* Pricing Guidance */}
          {provider.priceRange && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
                  Estimasi Biaya / Kisaran Harga
                </div>
                <div className="text-sm font-bold text-emerald-950">
                  {provider.priceRange}
                </div>
                <div className="text-[11px] text-emerald-700">
                  *Biaya riil dapat didiskusikan langsung via chat WhatsApp sesuai tingkat kerusakan.
                </div>
              </div>
            </div>
          )}

          {/* Sub-Services Offered */}
          {provider.subServices && provider.subServices.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2.5">
                Daftar Layanan Spesifik
              </h3>
              <div className="flex flex-wrap gap-2">
                {provider.subServices.map((srv, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200/80"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    {srv}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Service Area Coverage */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              Wilayah Operasional & Jangkauan Layanan
            </h3>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="text-xs text-slate-700">
                <span className="font-semibold text-slate-900">Kota / Wilayah Utama: </span>
                {provider.city}, {provider.province}
              </div>
              {provider.districts && provider.districts.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Kecamatan / Area Terlayani:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {provider.districts.map((dst, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-white text-slate-700 px-2 py-1 rounded-md border border-slate-200"
                      >
                        {dst}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description & Experience */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              Deskripsi Pengalaman & Layanan
            </h3>
            <div className="text-sm text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-slate-200 whitespace-pre-line">
              {provider.description}
            </div>
          </div>

          {/* Portfolio Work Gallery */}
          {provider.gallery && provider.gallery.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>Foto Hasil Pekerjaan / Portofolio</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {provider.gallery.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group relative"
                  >
                    <img
                      src={imgUrl}
                      alt={`Pekerjaan ${provider.name} ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* JasaDekat Direct Mediation Note */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Catatan Mediator JasaDekat: </span>
              Aplikasi memfasilitasi komunikasi langsung antara Anda dan teknisi tanpa biaya transaksi perantara. Pastikan konsultasikan kebutuhan dan estimasi biaya secara transparan di WhatsApp sebelum teknisi datang ke lokasi Anda.
            </div>
          </div>
        </div>

        {/* Modal Sticky Footer with Prominent WhatsApp Button */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:flex-1 text-center sm:text-left">
            <div className="text-xs text-slate-500">Tanya ketersediaan & jadwal kunjungan:</div>
            <div className="text-sm font-bold text-slate-800">{provider.name}</div>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsAppClick}
            className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/30 group"
          >
            <MessageCircle className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
            <span>Hubungi via WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
