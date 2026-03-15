import React, { useState, useEffect } from 'react';
import { reportBuilderService } from '../../services/reportBuilderService';
import { BuilderReport } from './types';

interface Props {
  onEdit: (id: string) => void;
  onNew: () => void;
  pendingPlayers?: { name: string; id: string; count: number }[];
  onCreateInforme?: (playerId: string, playerName: string) => void;
}

const ReportList: React.FC<Props> = ({ onEdit, onNew, pendingPlayers = [], onCreateInforme }) => {
  const [reports, setReports] = useState<BuilderReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await reportBuilderService.list(false);
      setReports(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Eliminar este informe?')) return;
    try {
      await reportBuilderService.delete(id);
      setReports(prev => prev.filter(r => r.id !== id));
    } catch (e) { alert('Error al eliminar'); }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border-strong mb-6">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: 'url(/images/football-dark.jpg)', backgroundSize: 'cover', backgroundPosition: 'center 30%', opacity: 0.45 }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface/70 via-surface/30 to-transparent" />
        <div className="relative z-10 px-8 py-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-xs uppercase tracking-[0.2em] text-accent font-medium">Editor Visual</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">
              <span className="text-gradient-hero">Informes Profesionales</span>
            </h2>
            <p className="text-text-secondary text-sm mt-1">Crea informes visuales con imagenes, videos y estadisticas</p>
          </div>
          <button
            onClick={onNew}
            className="px-6 py-3 bg-accent hover:bg-accent-dark text-white rounded-xl cursor-pointer font-semibold text-sm transition-colors glow-accent border-none"
          >
            + Nuevo Informe
          </button>
        </div>
      </div>

      {/* Pending / Completed informes */}
      {!loading && (pendingPlayers.length > 0 || reports.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Pending */}
          {pendingPlayers.length > 0 && (
            <div className="bg-card border border-accent/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <h4 className="text-sm font-semibold text-text m-0">Informes Pendientes</h4>
                <span className="text-[11px] bg-amber-500/15 text-amber-400 font-medium px-2 py-0.5 rounded-full ml-auto">
                  {pendingPlayers.length}
                </span>
              </div>
              <div className="space-y-2">
                {pendingPlayers.map(p => (
                  <div
                    key={p.name}
                    onClick={() => onCreateInforme?.(p.id, p.name)}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] hover:bg-accent/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-400 text-[10px] font-bold">
                        {p.name?.charAt(0)}
                      </div>
                      <span className="text-sm text-text">{p.name}</span>
                      <span className="text-[11px] text-text-muted">{p.count} visorias</span>
                    </div>
                    <span className="text-[11px] font-medium text-accent">Crear</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {reports.length > 0 && (
            <div className="bg-card border border-border-strong rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <h4 className="text-sm font-semibold text-text m-0">Informes Realizados</h4>
                <span className="text-[11px] bg-accent/15 text-accent font-medium px-2 py-0.5 rounded-full ml-auto">
                  {reports.length}
                </span>
              </div>
              <div className="space-y-2">
                {reports.slice(0, 5).map(r => (
                  <div
                    key={r.id}
                    onClick={() => r.id && onEdit(r.id)}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center text-accent text-[10px] font-bold">
                        {(r.player_name || r.title)?.charAt(0)}
                      </div>
                      <span className="text-sm text-text">{r.player_name || r.title}</span>
                    </div>
                    <span className="text-[11px] text-text-muted">
                      {r.updated_at ? new Date(r.updated_at).toLocaleDateString('es-ES') : ''}
                    </span>
                  </div>
                ))}
                {reports.length > 5 && (
                  <p className="text-[11px] text-text-muted text-center m-0 pt-1">y {reports.length - 5} mas...</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reports Grid */}
      {loading ? (
        <div className="text-center py-12 text-text-muted">Cargando informes...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 card-elevated rounded-2xl">
          <div className="text-4xl mb-4 opacity-50">📋</div>
          <p className="text-text-secondary text-lg mb-2">No hay informes creados</p>
          <p className="text-text-muted text-sm mb-6">Crea tu primer informe profesional con el editor visual</p>
          <button
            onClick={onNew}
            className="px-6 py-3 bg-accent hover:bg-accent-dark text-white rounded-xl cursor-pointer font-semibold text-sm transition-colors border-none"
          >
            Crear Informe
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map(report => (
            <div
              key={report.id}
              className="card-elevated rounded-xl overflow-hidden hover-lift cursor-pointer group"
              onClick={() => report.id && onEdit(report.id)}
            >
              {/* Mini cover preview */}
              <div className="h-32 relative bg-gradient-to-br from-accent/15 via-surface to-info/10 p-5">
                {report.cover_data?.playerPhoto && (
                  <>
                    <div
                      className="absolute inset-0"
                      style={{ backgroundImage: `url(${report.cover_data.playerPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.2 }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d10] to-transparent" />
                  </>
                )}
                <div className="relative z-10 h-full flex flex-col justify-end">
                  <h3 className="text-base font-bold text-text truncate">{report.title}</h3>
                  {report.player_name && (
                    <p className="text-xs text-text-secondary mt-0.5">{report.player_name}</p>
                  )}
                </div>
              </div>

              {/* Meta */}
              <div className="p-4 flex items-center justify-between">
                <div className="text-xs text-text-muted">
                  {report.blocks?.length || 0} bloques
                  {report.updated_at && (
                    <span className="ml-2">{new Date(report.updated_at).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); report.id && handleDelete(report.id); }}
                    className="px-2 py-1 bg-danger/15 text-danger rounded text-xs cursor-pointer border-none hover:bg-danger/25 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportList;
