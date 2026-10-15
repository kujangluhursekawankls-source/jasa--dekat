import { Provider, UserLocationState } from '../types';
import {
  MapPin,
  ExternalLink,
  MessageCircle,
  Wrench,
  Tag,
  Eye,
  Navigation,
} from 'lucide-react';
import {
  buildWhatsAppLink,
  recordWhatsAppClick,
  recordProviderView,
} from '../lib/firebase';
import { getProviderDistance } from '../lib/location';

interface ProviderCardProps {
  provider: Provider;
  onOpenDetail: (provider: Provider) => void;
  selectedArea?: string;
  userLocation?: UserLocationState | null;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  onOpenDetail,
  selectedArea,
  userLocation,
}) => {
  const whatsappUrl = buildWhatsAppLink({
    whatsappNumber: provider.whatsapp,
    providerName: provider.name,
    serviceCategory: provider.categoryName,
    userArea: selectedArea || provider.city,
  });

  const distanceKm = userLocation
    ? getProviderDistance(userLocation.latitude, userLocation.longitude, provider.city)
    : null;

  const isLocalCity = userLocation
    ? userLocation.cityName.toLowerCase() === provider.city.toLowerCase()
    : false;

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    recordWhatsAppClick(provider.id);
  };

  const handleCardClick = () => {
    recordProviderView(provider.id);
    onOpenDetail(provider);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer group"
    >
      <div>
        {/* Card Header & Avatar */}
        <div className="p-4 sm:p-5 flex items-start gap-3.5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 relative flex items-center justify-center">
            {provider.photoUrl ? (
              <img
                src={provider.photoUrl}
                alt={provider.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 flex items-center justify-center">
                <Wrench className="w-7 h-7" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 truncate">
                {provider.categoryName}
              </span>
              {distanceKm !== null && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                  isLocalCity
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  <Navigation className="w-2.5 h-2.5" />
                  <span>{isLocalCity ? `~${distanceKm} km (Wilayah Anda)` : `~${distanceKm} km`}</span>
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
              {provider.name}
            </h3>

            {/* Region / Coverage Area */}
            <div className="flex items-center gap-1 text-slate-500 text-xs mt-1 truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">
                {provider.city}, {provider.province}
              </span>
            </div>
          </div>
        </div>

        {/* Districts / Sub-services Chips */}
        <div className="px-4 sm:px-5 pb-3">
          {provider.districts && provider.districts.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2.5">
              <span className="text-[10px] text-slate-400 py-0.5">Jangkauan:</span>
              {provider.districts.slice(0, 3).map((district, idx) => (
                <span
                  key={idx}
                  className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                >
                  {district}
                </span>
              ))}
              {provider.districts.length > 3 && (
                <span className="text-[10px] text-slate-500 self-center">
                  +{provider.districts.length - 3} lainnya
                </span>
              )}
            </div>
          )}

          {/* Description */}
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {provider.description}
          </p>

          {/* Price Range if available */}
          {provider.priceRange && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kisaran: {provider.priceRange}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="p-3 sm:p-4 bg-slate-50/90 border-t border-slate-100 flex items-center gap-2">
        <button
          type="button"
          onClick={handleCardClick}
          className="flex-1 py-2.5 sm:py-2 px-3 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/90 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs min-h-[44px] active:scale-[0.98] cursor-pointer"
        >
          <Eye className="w-4 h-4 text-slate-500" />
          <span>Lihat Detail</span>
        </button>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWhatsAppClick}
          className="flex-1 py-2.5 sm:py-2 px-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-emerald-600/20 min-h-[44px] active:scale-[0.98]"
        >
          <MessageCircle className="w-4 h-4 fill-white" />
          <span>WhatsApp</span>
        </a>
      </div>
    </div>
  );
};
