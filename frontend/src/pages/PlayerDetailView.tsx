import React from 'react';
import { ScoutReport } from '../types';
import { calculateAverageScore, getLatestRecommendation, calculateCategoryAverages, getRatingColor } from '../utils/reportUtils';

interface PlayerDetailViewProps {
  playerName: string;
  reports: ScoutReport[];
  onClose: () => void;
}

const PlayerDetailView: React.FC<PlayerDetailViewProps> = ({ playerName, reports, onClose }) => {
  const averages = calculateCategoryAverages(reports);
  const overallAverage = calculateAverageScore(reports);
  const latestRecommendation = getLatestRecommendation(reports);

  const getRecommendationClass = (rec: string | undefined | null) => {
    if (rec === 'comprar') return 'bg-accent/15 text-accent';
    if (rec === 'seguir') return 'bg-blue-500/15 text-blue-400';
    return 'bg-red-500/15 text-red-400';
  };

  return (
    <div className="min-h-screen bg-surface p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <button
            onClick={onClose}
            className="bg-white/8 border border-border-strong text-text-secondary text-sm rounded-md px-4 py-2 cursor-pointer mb-4"
          >
            Volver a Mis Reportes
          </button>

          <h1 className="text-2xl font-semibold text-text tracking-tight">
            {playerName} — Analisis Completo
          </h1>
          <p className="text-base text-text-muted">
            Promedio General: <strong className="font-mono" style={{ color: getRatingColor(Number(overallAverage)) }}>
              {overallAverage}/10
            </strong> ({reports.length} evaluacion{reports.length !== 1 ? 'es' : ''})
          </p>
        </div>
        <p className="text-sm mt-2 text-text-muted">
          Recomendacion Actual:
          <span className={`rounded-md text-[11px] font-medium px-3 py-1 ml-2 ${getRecommendationClass(latestRecommendation)}`}>
            {latestRecommendation?.toUpperCase() || 'N/A'}
          </span>
        </p>

        {/* Category Averages */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-elevated border border-border-strong border-l-2 border-l-blue-400 rounded-lg p-6 text-center">
            <h3 className="text-[11px] uppercase tracking-widest text-text-muted mb-2">Tecnica</h3>
            <p className="font-mono text-2xl font-semibold text-blue-400">{averages.technical}/10</p>
          </div>
          <div className="bg-elevated border border-border-strong border-l-2 border-l-accent rounded-lg p-6 text-center">
            <h3 className="text-[11px] uppercase tracking-widest text-text-muted mb-2">Fisica</h3>
            <p className="font-mono text-2xl font-semibold text-accent">{averages.physical}/10</p>
          </div>
          <div className="bg-elevated border border-border-strong border-l-2 border-l-amber-400 rounded-lg p-6 text-center">
            <h3 className="text-[11px] uppercase tracking-widest text-text-muted mb-2">Mental</h3>
            <p className="font-mono text-2xl font-semibold text-amber-400">{averages.mental}/10</p>
          </div>
        </div>

        {/* Evolution chart */}
        {reports.length > 1 && (
          <div className="bg-elevated border border-border-strong rounded-lg p-6 mb-8">
            <h3 className="text-sm font-medium text-text mb-4">Evolucion de Calificaciones</h3>
            <div className="flex items-end gap-4 h-[200px]">
              {reports.map((report, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full rounded-t-lg flex items-start justify-center pt-2"
                    style={{
                      background: getRatingColor(report.overall_rating),
                      height: `${(report.overall_rating / 10) * 180}px`,
                    }}
                  >
                    <span className="font-mono text-sm font-semibold text-white">{report.overall_rating}/10</span>
                  </div>
                  <small className="mt-2 text-center text-text-muted text-[11px]">
                    {report.fecha_observacion ? new Date(report.fecha_observacion).toLocaleDateString() : 'N/A'}
                  </small>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Individual reports */}
        <div>
          <h3 className="text-sm font-medium text-text mb-4">Reportes Individuales</h3>
          {reports.map((report, index) => (
            <div key={index} className="bg-elevated border border-border-strong rounded-lg p-6 mb-4">
              <div className="flex justify-between mb-4">
                <div>
                  <h4 className="m-0 text-sm font-medium text-text">
                    {report.fecha_observacion ? new Date(report.fecha_observacion).toLocaleDateString() : 'N/A'} | {report.competicion || 'N/A'}
                  </h4>
                  <p className="my-2 text-text-muted">
                    Overall: <strong className="font-mono text-sm" style={{ color: getRatingColor(report.overall_rating) }}>
                      {report.overall_rating}/10
                    </strong>
                  </p>
                </div>
                {report.recomendacion && (
                  <span className={`rounded-md text-[11px] font-medium px-3 py-1 h-fit ${getRecommendationClass(report.recomendacion)}`}>
                    {report.recomendacion.toUpperCase()}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 text-text-muted">
                <div>
                  <strong className="font-mono text-sm text-text">Tecnica:</strong> <span className="font-mono text-sm">{
                    Math.round((report.tecnica_individual + report.pase + report.primer_toque +
                      report.control_balon + report.vision_juego) / 5)
                  }/10</span>
                </div>
                <div>
                  <strong className="font-mono text-sm text-text">Fisica:</strong> <span className="font-mono text-sm">{
                    Math.round((report.velocidad + report.resistencia + report.fuerza +
                      report.salto + report.agilidad) / 5)
                  }/10</span>
                </div>
                <div>
                  <strong className="font-mono text-sm text-text">Mental:</strong> <span className="font-mono text-sm">{
                    Math.round((report.inteligencia_tactica + report.posicionamiento +
                      report.concentracion + report.liderazgo + report.trabajo_equipo) / 5)
                  }/10</span>
                </div>
              </div>

              {report.fortalezas && (
                <div className="mb-2">
                  <strong className="text-[11px] uppercase tracking-widest font-medium text-text">Fortalezas:</strong>{' '}
                  <span className="text-[13px] text-text-secondary">{report.fortalezas}</span>
                </div>
              )}

              {report.debilidades && (
                <div className="mb-2">
                  <strong className="text-[11px] uppercase tracking-widest font-medium text-text">Debilidades:</strong>{' '}
                  <span className="text-[13px] text-text-secondary">{report.debilidades}</span>
                </div>
              )}

              {report.notes && (
                <div className="bg-elevated rounded-md border border-border-strong p-4 mt-4">
                  <strong className="text-[11px] uppercase tracking-widest font-medium text-text">Notas</strong>
                  <p className="text-[13px] text-text-secondary mt-1 m-0">{report.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlayerDetailView;
