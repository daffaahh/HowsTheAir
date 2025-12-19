import api from './api';
import type { MonitoredCity, CreateCityDto, SearchStation } from '../types';

export const citiesService = {
  // Ambil semua kota
  getAll: async () => {
    const response = await api.get<MonitoredCity[]>('/cities');
    return response.data;
  },

search: async (keyword: string) => {
    const response = await api.get<SearchStation[]>(`/cities/search?keyword=${keyword}`);
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

  update: async (id: number, data: { keyword: string }) => {
    const response = await api.patch(`/cities/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/cities/${id}`);
    return response.data;
  },
};