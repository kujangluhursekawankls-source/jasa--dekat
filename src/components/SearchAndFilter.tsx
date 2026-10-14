import React from 'react';
import {
  Search,
  MapPin,
  Filter,
  X,
  RotateCcw,
  Navigation,
  Loader2,
  Compass,
} from 'lucide-react';
import { Category, FilterState, UserLocationState } from '../types';
import { INDONESIAN_REGIONS } from '../data/initialData';

interface SearchAndFilterProps {
  categories: Category[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
  totalResults: number;
  userLocation: UserLocationState | null;
  onDetectLocation: () => void;
  isDetectingLocation: boolean;
  locationError: string;
  onClearLocation: () => void;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  categories,
  filters,
  onFilterChange,
  onReset,
  totalResults,
  userLocation,
  onDetectLocation,
  isDetectingLocation,
  locationError,
  onClearLocation,
}) => {
  const currentRegion = INDONESIAN_REGIONS.find((r) => r.province === filters.province);
  const currentCity = filters.city
    ? currentRegion?.cities.find((c) => c.name === filters.city) ||
      INDONESIAN_REGIONS.flatMap((r) => r.cities).find((c) => c.name === filters.city)
    : undefined;

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      province: e.target.value,
      city: '',
      district: '',
    });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCity = e.target.value;
    if (!selectedCity) {
      onFilterChange({
        ...filters,
        city: '',
        district: '',
      });
      return;
    }

    let prov = filters.province;
    if (!prov) {
      const foundReg = INDONESIAN_REGIONS.find((r) =>
        r.cities.some((c) => c.name === selectedCity)
      );
      if (foundReg) prov = foundReg.province;
    }

    onFilterChange({
      ...filters,
      province: prov,
      city: selectedCity,
      district: '',
    });
  };

  const hasActiveFilters =
    filters.searchQuery ||
    filters.categoryId ||
    filters.province ||
    filters.city ||
    filters.district ||
    userLocation;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
      {/* Search Input Bar + "Lokasi Saya" Quick Button */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            placeholder="Cari tukang atau jasa (contoh: Service AC, tukang listrik, ledeng)..."
            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* GPS Quick Location Button */}
        <button
          type="button"
          onClick={onDetectLocation}
          disabled={isDetectingLocation}
          className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shrink-0 shadow-xs ${
            userLocation
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
          title="Deteksi lokasi Anda untuk menampilkan tukang terdekat"
        >
          {isDetectingLocation ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Mencari Lokasi...</span>
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4" />
              <span>{userLocation ? 'Lokasi Terdeteksi' : 'Cari Terdekat dari Saya'}</span>
            </>
          )}
        </button>
      </div>

      {/* Active Detected Location Banner */}
      {userLocation && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-emerald-950">Lokasi Anda Terdeteksi: </span>
              <strong className="text-emerald-800">{userLocation.displayName}</strong>
              <span className="text-emerald-700 ml-1">
                (Hasil pencarian otomatis diurutkan dari yang terdekat)
              </span>
            </div>
          </div>
          <button
            onClick={onClearLocation}
            className="p-1 text-emerald-600 hover:text-emerald-900 hover:bg-emerald-100 rounded-md transition-colors"
            title="Hapus filter lokasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {locationError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <span className="text-base leading-none">📍</span>
            <div>
              <p className="font-semibold text-amber-900">{locationError}</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Jangan khawatir, Anda dapat langsung memilih Provinsi, Kota, dan Kecamatan dari filter dropdown di bawah ini.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClearLocation}
            className="text-amber-500 hover:text-amber-800 p-1 rounded-lg hover:bg-amber-100 transition-colors"
            title="Tutup pesan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Regional and Category Selectors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Kategori Dropdown */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
            Jenis Layanan / Jasa
          </label>
          <div className="relative">
            <select
              value={filters.categoryId}
              onChange={(e) => onFilterChange({ ...filters, categoryId: e.target.value })}
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none appearance-none"
            >
              <option value="">Semua Kategori Jasa</option>
              {categories
                .filter((c) => c.active !== false)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
              <Filter className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Provinsi */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
            Provinsi
          </label>
          <div className="relative">
            <select
              value={filters.province}
              onChange={handleProvinceChange}
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none appearance-none"
            >
              <option value="">Semua Provinsi</option>
              {INDONESIAN_REGIONS.map((r) => (
                <option key={r.id} value={r.province}>
                  {r.province}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
              <MapPin className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Kota / Kabupaten */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
            Kota / Kabupaten
          </label>
          <div className="relative">
            <select
              value={filters.city}
              onChange={handleCityChange}
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none appearance-none"
            >
              <option value="">
                {filters.province ? `Semua Kota di ${filters.province}` : 'Semua Kota / Kabupaten'}
              </option>
              {filters.province
                ? currentRegion?.cities.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))
                : INDONESIAN_REGIONS.map((reg) => (
                    <optgroup key={reg.id} label={reg.province}>
                      {reg.cities.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
              <MapPin className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Kecamatan Dropdown (Selalu Dropdown, Tidak Pernah Manual Input) */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
            Kecamatan
          </label>
          <div className="relative">
            <select
              value={filters.district}
              onChange={(e) => onFilterChange({ ...filters, district: e.target.value })}
              disabled={!filters.city}
              className={`w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none appearance-none ${
                !filters.city ? 'opacity-60 cursor-not-allowed text-slate-400' : ''
              }`}
            >
              <option value="">
                {!filters.city
                  ? 'Pilih Kota Terlebih Dahulu'
                  : `Semua Kecamatan di ${filters.city} (${currentCity?.districts.length || 0})`}
              </option>
              {currentCity?.districts
                .slice()
                .sort((a, b) => a.localeCompare(b))
                .map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
              <MapPin className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Summary, Sort By Distance & Reset Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
        <div className="text-slate-600 font-medium flex items-center gap-1.5">
          <span>Menampilkan</span>
          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            {totalResults} Teknisi
          </span>
          <span>tersedia</span>
          {userLocation && (
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 ml-1">
              ✓ Diurutkan dari Terdekat
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-slate-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Semua Filter</span>
          </button>
        )}
      </div>
    </div>
  );
};
