import React from 'react';
import { Player } from '../services/api';

interface ManualPlayerFilters {
  name: string;
  team: string;
  nationality: string;
  minAge: string;
  maxAge: string;
  position: string;
}

interface FilterOptions {
  teams: string[];
  countries: string[];
  positions: string[];
}

interface ManualPlayersTabProps {
  manualPlayerFilters: ManualPlayerFilters;
  setManualPlayerFilters: (filters: ManualPlayerFilters) => void;
  filterOptions: FilterOptions;
  filteredManualPlayers: any[];
  manualPlayers: any[];
  loadingManualPlayers: boolean;
  loadManualPlayers: () => void;
  openReportForm: (player: Player) => void;
  openMarketModal: (player: any) => void;
}

const ManualPlayersTab: React.FC<ManualPlayersTabProps> = ({
  manualPlayerFilters,
  setManualPlayerFilters,
  filterOptions,
  filteredManualPlayers,
  manualPlayers,
  loadingManualPlayers,
  loadManualPlayers,
  openReportForm,
  openMarketModal,
}) => {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-lg font-medium text-text tracking-tight mb-4">
          Jugadores Creados Manualmente
        </h2>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-elevated border border-border-strong rounded-lg mb-5">
          <div>
            <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-1.5">
              Nombre
            </label>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={manualPlayerFilters.name}
              onChange={(e) => setManualPlayerFilters({ ...manualPlayerFilters, name: e.target.value })}
              className="w-full py-2 px-3 border border-border-strong rounded-md text-sm bg-surface text-text placeholder:text-text-muted/50"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-1.5">
              Equipo
            </label>
            <select
              value={manualPlayerFilters.team}
              onChange={(e) => setManualPlayerFilters({ ...manualPlayerFilters, team: e.target.value })}
              className="w-full py-2 px-3 border border-border-strong rounded-md text-sm cursor-pointer bg-surface text-text"
            >
              <option value="">Todos los equipos</option>
              {filterOptions.teams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-1.5">
              Nacionalidad
            </label>
            <select
              value={manualPlayerFilters.nationality}
              onChange={(e) => setManualPlayerFilters({ ...manualPlayerFilters, nationality: e.target.value })}
              className="w-full py-2 px-3 border border-border-strong rounded-md text-sm cursor-pointer bg-surface text-text"
            >
              <option value="">Todos los paises</option>
              {filterOptions.countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-1.5">
              Posicion
            </label>
            <select
              value={manualPlayerFilters.position}
              onChange={(e) => setManualPlayerFilters({ ...manualPlayerFilters, position: e.target.value })}
              className="w-full py-2 px-3 border border-border-strong rounded-md text-sm cursor-pointer bg-surface text-text"
            >
              <option value="">Todas las posiciones</option>
              {filterOptions.positions.map(position => (
                <option key={position} value={position}>{position}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-1.5">
              Edad Minima
            </label>
            <input
              type="number"
              placeholder="Desde..."
              value={manualPlayerFilters.minAge}
              onChange={(e) => setManualPlayerFilters({ ...manualPlayerFilters, minAge: e.target.value })}
              className="w-full py-2 px-3 border border-border-strong rounded-md text-sm bg-surface text-text placeholder:text-text-muted/50"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-1.5">
              Edad Maxima
            </label>
            <input
              type="number"
              placeholder="Hasta..."
              value={manualPlayerFilters.maxAge}
              onChange={(e) => setManualPlayerFilters({ ...manualPlayerFilters, maxAge: e.target.value })}
              className="w-full py-2 px-3 border border-border-strong rounded-md text-sm bg-surface text-text placeholder:text-text-muted/50"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => {
                setManualPlayerFilters({
                  name: '',
                  team: '',
                  nationality: '',
                  minAge: '',
                  maxAge: '',
                  position: ''
                });
              }}
              className="py-2 px-4 bg-white/8 border border-border-strong text-text rounded-md text-xs cursor-pointer w-full hover:bg-white/15 transition-colors"
            >
              Limpiar
            </button>

            <button
              onClick={loadManualPlayers}
              className="py-2 px-4 bg-accent hover:bg-accent-dark text-white rounded-md text-xs cursor-pointer w-full transition-colors"
            >
              Recargar
            </button>
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="mb-4 text-[11px] text-text-muted">
          Mostrando {filteredManualPlayers.length} de {manualPlayers.length} jugadores
        </div>
      </div>

      {/* Lista de jugadores */}
      {loadingManualPlayers ? (
        <div className="text-center py-12">
          <div className="text-sm mb-2 text-text-muted animate-pulse">...</div>
          <p className="text-text-muted text-sm">Cargando jugadores...</p>
        </div>
      ) : filteredManualPlayers.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <p className="text-sm">
            {manualPlayers.length === 0
              ? "No hay jugadores creados manualmente todavia"
              : "No se encontraron jugadores con estos filtros"}
          </p>
          <p className="text-sm mt-1">Usa el boton "Agregar Jugador" para crear uno.</p>
        </div>
      ) : (
        <div>
          {filteredManualPlayers.map((player) => (
            <div
              key={player.id || player.manual_id}
              className="bg-card border-b border-border-strong py-4 px-4 flex justify-between items-center transition-colors hover:bg-card-hover"
            >
              <div className="flex items-center gap-5">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-accent-muted flex items-center justify-center text-accent font-medium text-sm">
                  {player.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>

                {/* Info del jugador */}
                <div>
                  <h3 className="text-sm font-medium m-0 text-text">
                    {player.name}
                  </h3>
                  <div className="flex gap-3 mt-1.5 items-center">
                    {player.position && (
                      <span className="text-[11px] px-2 py-0.5 bg-accent/10 text-accent rounded font-medium">
                        {player.position}
                      </span>
                    )}
                    {player.age && (
                      <span className="text-[13px] text-text-muted">
                        {player.age} anos
                      </span>
                    )}
                    {(player.passport_area || player.birth_area) && (
                      <span className="text-[13px] text-text-muted">
                        {player.passport_area || player.birth_area}
                      </span>
                    )}
                  </div>
                  {player.current_team_name && (
                    <p className="mt-1.5 mb-0 text-[13px] text-text-muted">
                      {player.current_team_name}
                      {player.current_team_area && ` (${player.current_team_area})`}
                    </p>
                  )}
                </div>
              </div>

              {/* Botones de accion */}
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openReportForm({
                      id: player.manual_id || player.id,
                      name: player.name,
                      position: player.position || '',
                      team: player.current_team_name || '',
                      wyscout_id: undefined
                    });
                  }}
                  className="px-3 py-1.5 rounded-md text-xs text-white bg-accent hover:bg-accent-dark border-none cursor-pointer transition-colors"
                >
                  Crear Reporte
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openMarketModal(player);
                  }}
                  className="px-3 py-1.5 rounded-md text-xs text-text-secondary bg-white/8 border border-border cursor-pointer hover:bg-white/15 transition-colors"
                >
                  A Mercado
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManualPlayersTab;
