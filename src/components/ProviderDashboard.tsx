import React, { useState } from 'react';
import {
  Briefcase,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  MessageCircle,
  TrendingUp,
  MapPin,
  Save,
  Send,
  AlertTriangle,
  Upload,
  Plus,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Category, Provider } from '../types';
import { INDONESIAN_REGIONS, getDistrictsForCity } from '../data/initialData';
import { db, doc, updateDoc, OperationType, handleFirestoreError } from '../lib/firebase';

interface ProviderDashboardProps {
  categories: Category[];
  onBackToHome: () => void;
}

export const ProviderDashboard: React.FC<ProviderDashboardProps> = ({
  categories,
  onBackToHome,
}) => {
  const { currentUser, providerProfile, refreshProviderProfile } = useAuth();

  const [name, setName] = useState(providerProfile?.name || '');
  const [whatsapp, setWhatsapp] = useState(providerProfile?.whatsapp || '');
  const [categoryId, setCategoryId] = useState(providerProfile?.categoryId || '');
  const [subServices, setSubServices] = useState(providerProfile?.subServices?.join(', ') || '');
  const [province, setProvince] = useState(providerProfile?.province || 'Jawa Barat');
  const [city, setCity] = useState(providerProfile?.city || 'Kota Bogor');
  const [districts, setDistricts] = useState<string[]>(providerProfile?.districts || []);
  const [description, setDescription] = useState(providerProfile?.description || '');
  const [priceRange, setPriceRange] = useState(providerProfile?.priceRange || '');
  const [photoUrl, setPhotoUrl] = useState(providerProfile?.photoUrl || '');

  const [loading, setLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Silakan Masuk Terlebih Dahulu</h2>
        <p className="text-sm text-slate-500 mb-4">
          Anda perlu masuk dengan akun mitra untuk mengakses dasbor ini.
        </p>
        <button
          onClick={onBackToHome}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  if (!providerProfile) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Profil Mitra Belum Terdaftar</h2>
        <p className="text-sm text-slate-500 mb-5">
          Akun Anda ({currentUser.email}) belum memiliki profil penyedia jasa terdaftar.
        </p>
        <button
          onClick={onBackToHome}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold"
        >
          Daftarkan Jasa Sekarang
        </button>
      </div>
    );
  }

  const viewsCount = providerProfile.viewsCount || 0;
  const whatsappClicks = providerProfile.whatsappClicks || 0;
  const conversionRate = viewsCount > 0 ? ((whatsappClicks / viewsCount) * 100).toFixed(1) : '0';

  const currentRegion = INDONESIAN_REGIONS.find((r) => r.province === province);
  const availableDistricts = getDistrictsForCity(city);

  const handleSelectDistrictDropdown = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val && !districts.includes(val)) {
      setDistricts([...districts, val]);
    }
    e.target.value = '';
  };

  const handleToggleDistrict = (dst: string) => {
    if (districts.includes(dst)) {
      setDistricts(districts.filter((d) => d !== dst));
    } else {
      setDistricts([...districts, dst]);
    }
  };

  const handleSelectAllDistricts = () => {
    setDistricts(availableDistricts);
  };

  const handleClearAllDistricts = () => {
    setDistricts([]);
  };

  const handleRemoveDistrict = (dst: string) => {
    setDistricts(districts.filter((d) => d !== dst));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('Ukuran file maksimal 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async (reSubmit: boolean = false) => {
    setLoading(true);
    setErrorMessage('');
    setSuccessNotice('');

    try {
      const selectedCategory = categories.find((c) => c.id === categoryId);
      const subServicesArray = subServices
        ? subServices.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      // If reSubmit is requested or status was rejected, set status back to 'pending' for admin review
      const newStatus = reSubmit ? 'pending' : providerProfile.status;

      const updatePayload: Partial<Provider> = {
        name: name.trim(),
        whatsapp: whatsapp.trim(),
        categoryId,
        categoryName: selectedCategory?.name || providerProfile.categoryName,
        subServices: subServicesArray,
        province,
        city,
        districts,
        description: description.trim(),
        priceRange: priceRange.trim(),
        photoUrl: photoUrl.trim(),
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };

      const docRef = doc(db, 'providers', providerProfile.id);
      await updateDoc(docRef, updatePayload);
      await refreshProviderProfile();

      setSuccessNotice(
        reSubmit
          ? 'Perubahan berhasil disimpan dan profil telah diajukan kembali ke Admin untuk peninjauan!'
          : 'Data profil berhasil diperbarui!'
      );
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, `providers/${providerProfile.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in">
      {/* Header & Status Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Dasbor Mitra Teknisi
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {providerProfile.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              ID Profil: <span className="font-mono">{providerProfile.id}</span>
            </p>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {providerProfile.status === 'approved' && (
              <div className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Aktif & Tampil Publik</span>
              </div>
            )}
            {providerProfile.status === 'pending' && (
              <div className="px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Menunggu Peninjauan Admin</span>
              </div>
            )}
            {providerProfile.status === 'rejected' && (
              <div className="px-3.5 py-1.5 rounded-full bg-red-100 text-red-800 border border-red-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <XCircle className="w-4 h-4 text-red-600" />
                <span>Pendaftaran Ditolak</span>
              </div>
            )}
            {providerProfile.status === 'disabled' && (
              <div className="px-3.5 py-1.5 rounded-full bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <AlertTriangle className="w-4 h-4 text-slate-600" />
                <span>Dinonaktifkan Sementara</span>
              </div>
            )}
          </div>
        </div>

        {/* Rejection Note if any */}
        {providerProfile.status === 'rejected' && providerProfile.rejectionReason && (
          <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900">
            <div className="font-bold mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Catatan Penolakan dari Admin:
            </div>
            <p className="leading-relaxed">{providerProfile.rejectionReason}</p>
            <p className="mt-2 text-red-700 font-medium">
              Silakan perbaiki data di bawah dan tekan tombol <strong>"Ajukan Ulang Peninjauan"</strong>.
            </p>
          </div>
        )}

        {/* Real-Time Performance Analytics Cards */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Profil Dilihat (Views)</span>
              <Eye className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {viewsCount.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Frekuensi profil muncul & dibuka pencari
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <div className="flex items-center justify-between text-emerald-800 mb-1">
              <span className="text-xs font-semibold">Klik Kontak WhatsApp</span>
              <MessageCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-950">
              {whatsappClicks.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-emerald-700 mt-1">
              Pelanggan menekan tombol hubungi
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
            <div className="flex items-center justify-between text-blue-800 mb-1">
              <span className="text-xs font-semibold">Rasio Konversi Kontak</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-950">
              {conversionRate}%
            </div>
            <div className="text-[11px] text-blue-700 mt-1">
              Persentase pengunjung yang chat WhatsApp
            </div>
          </div>
        </div>
      </div>

      {/* Profile Edit Form */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Perbarui Informasi Layanan
            </h2>
            <p className="text-xs text-slate-500">
              Perubahan pada nomor kontak atau deskripsi akan langsung diterapkan setelah disimpan
            </p>
          </div>
        </div>

        {successNotice && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Usaha / Teknisi
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nomor WhatsApp
            </label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kategori Jasa Utama
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kisaran Biaya / Tarif
            </label>
            <input
              type="text"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              placeholder="Contoh: Mulai Rp 75.000 / unit"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Layanan Spesifik (Pisahkan koma)
          </label>
          <input
            type="text"
            value={subServices}
            onChange={(e) => setSubServices(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Regional settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Provinsi
            </label>
            <select
              value={province}
              onChange={(e) => {
                const newProv = e.target.value;
                setProvince(newProv);
                const reg = INDONESIAN_REGIONS.find((r) => r.province === newProv);
                if (reg && reg.cities.length > 0) {
                  const firstCity = reg.cities[0].name;
                  setCity(firstCity);
                  const dists = getDistrictsForCity(firstCity);
                  setDistricts(dists.slice(0, 3));
                }
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {INDONESIAN_REGIONS.map((r) => (
                <option key={r.id} value={r.province}>
                  {r.province}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kota / Kabupaten
            </label>
            <select
              value={city}
              onChange={(e) => {
                const newCity = e.target.value;
                setCity(newCity);
                const dists = getDistrictsForCity(newCity);
                setDistricts(dists.slice(0, 3));
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {currentRegion?.cities.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Kecamatan Dropdown & Multi-Select */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700">
              Kecamatan Jangkauan Layanan
            </label>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={handleSelectAllDistricts}
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
              >
                Pilih Semua ({availableDistricts.length})
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleClearAllDistricts}
                className="text-slate-500 hover:text-red-600 font-semibold hover:underline"
              >
                Hapus Semua
              </button>
            </div>
          </div>

          {/* Dropdown Selector */}
          <div className="relative">
            <select
              onChange={handleSelectDistrictDropdown}
              defaultValue=""
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
            >
              <option value="" disabled>
                + Klik untuk pilih kecamatan di {city} ({availableDistricts.length} tersedia)
              </option>
              {availableDistricts.map((dst) => (
                <option key={dst} value={dst} disabled={districts.includes(dst)}>
                  {dst} {districts.includes(dst) ? '✓ (Sudah dipilih)' : ''}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <Plus className="w-4 h-4" />
            </div>
          </div>

          {/* Multi-Select Interactive Chips */}
          <div>
            <div className="text-[11px] text-slate-500 mb-1.5 flex items-center justify-between">
              <span>Klik nama kecamatan di bawah ini (bisa pilih beberapa kecamatan):</span>
              <span className="font-semibold text-blue-700">{districts.length} terpilih</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              {availableDistricts.map((dst) => {
                const isSelected = districts.includes(dst);
                return (
                  <button
                    type="button"
                    key={dst}
                    onClick={() => handleToggleDistrict(dst)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50/50'
                    }`}
                  >
                    <span>{isSelected ? '✓' : '+'}</span>
                    <span>{dst}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Summary Badges */}
          {districts.length > 0 ? (
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-slate-600">
                Kecamatan Terpilih ({districts.length}):
              </div>
              <div className="flex flex-wrap gap-1.5 p-2 bg-blue-50/60 rounded-xl border border-blue-200/60">
                {districts.map((dst) => (
                  <span
                    key={dst}
                    className="inline-flex items-center gap-1.5 bg-white border border-blue-200 px-2 py-0.5 rounded-lg text-xs text-blue-900 font-medium shadow-2xs"
                  >
                    <span>{dst}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDistrict(dst)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      title="Hapus kecamatan ini"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              ⚠️ Silakan pilih minimal satu kecamatan jangkauan layanan.
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Deskripsi Pengalaman & Layanan
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Foto Profil / Usaha
          </label>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>Pilih Foto Baru</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="Atau URL foto..."
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
            />
          </div>
          {photoUrl && (
            <div className="mt-2 w-16 h-16 rounded-xl overflow-hidden border border-slate-200">
              <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToHome}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Kembali ke Beranda
          </button>

          <div className="flex items-center gap-2">
            {(providerProfile.status === 'rejected' || providerProfile.status === 'pending') && (
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSaveChanges(true)}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ajukan Ulang Peninjauan</span>
              </button>
            )}

            <button
              type="button"
              disabled={loading}
              onClick={() => handleSaveChanges(false)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-500/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
