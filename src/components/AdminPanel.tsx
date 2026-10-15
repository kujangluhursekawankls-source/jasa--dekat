import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Trash2,
  Edit,
  Eye,
  MessageCircle,
  TrendingUp,
  BarChart3,
  Layers,
  MapPin,
  RefreshCw,
  ExternalLink,
  Save,
  Check,
  PowerOff,
  Power,
  RotateCcw,
  Phone,
  Globe,
  Users,
  Tag,
  SlidersHorizontal,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
} from 'lucide-react';
import { INDONESIAN_REGIONS, INITIAL_CATEGORIES, getDistrictsForCity, isDefaultSampleProvider } from '../data/initialData';
import {
  db,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
  OperationType,
  handleFirestoreError,
} from '../lib/firebase';
import { DynamicIcon } from './DynamicIcon';

import { Category, Provider, ProviderStatus, AdminContactSettings } from '../types';

export const PRESET_CATEGORY_IMAGES = [
  { name: 'Service AC', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=256&q=80' },
  { name: 'Tukang Listrik', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=256&q=80' },
  { name: 'Ledeng & Pipa', url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=256&q=80' },
  { name: 'Tukang Bangunan', url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=256&q=80' },
  { name: 'Cat Rumah', url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=256&q=80' },
  { name: 'Pompa Air', url: 'https://images.unsplash.com/photo-1615859131861-052f0641a60e?auto=format&fit=crop&w=256&q=80' },
  { name: 'Atap Bocor', url: 'https://images.unsplash.com/photo-1632759145351-1d592919f522?auto=format&fit=crop&w=256&q=80' },
  { name: 'Elektronik & TV', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=256&q=80' },
  { name: 'Kebersihan', url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=256&q=80' },
  { name: 'Kunci & Pintu', url: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=256&q=80' },
];

export const POPULAR_CATEGORY_ICONS = [
  { name: 'AirVent', label: 'AC' },
  { name: 'Zap', label: 'Listrik' },
  { name: 'Droplets', label: 'Ledeng' },
  { name: 'Hammer', label: 'Bangunan' },
  { name: 'ShieldAlert', label: 'Atap Bocor' },
  { name: 'Paintbrush', label: 'Cat Rumah' },
  { name: 'Gauge', label: 'Pompa Air' },
  { name: 'DoorClosed', label: 'Pintu/Jendela' },
  { name: 'Bug', label: 'Anti Hama' },
  { name: 'Sparkles', label: 'Cleaning' },
  { name: 'Truck', label: 'Jasa Angkut' },
  { name: 'Sun', label: 'Solar Panel' },
  { name: 'Wrench', label: 'Servis Umum' },
  { name: 'Flame', label: 'Kompor' },
  { name: 'Key', label: 'Ahli Kunci' },
  { name: 'Tv', label: 'Elektronik' },
  { name: 'Cpu', label: 'Komputer' },
  { name: 'Fan', label: 'Kipas/Blower' },
  { name: 'Scissors', label: 'Taman/Rumput' },
  { name: 'ShieldCheck', label: 'CCTV' },
  { name: 'Camera', label: 'Kamera' },
  { name: 'Home', label: 'Rumah' },
  { name: 'Box', label: 'Perkakas' },
  { name: 'Car', label: 'Otomotif' },
];

interface AdminPanelProps {
  providers: Provider[];
  categories: Category[];
  adminSettings?: AdminContactSettings;
  onRefreshData: () => void;
  onBackToHome: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  providers,
  categories,
  adminSettings,
  onRefreshData,
  onBackToHome,
}) => {
  const [activeTab, setActiveTab] = useState<
    'approvals' | 'analytics' | 'all-providers' | 'categories' | 'contact-settings' | 'regions'
  >('analytics');

  // Search & Filter state for admin provider list
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Provider deletion state
  const [providerToDelete, setProviderToDelete] = useState<Provider | null>(null);

  // Admin Contact Settings state
  const [contactWhatsapp, setContactWhatsapp] = useState(adminSettings?.adminWhatsapp || '08179015181');
  const [contactFacebook, setContactFacebook] = useState(adminSettings?.adminFacebook || 'https://facebook.com/jasadekat');
  const [savingContact, setSavingContact] = useState(false);

  useEffect(() => {
    if (adminSettings) {
      if (adminSettings.adminWhatsapp) setContactWhatsapp(adminSettings.adminWhatsapp);
      if (adminSettings.adminFacebook) setContactFacebook(adminSettings.adminFacebook);
    }
  }, [adminSettings]);

  // Modal / Form state for Manual Provider Creation
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualWhatsapp, setManualWhatsapp] = useState('');
  const [manualCategory, setManualCategory] = useState(categories[0]?.id || '');
  const [manualProvince, setManualProvince] = useState('Jawa Barat');
  const [manualCity, setManualCity] = useState('Kota Bogor');
  const [manualDistricts, setManualDistricts] = useState<string[]>(['Bogor Barat', 'Bogor Tengah']);
  const [manualNewDistrict, setManualNewDistrict] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualPrice, setManualPrice] = useState('Mulai Rp 75.000');
  const [manualPhotoUrl, setManualPhotoUrl] = useState('');
  const [manualConsentGiven, setManualConsentGiven] = useState(false);

  // Reject with reason modal
  const [rejectingProvider, setRejectingProvider] = useState<Provider | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Editing existing provider
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);

  // Category creation state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=256&q=80');
  const [categoryImageMode, setCategoryImageMode] = useState<'upload' | 'url'>('upload');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [categoryOrder, setCategoryOrder] = useState<number>(categories.length + 1);
  const [categoryActive, setCategoryActive] = useState(true);

  // Category Edit state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatIcon, setEditCatIcon] = useState('');
  const [editCatImageMode, setEditCatImageMode] = useState<'upload' | 'url'>('upload');
  const [editCatDesc, setEditCatDesc] = useState('');
  const [editCatOrder, setEditCatOrder] = useState<number>(1);
  const [editCatActive, setEditCatActive] = useState(true);

  // Image upload and compress helper (<50KB WebP)
  const handleImageFileChange = (file: File, callback: (dataUrl: string) => void) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 256;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/webp', 0.85);
          callback(compressedDataUrl);
        } else {
          callback(e.target?.result as string);
        }
      };
      img.onerror = () => {
        callback(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Category Delete confirmation state
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // Category search & filter in tab
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [loadingAction, setLoadingAction] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  // Stats calculation
  const totalCount = providers.length;
  const pendingProviders = providers.filter((p) => p.status === 'pending');
  const approvedProviders = providers.filter((p) => p.status === 'approved');
  const rejectedProviders = providers.filter((p) => p.status === 'rejected');
  const disabledProviders = providers.filter((p) => p.status === 'disabled');

  const totalViews = providers.reduce((acc, p) => acc + (p.viewsCount || 0), 0);
  const totalWhatsAppClicks = providers.reduce((acc, p) => acc + (p.whatsappClicks || 0), 0);
  const overallConversion = totalViews > 0 ? ((totalWhatsAppClicks / totalViews) * 100).toFixed(1) : '0';

  // Seed default categories if none exist
  const handleSeedCategories = async () => {
    setLoadingAction(true);
    try {
      for (const cat of INITIAL_CATEGORIES) {
        await addDoc(collection(db, 'categories'), {
          ...cat,
          createdAt: new Date().toISOString(),
        });
      }
      setActionNotice('12 Kategori awal berhasil ditambahkan ke database!');
      onRefreshData();
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.WRITE, 'categories');
    } finally {
      setLoadingAction(false);
    }
  };

  // Status updates: Approve
  const handleApprove = async (provider: Provider) => {
    setLoadingAction(true);
    try {
      const pRef = doc(db, 'providers', provider.id);
      await updateDoc(pRef, {
        status: 'approved',
        updatedAt: new Date().toISOString(),
      });
      setActionNotice(`Mitra "${provider.name}" berhasil disetujui dan kini aktif secara publik.`);
      onRefreshData();
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, `providers/${provider.id}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // Status updates: Reject
  const handleConfirmReject = async () => {
    if (!rejectingProvider) return;
    setLoadingAction(true);
    try {
      const pRef = doc(db, 'providers', rejectingProvider.id);
      await updateDoc(pRef, {
        status: 'rejected',
        rejectionReason: rejectReason || 'Informasi layanan belum memenuhi kriteria verifikasi.',
        updatedAt: new Date().toISOString(),
      });
      setActionNotice(`Pendaftaran mitra "${rejectingProvider.name}" telah ditolak.`);
      setRejectingProvider(null);
      setRejectReason('');
      onRefreshData();
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, `providers/${rejectingProvider.id}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // Toggle Disable / Enable
  const handleToggleDisable = async (provider: Provider) => {
    setLoadingAction(true);
    const newStatus: ProviderStatus = provider.status === 'disabled' ? 'approved' : 'disabled';
    try {
      const pRef = doc(db, 'providers', provider.id);
      await updateDoc(pRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      setActionNotice(
        newStatus === 'approved'
          ? `Mitra "${provider.name}" berhasil diaktifkan kembali.`
          : `Mitra "${provider.name}" dinonaktifkan dari tampilan publik.`
      );
      onRefreshData();
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, `providers/${provider.id}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // Delete provider modal trigger
  const handleDeleteProvider = (provider: Provider) => {
    setProviderToDelete(provider);
  };

  const handleConfirmDelete = async () => {
    if (!providerToDelete) return;
    setLoadingAction(true);
    try {
      await deleteDoc(doc(db, 'providers', providerToDelete.id));
      setActionNotice(`Mitra "${providerToDelete.name}" berhasil dihapus secara permanen.`);
      setProviderToDelete(null);
      onRefreshData();
    } catch (err) {
      console.error(err);
      setActionNotice(`Gagal menghapus mitra: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // Save Admin Contact Settings (WhatsApp & Facebook)
  const handleSaveContactSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContact(true);
    try {
      await setDoc(
        doc(db, 'settings', 'contact'),
        {
          adminWhatsapp: contactWhatsapp.trim(),
          adminFacebook: contactFacebook.trim(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setActionNotice('Kontak WhatsApp & Facebook Admin berhasil disimpan! Calon mitra akan melihat kontak ini saat mendaftar.');
      onRefreshData();
    } catch (err) {
      console.error(err);
      setActionNotice(`Gagal menyimpan pengaturan: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSavingContact(false);
    }
  };

  // Create manual provider
  const handleCreateManualProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualConsentGiven) {
      setActionNotice('Pemberian izin dari pemilik nomor WhatsApp wajib dicentang sebelum data disimpan.');
      return;
    }
    setLoadingAction(true);
    try {
      const selectedCat = categories.find((c) => c.id === manualCategory);
      const newProviderData = {
        userId: 'admin-manual',
        name: manualName.trim(),
        whatsapp: manualWhatsapp.trim(),
        categoryId: manualCategory,
        categoryName: selectedCat?.name || 'Jasa Umum',
        subServices: [],
        province: manualProvince,
        city: manualCity,
        districts: manualDistricts,
        description: manualDesc.trim(),
        priceRange: manualPrice.trim(),
        photoUrl: manualPhotoUrl.trim(),
        gallery: [],
        status: 'approved', // Admin manual entry is pre-verified
        manualEntry: true,
        viewsCount: 0,
        whatsappClicks: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'providers'), newProviderData);
      setActionNotice(`Mitra "${manualName}" berhasil ditambahkan secara manual oleh admin.`);
      setIsManualModalOpen(false);
      // Reset form
      setManualName('');
      setManualWhatsapp('');
      setManualDesc('');
      setManualConsentGiven(false);
      onRefreshData();
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.CREATE, 'providers');
    } finally {
      setLoadingAction(false);
    }
  };

  // Delete all default / sample providers from Firestore
  const handleDeleteDefaultProviders = async () => {
    setLoadingAction(true);
    try {
      let count = 0;
      for (const prov of providers) {
        if (isDefaultSampleProvider(prov)) {
          await deleteDoc(doc(db, 'providers', prov.id));
          count++;
        }
      }
      setActionNotice(
        count > 0
          ? `${count} data tukang default/sampel berhasil dihapus permanen dari Firestore!`
          : 'Database Firestore sudah bersih, tidak ditemukan data tukang default.'
      );
      onRefreshData();
    } catch (err) {
      console.error(err);
      setActionNotice(`Gagal menghapus tukang default: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // Open Create Category Modal
  const handleOpenCreateCategory = () => {
    setCategoryName('');
    setCategoryIcon('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=256&q=80');
    setCategoryImageMode('upload');
    setCategoryDesc('');
    setCategoryOrder(categories.length + 1);
    setCategoryActive(true);
    setIsCategoryModalOpen(true);
  };

  // Add new Category to Firestore
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    setLoadingAction(true);
    try {
      await addDoc(collection(db, 'categories'), {
        name: categoryName.trim(),
        icon: categoryIcon.trim() || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=256&q=80',
        description: categoryDesc.trim(),
        order: Number(categoryOrder) || categories.length + 1,
        active: Boolean(categoryActive),
        createdAt: new Date().toISOString(),
      });
      setActionNotice(`Kategori "${categoryName.trim()}" berhasil ditambahkan ke database.`);
      setIsCategoryModalOpen(false);
      setCategoryName('');
      setCategoryDesc('');
      onRefreshData();
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.CREATE, 'categories');
    } finally {
      setLoadingAction(false);
    }
  };

  // Open Edit Category Modal
  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setEditCatIcon(cat.icon || '');
    setEditCatImageMode(cat.icon && (cat.icon.startsWith('data:image/') || !cat.icon.startsWith('http')) ? 'upload' : 'url');
    setEditCatDesc(cat.description || '');
    setEditCatOrder(cat.order ?? 1);
    setEditCatActive(cat.active !== false);
  };

  // Update Category in Firestore and sync affected providers
  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editCatName.trim()) return;
    setLoadingAction(true);
    try {
      const trimmedName = editCatName.trim();
      const catRef = doc(db, 'categories', editingCategory.id);
      await updateDoc(catRef, {
        name: trimmedName,
        icon: editCatIcon.trim() || 'Wrench',
        description: editCatDesc.trim(),
        order: Number(editCatOrder) || 1,
        active: Boolean(editCatActive),
        updatedAt: new Date().toISOString(),
      });

      // Synchronize categoryName for any providers with this category
      if (trimmedName !== editingCategory.name) {
        const affectedProviders = providers.filter((p) => p.categoryId === editingCategory.id);
        for (const prov of affectedProviders) {
          try {
            await updateDoc(doc(db, 'providers', prov.id), {
              categoryName: trimmedName,
              updatedAt: new Date().toISOString(),
            });
          } catch (pErr) {
            console.warn('Update provider category name notice:', pErr);
          }
        }
      }

      setActionNotice(`Kategori "${trimmedName}" berhasil diperbarui.`);
      setEditingCategory(null);
      onRefreshData();
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, `categories/${editingCategory.id}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // Open Delete Category confirmation
  const handleOpenDeleteCategory = (cat: Category) => {
    setDeletingCategory(cat);
  };

  // Confirm Delete Category from Firestore
  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    setLoadingAction(true);
    try {
      await deleteDoc(doc(db, 'categories', deletingCategory.id));
      setActionNotice(`Kategori "${deletingCategory.name}" berhasil dihapus.`);
      setDeletingCategory(null);
      onRefreshData();
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.DELETE, `categories/${deletingCategory.id}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // Toggle category active/inactive
  const handleToggleCategory = async (cat: Category) => {
    setLoadingAction(true);
    try {
      await updateDoc(doc(db, 'categories', cat.id), {
        active: !cat.active,
        updatedAt: new Date().toISOString(),
      });
      setActionNotice(`Kategori "${cat.name}" sekarang ${!cat.active ? 'Aktif' : 'Nonaktif'}.`);
      onRefreshData();
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, `categories/${cat.id}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // Filtered providers list for All Providers tab
  const filteredProviders = providers.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.whatsapp.includes(searchQuery) ||
      p.categoryName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || p.categoryId === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Filtered categories list for Categories tab
  const filteredCategories = categories
    .filter((cat) => {
      const matchesSearch =
        !categorySearch ||
        cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
        cat.description?.toLowerCase().includes(categorySearch.toLowerCase()) ||
        cat.icon.toLowerCase().includes(categorySearch.toLowerCase());

      const matchesStatus =
        categoryStatusFilter === 'all' ||
        (categoryStatusFilter === 'active' && cat.active !== false) ||
        (categoryStatusFilter === 'inactive' && cat.active === false);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-500/40 text-purple-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  Panel Administrator JasaDekat
                </h1>
                <span className="text-[10px] uppercase font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                  Admin Resmi
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pusat verifikasi pendaftaran mitra, analitik real-time, dan manajemen layanan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {providers.length === 0 && categories.length > 0 && (
              <button
                onClick={async () => {
                  setLoadingAction(true);
                  try {
                    const acCat = categories.find((c) => c.name.toLowerCase().includes('ac')) || categories[0];
                    const listrikCat = categories.find((c) => c.name.toLowerCase().includes('listrik')) || categories[1];
                    const ledengCat = categories.find((c) => c.name.toLowerCase().includes('ledeng')) || categories[2];
                    const bangunanCat = categories.find((c) => c.name.toLowerCase().includes('bangunan')) || categories[3];

                    const sampleList = [
                      {
                        userId: 'admin-manual',
                        name: 'Pak Budi Service AC Mandiri',
                        whatsapp: '081289123456',
                        categoryId: acCat.id,
                        categoryName: acCat.name,
                        subServices: ['Cuci AC', 'Isi Freon R32/R410', 'Bongkar Pasang AC', 'Perbaikan Modul'],
                        province: 'Jawa Barat',
                        city: 'Kota Bogor',
                        districts: ['Bogor Barat', 'Bogor Tengah', 'Bogor Selatan', 'Tanah Sareal', 'Cibinong'],
                        description: 'Teknisi berpengalaman 9 tahun khusus pendingin ruangan rumah dan kantor. Pengerjaan rapi, bersih, dan bergaransi 30 hari.',
                        priceRange: 'Mulai Rp 75.000 / unit',
                        photoUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
                        gallery: [
                          'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'
                        ],
                        status: 'approved',
                        manualEntry: true,
                        viewsCount: 24,
                        whatsappClicks: 7,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      },
                      {
                        userId: 'admin-manual',
                        name: 'Surya Teknik Listrik & Panel',
                        whatsapp: '081318765432',
                        categoryId: listrikCat.id,
                        categoryName: listrikCat.name,
                        subServices: ['Korsleting Listrik', 'Instalasi Baru', 'Ganti MCB & Saklar', 'Pemasangan Stop Kontak'],
                        province: 'Jawa Barat',
                        city: 'Kota Depok',
                        districts: ['Pancoran Mas', 'Beji', 'Sukmajaya', 'Cinere', 'Sawangan'],
                        description: 'Spesialis perbaikan korsleting listrik darurat 24 jam. Siap datang ke lokasi dengan peralatan lengkap dan material SNI.',
                        priceRange: 'Rp 100.000 - Rp 250.000',
                        photoUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80',
                        gallery: [],
                        status: 'approved',
                        manualEntry: true,
                        viewsCount: 18,
                        whatsappClicks: 5,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      },
                      {
                        userId: 'admin-manual',
                        name: 'Wahyu Mandiri Pipa & Pompa Air',
                        whatsapp: '085712349876',
                        categoryId: ledengCat.id,
                        categoryName: ledengCat.name,
                        subServices: ['Pipa Bocor / Mampet', 'Ganti Kran & Wastafel', 'Otomatis Pompa Air', 'Kuras & Pasang Toren'],
                        province: 'Jawa Barat',
                        city: 'Kabupaten Bogor',
                        districts: ['Cibinong', 'Bojonggede', 'Citeureup', 'Babakan Madang'],
                        description: 'Mengatasi pipa air mampet tanpa bongkar lantai berlebih. Perbaikan otomatis radar toren dan instalasi pipa PVC/PPR.',
                        priceRange: 'Mulai Rp 80.000',
                        photoUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=400&q=80',
                        gallery: [],
                        status: 'approved',
                        manualEntry: true,
                        viewsCount: 12,
                        whatsappClicks: 3,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      },
                      {
                        userId: 'admin-manual',
                        name: 'Karya Bangun Jaya (Renovasi & Atap)',
                        whatsapp: '081299887766',
                        categoryId: bangunanCat.id,
                        categoryName: bangunanCat.name,
                        subServices: ['Bocor Atap & Talang', 'Pasang Keramik', 'Plester Acian', 'Plafon Gypsum'],
                        province: 'DKI Jakarta',
                        city: 'Jakarta Selatan',
                        districts: ['Pasar Minggu', 'Cilandak', 'Tebet', 'Jagakarsa'],
                        description: 'Tim tukang bangunan profesional dan amanah. Melayani perbaikan skala kecil hingga renovasi sebagian rumah.',
                        priceRange: 'Harian atau Borongan',
                        photoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=400&q=80',
                        gallery: [],
                        status: 'pending', // Sample pending entry for admin review queue testing!
                        manualEntry: false,
                        viewsCount: 0,
                        whatsappClicks: 0,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      }
                    ];

                    for (const s of sampleList) {
                      await addDoc(collection(db, 'providers'), s);
                    }
                    setActionNotice('Berhasil memuat contoh mitra verifikasi untuk pengujian!');
                    onRefreshData();
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setLoadingAction(false);
                  }
                }}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                + Muat Contoh Mitra Uji
              </button>
            )}
            <button
              onClick={() => onRefreshData()}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Perbarui Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <button
              onClick={onBackToHome}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Lihat Tampilan Publik
            </button>
          </div>
        </div>

        {/* Global Metric Summary Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-5">
          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-800">
            <div className="text-[11px] font-medium text-slate-400">Total Mitra</div>
            <div className="text-2xl font-black text-white mt-1">{totalCount}</div>
          </div>

          <div className="p-3 bg-amber-950/30 rounded-2xl border border-amber-900/40">
            <div className="text-[11px] font-medium text-amber-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Menunggu Review
            </div>
            <div className="text-2xl font-black text-amber-300 mt-1">{pendingProviders.length}</div>
          </div>

          <div className="p-3 bg-emerald-950/30 rounded-2xl border border-emerald-900/40">
            <div className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Disetujui (Aktif)
            </div>
            <div className="text-2xl font-black text-emerald-300 mt-1">{approvedProviders.length}</div>
          </div>

          <div className="p-3 bg-blue-950/30 rounded-2xl border border-blue-900/40">
            <div className="text-[11px] font-medium text-blue-400 flex items-center gap-1">
              <Eye className="w-3 h-3" /> Total Views
            </div>
            <div className="text-2xl font-black text-blue-300 mt-1">{totalViews.toLocaleString('id-ID')}</div>
          </div>

          <div className="p-3 bg-green-950/30 rounded-2xl border border-green-900/40 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-medium text-green-400 flex items-center gap-1">
              <MessageCircle className="w-3 h-3" /> Total Klik WhatsApp
            </div>
            <div className="text-2xl font-black text-green-300 mt-1">{totalWhatsAppClicks.toLocaleString('id-ID')}</div>
          </div>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice('')} className="text-emerald-600 hover:text-emerald-900">
            &times;
          </button>
        </div>
      )}

      {/* Tabs Navigation (Horizontally scrollable on mobile Android) */}
      <div className="flex items-center overflow-x-auto sm:flex-wrap gap-2 border-b border-slate-200 pb-3 select-none no-scrollbar">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'analytics'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Dasbor Analitik Real-Time</span>
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all relative ${
            activeTab === 'approvals'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Antrean Persetujuan</span>
          {pendingProviders.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              {pendingProviders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('all-providers')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'all-providers'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Kelola Semua Mitra ({totalCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'categories'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Kelola Kategori ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('contact-settings')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'contact-settings'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Phone className="w-4 h-4 text-emerald-500" />
          <span>Kontak Admin (WA & FB)</span>
        </button>

        <button
          onClick={() => setActiveTab('regions')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'regions'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Wilayah Layanan</span>
        </button>
      </div>

      {/* TAB 1: REAL-TIME PERFORMANCE ANALYTICS DASHBOARD */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <span>Pemantauan Performa Mitra Real-Time</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Data impresi pencarian, klik kontak WhatsApp, dan rasio konversi diperbarui langsung dari Cloud Firestore
                </p>
              </div>

              <div className="text-xs bg-slate-100 px-3 py-1.5 rounded-xl font-medium text-slate-700">
                Rata-rata Rasio Kontak Platform: <strong className="text-blue-700">{overallConversion}%</strong>
              </div>
            </div>

            {/* Performance Ranking Table */}
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Nama Mitra & Kontak</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Wilayah</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Dilihat (Views)</th>
                    <th className="py-3 px-3 text-right">Klik WhatsApp</th>
                    <th className="py-3 px-3 text-right">Konversi (CTR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {providers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 italic">
                        Belum ada data penyedia jasa di database.
                      </td>
                    </tr>
                  ) : (
                    // Sort by highest WhatsApp clicks first
                    [...providers]
                      .sort((a, b) => (b.whatsappClicks || 0) - (a.whatsappClicks || 0))
                      .map((p) => {
                        const v = p.viewsCount || 0;
                        const w = p.whatsappClicks || 0;
                        const ctr = v > 0 ? ((w / v) * 100).toFixed(1) : '0';
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900">{p.name}</div>
                              <div className="text-[11px] text-slate-500">{p.whatsapp}</div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-medium">
                                {p.categoryName}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="text-slate-800 font-medium">{p.city}</div>
                              <div className="text-[10px] text-slate-400">{p.province}</div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              {p.status === 'approved' && (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  Aktif
                                </span>
                              )}
                              {p.status === 'pending' && (
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  Pending
                                </span>
                              )}
                              {p.status === 'rejected' && (
                                <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  Ditolak
                                </span>
                              )}
                              {p.status === 'disabled' && (
                                <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  Nonaktif
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right font-semibold text-slate-800">
                              {v.toLocaleString('id-ID')}
                            </td>
                            <td className="py-3 px-3 text-right font-black text-emerald-600">
                              {w.toLocaleString('id-ID')}
                            </td>
                            <td className="py-3 px-3 text-right font-black text-blue-600">
                              {ctr}%
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APPROVALS QUEUE */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>Antrean Pendaftaran Menunggu Persetujuan ({pendingProviders.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Periksa kebenaran data teknisi sebelum disetujui untuk tampil di pencarian publik JasaDekat
            </p>

            {pendingProviders.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <div className="font-semibold text-slate-700">Semua Pendaftaran Telah Diperiksa!</div>
                <div className="text-xs text-slate-400 mt-1">Tidak ada antrean mitra yang berstatus pending.</div>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingProviders.map((p) => (
                  <div
                    key={p.id}
                    className="p-5 rounded-2xl border border-amber-200/90 bg-amber-50/20 hover:bg-amber-50/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-base text-slate-900">{p.name}</span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold">
                          {p.categoryName}
                        </span>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {p.city}, {p.province}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600">
                        <strong>WhatsApp: </strong>
                        <a
                          href={`https://wa.me/${p.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 font-semibold hover:underline"
                        >
                          {p.whatsapp}
                        </a>
                      </div>

                      <div className="text-xs text-slate-600 leading-relaxed">
                        <strong>Deskripsi: </strong>
                        {p.description}
                      </div>

                      {p.priceRange && (
                        <div className="text-xs text-emerald-800 font-semibold">
                          Estimasi Biaya: {p.priceRange}
                        </div>
                      )}

                      {p.districts && p.districts.length > 0 && (
                        <div className="text-[11px] text-slate-500 flex flex-wrap gap-1">
                          <span>Wilayah jangkauan:</span>
                          {p.districts.map((d, i) => (
                            <span key={i} className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {d}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="text-[10px] text-slate-400">
                        Diajukan pada: {new Date(p.createdAt).toLocaleString('id-ID')}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200">
                      <button
                        type="button"
                        disabled={loadingAction}
                        onClick={() => {
                          setRejectingProvider(p);
                          setRejectReason('');
                        }}
                        className="px-4 py-2.5 bg-red-600/10 hover:bg-red-600/20 text-red-700 rounded-xl text-xs font-bold transition-colors"
                      >
                        Tolak
                      </button>

                      <button
                        type="button"
                        disabled={loadingAction}
                        onClick={() => handleApprove(p)}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shadow-emerald-600/20"
                      >
                        <Check className="w-4 h-4" />
                        <span>Setujui Mitra</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ALL PROVIDERS MANAGEMENT & MANUAL ENTRY */}
      {activeTab === 'all-providers' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Daftar & Manajemen Penyedia Jasa
                </h2>
                <p className="text-xs text-slate-500">
                  Cari, edit, aktifkan/nonaktifkan, atau tambahkan teknisi terverifikasi secara manual
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {providers.filter(isDefaultSampleProvider).length > 0 ? (
                  <button
                    type="button"
                    disabled={loadingAction}
                    onClick={handleDeleteDefaultProviders}
                    className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-rose-200 shadow-sm"
                    title="Hapus seluruh data tukang default / sampel dari Firestore"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Hapus Tukang Default ({providers.filter(isDefaultSampleProvider).length})</span>
                  </button>
                ) : (
                  <div className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-medium flex items-center gap-1.5 border border-emerald-200">
                    <Check className="w-3.5 h-3.5" />
                    <span>Data Bersih (Tanpa Tukang Default)</span>
                  </div>
                )}

                <button
                  onClick={() => setIsManualModalOpen(true)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Mitra Manual</span>
                </button>
              </div>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, nomor HP, atau kota..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none"
                >
                  <option value="all">Semua Status</option>
                  <option value="approved">Disetujui (Aktif)</option>
                  <option value="pending">Pending (Menunggu)</option>
                  <option value="rejected">Ditolak</option>
                  <option value="disabled">Dinonaktifkan</option>
                </select>
              </div>

              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Providers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Nama & WhatsApp</th>
                    <th className="py-3 px-3">Layanan</th>
                    <th className="py-3 px-3">Wilayah</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3">Tanggal Daftar</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProviders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 italic">
                        Tidak ada data mitra yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredProviders.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{p.name}</span>
                            {p.manualEntry && (
                              <span className="text-[9px] bg-slate-200 text-slate-700 px-1 rounded font-semibold">
                                Manual
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">{p.whatsapp}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                            {p.categoryName}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800">{p.city}</div>
                          <div className="text-[10px] text-slate-400">{p.province}</div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {p.status === 'approved' && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Disetujui
                            </span>
                          )}
                          {p.status === 'pending' && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Pending
                            </span>
                          )}
                          {p.status === 'rejected' && (
                            <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Ditolak
                            </span>
                          )}
                          {p.status === 'disabled' && (
                            <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Nonaktif
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-[11px] text-slate-500">
                          {new Date(p.createdAt).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {p.status === 'pending' && (
                              <button
                                onClick={() => handleApprove(p)}
                                title="Setujui"
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {p.status === 'approved' ? (
                              <button
                                onClick={() => handleToggleDisable(p)}
                                title="Nonaktifkan Sementara"
                                className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100"
                              >
                                <PowerOff className="w-3.5 h-3.5" />
                              </button>
                            ) : p.status === 'disabled' ? (
                              <button
                                onClick={() => handleToggleDisable(p)}
                                title="Aktifkan Kembali"
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>
                            ) : null}

                            <button
                              onClick={() => setEditingProvider(p)}
                              title="Edit Profil"
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteProvider(p)}
                              title="Hapus Permanen"
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CATEGORIES MANAGEMENT */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Kelola Kategori Jasa ({categories.length})
                  </h2>
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                    {categories.filter((c) => c.active !== false).length} Aktif
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tambah kategori baru, edit nama/ikon/urutan, hapus kategori, dan aktifkan atau nonaktifkan tampilan
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {categories.length === 0 ? (
                  <button
                    onClick={handleSeedCategories}
                    disabled={loadingAction}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Muat 12 Kategori Bawaan</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSeedCategories}
                    disabled={loadingAction}
                    title="Tambah kembali 12 kategori standar jika ada yang terhapus"
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Pulihkan 12 Kategori Bawaan</span>
                  </button>
                )}
                <button
                  onClick={handleOpenCreateCategory}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Kategori Baru</span>
                </button>
              </div>
            </div>

            {/* Search and Status Filters */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-100">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Cari kategori berdasarkan nama, ikon, atau deskripsi..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {categorySearch && (
                  <button
                    onClick={() => setCategorySearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setCategoryStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    categoryStatusFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({categories.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    categoryStatusFilter === 'active'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Aktif ({categories.filter((c) => c.active !== false).length})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryStatusFilter('inactive')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    categoryStatusFilter === 'inactive'
                      ? 'bg-white text-slate-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Nonaktif ({categories.filter((c) => c.active === false).length})
                </button>
              </div>
            </div>

            {/* Category Cards Grid */}
            {categories.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-2xl space-y-3">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Tag className="w-6 h-6" />
                </div>
                <div className="font-bold text-slate-800 text-sm">Belum Ada Kategori di Database</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Anda dapat memuat 12 kategori awal bawaan atau membuat kategori kustom pertama Anda.
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={handleSeedCategories}
                    disabled={loadingAction}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                  >
                    Muat 12 Kategori Awal
                  </button>
                  <button
                    onClick={handleOpenCreateCategory}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
                  >
                    Tambah Kategori Manual
                  </button>
                </div>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-10 px-4 border border-slate-200 rounded-2xl space-y-2 bg-slate-50">
                <div className="text-sm font-bold text-slate-700">Tidak ada kategori yang cocok</div>
                <p className="text-xs text-slate-500">
                  Coba ubah kata kunci pencarian atau filter status yang dipilih.
                </p>
                <button
                  onClick={() => {
                    setCategorySearch('');
                    setCategoryStatusFilter('all');
                  }}
                  className="px-3 py-1.5 text-xs text-blue-600 font-bold hover:underline"
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredCategories.map((cat) => {
                  const linkedCount = providers.filter((p) => p.categoryId === cat.id).length;
                  return (
                    <div
                      key={cat.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        cat.active !== false
                          ? 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                          : 'bg-slate-50/80 border-slate-200 opacity-75'
                      }`}
                    >
                      {/* Top Header of Card */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                            Urutan #{cat.order ?? 1}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            <Users className="w-3 h-3 text-blue-500" />
                            <span>{linkedCount} Tukang</span>
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleCategory(cat)}
                          title="Klik untuk ubah status aktif/nonaktif"
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                            cat.active !== false
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {cat.active !== false ? '● Aktif' : '○ Nonaktif'}
                        </button>
                      </div>

                      {/* Main Info */}
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                          {cat.icon && (cat.icon.startsWith('http') || cat.icon.startsWith('data:image')) ? (
                            <img src={cat.icon} alt={cat.name} className="w-full h-full object-cover" />
                          ) : (
                            <DynamicIcon name={cat.icon} className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-extrabold text-slate-900 text-sm truncate" title={cat.name}>
                            {cat.name}
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                            {cat.description || 'Tidak ada deskripsi'}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <span>Gambar:</span>
                            {cat.icon?.startsWith('data:image') ? (
                              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">Foto Upload</span>
                            ) : cat.icon?.startsWith('http') ? (
                              <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-medium truncate max-w-[120px]">URL Link</span>
                            ) : (
                              <span className="text-slate-600 bg-slate-100 px-1 py-0.5 rounded font-mono">{cat.icon || 'Ikon Bawaan'}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons: Edit and Delete */}
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditCategory(cat)}
                          className="flex-1 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenDeleteCategory(cat)}
                          title="Hapus Kategori"
                          className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: REGIONAL SERVICE AREAS */}
      {activeTab === 'regions' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Wilayah Layanan Terkonfigurasi
            </h2>
            <p className="text-xs text-slate-500">
              Daftar provinsi dan kota populer yang tersedia untuk filter pencarian pengguna
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INDONESIAN_REGIONS.map((reg) => (
              <div key={reg.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="font-extrabold text-sm text-slate-900 mb-2 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <span>{reg.province}</span>
                </div>
                <div className="space-y-2">
                  {reg.cities.map((city) => (
                    <div key={city.name} className="text-xs bg-white p-2.5 rounded-xl border border-slate-200/70">
                      <div className="font-bold text-slate-800 mb-1">{city.name}</div>
                      <div className="flex flex-wrap gap-1">
                        {city.districts.map((d) => (
                          <span key={d} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: ADMIN CONTACT SETTINGS (WA & FB KONFIRMASI PENDAFTARAN) */}
      {activeTab === 'contact-settings' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-600" />
                <span>Pengaturan Kontak Admin (Konfirmasi Calon Mitra)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Nomor WhatsApp dan link Facebook ini akan ditampilkan kepada calon penyedia jasa saat mendaftar. Calon teknisi diwajibkan untuk mengonfirmasi data mereka langsung ke kontak admin Anda sebelum pendaftaran dapat disetujui.
              </p>
            </div>

            <form onSubmit={handleSaveContactSettings} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp Admin (Untuk Konfirmasi Pendaftaran) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={contactWhatsapp}
                    onChange={(e) => setContactWhatsapp(e.target.value)}
                    placeholder="Contoh: 081289123456 atau 6281289123456"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Tombol "Hubungi WhatsApp Admin untuk Konfirmasi" pada form pendaftaran akan otomatis mengarahkan calon mitra ke nomor ini.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Link Akun / Halaman Facebook Admin (Opsional)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={contactFacebook}
                    onChange={(e) => setContactFacebook(e.target.value)}
                    placeholder="Contoh: https://facebook.com/jasadekat.official"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Tautan profil atau halaman Facebook resmi untuk meningkatkan kredibilitas dan opsi kontak alternatif.
                </p>
              </div>

              {/* Preview Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-800">
                  Pratinjau Tampilan untuk Calon Mitra:
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`https://wa.me/${contactWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Halo Admin JasaDekat, saya ingin mendaftar sebagai teknisi.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white" />
                    <span>WhatsApp Admin: {contactWhatsapp}</span>
                  </a>
                  {contactFacebook && (
                    <a
                      href={contactFacebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Facebook Admin</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingContact}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-sm shadow-blue-500/20"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingContact ? 'Menyimpan...' : 'Simpan Kontak Admin'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Provider Confirmation (replaces window.confirm) */}
      {providerToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Hapus Permanen Mitra?
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Apakah Anda yakin ingin menghapus <strong>"{providerToDelete.name}"</strong> ({providerToDelete.categoryName} - {providerToDelete.city}) secara permanen dari database Cloud Firestore?
              </p>
              <div className="mt-2.5 p-2.5 bg-red-50 rounded-xl text-[11px] text-red-700">
                Tindakan ini tidak dapat dibatalkan. Jika Anda hanya ingin menyembunyikan profil sementara, gunakan tombol <strong>Nonaktifkan</strong>.
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={loadingAction}
                onClick={() => setProviderToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={loadingAction}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-red-600/20"
              >
                {loadingAction ? 'Menghapus...' : 'Ya, Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Reject Reason */}
      {rejectingProvider && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Tolak Pendaftaran: {rejectingProvider.name}
            </h3>
            <p className="text-xs text-slate-500">
              Berikan catatan alasan penolakan agar mitra dapat memperbaiki datanya di Dasbor Mitra.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Contoh: Nomor WhatsApp tidak dapat dihubungi atau wilayah layanan belum jelas..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingProvider(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Manual Provider Entry */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Tambah Mitra Teknisi Secara Manual
                </h3>
                <p className="text-xs text-slate-500">
                  Input data teknisi terpercaya langsung oleh admin
                </p>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateManualProvider} className="overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900">
                <strong>Ketentuan Admin: </strong> Data yang dimasukkan manual tetap harus diperiksa kebenarannya dan memperoleh izin dari pemilik nomor sebelum dipublikasikan.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Teknisi / Usaha <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Contoh: Pak Joko Service AC"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={manualWhatsapp}
                  onChange={(e) => setManualWhatsapp(e.target.value)}
                  placeholder="08123456789"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Jasa <span className="text-red-500">*</span>
                </label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Provinsi
                  </label>
                  <select
                    value={manualProvince}
                    onChange={(e) => {
                      const newProv = e.target.value;
                      setManualProvince(newProv);
                      const reg = INDONESIAN_REGIONS.find((r) => r.province === newProv);
                      if (reg && reg.cities.length > 0) {
                        const firstCity = reg.cities[0].name;
                        setManualCity(firstCity);
                        const dists = getDistrictsForCity(firstCity);
                        setManualDistricts(dists.slice(0, 3));
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none"
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
                    Kota / Kab
                  </label>
                  <select
                    value={manualCity}
                    onChange={(e) => {
                      const newCity = e.target.value;
                      setManualCity(newCity);
                      const dists = getDistrictsForCity(newCity);
                      setManualDistricts(dists.slice(0, 3));
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none"
                  >
                    {INDONESIAN_REGIONS.find((r) => r.province === manualProvince)?.cities.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Kecamatan Dropdown & Multi-Select for Manual Provider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Kecamatan Jangkauan Layanan
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setManualDistricts(getDistrictsForCity(manualCity))}
                      className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setManualDistricts([])}
                      className="text-slate-500 hover:text-red-600 font-semibold hover:underline"
                    >
                      Hapus Semua
                    </button>
                  </div>
                </div>

                <select
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && !manualDistricts.includes(val)) {
                      setManualDistricts([...manualDistricts, val]);
                    }
                    e.target.value = '';
                  }}
                  defaultValue=""
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none"
                >
                  <option value="" disabled>
                    + Klik untuk pilih kecamatan di {manualCity}
                  </option>
                  {getDistrictsForCity(manualCity).map((d) => (
                    <option key={d} value={d} disabled={manualDistricts.includes(d)}>
                      {d} {manualDistricts.includes(d) ? '✓ (Sudah dipilih)' : ''}
                    </option>
                  ))}
                </select>

                <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto p-1.5 bg-slate-50 rounded-xl border border-slate-200">
                  {getDistrictsForCity(manualCity).map((d) => {
                    const isSelected = manualDistricts.includes(d);
                    return (
                      <button
                        type="button"
                        key={d}
                        onClick={() => {
                          if (isSelected) {
                            setManualDistricts(manualDistricts.filter((x) => x !== d));
                          } else {
                            setManualDistricts([...manualDistricts, d]);
                          }
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi Pengalaman & Layanan <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  placeholder="Layanan terpercaya, bergaransi..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimasi Biaya
                </label>
                <input
                  type="text"
                  value={manualPrice}
                  onChange={(e) => setManualPrice(e.target.value)}
                  placeholder="Mulai Rp 75.000 / unit"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Foto URL (Opsional)
                </label>
                <input
                  type="url"
                  value={manualPhotoUrl}
                  onChange={(e) => setManualPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-800">
                  <input
                    type="checkbox"
                    required
                    checked={manualConsentGiven}
                    onChange={(e) => setManualConsentGiven(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    Saya mengonfirmasi bahwa data ini telah diverifikasi dan memiliki izin dari pemilik nomor WhatsApp untuk dicantumkan di JasaDekat.
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Simpan & Publikasikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Provider */}
      {editingProvider && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Edit Data Mitra: {editingProvider.name}
              </h3>
              <button
                onClick={() => setEditingProvider(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Usaha / Teknisi</label>
                <input
                  type="text"
                  value={editingProvider.name}
                  onChange={(e) => setEditingProvider({ ...editingProvider, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">WhatsApp</label>
                <input
                  type="tel"
                  value={editingProvider.whatsapp}
                  onChange={(e) => setEditingProvider({ ...editingProvider, whatsapp: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kota</label>
                <input
                  type="text"
                  value={editingProvider.city}
                  onChange={(e) => setEditingProvider({ ...editingProvider, city: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi</label>
                <textarea
                  rows={3}
                  value={editingProvider.description}
                  onChange={(e) => setEditingProvider({ ...editingProvider, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingProvider(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  setLoadingAction(true);
                  try {
                    await updateDoc(doc(db, 'providers', editingProvider.id), {
                      name: editingProvider.name,
                      whatsapp: editingProvider.whatsapp,
                      city: editingProvider.city,
                      description: editingProvider.description,
                      updatedAt: new Date().toISOString(),
                    });
                    setActionNotice(`Perubahan data mitra "${editingProvider.name}" berhasil disimpan.`);
                    setEditingProvider(null);
                    onRefreshData();
                  } catch (err) {
                    console.error(err);
                    handleFirestoreError(err, OperationType.UPDATE, `providers/${editingProvider.id}`);
                  } finally {
                    setLoadingAction(false);
                  }
                }}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Create Category */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Tambah Kategori Jasa Baru</h3>
                  <p className="text-xs text-slate-500">Kategori akan langsung tampil pada pilihan jasa</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Contoh: Service Elektronik & TV"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Gambar Kategori: Upload File atau URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Gambar Kategori <span className="text-red-500">*</span></span>
                  <span className="text-[10px] font-normal text-slate-500">Upload file gambar atau URL</span>
                </label>

                {/* Switcher Tab: Upload vs URL */}
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 mb-2.5">
                  <button
                    type="button"
                    onClick={() => setCategoryImageMode('upload')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      categoryImageMode === 'upload'
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload dari HP / PC</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryImageMode('url')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      categoryImageMode === 'url'
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Pakai URL Gambar</span>
                  </button>
                </div>

                {/* Preview Box & Input Area */}
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                    {categoryIcon ? (
                      categoryIcon.startsWith('data:image/') || categoryIcon.startsWith('http') ? (
                        <img
                          src={categoryIcon}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <DynamicIcon name={categoryIcon} className="w-7 h-7 text-blue-600" />
                      )
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    {categoryImageMode === 'upload' ? (
                      <div>
                        <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 cursor-pointer transition-colors shadow-2xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Pilih Foto Gambar...</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageFileChange(file, (dataUrl) => setCategoryIcon(dataUrl));
                              }
                            }}
                          />
                        </label>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Pilih foto dari galeri HP atau komputer. Otomatis dikompres & disimpan ke database.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="url"
                          value={categoryIcon}
                          onChange={(e) => setCategoryIcon(e.target.value)}
                          placeholder="https://images.unsplash.com/... atau URL gambar"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Masukkan URL tautan gambar langsung dari web/CDN.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preset Suggestions */}
                <div className="mt-2.5">
                  <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
                    Pilihan Contoh Gambar Layanan:
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                    {PRESET_CATEGORY_IMAGES.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setCategoryIcon(preset.url)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-medium shrink-0 transition-all cursor-pointer ${
                          categoryIcon === preset.url
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <img src={preset.url} alt="" className="w-4 h-4 rounded-md object-cover" />
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Urutan Tampilan
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={categoryOrder}
                    onChange={(e) => setCategoryOrder(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Nomor urut posisi di daftar (1, 2, 3...)</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Awal
                  </label>
                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={categoryActive}
                      onChange={(e) => setCategoryActive(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-slate-700">Langsung Aktifkan</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi Kategori
                </label>
                <textarea
                  rows={2}
                  value={categoryDesc}
                  onChange={(e) => setCategoryDesc(e.target.value)}
                  placeholder="Keterangan singkat cakupan perbaikan atau jasa yang ditawarkan..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  {loadingAction ? 'Menyimpan...' : 'Simpan Kategori Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Category */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Edit Kategori: &ldquo;{editingCategory.name}&rdquo;
                  </h3>
                  <p className="text-xs text-slate-500">Ubah nama, ikon, deskripsi, atau urutan kategori</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  placeholder="Contoh: Service AC"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                />
              </div>

              {/* Gambar Kategori: Upload File atau URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Gambar Kategori <span className="text-red-500">*</span></span>
                  <span className="text-[10px] font-normal text-slate-500">Upload file gambar atau URL</span>
                </label>

                {/* Switcher Tab: Upload vs URL */}
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 mb-2.5">
                  <button
                    type="button"
                    onClick={() => setEditCatImageMode('upload')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      editCatImageMode === 'upload'
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload dari HP / PC</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditCatImageMode('url')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      editCatImageMode === 'url'
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Pakai URL Gambar</span>
                  </button>
                </div>

                {/* Preview Box & Input Area */}
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                    {editCatIcon ? (
                      editCatIcon.startsWith('data:image/') || editCatIcon.startsWith('http') ? (
                        <img
                          src={editCatIcon}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <DynamicIcon name={editCatIcon} className="w-7 h-7 text-blue-600" />
                      )
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    {editCatImageMode === 'upload' ? (
                      <div>
                        <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 cursor-pointer transition-colors shadow-2xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Ganti Foto Gambar...</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageFileChange(file, (dataUrl) => setEditCatIcon(dataUrl));
                              }
                            }}
                          />
                        </label>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Pilih foto dari galeri HP atau komputer. Otomatis dikompres & disimpan ke database.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="url"
                          value={editCatIcon}
                          onChange={(e) => setEditCatIcon(e.target.value)}
                          placeholder="https://images.unsplash.com/... atau URL gambar"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Masukkan URL tautan gambar langsung dari web/CDN.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preset Suggestions */}
                <div className="mt-2.5">
                  <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
                    Pilihan Contoh Gambar Layanan:
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                    {PRESET_CATEGORY_IMAGES.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setEditCatIcon(preset.url)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-medium shrink-0 transition-all cursor-pointer ${
                          editCatIcon === preset.url
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <img src={preset.url} alt="" className="w-4 h-4 rounded-md object-cover" />
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Urutan Tampilan
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editCatOrder}
                    onChange={(e) => setEditCatOrder(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Nomor urut posisi di daftar (1, 2, 3...)</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Tampilan
                  </label>
                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editCatActive}
                      onChange={(e) => setEditCatActive(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-slate-700">Aktif (Tampil di aplikasi)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi Kategori
                </label>
                <textarea
                  rows={2}
                  value={editCatDesc}
                  onChange={(e) => setEditCatDesc(e.target.value)}
                  placeholder="Keterangan singkat cakupan perbaikan..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Linked providers notice */}
              {providers.filter((p) => p.categoryId === editingCategory.id).length > 0 && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2 text-xs text-blue-800">
                  <Users className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    Ada{' '}
                    <span className="font-bold">
                      {providers.filter((p) => p.categoryId === editingCategory.id).length} mitra tukang
                    </span>{' '}
                    terdaftar dalam kategori ini. Menyimpan perubahan nama kategori akan otomatis menyinkronkan nama kategori di seluruh profil tukang tersebut.
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  {loadingAction ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Category Confirmation */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 border border-rose-200 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Hapus Kategori &ldquo;{deletingCategory.name}&rdquo;?
              </h3>
              <p className="text-xs text-slate-500">
                Tindakan ini akan menghapus dokumen kategori dari Firestore secara permanen.
              </p>
            </div>

            {/* Provider linkage warning */}
            {(() => {
              const linked = providers.filter((p) => p.categoryId === deletingCategory.id);
              if (linked.length > 0) {
                return (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs text-amber-900">
                    <div className="font-bold flex items-center gap-1.5 text-amber-800">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Perhatian: Kategori Sedang Digunakan</span>
                    </div>
                    <p>
                      Terdapat <span className="font-bold">{linked.length} mitra tukang</span> yang saat ini terdaftar dengan kategori ini:
                    </p>
                    <ul className="list-disc list-inside text-[11px] text-amber-800/90 max-h-24 overflow-y-auto bg-amber-100/40 p-2 rounded-lg">
                      {linked.slice(0, 5).map((p) => (
                        <li key={p.id} className="truncate">
                          {p.name} ({p.city})
                        </li>
                      ))}
                      {linked.length > 5 && <li>...dan {linked.length - 5} mitra lainnya</li>}
                    </ul>
                    <p className="text-[11px] text-amber-700">
                      Jika dihapus, profil tukang tetap aman, namun tidak akan muncul di filter kategori ini sampai Anda mengedit dan memilih kategori baru untuk mereka.
                    </p>
                  </div>
                );
              }
              return (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Kategori ini belum memiliki mitra tukang terdaftar. Aman untuk dihapus.</span>
                </div>
              );
            })()}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                disabled={loadingAction}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCategory}
                disabled={loadingAction}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{loadingAction ? 'Menghapus...' : 'Ya, Hapus Kategori'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
