export type ProviderStatus = 'pending' | 'approved' | 'rejected' | 'disabled';

export type UserRole = 'visitor' | 'provider' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  displayName?: string;
  createdAt?: string;
}

export interface Provider {
  id: string;
  userId: string;
  name: string;
  whatsapp: string;
  categoryId: string;
  categoryName: string;
  subServices: string[];
  province: string;
  city: string;
  districts: string[];
  description: string;
  priceRange?: string;
  photoUrl?: string;
  gallery?: string[];
  status: ProviderStatus;
  rejectionReason?: string;
  manualEntry?: boolean;
  viewsCount?: number;
  whatsappClicks?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  order: number;
  active: boolean;
}

export interface ServiceArea {
  id: string;
  province: string;
  cities: {
    name: string;
    districts: string[];
  }[];
}

export interface UserLocationState {
  latitude: number;
  longitude: number;
  cityName: string;
  provinceName: string;
  districtName?: string;
  displayName: string;
}

export interface FilterState {
  searchQuery: string;
  categoryId: string;
  province: string;
  city: string;
  district: string;
  sortByDistance?: boolean;
}

export interface AdminContactSettings {
  adminWhatsapp: string;
  adminFacebook: string;
  updatedAt?: string;
}

export interface ProviderAnalyticsStats {
  providerId: string;
  providerName: string;
  categoryName: string;
  city: string;
  viewsCount: number;
  whatsappClicks: number;
  conversionRate: number;
  status: ProviderStatus;
  lastUpdated: string;
}
