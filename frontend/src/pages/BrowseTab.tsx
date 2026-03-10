import React, { useState, useRef } from 'react';
import { Player, playerService } from '../services/api';

interface BrowseTabProps {
  areas: any[];
  selectedArea: number | null;
  setSelectedArea: (area: number | null) => void;
  competitions: any[];
  selectedCompetition: number | null;
  setSelectedCompetition: (comp: number | null) => void;
  competitionTeams: any[];
  selectedTeams: number[];
  setSelectedTeams: (teams: number[]) => void;
  teamPlayers: any[];
  selectedNationalities: string[];
  setSelectedNationalities: (nats: string[]) => void;
  showNationalityFilter: boolean;
  setShowNationalityFilter: (show: boolean) => void;
  availableNationalities: string[];
  ageFilter: { min: string; max: string };
  setAgeFilter: (filter: { min: string; max: string }) => void;
  contractFilter: { from: string; to: string };
  setContractFilter: (filter: { from: string; to: string }) => void;
  browseExtraInfo: Record<string, any>;
  setBrowseExtraInfo: (info: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => void;
  viewPlayerProfile: (playerId: number) => void;
  openReportForm: (player: Player) => void;
  openMarketModal: (player: any) => void;
  setPreselectedPlayer: (player: any) => void;
  setActiveTab: (tab: any) => void;
}

const BrowseTab: React.FC<BrowseTabProps> = ({
  areas,
  selectedArea,
  setSelectedArea,
  competitions,
  selectedCompetition,
  setSelectedCompetition,
  competitionTeams,
  selectedTeams,
  setSelectedTeams,
  teamPlayers,
  selectedNationalities,
  setSelectedNationalities,
  showNationalityFilter,
  setShowNationalityFilter,
  availableNationalities,
  ageFilter,
  setAgeFilter,
  contractFilter,
  setContractFilter,
  browseExtraInfo,
  setBrowseExtraInfo,
  viewPlayerProfile,
  openReportForm,
  openMarketModal,
  setPreselectedPlayer,
  setActiveTab,
}) => {
  const [loadingExtra, setLoadingExtra] = useState(false);
  const [extraLoaded, setExtraLoaded] = useState(false);
  const fetchedRef = useRef<Set<string>>(new Set());

  // Cargar contratos SOLO cuando el usuario lo pide
  const loadContracts = async () => {
    if (teamPlayers.length === 0) return;
    const ids: number[] = [];
    for (const p of teamPlayers) {
      const wid = Number(p.wyscout_id || p.id);
      if (!wid || fetchedRef.current.has(String(wid))) continue;
      ids.push(wid);
    }
    if (ids.length === 0) { setExtraLoaded(true); return; }

    setLoadingExtra(true);
    for (let i = 0; i < ids.length; i += 10) {
      const batch = ids.slice(i, i + 10);
      batch.forEach(id => fetchedRef.current.add(String(id)));
      try {
        const info = await playerService.getPlayersBatchInfo(batch);
        setBrowseExtraInfo((prev: Record<string, any>) => ({ ...prev, ...info }));
      } catch (e) {
        console.error('Error batch-info:', e);
      }
    }
    setLoadingExtra(false);
    setExtraLoaded(true);
  };

  const getExtra = (player: any) => {
    const wid = String(player.wyscout_id || player.id);
    return browseExtraInfo[wid] || null;
  };

  return (
    <div className="grid gap-6 animate-fade-in">
      {/* Browse Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border-strong">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/images/pitch-aerial.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.45,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface/70 via-surface/30 to-transparent" />
        <div className="relative z-10 px-8 py-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-xs uppercase tracking-[0.2em] text-accent font-medium">Explorar</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            <span className="text-gradient-hero">Explorar Ligas</span>
          </h2>
          <p className="text-text-muted text-sm mt-1">Navega por paises, competiciones y equipos</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="card-elevated rounded-xl p-6">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
              Area / País
            </label>
            <select
              value={selectedArea || ''}
              onChange={(e) => setSelectedArea(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full py-2.5 px-3 border border-border-strong rounded-md text-sm cursor-pointer outline-none bg-elevated text-text focus:border-accent/50 focus:outline-none"
            >
              <option value="">Seleccionar área...</option>
              {areas.map(area => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
              Competición
            </label>
            <select
              value={selectedCompetition || ''}
              onChange={(e) => setSelectedCompetition(e.target.value ? parseInt(e.target.value) : null)}
              disabled={!selectedArea}
              className={`w-full py-2.5 px-3 border border-border-strong rounded-md text-sm outline-none bg-elevated text-text focus:border-accent/50 focus:outline-none ${
                selectedArea ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <option value="">Seleccionar competición...</option>
              {competitions.map(comp => (
                <option key={comp.id} value={comp.id}>{comp.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
              Equipos
            </label>
            <div className={`border border-border-strong rounded-md p-2 max-h-[150px] overflow-y-auto bg-elevated text-text ${
              selectedCompetition ? '' : 'opacity-50'
            }`}>
              <label className="flex items-center p-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTeams.length === competitionTeams.length && competitionTeams.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTeams(competitionTeams.map(team => team.id));
                    } else {
                      setSelectedTeams([]);
                    }
                  }}
                  disabled={!selectedCompetition}
                  className="mr-2"
                />
                <strong>Todos los equipos</strong>
              </label>
              {competitionTeams.map(team => (
                <label key={team.id} className="flex items-center p-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTeams.includes(team.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTeams([...selectedTeams, team.id]);
                      } else {
                        setSelectedTeams(selectedTeams.filter(id => id !== team.id));
                      }
                    }}
                    disabled={!selectedCompetition}
                    className="mr-2"
                  />
                  {team.name}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filtros avanzados */}
      {teamPlayers.length > 0 && (
        <div className="bg-card border border-border-strong rounded-lg p-6">
          <h3 className="text-base font-medium text-text tracking-tight mb-4">
            Filtros Avanzados
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro de Nacionalidad */}
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
                Nacionalidades
              </label>
              <div className="relative">
                <div
                  onClick={() => setShowNationalityFilter(!showNationalityFilter)}
                  className="w-full py-2.5 px-3 border border-border-strong rounded-md text-sm cursor-pointer bg-elevated text-text flex justify-between items-center"
                >
                  <span>
                    {selectedNationalities.length === 0
                      ? 'Todas'
                      : `${selectedNationalities.length} seleccionadas`
                    }
                  </span>
                  <span>▼</span>
                </div>

                {showNationalityFilter && (
                  <div className="absolute top-full left-0 right-0 bg-elevated border border-border-strong rounded-md max-h-[200px] overflow-y-auto z-10 text-text">
                    {availableNationalities.map(nationality => (
                      <label key={nationality} className="flex items-center py-2 px-3 cursor-pointer hover:bg-white/[0.06]">
                        <input
                          type="checkbox"
                          checked={selectedNationalities.includes(nationality)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedNationalities([...selectedNationalities, nationality]);
                            } else {
                              setSelectedNationalities(selectedNationalities.filter(n => n !== nationality));
                            }
                          }}
                          className="mr-2"
                        />
                        {nationality}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Filtro de Edad */}
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
                Rango de Edad
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Min"
                  value={ageFilter.min}
                  onChange={(e) => setAgeFilter({ ...ageFilter, min: e.target.value })}
                  className="flex-1 py-2.5 px-3 border border-border-strong rounded-md text-sm bg-elevated text-text focus:border-accent/50 focus:outline-none min-w-0"
                />
                <span className="text-text-muted">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={ageFilter.max}
                  onChange={(e) => setAgeFilter({ ...ageFilter, max: e.target.value })}
                  className="flex-1 py-2.5 px-3 border border-border-strong rounded-md text-sm bg-elevated text-text focus:border-accent/50 focus:outline-none min-w-0"
                />
              </div>
            </div>

            {/* Filtro de Vencimiento de Contrato */}
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
                Vto. Contrato
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={contractFilter.from}
                  onChange={(e) => setContractFilter({ ...contractFilter, from: e.target.value })}
                  className="flex-1 py-2.5 px-3 border border-border-strong rounded-md text-sm bg-elevated text-text focus:border-accent/50 focus:outline-none min-w-0"
                />
                <span className="text-text-muted shrink-0">-</span>
                <input
                  type="date"
                  value={contractFilter.to}
                  onChange={(e) => setContractFilter({ ...contractFilter, to: e.target.value })}
                  className="flex-1 py-2.5 px-3 border border-border-strong rounded-md text-sm bg-elevated text-text focus:border-accent/50 focus:outline-none min-w-0"
                />
              </div>
            </div>
          </div>

          {/* Botón cargar contratos - fila separada */}
          <div className="mt-4">
            <button
              onClick={loadContracts}
              disabled={loadingExtra || extraLoaded}
              className={`py-2.5 px-6 rounded-md text-sm font-medium transition-colors ${
                extraLoaded
                  ? 'bg-accent/20 text-accent cursor-default'
                  : loadingExtra
                  ? 'bg-white/8 text-text-muted cursor-wait'
                  : 'bg-accent text-white cursor-pointer hover:bg-accent-dark'
              }`}
            >
              {extraLoaded ? 'Contratos cargados' : loadingExtra ? 'Cargando...' : 'Cargar contratos'}
            </button>
          </div>
        </div>
      )}

      {/* Players List */}
      {teamPlayers.length > 0 && (
        <div className="bg-card border border-border-strong rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-medium text-text tracking-tight">
              Plantilla ({teamPlayers.length} jugadores)
            </h3>
            {loadingExtra && (
              <span className="text-[11px] uppercase tracking-widest text-accent animate-pulse">Cargando contratos...</span>
            )}
          </div>

          <div className="grid">
            {teamPlayers.map((player: any) => {
              const extra = getExtra(player);
              const contractDate = extra?.contract_expires;
              const mktValue = extra?.market_value;

              return (
                <div
                  key={player.id}
                  className="bg-card border-b border-border last:border-b-0 px-4 py-3 flex justify-between items-center hover:bg-card-hover transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {player.imageDataURL ? (
                      <img
                        src={player.imageDataURL}
                        alt={player.name}
                        className="w-[40px] h-[40px] rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-xs text-accent font-medium bg-accent-muted">
                        {player.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-medium m-0 text-text">
                        {player.name}
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-1 items-center">
                        <span className="text-[13px] text-text-muted">{player.position}</span>
                        {player.age && (
                          <span className="text-[13px] text-text-muted">{player.age} años</span>
                        )}
                        {player.nationality && (
                          <span className="text-[13px] text-text-muted">{player.nationality}</span>
                        )}
                        {contractDate && (
                          <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                            (() => {
                              const months = Math.ceil((new Date(contractDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30));
                              if (months <= 6) return 'bg-red-500/15 text-red-400';
                              if (months <= 12) return 'bg-amber-500/15 text-amber-400';
                              return 'bg-white/8 text-text-muted';
                            })()
                          }`}>
                            Vto: {new Date(contractDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                        )}
                        {mktValue && (
                          <span className="text-[11px] font-mono font-medium bg-accent/10 text-accent px-1.5 py-0.5 rounded">
                            {mktValue >= 1000000 ? `EUR ${(mktValue / 1000000).toFixed(1)}M` : mktValue >= 1000 ? `EUR ${(mktValue / 1000).toFixed(0)}K` : `EUR ${mktValue}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => viewPlayerProfile(player.wyscout_id || player.id)}
                      className="px-2.5 py-1.5 rounded-md text-xs font-medium text-white bg-accent hover:bg-accent-dark cursor-pointer"
                    >
                      Perfil
                    </button>
                    <button
                      onClick={() => openReportForm(player)}
                      className="px-2.5 py-1.5 rounded-md text-xs font-medium text-text-secondary bg-white/8 border border-border cursor-pointer hover:bg-white/12"
                    >
                      Reporte
                    </button>
                    <button
                      onClick={() => openMarketModal(player)}
                      className="px-2.5 py-1.5 rounded-md text-xs font-medium text-text-secondary bg-white/8 border border-border cursor-pointer hover:bg-white/12"
                    >
                      Mercado
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseTab;
