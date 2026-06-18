import React, { useEffect, useState } from 'react';
import { API_URL } from '../config';

interface MarketShareModalProps {
  market: any;
  onClose: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  head_scout: 'Jefe Scout',
  scout: 'Scout',
  viewer: 'Observador',
};

const MarketShareModal: React.FC<MarketShareModalProps> = ({ market, onClose }) => {
  const [scouts, setScouts] = useState<any[]>([]);
  const [sharedIds, setSharedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [scoutsRes, sharesRes] = await Promise.all([
          fetch(`${API_URL}/api/scouts`, { headers }),
          fetch(`${API_URL}/api/markets/${market.id}/shares`, { headers }),
        ]);
        const scoutsData = scoutsRes.ok ? await scoutsRes.json() : [];
        const sharesData = sharesRes.ok ? await sharesRes.json() : [];
        if (!active) return;
        setScouts(Array.isArray(scoutsData) ? scoutsData : []);
        setSharedIds(new Set(Array.isArray(sharesData) ? sharesData : []));
      } catch (e) {
        console.error('Error loading shares:', e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [market.id]);

  const alwaysHasAccess = (s: any) => s.role === 'admin' || s.role === 'head_scout';
  const isCreator = (s: any) => s.id === market.created_by;

  const toggleShare = async (scout: any) => {
    const id = scout.id;
    const isShared = sharedIds.has(id);
    setSavingId(id);
    try {
      if (isShared) {
        const r = await fetch(`${API_URL}/api/markets/${market.id}/shares/${id}`, { method: 'DELETE', headers });
        if (r.ok) {
          setSharedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
        } else {
          alert('Error al quitar el acceso');
        }
      } else {
        const r = await fetch(`${API_URL}/api/markets/${market.id}/shares`, {
          method: 'POST', headers, body: JSON.stringify({ scout_id: id }),
        });
        if (r.ok) {
          setSharedIds(prev => new Set(prev).add(id));
        } else {
          const e = await r.json().catch(() => null);
          alert(e?.detail || 'Error al compartir');
        }
      }
    } catch (e) {
      console.error('Error toggling share:', e);
      alert('Error de conexion');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[2000] p-4" onClick={onClose}>
      <div
        className="bg-card border-2 border-border-strong rounded-xl w-[90%] max-w-[520px] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 shrink-0 border-b border-border-strong">
          <h3 className="text-lg font-semibold text-text m-0">Compartir mercado</h3>
          <p className="text-sm text-text-muted mt-1">{market.name}</p>
        </div>

        <div className="px-6 py-4 flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-text-muted text-sm">Cargando usuarios...</div>
          ) : scouts.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-sm">No hay otros usuarios en el club.</div>
          ) : (
            <div className="grid gap-2">
              {scouts.map((s) => {
                const auto = alwaysHasAccess(s) || isCreator(s);
                const shared = sharedIds.has(s.id);
                const reason = isCreator(s) ? 'Creador' : alwaysHasAccess(s) ? `Ve todos (${ROLE_LABELS[s.role] || s.role})` : null;
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 p-3 bg-surface border border-border-strong rounded-lg"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-text truncate">{s.name}</div>
                      <div className="text-xs text-text-muted truncate">{s.email}</div>
                    </div>
                    {auto ? (
                      <span className="shrink-0 text-[11px] text-text-muted italic">{reason}</span>
                    ) : (
                      <button
                        onClick={() => toggleShare(s)}
                        disabled={savingId === s.id}
                        className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50 ${
                          shared
                            ? 'bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25'
                            : 'bg-white/8 text-text-secondary border border-border hover:bg-white/12'
                        }`}
                      >
                        {savingId === s.id ? '...' : shared ? '✓ Compartido' : 'Compartir'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 justify-end shrink-0 border-t border-border-strong bg-card rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-accent hover:bg-accent-dark text-white rounded-lg text-sm cursor-pointer font-semibold transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketShareModal;
