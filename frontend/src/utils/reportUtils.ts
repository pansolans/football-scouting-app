import { ScoutReport } from '../types';

export const calculateAverageScore = (reports: ScoutReport[]) => {
  if (!reports || !Array.isArray(reports) || reports.length === 0) return '0';
  const sum = reports.reduce((acc, report) => acc + report.overall_rating, 0);
  return (sum / reports.length).toFixed(1);
};

export const getLatestRecommendation = (reports: ScoutReport[]) => {
  if (reports.length === 0) return null;
  const sortedReports = [...reports].sort((a, b) => {
    const dateA = new Date(a.fecha_observacion || a.created_at).getTime();
    const dateB = new Date(b.fecha_observacion || b.created_at).getTime();
    return dateB - dateA;
  });
  return sortedReports[0].recomendacion;
};

export const calculateCategoryAverages = (reports: ScoutReport[]) => {
  if (!reports || !Array.isArray(reports) || reports.length === 0) {
    return { technical: '0', physical: '0', mental: '0' };
  }

  const technical = reports.reduce((acc, report) => {
    const techSum = (report.tecnica_individual + report.pase + report.primer_toque +
      report.control_balon + report.vision_juego) / 5;
    return acc + techSum;
  }, 0) / reports.length;

  const physical = reports.reduce((acc, report) => {
    const physSum = (report.velocidad + report.resistencia + report.fuerza +
      report.salto + report.agilidad) / 5;
    return acc + physSum;
  }, 0) / reports.length;

  const mental = reports.reduce((acc, report) => {
    const mentSum = (report.inteligencia_tactica + report.posicionamiento +
      report.concentracion + report.liderazgo + report.trabajo_equipo) / 5;
    return acc + mentSum;
  }, 0) / reports.length;

  return {
    technical: technical.toFixed(1),
    physical: physical.toFixed(1),
    mental: mental.toFixed(1)
  };
};

export const getRatingColor = (rating: number) => {
  if (rating >= 8) return '#10b981';
  if (rating >= 6) return '#f59e0b';
  if (rating >= 4) return '#ef4444';
  return '#6b7280';
};

export const getPositionColor = (position: string) => {
  const pos = position?.toLowerCase() || '';
  if (pos.includes('goalkeeper')) return '#dc2626';
  if (pos.includes('defender')) return '#3b82f6';
  if (pos.includes('midfielder')) return '#10b981';
  if (pos.includes('forward') || pos.includes('striker')) return '#f59e0b';
  return '#6b7280';
};

export const getRecommendationColor = (rec: string | undefined) => {
  if (!rec) return '#6b7280';
  const r = rec.toLowerCase();
  if (r === 'comprar') return '#10b981';
  if (r === 'seguir') return '#3b82f6';
  return '#ef4444';
};
