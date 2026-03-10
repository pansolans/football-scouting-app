import React from 'react';
import { Player } from '../services/api';
import { getPositionColor } from '../utils/reportUtils';

interface QuickSearchTabProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loading: boolean;
  searchResults: any[];
  setSelectedTeam: (id: number) => void;
  setActiveTab: (tab: any) => void;
  viewPlayerProfile: (playerId: number) => void;
  openReportForm: (player: Player) => void;
  openMarketModal: (player: any) => void;
  setPreselectedPlayer: (player: any) => void;
}

const QuickSearchTab: React.FC<QuickSearchTabProps> = ({
  searchQuery,
  setSearchQuery,
  loading,
  searchResults,
  setSelectedTeam,
  setActiveTab,
  viewPlayerProfile,
  openReportForm,
  openMarketModal,
  setPreselectedPlayer,
}) => {
  return (
    <div className="grid gap-6 animate-fade-in">
      {/* Search Hero */}
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

        <div className="relative z-10 p-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-xs uppercase tracking-[0.2em] text-accent font-medium">Busqueda</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            <span className="text-gradient-hero">Busqueda Rapida</span>
          </h2>
          <p className="text-text-muted text-sm mb-5">Busca equipos o jugadores en la base de datos de Wyscout</p>

          <div className="relative max-w-2xl">
            <input
              type="text"
              placeholder="Buscar equipos o jugadores... (ej: 'Barcelona', 'Messi')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3.5 px-5 bg-card/80 backdrop-blur border border-border-strong rounded-xl text-sm text-text placeholder:text-text-muted focus:border-accent/50 focus:outline-none transition-colors glow-card"
            />
            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin-slow" />
              </div>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="text-sm mb-2 text-text-muted animate-pulse inline-block">Loading</div>
          <p className="text-text-muted text-sm">Searching...</p>
        </div>
      )}

      {!loading && searchResults.length > 0 && (
        <div className="grid gap-2">
          {searchResults.map((result: any) => (
            <div
              key={`${result.type}-${result.id}`}
              className="bg-card rounded-lg p-4 border border-border-strong hover:border-accent/30 transition-colors cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {result.type === 'team' ? (
                    <>
                      {result.imageDataURL ? (
                        <img
                          src={result.imageDataURL}
                          alt={result.name}
                          className="w-10 h-10 object-contain rounded-lg bg-white/5"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-accent-muted rounded-lg flex items-center justify-center text-xs text-accent font-medium">
                          {result.name?.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-text">
                            {result.name}
                          </h3>
                          <span className="bg-white/10 text-text-secondary rounded text-[11px] px-2 py-0.5 font-medium">
                            TEAM
                          </span>
                        </div>
                        <p className="text-[13px] text-text-muted mt-0.5">
                          {result.area?.name || 'International'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      {result.imageDataURL ? (
                        <img
                          src={result.imageDataURL}
                          alt={result.name}
                          className="w-10 h-10 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-accent-muted rounded-full flex items-center justify-center text-xs text-accent font-medium border border-border">
                          {result.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-text">
                            {result.name}
                          </h3>
                          <span className="bg-white/10 text-text-secondary rounded text-[11px] px-2 py-0.5 font-medium">
                            {result.position || 'PLAYER'}
                          </span>
                        </div>
                        <div className="flex gap-3 text-[13px] text-text-muted mt-0.5">
                          <span>{result.team || 'Free Agent'}</span>
                          {result.age && <span>Age: {result.age}</span>}
                          {result.nationality && <span>{result.nationality}</span>}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-1.5">
                  {result.type === 'team' ? (
                    <button
                      onClick={() => {
                        setSelectedTeam(result.id);
                        setActiveTab('browse');
                      }}
                      className="px-3 py-1.5 rounded-md text-xs font-medium bg-accent hover:bg-accent-dark text-white transition-colors active:scale-95"
                    >
                      View Squad
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => viewPlayerProfile(result.wyscout_id || result.id)}
                        className="px-3 py-1.5 rounded-md text-xs font-medium bg-accent hover:bg-accent-dark text-white transition-colors active:scale-95"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={() => openReportForm(result)}
                        className="px-3 py-1.5 rounded-md text-xs font-medium bg-white/8 border border-border text-text-secondary hover:bg-white/12 hover:text-text transition-colors active:scale-95"
                      >
                        Create Report
                      </button>
                      <button
                        onClick={() => openMarketModal(result)}
                        className="px-3 py-1.5 rounded-md text-xs font-medium bg-white/8 border border-border text-text-secondary hover:bg-white/12 hover:text-text transition-colors active:scale-95"
                      >
                        A Mercado
                      </button>
                      <button
                        onClick={() => {
                          setPreselectedPlayer(result);
                          setActiveTab('player-profiles');
                        }}
                        className="px-3 py-1.5 rounded-md text-xs font-medium bg-white/8 border border-border text-text-secondary hover:bg-white/12 hover:text-text transition-colors active:scale-95"
                      >
                        Perfil Scouting
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuickSearchTab;
