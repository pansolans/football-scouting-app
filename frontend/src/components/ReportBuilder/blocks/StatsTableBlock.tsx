import React from 'react';
import { ScoutReport } from '../../../services/api';

interface Props {
  reports: ScoutReport[];
  readOnly?: boolean;
}

const CATEGORIES = {
  tecnico: {
    label: 'Tecnico',
    fields: ['tecnica_individual', 'pase', 'primer_toque', 'control_balon', 'vision_juego'],
    labels: ['Tecnica', 'Pase', 'Primer Toque', 'Control', 'Vision'],
  },
  fisico: {
    label: 'Fisico',
    fields: ['velocidad', 'resistencia', 'fuerza', 'salto', 'agilidad'],
    labels: ['Velocidad', 'Resistencia', 'Fuerza', 'Salto', 'Agilidad'],
  },
  mental: {
    label: 'Mental',
    fields: ['inteligencia_tactica', 'posicionamiento', 'concentracion', 'liderazgo', 'trabajo_equipo'],
    labels: ['Tactica', 'Posicionamiento', 'Concentracion', 'Liderazgo', 'Trabajo Eq.'],
  },
};

const getRatingColor = (v: number) => {
  if (v >= 8) return 'text-accent';
  if (v >= 6) return 'text-amber-400';
  return 'text-red-400';
};

const getRatingBg = (v: number) => {
  if (v >= 8) return 'bg-accent/15';
  if (v >= 6) return 'bg-amber-500/15';
  return 'bg-red-500/15';
};

const StatsTableBlock: React.FC<Props> = ({ reports, readOnly }) => {
  if (reports.length === 0) {
    return (
      <div className="p-6 border border-dashed border-border-strong rounded-xl text-center">
        <p className="text-text-muted text-sm">Selecciona un jugador para ver sus estadisticas</p>
      </div>
    );
  }

  const avg = (field: string) => {
    const vals = reports.map(r => (r as any)[field]).filter((v: any) => typeof v === 'number');
    return vals.length > 0 ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0;
  };

  const overallAvg = avg('overall_rating');

  // Radar chart SVG
  const allFields = Object.values(CATEGORIES).flatMap(c => c.fields);
  const allLabels = Object.values(CATEGORIES).flatMap(c => c.labels);
  const values = allFields.map(f => avg(f));
  const cx = 150, cy = 150, r = 120;
  const n = values.length;

  const getPoint = (i: number, val: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const dist = (val / 10) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  };

  const polygonPoints = values.map((v, i) => {
    const p = getPoint(i, v);
    return `${p.x},${p.y}`;
  }).join(' ');

  const gridLevels = [2, 4, 6, 8, 10];

  return (
    <div className="space-y-6">
      {/* Overall Rating */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-border-strong">
        <div className={`text-4xl font-bold ${getRatingColor(overallAvg)}`}>
          {overallAvg.toFixed(1)}
        </div>
        <div>
          <div className="text-sm font-semibold text-text">Rating General</div>
          <div className="text-xs text-text-muted">Promedio de {reports.length} reporte{reports.length > 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="flex justify-center">
        <svg width="300" height="300" viewBox="0 0 300 300">
          {/* Grid */}
          {gridLevels.map(level => {
            const pts = Array.from({ length: n }, (_, i) => {
              const p = getPoint(i, level);
              return `${p.x},${p.y}`;
            }).join(' ');
            return <polygon key={level} points={pts} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
          })}
          {/* Axis lines */}
          {Array.from({ length: n }, (_, i) => {
            const p = getPoint(i, 10);
            return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
          })}
          {/* Data polygon */}
          <polygon points={polygonPoints} fill="rgba(16,185,129,0.15)" stroke="#10b981" strokeWidth="2" />
          {/* Data points */}
          {values.map((v, i) => {
            const p = getPoint(i, v);
            return <circle key={i} cx={p.x} cy={p.y} r="4" fill="#10b981" />;
          })}
          {/* Labels */}
          {allLabels.map((label, i) => {
            const p = getPoint(i, 12);
            return (
              <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill="#a1a1aa" fontSize="8">
                {label}
              </text>
            );
          })}
        </svg>
      </div>

    </div>
  );
};

export default StatsTableBlock;
