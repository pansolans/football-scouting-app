import React, { useState, useEffect } from 'react';
import { ScoutReport, playerService } from '../services/api';

interface ReportsTabProps {
  scoutReports: ScoutReport[];
  filterPlayerName: string;
  setFilterPlayerName: (name: string) => void;
  filterTeam: string;
  setFilterTeam: (team: string) => void;
  filterLeague: string;
  setFilterLeague: (league: string) => void;
  getFilteredReports: () => ScoutReport[];
  getUniqueLeagues: () => (string | undefined)[];
  openPlayerDetail: (playerName: string) => void;
  editReport: (report: ScoutReport) => void;
  onDeleteReport?: (reportId: string) => void;
  onCreateInforme?: (playerId: string, playerName: string) => void;
}

const getRatingColorClass = (rating: number): string => {
  if (rating >= 8) return 'text-accent';
  if (rating >= 6) return 'text-amber-400';
  return 'text-red-400';
};

const getRatingBgClass = (rating: number): string => {
  if (rating >= 8) return 'bg-accent/15 text-accent';
  if (rating >= 6) return 'bg-amber-500/15 text-amber-400';
  return 'bg-red-500/15 text-red-400';
};

const formatMoney = (value: number | null | undefined) => {
  if (!value && value !== 0) return null;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return `${value}`;
};

const getContractBadge = (dateStr: string | null | undefined) => {
  if (!dateStr) return null;
  const months = Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30));
  if (months <= 0) return { text: 'Expirado', cls: 'bg-red-500/15 text-red-400' };
  if (months <= 6) return { text: `${months}m`, cls: 'bg-red-500/15 text-red-400' };
  if (months <= 12) return { text: `${months}m`, cls: 'bg-amber-500/15 text-amber-400' };
  return { text: `${months}m`, cls: 'bg-accent/15 text-accent' };
};

const ReportsTab: React.FC<ReportsTabProps> = ({
  scoutReports,
  filterPlayerName,
  setFilterPlayerName,
  filterTeam,
  setFilterTeam,
  filterLeague,
  setFilterLeague,
  getFilteredReports,
  getUniqueLeagues,
  openPlayerDetail,
  editReport,
  onDeleteReport,
  onCreateInforme,
}) => {
  const [playerInfoCache, setPlayerInfoCache] = useState<Record<string, any>>({});
  const [loadingInfo, setLoadingInfo] = useState(false);
  const fetchedRef = React.useRef<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState(10);

  // Fetch player info for visible (filtered) reports only, in batches of 10
  const allFilteredReports: ScoutReport[] = getFilteredReports();
  const filteredReports = allFilteredReports.slice(0, pageSize);

  useEffect(() => {
    if (filteredReports.length === 0) return;

    const fetchPlayerInfo = async () => {
      const wyscoutIds: number[] = [];

      for (const r of filteredReports) {
        // player_id contains the Wyscout ID
        const wid = Number(r.player_id) || r.player_wyscout_id;
        if (!wid) continue;
        const key = String(wid);
        if (fetchedRef.current.has(key)) continue;
        wyscoutIds.push(wid);
        fetchedRef.current.add(key);
      }

      const uniqueIds = [...new Set(wyscoutIds)];

      if (uniqueIds.length === 0) return;

      setLoadingInfo(true);
      // Fetch in batches of 10
      for (let i = 0; i < uniqueIds.length; i += 10) {
        const batch = uniqueIds.slice(i, i + 10);
        try {
          const info = await playerService.getPlayersBatchInfo(batch);
          setPlayerInfoCache(prev => ({ ...prev, ...info }));
        } catch (e) {
          console.error('[ReportsTab] Error fetching batch:', e);
        }
      }
      setLoadingInfo(false);
    };

    fetchPlayerInfo();
  }, [filteredReports.map((r: ScoutReport) => r.id).join(',')]);

  const getInfo = (report: ScoutReport) => {
    const wid = Number(report.player_id) || report.player_wyscout_id;
    if (!wid) return null;
    return playerInfoCache[String(wid)] || null;
  };

  return (
    <div className="animate-fade-in">
      {/* Reports Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border-strong mb-6">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/images/stadium-bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 60%',
            opacity: 0.45,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface/70 via-surface/30 to-transparent" />

        <div className="relative z-10 px-8 py-7 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-xs uppercase tracking-[0.2em] text-accent font-medium">Analisis</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              <span className="text-gradient-hero">Mis Reportes</span>
            </h2>
          </div>
          <div className="text-right">
            <div className="big-number-sm text-gradient">{allFilteredReports.length}</div>
            <div className="text-xs uppercase tracking-widest text-text-muted mt-1">
              reportes totales
              {loadingInfo && <span className="ml-2 text-accent">cargando...</span>}
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-5 bg-card border border-border-strong rounded-lg mb-6">
        <div>
          <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
            Buscar Jugador
          </label>
          <input
            type="text"
            placeholder="Nombre del jugador..."
            value={filterPlayerName}
            onChange={(e) => setFilterPlayerName(e.target.value)}
            className="w-full py-2.5 px-3 bg-surface border border-border-strong rounded-md text-sm text-text placeholder:text-zinc-500 focus:border-accent/50 focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
            Filtrar por Equipo/Rival
          </label>
          <input
            type="text"
            placeholder="Nombre del equipo..."
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="w-full py-2.5 px-3 bg-surface border border-border-strong rounded-md text-sm text-text placeholder:text-zinc-500 focus:border-accent/50 focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
            Filtrar por Liga
          </label>
          <select
            value={filterLeague}
            onChange={(e) => setFilterLeague(e.target.value)}
            className="w-full py-2.5 px-3 bg-surface border border-border-strong rounded-md text-sm text-text cursor-pointer focus:border-accent/50 focus:outline-none transition-colors"
          >
            <option value="">Todas las ligas</option>
            {getUniqueLeagues().map(league => (
              <option key={league} value={league}>{league}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
            Mostrar
          </label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="w-full py-2.5 px-3 bg-surface border border-border-strong rounded-md text-sm text-text cursor-pointer focus:border-accent/50 focus:outline-none transition-colors"
          >
            {[5, 10, 20, 50].map(n => (
              <option key={n} value={n}>{n} reportes</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => { setFilterPlayerName(''); setFilterTeam(''); setFilterLeague(''); }}
            className="w-full py-2.5 px-6 bg-white/8 border border-border-strong text-text-secondary rounded-md text-xs font-medium cursor-pointer transition-colors hover:text-text"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <p className="text-sm">
            {scoutReports.length === 0
              ? "No hay reportes todavia. Empieza a scoutear jugadores!"
              : "No se encontraron reportes con estos filtros"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredReports.map((report) => {
            const info = getInfo(report);
            const contractBadge = info ? getContractBadge(info.contract_expires) : null;

            return (
              <div
                key={report.id}
                className="bg-card border border-border-strong rounded-lg p-5 hover:border-accent/30 transition-colors"
              >
                {/* Top row: player info + rating */}
                <div className="flex gap-4">
                  {/* Player photo */}
                  <div className="shrink-0">
                    {info?.player_image ? (
                      <img
                        src={info.player_image}
                        alt={report.player_name}
                        className="w-16 h-16 rounded-lg object-cover border border-border-strong"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-accent-muted rounded-lg flex items-center justify-center text-lg text-accent font-bold border border-border-strong">
                        {report.player_name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                      </div>
                    )}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3
                            className="text-sm font-semibold text-accent hover:text-accent-light cursor-pointer transition-colors truncate"
                            onClick={() => openPlayerDetail(report.player_name)}
                          >
                            {report.player_name}
                          </h3>
                          {info?.age && (
                            <span className="text-[11px] text-text-muted shrink-0">{info.age} años</span>
                          )}
                        </div>

                        {/* Team row with badge */}
                        <div className="flex items-center gap-2 mt-1">
                          {info?.team_image && (
                            <img src={info.team_image} alt="" className="w-4 h-4 object-contain" />
                          )}
                          <span className="text-[12px] text-text-secondary truncate">
                            {info?.team_name || report.match_context || ''}
                          </span>
                          {info?.position && (
                            <span className="text-[11px] bg-white/8 text-text-muted px-1.5 py-0.5 rounded shrink-0">
                              {info.position}
                            </span>
                          )}
                          {info?.nationality_code && (
                            <span className="text-[11px] text-text-muted shrink-0">{info.nationality_code}</span>
                          )}
                        </div>

                        {/* Quick info tags */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {info?.market_value && (
                            <span className="text-[11px] font-mono font-medium bg-accent/10 text-accent px-1.5 py-0.5 rounded">
                              EUR {formatMoney(info.market_value)}
                            </span>
                          )}
                          {info?.contract_expires && (
                            <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${getContractBadge(info.contract_expires)?.cls || 'bg-white/10 text-text-secondary'}`}>
                              Vto Contrato: {new Date(info.contract_expires).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
                          )}
                          {info?.foot && (
                            <span className="text-[11px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded">
                              {info.foot === 'right' ? 'Derecho' : info.foot === 'left' ? 'Izquierdo' : 'Ambidiestro'}
                            </span>
                          )}
                          {info?.height && (
                            <span className="text-[11px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded">
                              {info.height}cm
                            </span>
                          )}
                          {report.competicion && (
                            <span className="text-[11px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded">
                              {report.competicion}
                            </span>
                          )}
                          {report.recomendacion && (
                            <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                              report.recomendacion.toLowerCase().includes('hacer informe') ? 'bg-accent/15 text-accent' :
                              report.recomendacion.toLowerCase().includes('continuar') ? 'bg-blue-500/15 text-blue-400' :
                              report.recomendacion.toLowerCase().includes('encima') ? 'bg-orange-500/15 text-orange-400' :
                              report.recomendacion.toLowerCase().includes('comprar') ? 'bg-accent/15 text-accent' :
                              report.recomendacion.toLowerCase().includes('seguir') ? 'bg-blue-500/15 text-blue-400' :
                              'bg-red-500/15 text-red-400'
                            }`}>
                              {report.recomendacion}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Rating + Edit */}
                      <div className="shrink-0 flex flex-col items-end gap-2">
                        <div className={`font-mono text-xl font-bold px-3 py-1.5 rounded-lg ${getRatingBgClass(report.overall_rating)}`}>
                          {report.overall_rating}
                        </div>
                        <button
                          onClick={() => editReport(report)}
                          className="py-1.5 px-3 bg-white/8 border border-border text-text-secondary rounded-md cursor-pointer text-[11px] font-medium transition-colors hover:bg-white/12 hover:text-text"
                        >
                          Editar
                        </button>
                        {onDeleteReport && (
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Estás seguro de que querés eliminar el reporte de ${report.player_name}?`)) {
                                onDeleteReport(report.id);
                              }
                            }}
                            className="py-1.5 px-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-md cursor-pointer text-[11px] font-medium transition-colors hover:bg-red-500/20"
                          >
                            Eliminar
                          </button>
                        )}
                        {onCreateInforme && (
                          <button
                            onClick={() => onCreateInforme(report.player_id, report.player_name)}
                            className="py-1.5 px-3 bg-accent/15 border border-accent/30 text-accent rounded-md cursor-pointer text-[11px] font-medium transition-colors hover:bg-accent/25"
                          >
                            Crear Informe
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ratings row */}
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
                  {[
                    { label: 'Tecnica', value: report.tecnica_individual, color: 'text-emerald-400' },
                    { label: 'Fisico', value: report.velocidad, color: 'text-amber-400' },
                    { label: 'Mental', value: report.inteligencia_tactica, color: 'text-violet-400' }
                  ].map((r) => (
                    <div key={r.label} className="flex items-center justify-between bg-elevated rounded-md px-3 py-2">
                      <span className="text-[11px] uppercase tracking-widest text-text-muted">{r.label}</span>
                      <span className={`font-mono text-sm font-bold ${r.color}`}>{r.value}/10</span>
                    </div>
                  ))}
                </div>

                {/* Notes (collapsible - show first line) */}
                {report.notes && (
                  <p className="text-[12px] text-text-secondary mt-3 line-clamp-2 leading-relaxed">{report.notes}</p>
                )}

                {/* Strengths & Weaknesses inline */}
                {(report.fortalezas || report.debilidades) && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {report.fortalezas && (
                      <div className="p-3 bg-accent/5 border border-accent/15 rounded-md">
                        <div className="text-[10px] uppercase tracking-widest text-accent font-medium mb-1">Fortalezas</div>
                        <p className="text-[12px] text-text-secondary line-clamp-2 m-0">{report.fortalezas}</p>
                      </div>
                    )}
                    {report.debilidades && (
                      <div className="p-3 bg-red-500/5 border border-red-500/15 rounded-md">
                        <div className="text-[10px] uppercase tracking-widest text-red-400 font-medium mb-1">Debilidades</div>
                        <p className="text-[12px] text-text-secondary line-clamp-2 m-0">{report.debilidades}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer: author + date */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <div className="text-[11px] text-text-muted">
                    {report.created_by_name && (
                      <span>
                        Por {report.created_by_name}
                        {report.created_by_role && ` · ${
                          report.created_by_role === 'admin' ? 'Admin' :
                          report.created_by_role === 'head_scout' ? 'Jefe Scout' :
                          report.created_by_role === 'scout' ? 'Scout' : 'Observador'
                        }`}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-text-muted font-mono">
                    {report.fecha_observacion || report.created_at?.split('T')[0] || ''}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Load more */}
          {allFilteredReports.length > pageSize && (
            <div className="text-center pt-4">
              <button
                onClick={() => setPageSize(prev => prev + 10)}
                className="px-6 py-2.5 bg-white/8 border border-border-strong text-text-secondary rounded-md text-sm font-medium cursor-pointer transition-colors hover:text-text hover:bg-white/12"
              >
                Cargar mas ({allFilteredReports.length - pageSize} restantes)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsTab;
