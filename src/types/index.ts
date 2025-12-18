export interface AirQuality {
  id: number;
  stationName: string;
  aqi: number;
  category: string;
  recordedAt: string; // ISO String dari BE
  lastSynced: string;
  monitoredCityId: number;
}

export interface AuditLog {
  id: number;
  action: string;
  status: string;
  details: string;
  performedAt: string;
}

export interface SyncResponse {
  message: string;
  syncedCount: number;
}