import React from 'react';
import { Player } from '../services/api';

interface PlayerProfileTabProps {
  loadingProfile: boolean;
  playerProfile: any;
  setActiveTab: (tab: any) => void;
  openReportForm: (player: Player) => void;
}

const formatMoney = (value: number | null | undefined, currency: string = 'EUR') => {
  if (!value && value !== 0) return 'No disponible';
  if (value >= 1000000) return `${currency} ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${currency} ${(value / 1000).toFixed(0)}K`;
  return `${currency} ${value.toLocaleString()}`;
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'No disponible';
  try {
    return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const calculateAge = (birthDate: string | null | undefined) => {
  if (!birthDate) return null;
  try {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  } catch {
    return null;
  }
};

const getContractStatusInfo = (expiresDate: string | null | undefined) => {
  if (!expiresDate) return { text: 'Desconocido', color: 'bg-white/10 text-text-secondary', months: null };
  const months = Math.ceil((new Date(expiresDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30));
  if (months <= 0) return { text: 'Expirado', color: 'bg-red-500/15 text-red-400', months };
  if (months <= 6) return { text: 'Expira pronto', color: 'bg-red-500/15 text-red-400', months };
  if (months <= 12) return { text: 'Ultimo año', color: 'bg-amber-500/15 text-amber-400', months };
  if (months <= 24) return { text: 'Bajo contrato', color: 'bg-accent/15 text-accent', months };
  return { text: 'Contrato largo', color: 'bg-accent/15 text-accent', months };
};

const PlayerProfileTab: React.FC<PlayerProfileTabProps> = ({
  loadingProfile,
  playerProfile,
  setActiveTab,
  openReportForm,
}) => {
  const info = playerProfile?.basic_info;
  const contract = playerProfile?.contract_info;
  const career = playerProfile?.career;
  const transfers = playerProfile?.transfers;

  // Compute career totals
  const careerTotals = career?.reduce((acc: any, e: any) => ({
    appearances: (acc.appearances || 0) + (e.appearances || 0),
    goals: (acc.goals || 0) + (e.goals || 0),
    assists: (acc.assists || 0) + (e.assists || 0),
    minutes: (acc.minutes || 0) + (e.minutes_played || 0),
    yellowCards: (acc.yellowCards || 0) + (e.yellow_cards || 0),
    redCards: (acc.redCards || 0) + (e.red_cards || 0),
  }), {});

  return (
    <div>
      {loadingProfile ? (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin-slow mb-4"></div>
          <p className="text-text-muted text-sm">Cargando perfil del jugador...</p>
        </div>
      ) : playerProfile ? (
        <div className="space-y-6 animate-fade-in">
          {/* Back button */}
          <button
            onClick={() => setActiveTab('quick-search')}
            className="px-4 py-2 bg-white/8 border border-border-strong text-text-secondary hover:text-text text-sm rounded-md cursor-pointer"
          >
            Volver a Busqueda
          </button>

          {/* === PLAYER HEADER === */}
          <div className="bg-card border border-border-strong rounded-lg overflow-hidden">
            <div className="p-6 flex gap-6">
              {/* Photo */}
              <div className="shrink-0">
                {info?.imageDataURL ? (
                  <img
                    src={info.imageDataURL}
                    alt={info.shortName}
                    className="w-28 h-28 rounded-xl object-cover border border-border-strong"
                  />
                ) : (
                  <div className="w-28 h-28 bg-accent-muted rounded-xl flex items-center justify-center text-3xl text-accent font-bold border border-border-strong">
                    {info?.shortName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-semibold text-text tracking-tight">
                      {info?.shortName || 'Jugador Desconocido'}
                    </h1>
                    {info?.firstName && info?.lastName && info.shortName !== `${info.firstName} ${info.lastName}` && (
                      <p className="text-sm text-text-secondary mt-0.5">
                        {info.firstName} {info.middleName ? info.middleName + ' ' : ''}{info.lastName}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => openReportForm({
                      id: String(info?.wyId || ''),
                      name: info?.shortName || '',
                      position: info?.role?.name || '',
                      team: contract?.team || info?.currentTeam?.name || 'Sin equipo',
                      wyscout_id: info?.wyId
                    })}
                    className="shrink-0 px-5 py-2.5 bg-accent hover:bg-accent-dark text-white text-sm font-medium rounded-md cursor-pointer border-none transition-colors"
                  >
                    Crear Reporte
                  </button>
                </div>

                {/* Tags row */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {info?.role?.name && (
                    <span className="bg-accent/15 text-accent text-xs font-medium px-2.5 py-1 rounded-md">
                      {info.role.name}
                    </span>
                  )}
                  {info?.currentTeam?.name && (
                    <span className="bg-white/8 text-text-secondary text-xs px-2.5 py-1 rounded-md">
                      {info.currentTeam.name}
                    </span>
                  )}
                  {contract?.loan && (
                    <span className="bg-amber-500/15 text-amber-400 text-xs font-medium px-2.5 py-1 rounded-md">
                      Cedido{contract.loan_from ? ` de ${contract.loan_from}` : ''}
                    </span>
                  )}
                  {info?.passportArea?.name && (
                    <span className="bg-white/8 text-text-secondary text-xs px-2.5 py-1 rounded-md">
                      {info.passportArea.alpha3code || info.passportArea.name}
                    </span>
                  )}
                  {info?.status && info.status !== 'active' && (
                    <span className="bg-red-500/15 text-red-400 text-xs px-2.5 py-1 rounded-md">
                      {info.status}
                    </span>
                  )}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
                  {calculateAge(info?.birthDate) && (
                    <div>
                      <div className="text-[11px] uppercase tracking-widest text-text-muted">Edad</div>
                      <div className="text-sm font-medium text-text">{calculateAge(info?.birthDate)} años</div>
                    </div>
                  )}
                  {info?.birthDate && (
                    <div>
                      <div className="text-[11px] uppercase tracking-widest text-text-muted">Nacimiento</div>
                      <div className="text-sm font-medium text-text">{formatDate(info.birthDate)}</div>
                    </div>
                  )}
                  {info?.height && (
                    <div>
                      <div className="text-[11px] uppercase tracking-widest text-text-muted">Altura</div>
                      <div className="text-sm font-medium text-text">{info.height} cm</div>
                    </div>
                  )}
                  {info?.weight && (
                    <div>
                      <div className="text-[11px] uppercase tracking-widest text-text-muted">Peso</div>
                      <div className="text-sm font-medium text-text">{info.weight} kg</div>
                    </div>
                  )}
                  {info?.foot && (
                    <div>
                      <div className="text-[11px] uppercase tracking-widest text-text-muted">Pie</div>
                      <div className="text-sm font-medium text-text capitalize">{info.foot === 'right' ? 'Derecho' : info.foot === 'left' ? 'Izquierdo' : 'Ambidiestro'}</div>
                    </div>
                  )}
                  {contract?.jersey_number && (
                    <div>
                      <div className="text-[11px] uppercase tracking-widest text-text-muted">Dorsal</div>
                      <div className="text-sm font-medium text-text">#{contract.jersey_number}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* === INFO CARDS ROW === */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Market Value Card */}
            <div className="bg-card border border-border-strong rounded-lg p-5">
              <div className="text-[11px] uppercase tracking-widest text-text-muted mb-2">Valor de Mercado</div>
              <div className="text-2xl font-mono font-semibold text-accent">
                {formatMoney(contract?.market_value, contract?.market_value_currency)}
              </div>
            </div>

            {/* Contract Card */}
            <div className="bg-card border border-border-strong rounded-lg p-5">
              <div className="text-[11px] uppercase tracking-widest text-text-muted mb-2">Contrato</div>
              <div className="text-sm font-medium text-text mb-1.5">
                {contract?.contract_expires ? `Hasta ${formatDate(contract.contract_expires)}` : 'No disponible'}
              </div>
              {contract?.contract_expires && (() => {
                const status = getContractStatusInfo(contract.contract_expires);
                return (
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${status.color}`}>
                    {status.text}{status.months !== null ? ` (${status.months} meses)` : ''}
                  </span>
                );
              })()}
            </div>

            {/* Agent Card */}
            <div className="bg-card border border-border-strong rounded-lg p-5">
              <div className="text-[11px] uppercase tracking-widest text-text-muted mb-2">Agente</div>
              <div className="text-sm font-medium text-text">
                {contract?.agent || 'No disponible'}
              </div>
              {contract?.wage && (
                <div className="mt-2">
                  <div className="text-[11px] uppercase tracking-widest text-text-muted mb-1">Salario</div>
                  <div className="text-sm font-mono text-text-secondary">{formatMoney(contract.wage)}/año</div>
                </div>
              )}
            </div>
          </div>

          {/* === CAREER TOTALS === */}
          {careerTotals && careerTotals.appearances > 0 && (
            <div className="bg-card border border-border-strong rounded-lg p-5">
              <h2 className="text-sm font-medium text-text tracking-tight mb-4">Resumen de Carrera</h2>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="font-mono text-2xl font-semibold text-text">{careerTotals.appearances}</div>
                  <div className="text-[11px] uppercase tracking-widest text-text-muted mt-1">Partidos</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-2xl font-semibold text-accent">{careerTotals.goals}</div>
                  <div className="text-[11px] uppercase tracking-widest text-text-muted mt-1">Goles</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-2xl font-semibold text-text">{careerTotals.assists}</div>
                  <div className="text-[11px] uppercase tracking-widest text-text-muted mt-1">Asistencias</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-2xl font-semibold text-text">{careerTotals.minutes?.toLocaleString()}</div>
                  <div className="text-[11px] uppercase tracking-widest text-text-muted mt-1">Minutos</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-2xl font-semibold text-amber-400">{careerTotals.yellowCards}</div>
                  <div className="text-[11px] uppercase tracking-widest text-text-muted mt-1">Amarillas</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-2xl font-semibold text-red-400">{careerTotals.redCards}</div>
                  <div className="text-[11px] uppercase tracking-widest text-text-muted mt-1">Rojas</div>
                </div>
              </div>
            </div>
          )}

          {/* === CAREER TIMELINE === */}
          {career && career.length > 0 && (
            <div className="bg-card border border-border-strong rounded-lg p-5">
              <h2 className="text-sm font-medium text-text tracking-tight mb-4">
                Historial de Carrera ({career.length} temporadas)
              </h2>

              {/* Table header */}
              <div className="hidden md:grid grid-cols-[140px_1fr_120px_60px_60px_60px_60px_60px_80px] gap-2 px-3 py-2 text-[11px] uppercase tracking-widest text-text-muted border-b border-border">
                <div>Temporada</div>
                <div>Equipo / Competicion</div>
                <div>Dorsal</div>
                <div className="text-center">PJ</div>
                <div className="text-center">G</div>
                <div className="text-center">A</div>
                <div className="text-center">TA</div>
                <div className="text-center">TR</div>
                <div className="text-right">Minutos</div>
              </div>

              {/* Table rows */}
              <div className="divide-y divide-border">
                {career.map((entry: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-[140px_1fr_120px_60px_60px_60px_60px_60px_80px] gap-2 px-3 py-3 hover:bg-white/[0.02] items-center">
                    {/* Season */}
                    <div>
                      <span className="text-xs font-mono font-medium text-accent">{entry.period}</span>
                    </div>

                    {/* Team & Competition */}
                    <div>
                      <div className="text-sm font-medium text-text">{entry.team_name}</div>
                      <div className="text-[11px] text-text-muted">{entry.competition}</div>
                    </div>

                    {/* Shirt number */}
                    <div className="text-sm text-text-secondary">
                      {entry.shirt_number ? `#${entry.shirt_number}` : '-'}
                    </div>

                    {/* Appearances */}
                    <div className="text-center font-mono text-sm text-text">{entry.appearances}</div>

                    {/* Goals */}
                    <div className="text-center font-mono text-sm text-text font-medium">
                      {entry.goals > 0 ? entry.goals : '-'}
                    </div>

                    {/* Assists */}
                    <div className="text-center font-mono text-sm text-text">
                      {entry.assists > 0 ? entry.assists : '-'}
                    </div>

                    {/* Yellow cards */}
                    <div className="text-center font-mono text-sm text-amber-400">
                      {entry.yellow_cards > 0 ? entry.yellow_cards : '-'}
                    </div>

                    {/* Red cards */}
                    <div className="text-center font-mono text-sm text-red-400">
                      {entry.red_cards > 0 ? entry.red_cards : '-'}
                    </div>

                    {/* Minutes */}
                    <div className="text-right font-mono text-sm text-text-secondary">
                      {entry.minutes_played?.toLocaleString() || '0'}'
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === TRANSFER HISTORY === */}
          {transfers && transfers.length > 0 && (
            <div className="bg-card border border-border-strong rounded-lg p-5">
              <h2 className="text-sm font-medium text-text tracking-tight mb-4">
                Historial de Traspasos ({transfers.length})
              </h2>

              <div className="space-y-3">
                {transfers.map((t: any, idx: number) => (
                  <div key={idx} className="bg-elevated border border-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Date */}
                    <div className="shrink-0 w-24">
                      <div className="text-xs font-mono text-text-muted">{formatDate(t.date)}</div>
                    </div>

                    {/* From -> To */}
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <span className="text-sm text-text-secondary truncate">{t.from_team}</span>
                      <span className="text-text-muted shrink-0">&rarr;</span>
                      <span className="text-sm font-medium text-text truncate">{t.to_team}</span>
                    </div>

                    {/* Transfer type & fee */}
                    <div className="shrink-0 flex items-center gap-2">
                      {t.transfer_type && t.transfer_type !== 'transfer' && (
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                          t.transfer_type === 'loan' ? 'bg-amber-500/15 text-amber-400' :
                          t.transfer_type === 'free' ? 'bg-blue-500/15 text-blue-400' :
                          'bg-white/10 text-text-secondary'
                        }`}>
                          {t.transfer_type === 'loan' ? 'Cesion' : t.transfer_type === 'free' ? 'Libre' : t.transfer_type}
                        </span>
                      )}
                      <span className={`font-mono text-sm font-medium px-2.5 py-1 rounded ${
                        t.fee ? 'bg-accent/15 text-accent' : 'bg-white/5 text-text-muted'
                      }`}>
                        {t.fee ? formatMoney(t.fee, t.fee_currency) : 'No revelado'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-text-muted">
          <p>No hay perfil de jugador cargado</p>
          <p className="text-sm mt-2">Busca un jugador para ver su perfil completo</p>
        </div>
      )}
    </div>
  );
};

export default PlayerProfileTab;
