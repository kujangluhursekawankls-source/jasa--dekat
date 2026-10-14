import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  Trash2,
} from 'lucide-react';
import { Category, AdminContactSettings } from '../types';
import { INDONESIAN_REGIONS, getDistrictsForCity } from '../data/initialData';
import { useAuth } from '../contexts/AuthContext';
import {
  db,
  setDoc,
  doc,
  collection,
  addDoc,
  OperationType,
  handleFirestoreError,
  normalizeWhatsAppNumber,
} from '../lib/firebase';
import { MessageCircle, Globe } from 'lucide-react';

interface RegisterProviderModalProps {
  categories: Category[];
  adminSettings?: AdminContactSettings;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RegisterProviderModal: React.FC<RegisterProviderModalProps> = ({
  categories,
  adminSettings,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, registerWithEmail } = useAuth();

  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subServicesInput, setSubServicesInput] = useState('');
  const [province, setProvince] = useState('Jawa Barat');
  const [city, setCity] = useState('Kota Bogor');
  const [districtsList, setDistrictsList] = useState<string[]>(['Bogor Tengah', 'Bogor Barat']);
  const [description, setDescription] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const currentRegion = INDONESIAN_REGIONS.find((r) => r.province === province);
  const availableDistricts = getDistrictsForCity(city);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProv = e.target.value;
    setProvince(newProv);
    const reg = INDONESIAN_REGIONS.find((r) => r.province === newProv);
    if (reg && reg.cities.length > 0) {
      const firstCity = reg.cities[0].name;
      setCity(firstCity);
      const dists = getDistrictsForCity(firstCity);
      setDistrictsList(dists.slice(0, 3));
    } else {
      setCity('');
      setDistrictsList([]);
    }
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCity = e.target.value;
    setCity(newCity);
    const dists = getDistrictsForCity(newCity);
    setDistrictsList(dists.slice(0, 3));
  };

  const handleSelectDistrictDropdown = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val && !districtsList.includes(val)) {
      setDistrictsList([...districtsList, val]);
    }
    e.target.value = '';
  };

  const handleToggleDistrict = (dst: string) => {
    if (districtsList.includes(dst)) {
      setDistrictsList(districtsList.filter((d) => d !== dst));
    } else {
      setDistrictsList([...districtsList, dst]);
    }
  };

  const handleSelectAllDistricts = () => {
    setDistrictsList(availableDistricts);
  };

  const handleClearAllDistricts = () => {
    setDistrictsList([]);
  };

  const handleRemoveDistrict = (dst: string) => {
    setDistrictsList(districtsList.filter((d) => d !== dst));
  };

  // Convert uploaded image file to data URL
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

  const handleRemovePhoto = () => {
    setPhotoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      // Basic validations
      if (!name.trim()) throw new Error('Nama lengkap / usaha wajib diisi.');
      if (!whatsapp.trim()) throw new Error('Nomor WhatsApp wajib diisi.');
      if (!categoryId) throw new Error('Pilih kategori jasa.');
      if (!province || !city) throw new Error('Wilayah provinsi dan kota wajib dipilih.');
      if (!districtsList || districtsList.length === 0) {
        throw new Error('Pilih minimal 1 kecamatan wilayah jangkauan layanan Anda.');
      }
      if (!description.trim()) throw new Error('Deskripsi keahlian / layanan wajib diisi.');

      let userId = currentUser?.uid;

      // If user not logged in, attempt to create account if credentials provided
      if (!currentUser) {
        if (email.trim() && password.trim()) {
          try {
            if (password.length >= 6) {
              const createdUser = await registerWithEmail(email.trim(), password.trim(), name.trim());
              userId = createdUser.uid;
            }
          } catch (authErr: unknown) {
            console.warn('Mitra auth notice (proceeding with registration ID):', authErr);
            // If Firebase Auth has email/password disabled (auth/operation-not-allowed), fallback gracefully
            userId = `mitra-${Date.now()}`;
          }
        }
        if (!userId) {
          userId = `mitra-${Date.now()}`;
        }
      }

      const selectedCategory = categories.find((c) => c.id === categoryId);
      const subServicesArray = subServicesInput
        ? subServicesInput.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      // Save provider profile to Cloud Firestore with status 'pending'
      const providerData = {
        userId,
        name: name.trim(),
        whatsapp: whatsapp.trim(),
        categoryId,
        categoryName: selectedCategory?.name || 'Jasa Umum',
        subServices: subServicesArray,
        province,
        city,
        districts: districtsList,
        description: description.trim(),
        priceRange: priceRange.trim(),
        photoUrl: photoUrl.trim() || '',
        gallery: [],
        status: 'pending', // Pendaftaran harus menunggu persetujuan admin
        viewsCount: 0,
        whatsappClicks: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await addDoc(collection(db, 'providers'), providerData);
        // If user is authenticated, also sync their user role document
        if (currentUser || (userId && !userId.startsWith('mitra-'))) {
          try {
            await setDoc(
              doc(db, 'users', String(userId)),
              {
                id: userId,
                email: currentUser?.email || email.trim(),
                role: 'provider',
                displayName: name.trim(),
                createdAt: new Date().toISOString(),
              },
              { merge: true }
            );
          } catch (userErr) {
            console.warn('User doc sync skipped:', userErr);
          }
        }
      } catch (firestoreErr) {
        handleFirestoreError(firestoreErr, OperationType.CREATE, 'providers');
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Terjadi kesalahan saat mendaftar. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div
        className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Daftar Sebagai Penyedia Jasa / Teknisi
            </h2>
            <p className="text-xs text-slate-500">
              Bergabung dengan JasaDekat untuk menerima order perbaikan rumah via WhatsApp
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body or Success State */}
        <div className="overflow-y-auto p-4 sm:p-6">
          {isSuccess ? (
            <div className="text-center py-6 px-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Pendaftaran Berhasil Dikirim!
              </h3>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1.5 text-left">
                <div className="font-semibold flex items-center gap-1 text-amber-800">
                  <Clock className="w-4 h-4" />
                  Status: Menunggu Pemeriksaan Admin
                </div>
                <p>
                  Sesuai ketentuan JasaDekat, profil Anda berstatus <strong>Pending</strong> dan akan ditinjau oleh Admin untuk memverifikasi data sebelum ditampilkan di pencarian publik.
                </p>
                <p>
                  Anda dapat masuk ke <strong>Dasbor Mitra</strong> kapan saja untuk memantau status atau memperbarui informasi profil Anda.
                </p>
              </div>

              {/* ACTION: Hubungi Admin untuk verifikasi langsung */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-left space-y-2">
                <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  <span>Konfirmasi Pendaftaran ke WhatsApp Admin</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Agar akun Anda cepat diperiksa dan disetujui, segera hubungi Admin melalui WhatsApp dengan menekan tombol di bawah ini:
                </p>
                <a
                  href={`https://wa.me/${normalizeWhatsAppNumber(
                    adminSettings?.adminWhatsapp || '081289123456'
                  )}?text=${encodeURIComponent(
                    `Halo Admin JasaDekat, saya baru saja mendaftar sebagai mitra tukang/teknisi atas nama "${name}" untuk layanan "${
                      categories.find((c) => c.id === categoryId)?.name || 'Jasa Perbaikan'
                    }" di ${city}. Mohon panduan verifikasi akun saya. Terima kasih!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Chat WhatsApp Admin Sekarang</span>
                </a>
              </div>

              <button
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                Selesai & Kembali ke Beranda
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>{errorMessage}</div>
                </div>
              )}

              {/* WAJIB KONFIRMASI KE NOMOR WA ADMIN DAHULU */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <MessageCircle className="w-4 h-4 fill-white" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-amber-950 uppercase tracking-wide">
                      ⚠️ Wajib Konfirmasi ke Admin Terlebih Dahulu
                    </h4>
                    <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                      Untuk mendaftar sebagai mitra, harap konfirmasi terlebih dahulu ke nomor WhatsApp Admin agar identitas dan wilayah kerja Anda dapat segera diproses.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/80">
                  <a
                    href={`https://wa.me/${normalizeWhatsAppNumber(
                      adminSettings?.adminWhatsapp || '081289123456'
                    )}?text=${encodeURIComponent(
                      'Halo Admin JasaDekat, saya ingin mendaftar sebagai mitra teknisi/tukang di JasaDekat. Mohon informasi dan verifikasi pendaftaran saya.'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white" />
                    <span>WhatsApp Admin: {adminSettings?.adminWhatsapp || '081289123456'}</span>
                  </a>

                  {adminSettings?.adminFacebook && (
                    <a
                      href={adminSettings.adminFacebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Facebook Admin</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Data Usaha / Teknisi */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100">
                  1. Informasi Teknisi / Jasa
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Teknisi atau Nama Usaha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Pak Budi Service AC / Surya Mandiri Teknik"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp Aktif <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Contoh: 08123456789 atau 628123456789"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-500">
                    Pelanggan akan langsung menghubungi nomor WhatsApp ini.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori Jasa Utama <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  >
                    <option value="">Pilih Kategori Layanan</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Layanan Spesifik (Pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={subServicesInput}
                    onChange={(e) => setSubServicesInput(e.target.value)}
                    placeholder="Contoh: Cuci AC, Tambah Freon R32, Bongkar Pasang"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Akun Login (jika belum login) */}
              {!currentUser && (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100">
                    2. Akun Login Mitra
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Akun <span className="text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="emailanda@gmail.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kata Sandi <span className="text-slate-400 font-normal">(Opsional, untuk login ke dasbor mitra)</span>
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Opsional (minimal 6 karakter)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Wilayah Jangkauan Layanan */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100">
                  {currentUser ? '2' : '3'}. Wilayah Jangkauan Layanan
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Provinsi <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={province}
                      onChange={handleProvinceChange}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                      Kota / Kabupaten <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={city}
                      onChange={handleCityChange}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                      Pilih Kecamatan Jangkauan Layanan <span className="text-red-500">*</span>
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
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
                    >
                      <option value="" disabled>
                        + Klik untuk pilih kecamatan di {city} ({availableDistricts.length} tersedia)
                      </option>
                      {availableDistricts.map((dst) => (
                        <option key={dst} value={dst} disabled={districtsList.includes(dst)}>
                          {dst} {districtsList.includes(dst) ? '✓ (Sudah dipilih)' : ''}
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
                      <span>Bisa langsung klik nama kecamatan di bawah ini (bisa pilih beberapa):</span>
                      <span className="font-semibold text-blue-700">{districtsList.length} terpilih</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                      {availableDistricts.map((dst) => {
                        const isSelected = districtsList.includes(dst);
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
                  {districtsList.length > 0 ? (
                    <div className="space-y-1">
                      <div className="text-[11px] font-medium text-slate-600">
                        Kecamatan Terpilih ({districtsList.length}):
                      </div>
                      <div className="flex flex-wrap gap-1.5 p-2 bg-blue-50/60 rounded-xl border border-blue-200/60">
                        {districtsList.map((dst) => (
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
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                      ⚠️ Wajib memilih minimal satu kecamatan di {city} yang Anda layani.
                    </div>
                  )}
                </div>
              </div>

              {/* Detail Layanan & Estimasi Biaya */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100">
                  {currentUser ? '3' : '4'}. Detail & Pengalaman
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deskripsi Pengalaman & Keahlian <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Jelaskan pengalaman Anda, garansi pekerjaan, jam kerja, atau peralatan yang dimiliki..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estimasi Harga / Kisaran Biaya (Opsional)
                  </label>
                  <input
                    type="text"
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    placeholder="Contoh: Mulai Rp 75.000 / unit atau Rp 100.000 - Rp 300.000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Foto Profil / Foto Hasil Kerja (Opsional)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{photoUrl ? 'Ganti Foto dari HP' : 'Pilih Foto dari HP'}</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-xs text-slate-400">atau masukkan URL:</span>
                  </div>
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="mt-2 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {photoUrl && (
                    <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-white">
                          <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800">Foto Berhasil Dipilih</p>
                          <p className="text-[11px] text-slate-500 truncate">Foto ini akan tampil di profil mitra Anda</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                        title="Hapus atau batalkan foto ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus / Batal Foto</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-blue-500/20"
                >
                  {loading ? 'Mengirim Pendaftaran...' : 'Kirim Pendaftaran'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
