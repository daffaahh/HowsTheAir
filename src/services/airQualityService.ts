import api from './api';
import type { AirQuality, AuditLog, SyncResponse, AirQualityHistory } from '../types/index.ts';

export const airQualityService = {
  // Ambil semua data
  getAll: async (params?: { search?: string; startDate?: string; endDate?: string }) => {
    // Axios otomatis mengubah object params jadi query string (?search=abc)
    const response = await api.get('/air-quality', { params });
    return response.data;
  },

  // Trigger Sync Manual
  sync: async () => {
    const response = await api.post<SyncResponse>('/air-quality/sync');
    return response.data;
  },

  // Ambil Info Last Sync
  getLastSync: async () => {
    const response = await api.get<AuditLog>('/air-quality/last-sync');
    return response.data;
  },

  getHistory: async (): Promise<AirQualityHistory[]> => {
    // Panggil endpoint backend yang return data dari tabel AirQualityHistory
    // Bisa tambahkan query param ?startDate=...&endDate=...
    const response = await api.get('/air-quality/history'); 
    return response.data;
  },
};