import axios from 'axios';
import { API_URL } from '../config';
import { BuilderReport } from '../components/ReportBuilder/types';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const reportBuilderService = {
  list: async (isTemplate?: boolean, playerId?: string): Promise<BuilderReport[]> => {
    const params: any = {};
    if (isTemplate !== undefined) params.is_template = isTemplate;
    if (playerId) params.player_id = playerId;
    const res = await api.get('/api/report-builder', { params });
    return res.data;
  },

  get: async (id: string): Promise<BuilderReport> => {
    const res = await api.get(`/api/report-builder/${id}`);
    return res.data;
  },

  create: async (report: Partial<BuilderReport>): Promise<BuilderReport> => {
    const res = await api.post('/api/report-builder', report);
    return res.data;
  },

  update: async (id: string, report: Partial<BuilderReport>): Promise<BuilderReport> => {
    const res = await api.put(`/api/report-builder/${id}`, report);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/report-builder/${id}`);
  },
};
