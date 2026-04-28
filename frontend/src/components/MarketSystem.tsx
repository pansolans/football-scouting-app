import React, { useState, useEffect } from 'react';
import { scoutingService } from '../services/api';
import MarketEditor from './MarketEditor';
import MarketPlayerSelector from './MarketPlayerSelector';
import MarketPitchView from './MarketPitchView';

import { API_URL } from '../config';

interface Market {
  id: string;
  name: string;
  status: 'active' | 'closed';
  start_date: string;
  end_date: string;
  notes?: string;
  created_at: string;
}

interface MarketPlayer {
  id: string;
  market_id: string;
  player_id: string;
  player_name: string;
  player_type: 'wyscout' | 'manual';
  status: 'seguimiento' | 'negociando' | 'descartado' | 'fichado';
  priority: 'alta' | 'media' | 'baja';
  estimated_price?: number;
  max_price?: number;
  position?: string;
  age?: number;
  current_team?: string;
  notes?: string;
  added_date: string;
}

const MarketSystem: React.FC = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [marketPlayers, setMarketPlayers] = useState<MarketPlayer[]>([]);
  const [showCreateMarket, setShowCreateMarket] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<'list' | 'detail'>('list');
  const [showEditMarket, setShowEditMarket] = useState(false);
  const [marketToEdit, setMarketToEdit] = useState<Market | null>(null);

  const [marketForm, setMarketForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    notes: ''
  });

  const [playerForm, setPlayerForm] = useState({
    player_name: '',
    position: '',
    age: '',
    current_team: '',
    status: 'seguimiento',
    priority: 'media',
    estimated_price: '',
    max_price: '',
    notes: ''
  });

  useEffect(() => {
    loadMarkets();
  }, []);

  const loadMarkets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/markets`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMarkets(data);
      }
    } catch (error) {
      console.error('Error loading markets:', error);
    } finally {
      setLoading(false);
    }
  };

  const createMarket = async () => {
    try {
      const response = await fetch(`${API_URL}/api/markets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(marketForm)
      });
      if (response.ok) {
        const newMarket = await response.json();
        setMarkets([...markets, newMarket]);
        setShowCreateMarket(false);
        setMarketForm({ name: '', start_date: '', end_date: '', notes: '' });
      }
    } catch (error) {
      console.error('Error creating market:', error);
    }
  };

  const loadMarketPlayers = async (marketId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/markets/${marketId}/players`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMarketPlayers(data);
      }
    } catch (error) {
      console.error('Error loading market players:', error);
    }
  };

  const addPlayerToMarket = async () => {
    if (!selectedMarket) return;
    try {
      const response = await fetch(`${API_URL}/api/markets/${selectedMarket.id}/players`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...playerForm,
          player_type: 'manual',
          player_id: `manual_${Date.now()}`
        })
      });
      if (response.ok) {
        const newPlayer = await response.json();
        setMarketPlayers([...marketPlayers, newPlayer]);
        setShowAddPlayer(false);
        setPlayerForm({
          player_name: '', position: '', age: '', current_team: '',
          status: 'seguimiento', priority: 'media', estimated_price: '', max_price: '', notes: ''
        });
      }
    } catch (error) {
      console.error('Error adding player:', error);
    }
  };

  const deleteMarket = async (market: Market) => {
    const confirmText = `Eliminar el mercado "${market.name}"?\n\nEsto borrara TAMBIEN todos los jugadores cargados en este mercado. Esta accion no se puede deshacer.`;
    if (!window.confirm(confirmText)) return;

    try {
      const response = await fetch(`${API_URL}/api/markets/${market.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        setMarkets(prev => prev.filter(m => m.id !== market.id));
        if (selectedMarket?.id === market.id) {
          setSelectedMarket(null);
          setActiveView('list');
        }
      } else {
        const err = await response.json().catch(() => null);
        alert(err?.detail || 'Error al eliminar el mercado');
      }
    } catch (error) {
      console.error('Error deleting market:', error);
      alert('Error al eliminar el mercado');
    }
  };

  const updatePlayerStatus = async (playerId: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_URL}/api/markets/players/${playerId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        setMarketPlayers(marketPlayers.map(p =>
          p.id === playerId ? { ...p, status: newStatus as any } : p
        ));
      }
    } catch (error) {
      console.error('Error updating player status:', error);
    }
  };

  const MarketListView = () => (
    <div className="animate-fade-in">
      {/* Market Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border-strong mb-6">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/images/stadium-bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 70%',
            opacity: 0.45,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface/70 via-surface/30 to-transparent" />
        <div className="relative z-10 px-8 py-7 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-xs uppercase tracking-[0.2em] text-accent font-medium">Fichajes</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              <span className="text-gradient-hero">Mercados de Fichajes</span>
            </h2>
          </div>
          <button
            onClick={() => setShowCreateMarket(true)}
            className="px-5 py-3 bg-accent hover:bg-accent-dark text-white rounded-xl cursor-pointer font-semibold text-sm transition-colors glow-accent"
          >
            + Nuevo Mercado
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-text-muted">Cargando mercados...</div>
      ) : markets.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border-strong rounded-lg">
          <p className="text-text-muted">No hay mercados creados todavia</p>
          <p className="text-text-muted text-sm mt-1">Crea tu primer mercado para empezar a hacer seguimiento de jugadores</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {markets.map(market => (
            <div
              key={market.id}
              onClick={() => {
                setSelectedMarket(market);
                loadMarketPlayers(market.id);
                setActiveView('detail');
              }}
              className="bg-card border border-border-strong rounded-lg p-5 cursor-pointer hover:border-accent/30 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-semibold text-text">{market.name}</h3>
                  <p className="text-sm text-text-muted mt-1">
                    {market.start_date} - {market.end_date}
                  </p>
                  {market.notes && (
                    <p className="text-sm text-text-muted mt-1">{market.notes}</p>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMarketToEdit(market);
                      setShowEditMarket(true);
                    }}
                    className="px-3 py-1.5 bg-blue-500/15 text-blue-400 rounded-md text-xs font-medium cursor-pointer hover:bg-blue-500/25 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMarket(market);
                    }}
                    className="px-3 py-1.5 bg-red-500/15 text-red-400 rounded-md text-xs font-medium cursor-pointer hover:bg-red-500/25 transition-colors"
                    title="Eliminar mercado"
                  >
                    Eliminar
                  </button>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                    market.status === 'active'
                      ? 'bg-accent/15 text-accent'
                      : 'bg-white/8 text-text-muted'
                  }`}>
                    {market.status === 'active' ? 'Activo' : 'Cerrado'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const MarketDetailView = () => (
    <div>
      <div className="mb-6">
        <button
          onClick={() => setActiveView('list')}
          className="px-3 py-1.5 bg-white/8 text-text-secondary border border-border rounded-md text-sm cursor-pointer hover:bg-white/12 transition-colors mb-4"
        >
          ← Volver a Mercados
        </button>

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-text tracking-tight">
            {selectedMarket?.name}
          </h2>
          <button
            onClick={() => setShowAddPlayer(true)}
            className="px-4 py-2.5 bg-accent hover:bg-accent-dark text-white rounded-lg cursor-pointer font-semibold text-sm transition-colors"
          >
            + Agregar Jugador
          </button>
        </div>
      </div>

      <MarketPitchView
        marketPlayers={marketPlayers}
        marketId={selectedMarket?.id || ''}
        market={selectedMarket}
        onMarketUpdated={(updated) => {
          setSelectedMarket(prev => prev ? { ...prev, ...updated } : prev);
          setMarkets(ms => ms.map(m => (m.id === updated.id ? { ...m, ...updated } : m)));
        }}
        onUpdateFormation={(formation) => {
          console.log('Formacion actualizada:', formation);
        }}
        onPlayerDeleted={() => {
          if (selectedMarket) {
            loadMarketPlayers(selectedMarket.id);
          }
        }}
        onPlayerUpdated={() => {
          if (selectedMarket) {
            loadMarketPlayers(selectedMarket.id);
          }
        }}
      />
    </div>
  );

  return (
    <div>
      {activeView === 'list' ? <MarketListView /> : <MarketDetailView />}

      {/* Modal Crear Mercado */}
      {showCreateMarket && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-card border border-border-strong rounded-xl p-6 w-[90%] max-w-[500px]">
            <h3 className="text-lg font-semibold text-text mb-5">
              Crear Nuevo Mercado
            </h3>

            <div className="grid gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
                  Nombre del Mercado
                </label>
                <input
                  type="text"
                  value={marketForm.name}
                  onChange={(e) => setMarketForm({...marketForm, name: e.target.value})}
                  placeholder="Ej: Mercado Verano 2025"
                  className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={marketForm.start_date}
                    onChange={(e) => setMarketForm({...marketForm, start_date: e.target.value})}
                    className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={marketForm.end_date}
                    onChange={(e) => setMarketForm({...marketForm, end_date: e.target.value})}
                    className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
                  Notas
                </label>
                <textarea
                  value={marketForm.notes}
                  onChange={(e) => setMarketForm({...marketForm, notes: e.target.value})}
                  placeholder="Objetivos, presupuesto, etc..."
                  rows={3}
                  className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5 justify-end">
              <button
                onClick={() => setShowCreateMarket(false)}
                className="px-4 py-2.5 bg-white/8 text-text-secondary border border-border rounded-lg text-sm cursor-pointer hover:bg-white/12 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createMarket}
                className="px-4 py-2.5 bg-accent hover:bg-accent-dark text-white rounded-lg text-sm cursor-pointer font-semibold transition-colors"
              >
                Crear Mercado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Jugador */}
      {showAddPlayer && selectedMarket && (
        <MarketPlayerSelector
          show={showAddPlayer}
          marketId={selectedMarket.id}
          onClose={() => setShowAddPlayer(false)}
          onPlayerAdded={() => {
            loadMarketPlayers(selectedMarket.id);
            setShowAddPlayer(false);
          }}
        />
      )}

      {showEditMarket && marketToEdit && (
        <MarketEditor
          market={marketToEdit}
          onUpdate={loadMarkets}
          onClose={() => {
            setShowEditMarket(false);
            setMarketToEdit(null);
          }}
        />
      )}
    </div>
  );
};

export default MarketSystem;
