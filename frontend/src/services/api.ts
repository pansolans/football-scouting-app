import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'football-scouting-backend-vd0x.onrender.com'
  : 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  wyscout_id?: number;
  age?: number;
  nationality?: string;
  imageDataURL?: string;
}

export interface PlayerDetails {
  id: number;
  name: string;
  position: string;
  team: string;
  stats: {
    matches: number;
    goals: number;
    assists: number;
  };
}

export interface ScoutReport {
  id: string;
  player_id: string;
  player_name: string;
  player_wyscout_id?: number;
  match_context?: string;
  position_played?: string;
  
  overall_rating: number;
  
  // Técnicos
  tecnica_individual: number;
  pase: number;
  primer_toque: number;
  control_balon: number;
  vision_juego: number;
  
  // Físicos
  velocidad: number;
  resistencia: number;
  fuerza: number;
  salto: number;
  agilidad: number;
  
  // Mentales
  inteligencia_tactica: number;
  posicionamiento: number;
  concentracion: number;
  liderazgo: number;
  trabajo_equipo: number;
  
  notes: string;
  fortalezas?: string;
  debilidades?: string;
  
  // Seguimiento
  recomendacion?: string;
  condicion_mercado?: string;
  agente?: string;
  tags?: string[];
  precio_estimado?: number;
  
  fecha_observacion?: string;
  tipo_visionado?: string;
  competicion?: string;
  rival?: string;
  resultado?: string;
  minutos_observados?: number;
  
  created_at: string;
}

export interface ScoutReportCreate {
  player_id: string;
  player_name: string;
  player_wyscout_id?: number;
  match_context?: string;
  position_played?: string;
  
  overall_rating: number;
  
  // Técnicos
  tecnica_individual: number;
  pase: number;
  primer_toque: number;
  control_balon: number;
  vision_juego: number;
  
  // Físicos
  velocidad: number;
  resistencia: number;
  fuerza: number;
  salto: number;
  agilidad: number;
  
  // Mentales
  inteligencia_tactica: number;
  posicionamiento: number;
  concentracion: number;
  liderazgo: number;
  trabajo_equipo: number;
  
  notes: string;
  fortalezas?: string;
  debilidades?: string;
  
  // Seguimiento
  recomendacion?: string;
  condicion_mercado?: string;
  agente?: string;
  tags?: string[];
  precio_estimado?: number;
  
  fecha_observacion?: string;
  tipo_visionado?: string; 
  competicion?: string;
  rival?: string;
  resultado?: string;
  minutos_observados?: number;
}
export const playerService = {
  searchPlayers: async (query: string): Promise<Player[]> => {
    const response = await api.get('/api/search/players', { params: { query } });
    return response.data;
  },

  getPlayerRecentMatches: async (playerId: number): Promise<any[]> => {
    const response = await api.get(`/api/player/${playerId}/recent-matches`);
    return response.data;
  },
  
  smartSearch: async (query: string): Promise<any[]> => {
    const response = await api.get('/api/search/smart', { params: { query } });
    return response.data;
  },
  
  getAreas: async (): Promise<any[]> => {
    const response = await api.get('/api/areas');
    return response.data;
  },
  
  getCompetitions: async (areaId: number): Promise<any[]> => {
    const response = await api.get(`/api/areas/${areaId}/competitions`);
    return response.data;
  },
  
  getCompetitionTeams: async (competitionId: number): Promise<any[]> => {
    const response = await api.get(`/api/competitions/${competitionId}/teams`);
    return response.data;
  },
  
  getTeamPlayers: async (teamId: number): Promise<any[]> => {
    const response = await api.get(`/api/teams/${teamId}/players`);
    return response.data;
  },
  
  getPlayerProfile: async (playerId: number): Promise<any> => {
    const response = await api.get(`/api/player/${playerId}/profile`);
    return response.data;
  },
  
  getPlayerDetails: async (playerId: number): Promise<PlayerDetails> => {
    const response = await api.get(`/api/players/${playerId}`);
    return response.data;
  },
  
  getPlayerMatches: async (playerId: number): Promise<any[]> => {
    const response = await api.get(`/api/players/${playerId}/matches`);
    return response.data;
  },
};

export const scoutingService = {
  createReport: async (report: ScoutReportCreate): Promise<ScoutReport> => {
    const response = await api.post('/api/scout-reports', report);
    return response.data;
  },
  
  getReports: async (): Promise<ScoutReport[]> => {
    const response = await api.get('/api/scout-reports');
    return response.data;
  },
  
  getPlayerReports: async (playerId: string): Promise<ScoutReport[]> => {
    const response = await api.get(`/api/scout-reports/player/${playerId}`);
    return response.data;
  },
  
  // NUEVO MÉTODO
  getAllPlayerReports: async (playerId: string): Promise<any> => {
    const response = await api.get(`/api/scout-reports/player/${playerId}/all`);
    return response.data;
  },
};

export const healthService = {
  checkHealth: async () => {
    const response = await api.get('/api/health');
    return response.data;
  },
  
  testWyscout: async () => {
    const response = await api.get('/api/test-wyscout');
    return response.data;
  },
};
