import React, { useState, useEffect } from 'react';
import { ScoutReport, playerService } from '../services/api';

interface RecommendationsTabProps {
  scoutReports: ScoutReport[];
  filterLeague: string;
  setFilterLeague: (league: string) => void;
  filterRecommendation: string;
  setFilterRecommendation: (rec: string) => void;
  filterPosition: string;
  setFilterPosition: (pos: string) => void;
  filterCondicionMercado: string;
  setFilterCondicionMercado: (cond: string) => void;
  getUniqueLeagues: () => (string | undefined)[];
  getUniquePositions: () => (string | undefined)[];
  getFilteredPlayers: () => any[];
  openMarketModal: (player: any) => void;
  openPlayerDetail: (playerName: string) => void;
  onCreateInforme?: (playerId: string, playerName: string) => void;
}

const formatMoney = (value: number | null | undefined) => {
  if (!value && value !== 0) return null;
  if (value >= 1000000) return `EUR ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `EUR ${(value / 1000).toFixed(0)}K`;
  return `EUR ${value}`;
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const getContractColor = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'text-text-muted';
  const months = Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30));
  if (months <= 0) return 'text-red-400';
  if (months <= 6) return 'text-red-400';
  if (months <= 12) return 'text-amber-400';
  return 'text-accent';
};

const RecommendationsTab: React.FC<RecommendationsTabProps> = ({
  scoutReports,
  filterLeague,
  setFilterLeague,
  filterRecommendation,
  setFilterRecommendation,
  filterPosition,
  setFilterPosition,
  filterCondicionMercado,
  setFilterCondicionMercado,
  getUniqueLeagues,
  getUniquePositions,
  getFilteredPlayers,
  openMarketModal,
  openPlayerDetail,
  onCreateInforme,
}) => {
  const [playerInfoCache, setPlayerInfoCache] = useState<Record<string, any>>({});
  const [loadingInfo, setLoadingInfo] = useState(false);
  const fetchedRef = React.useRef<Set<string>>(new Set());

  const players = getFilteredPlayers();

  // Fetch Wyscout info for visible players
  // Fetch info progressively in batches of 10
  useEffect(() => {
    if (players.length === 0) return;

    const fetchAllBatches = async () => {
      // Collect all IDs that haven't been fetched yet
      const allIds: number[] = [];
      for (const p of players) {
        const wid = Number(p.player_id) || p.player_wyscout_id;
        if (!wid) continue;
        if (fetchedRef.current.has(String(wid))) continue;
        if (!allIds.includes(wid)) allIds.push(wid);
      }

      if (allIds.length === 0) return;

      setLoadingInfo(true);

      // Process in batches of 10
      for (let i = 0; i < allIds.length; i += 10) {
        const batch = allIds.slice(i, i + 10);
        batch.forEach(id => fetchedRef.current.add(String(id)));

        try {
          const info = await playerService.getPlayersBatchInfo(batch);
          setPlayerInfoCache(prev => ({ ...prev, ...info }));
        } catch (e) {
          console.error('Error fetching batch:', e);
        }
      }

      setLoadingInfo(false);
    };

    fetchAllBatches();
  }, [players.map((p: any) => p.player_name).join(',')]);

  const getInfo = (player: any) => {
    const wid = Number(player.player_id) || player.player_wyscout_id;
    if (!wid) return null;
    return playerInfoCache[String(wid)] || null;
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border-strong mb-6">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/images/football-dark.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
            opacity: 0.45,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface/70 via-surface/30 to-transparent" />
        <div className="relative z-10 px-8 py-7 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-xs uppercase tracking-[0.2em] text-accent font-medium">Scouting</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              <span className="text-gradient-hero">Recomendaciones de Jugadores</span>
            </h2>
          </div>
          {loadingInfo && (
            <span className="text-[11px] uppercase tracking-widest text-accent">Cargando info...</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="stat-card p-4 text-center">
          <div className="text-3xl font-bold text-blue-400">
            {scoutReports.filter(r => r.recomendacion === 'Continuar visoria').length}
          </div>
          <div className="text-[11px] uppercase tracking-widest text-text-muted mt-1">Continuar Visoria</div>
        </div>
        <div className="bg-card border border-border-strong p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-red-400">
            {scoutReports.filter(r => r.recomendacion === 'Descartar por encima').length}
          </div>
          <div className="text-[11px] uppercase tracking-widest text-text-muted mt-1">Desc. por Encima</div>
        </div>
        <div className="bg-card border border-border-strong p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-red-400">
            {scoutReports.filter(r => r.recomendacion === 'Descartar por debajo').length}
          </div>
          <div className="text-[11px] uppercase tracking-widest text-text-muted mt-1">Desc. por Debajo</div>
        </div>
        <div className="bg-card border border-border-strong p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-gradient">
            {scoutReports.filter(r => r.recomendacion === 'Hacer informe').length}
          </div>
          <div className="text-[11px] uppercase tracking-widest text-text-muted mt-1">Hacer Informe</div>
        </div>
        <div className="bg-card border border-border-strong p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-white">
            {new Set(scoutReports.map(r => r.player_name)).size}
          </div>
          <div className="text-[11px] uppercase tracking-widest text-text-muted mt-1">Jugadores Unicos</div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-card border border-border-strong rounded-lg mb-6">
        <div>
          <label className="block text-[11px] uppercase tracking-widest text-text-muted mb-2">
            Liga / Competicion
          </label>
          <select
            value={filterLeague}
            onChange={(e) => setFilterLeague(e.target.value)}
            className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text cursor-pointer focus:border-accent/50 focus:outline-none"
          >
            <option value="">Todas las Ligas</option>
            {getUniqueLeagues().map(league => (
              <option key={league} value={league}>{league}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-widest text-text-muted mb-2">
            Recomendacion
          </label>
          <select
            value={filterRecommendation}
            onChange={(e) => setFilterRecommendation(e.target.value)}
            className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text cursor-pointer focus:border-accent/50 focus:outline-none"
          >
            <option value="">Todas</option>
            <option value="Continuar visoria">Continuar Visoria</option>
            <option value="Descartar por encima">Descartar por Encima</option>
            <option value="Descartar por debajo">Descartar por Debajo</option>
            <option value="Hacer informe">Hacer Informe</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-widest text-text-muted mb-2">
            Posicion
          </label>
          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text cursor-pointer focus:border-accent/50 focus:outline-none"
          >
            <option value="">Todas las Posiciones</option>
            {getUniquePositions().map(position => (
              <option key={position} value={position}>{position}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-widest text-text-muted mb-2">
            Condición de Mercado
          </label>
          <select
            value={filterCondicionMercado}
            onChange={(e) => setFilterCondicionMercado(e.target.value)}
            className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text cursor-pointer focus:border-accent/50 focus:outline-none"
          >
            <option value="">Todas</option>
            <option value="Libre">Agente Libre</option>
            <option value="Ultimo año">Ultimo Año de Contrato</option>
            <option value="Contrato largo">Contrato Largo</option>
            <option value="Clausula">Con Clausula de Rescision</option>
            <option value="A prestamo">A Préstamo</option>
          </select>
        </div>
      </div>

      {/* Player list */}
      {players.length === 0 ? (
        <div className="text-center py-12 px-6 text-text-muted">
          <p>No se encontraron jugadores con estos filtros</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {players.map((player: any) => {
            const info = getInfo(player);
            return (
              <div
                key={player.player_name}
                className="bg-card border border-border-strong rounded-lg p-4 hover:border-accent/30 transition-colors"
              >
                <div className="flex gap-4">
                  {/* Player photo */}
                  <div className="shrink-0">
                    {info?.player_image ? (
                      <img
                        src={info.player_image}
                        alt={player.player_name}
                        className="w-14 h-14 rounded-lg object-cover border border-border-strong"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-accent-muted rounded-lg flex items-center justify-center text-base text-accent font-bold border border-border-strong">
                        {player.player_name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                      </div>
                    )}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {/* Name + age */}
                        <div className="flex items-center gap-2">
                          <h3
                            className="text-sm font-semibold text-accent hover:text-accent-light cursor-pointer transition-colors truncate"
                            onClick={() => openPlayerDetail(player.player_name)}
                          >
                            {player.player_name}
                          </h3>
                          {info?.age && (
                            <span className="text-[11px] text-text-muted shrink-0">{info.age} años</span>
                          )}
                        </div>

                        {/* Team + position from Wyscout */}
                        <div className="flex items-center gap-2 mt-1">
                          {info?.team_image && (
                            <img src={info.team_image} alt="" className="w-4 h-4 object-contain" />
                          )}
                          <span className="text-[12px] text-text-secondary truncate">
                            {info?.team_name || player.team || 'Sin equipo'}
                          </span>
                          {info?.position && (
                            <span className="text-[11px] bg-white/8 text-text-muted px-1.5 py-0.5 rounded shrink-0">
                              {info.position}
                            </span>
                          )}
                          {info?.nationality_code && (
                            <span className="text-[11px] text-text-muted shrink-0">{info.nationality_code}</span>
                          )}
                          <span className="text-[11px] text-text-muted shrink-0">
                            · {player.total_reports} {player.total_reports === 1 ? 'reporte' : 'reportes'}
                          </span>
                        </div>

                        {/* Info tags row */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {/* Rating */}
                          <span className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                            player.overall_rating >= 8 ? 'bg-accent/15 text-accent' :
                            player.overall_rating >= 6 ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'
                          }`}>
                            {player.overall_rating}/10
                          </span>

                          {/* Recommendation */}
                          {player.recomendacion && (
                            <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                              player.recomendacion === 'Hacer informe' ? 'bg-accent/15 text-accent' :
                              player.recomendacion === 'Continuar visoria' ? 'bg-blue-500/15 text-blue-400' :
                              player.recomendacion === 'Descartar por encima' ? 'bg-orange-500/15 text-orange-400' :
                              'bg-red-500/15 text-red-400'
                            }`}>
                              {player.recomendacion}
                            </span>
                          )}

                          {/* Market value from Wyscout */}
                          {info?.market_value && (
                            <span className="text-[11px] font-mono font-medium bg-accent/10 text-accent px-1.5 py-0.5 rounded">
                              {formatMoney(info.market_value)}
                            </span>
                          )}

                          {/* Estimated price from report */}
                          {player.precio_estimado && (
                            <span className="text-[11px] font-mono font-medium bg-white/8 text-text-secondary px-1.5 py-0.5 rounded">
                              Est: EUR {(player.precio_estimado / 1000000).toFixed(1)}M
                            </span>
                          )}

                          {/* Contract expiry from Wyscout */}
                          {info?.contract_expires && (
                            <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded bg-white/5 ${getContractColor(info.contract_expires)}`}>
                              Vto: {formatDate(info.contract_expires)}
                            </span>
                          )}

                          {/* Competition */}
                          {player.competicion && (
                            <span className="text-[11px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded">
                              {player.competicion}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="shrink-0 flex flex-col items-end gap-2">
                        <button
                          onClick={() => {
                            openMarketModal({
                              name: player.player_name,
                              position: player.position_played || '',
                              age: info?.age || player.age || null,
                              team: info?.team_name || player.team || '',
                              manual_id: player.manual_id || null,
                              wyscout_id: player.player_wyscout_id || player.player_id || null
                            });
                          }}
                          className="bg-white/8 border border-border px-3 py-1.5 rounded-md text-[11px] text-text-secondary cursor-pointer whitespace-nowrap hover:bg-white/12 transition-colors"
                        >
                          A Mercado
                        </button>
                        {onCreateInforme && (
                          <button
                            onClick={() => onCreateInforme(player.player_id, player.player_name)}
                            className="bg-accent/15 border border-accent/30 px-3 py-1.5 rounded-md text-[11px] text-accent font-medium cursor-pointer whitespace-nowrap hover:bg-accent/25 transition-colors"
                          >
                            Crear Informe
                          </button>
                        )}
                        <button
                          onClick={() => openPlayerDetail(player.player_name)}
                          className="text-accent text-[11px] hover:text-accent-light cursor-pointer bg-transparent border-none whitespace-nowrap transition-colors"
                        >
                          Ver Detalles
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecommendationsTab;
