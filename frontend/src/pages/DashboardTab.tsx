import React from 'react';
import { ScoutReport, HealthStatus } from '../types';

interface DashboardTabProps {
  totalReports: number;
  avgRating: string;
  scoutReports: ScoutReport[];
  healthStatus: HealthStatus | null;
  wyscoutStatus: any;
}

const DashboardTab: React.FC<DashboardTabProps> = ({ totalReports, avgRating, scoutReports, healthStatus, wyscoutStatus }) => {
  const uniquePlayers = new Set(scoutReports.map(r => r.player_id)).size;
  const topRated = [...scoutReports].sort((a, b) => b.overall_rating - a.overall_rating).slice(0, 3);

  return (
    <div className="grid gap-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-border-strong">
        {/* Background football image */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/images/football-dark.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%',
            opacity: 0.45,
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-surface/80 via-surface/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface/70 via-transparent to-transparent" />

        {/* Decorative field lines */}
        <div className="field-line w-[200px] h-[200px] top-[-50px] right-[10%] opacity-40" />
        <div className="field-line w-[120px] h-[120px] bottom-[-30px] right-[25%] opacity-30" />

        <div className="relative z-10 px-10 py-12">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse-glow" />
            <span className="text-xs uppercase tracking-[0.2em] text-accent font-medium">Panel de Control</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight mb-2">
            <span className="text-gradient-hero">Bienvenido a ScoutPro</span>
          </h1>
          <p className="text-text-secondary text-lg max-w-xl">
            Tu plataforma de scouting profesional. Analiza, descubre y ficha los mejores talentos.
          </p>

          {/* Quick stats inline */}
          <div className="flex gap-10 mt-8">
            <div>
              <div className="big-number text-gradient">{totalReports}</div>
              <div className="text-xs uppercase tracking-widest text-text-muted mt-1">Reportes</div>
            </div>
            <div>
              <div className="big-number text-gradient">{uniquePlayers}</div>
              <div className="text-xs uppercase tracking-widest text-text-muted mt-1">Jugadores</div>
            </div>
            <div>
              <div className="big-number text-gradient-gold">{avgRating}</div>
              <div className="text-xs uppercase tracking-widest text-text-muted mt-1">Rating Prom.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="stat-card p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-xs text-accent bg-accent/10 px-2 py-1 rounded-full font-medium">Activo</span>
          </div>
          <div className="big-number-sm text-text mb-1">{totalReports}</div>
          <div className="text-sm text-text-muted">Reportes Totales</div>
        </div>

        <div className="stat-card p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-info/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-xs text-info bg-info/10 px-2 py-1 rounded-full font-medium">Scouted</span>
          </div>
          <div className="big-number-sm text-text mb-1">{uniquePlayers}</div>
          <div className="text-sm text-text-muted">Jugadores Evaluados</div>
        </div>

        <div className="stat-card p-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-warning/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <span className="text-xs text-warning bg-warning/10 px-2 py-1 rounded-full font-medium">Promedio</span>
          </div>
          <div className="big-number-sm text-text mb-1">{avgRating}<span className="text-lg text-text-muted">/10</span></div>
          <div className="text-sm text-text-muted">Rating Promedio</div>
        </div>
      </div>

      {/* Two columns: Top Rated + System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Rated Players */}
        {topRated.length > 0 && (
          <div className="card-elevated rounded-xl p-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-accent to-accent-dark" />
              <h3 className="text-base font-semibold text-text tracking-tight">Top Jugadores</h3>
            </div>

            <div className="space-y-3">
              {topRated.map((report, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    i === 0 ? 'bg-accent/20 text-accent' :
                    i === 1 ? 'bg-info/20 text-info' :
                    'bg-white/10 text-text-secondary'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text m-0 truncate">{report.player_name}</p>
                    <p className="text-xs text-text-muted m-0">{report.position_played || report.competicion || 'Sin posicion'}</p>
                  </div>
                  <div className={`font-mono text-lg font-bold ${
                    report.overall_rating >= 8 ? 'text-gradient' :
                    report.overall_rating >= 6 ? 'text-gradient-gold' :
                    'text-red-400'
                  }`}>
                    {report.overall_rating}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System Status */}
        <div className="card-elevated rounded-xl p-6 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-info to-blue-700" />
            <h3 className="text-base font-semibold text-text tracking-tight">Estado del Sistema</h3>
          </div>

          <div className="space-y-3">
            <div className={`p-4 rounded-lg border ${
              healthStatus?.status === 'healthy'
                ? 'bg-accent/5 border-accent/20'
                : 'bg-danger/5 border-danger/20'
            }`}>
              <div className="flex items-center gap-2.5 mb-2">
                <span className={`w-2 h-2 rounded-full ${
                  healthStatus?.status === 'healthy' ? 'bg-accent animate-pulse-glow' : 'bg-danger'
                }`} />
                <h4 className="m-0 font-semibold text-sm text-text">Backend API</h4>
              </div>
              <p className="text-sm text-text-muted mb-1 mt-0">
                {healthStatus?.message || 'Verificando...'}
              </p>
              {healthStatus?.environment && (
                <div className="text-xs text-text-muted/60">
                  Supabase: {healthStatus.environment.supabase_configured ? 'OK' : 'Error'} |
                  Wyscout: {healthStatus.environment.wyscout_configured ? 'OK' : 'Error'}
                </div>
              )}
            </div>

            <div className={`p-4 rounded-lg border ${
              wyscoutStatus?.status === 'success'
                ? 'bg-accent/5 border-accent/20'
                : 'bg-danger/5 border-danger/20'
            }`}>
              <div className="flex items-center gap-2.5 mb-2">
                <span className={`w-2 h-2 rounded-full ${
                  wyscoutStatus?.status === 'success' ? 'bg-accent animate-pulse-glow' : 'bg-danger'
                }`} />
                <h4 className="m-0 font-semibold text-sm text-text">Wyscout API</h4>
              </div>
              <p className="text-sm text-text-muted mb-1 mt-0">
                {wyscoutStatus?.message || 'Verificando...'}
              </p>
              {wyscoutStatus?.areas_count && (
                <div className="text-xs text-text-muted/60">
                  Areas disponibles: {wyscoutStatus.areas_count}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {scoutReports.length > 0 && (
        <div className="card-elevated rounded-xl p-6 animate-fade-in-up relative overflow-hidden" style={{ animationDelay: '0.6s' }}>
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-diagonal-lines pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-accent to-transparent" />
              <h3 className="text-base font-semibold text-text tracking-tight">Actividad Reciente</h3>
              <span className="text-xs text-text-muted ml-auto">Ultimos 5 reportes</span>
            </div>

            <div className="space-y-0">
              {[...scoutReports]
                .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
                .slice(0, 5)
                .map((report, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-3.5 border-b border-border last:border-b-0 hover:bg-white/[0.02] transition-colors px-2 -mx-2 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-bold">
                        {report.player_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text m-0">{report.player_name}</p>
                        <p className="text-xs text-text-muted m-0 mt-0.5">{report.competicion || 'Sin competicion'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-mono text-base font-bold ${
                        report.overall_rating >= 8 ? 'text-accent' :
                        report.overall_rating >= 6 ? 'text-amber-400' :
                        'text-red-400'
                      }`}>
                        {report.overall_rating}/10
                      </span>
                      <span className="text-xs text-text-muted min-w-[70px] text-right">
                        {report.fecha_observacion ? new Date(report.fecha_observacion).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardTab;
