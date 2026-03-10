// Re-export from api.ts
export type { Player, PlayerDetails, ScoutReport, ScoutReportCreate, HealthStatus } from './services/api';

// Club configuration
export interface ClubConfig {
  primaryColor: string;
  secondaryColor: string;
  logo: string;
  name: string;
}

// Tab types
export type TabId = 'dashboard' | 'quick-search' | 'browse' | 'reports' | 'player-profile' | 'recommendations' | 'add-player' | 'manual-players' | 'markets' | 'informes' | 'player-profiles';
