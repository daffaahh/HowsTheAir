export interface MonitoredCity {
  id: number;
  stationName: string;
  keyword: string;
  isActive: boolean;
  uid :number
  createdAt : Date
}

export interface AirQuality {
  id: number;
  aqi: number;
  category: string;
  recordedAt: string;
  lastSynced: string;  
  monitoredCity: MonitoredCity; 
}

export interface AirQualityHistory {
  id: number;
  aqi: number;
  category: string;
  recordedAt: string; // ISO Date
  monitoredCityId: number; 
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
  keyword: string;
  stationName: string;
  uid : number
}

export interface SearchStation {
  uid: number;
  name: string;
  aqi: string;
  keywordValue: string;
}