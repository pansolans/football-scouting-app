import React, { useState, useEffect } from 'react';
import { reportBuilderService } from '../../services/reportBuilderService';
import { BuilderReport } from './types';

interface Props {
  onEdit: (id: string) => void;
  onNew: () => void;
}

const ReportList: React.FC<Props> = ({ onEdit, onNew }) => {
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
