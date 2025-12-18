// src/types/index.ts

export interface MonitoredCity {
  id: number;
  stationName: string; // Sesuaikan dengan backend (dulu 'name')
  keyword: string;
  isActive: boolean;
}

export interface AirQuality {
  id: number;
  aqi: number;
  category: string;
  recordedAt: string;
  lastSynced: string;
  
  // INI YANG PENTING: Tambahkan relasi ini
  monitoredCity: MonitoredCity; 
}

export interface AirQualityHistory {
  id: number;
  aqi: number;
  category: string;
  recordedAt: string; // ISO Date
  monitoredCityId: number; 
  // Jika backend include monitoredCity:
  monitoredCity?: { stationName: string };
}

export interface AuditLog {
  id: number;
  action: string;
  details: string;
  status: string;
  performedAt: string;
}

export interface SyncResponse {
  message: string;
  syncedCount: number;
}

export interface CreateCityDto {
  stringName: string;
  keyword: string;
}