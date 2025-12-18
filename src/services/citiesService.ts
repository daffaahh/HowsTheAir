import api from './api';
import type { MonitoredCity, CreateCityDto } from '../types';

export const citiesService = {
  // Ambil semua kota
  getAll: async () => {
    const response = await api.get<MonitoredCity[]>('/cities');
    return response.data;
  },

  // Tambah kota baru
  create: async (data: CreateCityDto) => {
    const response = await api.post<MonitoredCity>('/cities', data);
    return response.data;
  },

  // Toggle status aktif/non-aktif
  toggleActive: async (id: number) => {
    const response = await api.patch<MonitoredCity>(`/cities/${id}/toggle`);
    return response.data;
  },
};