import React, { useState, useEffect } from 'react';
import { scoutingService } from '../services/api';

const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://football-scouting-backend-vd0x.onrender.com'
  : 'http://localhost:8000';

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
  
  // Formulario para nuevo mercado
  const [marketForm, setMarketForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    notes: ''
  });

  // Formulario para agregar jugador
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

  // Cargar mercados al iniciar
  useEffect(() => {
    loadMarkets();
  }, []);

  // Cargar mercados desde la API
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

  // Crear nuevo mercado
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
        alert('Mercado creado exitosamente');
      }
    } catch (error) {
      console.error('Error creating market:', error);
      alert('Error al crear el mercado');
    }
  };

  // Cargar jugadores de un mercado
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

  // Agregar jugador al mercado
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
        alert('Jugador agregado al mercado');
      }
    } catch (error) {
      console.error('Error adding player:', error);
      alert('Error al agregar jugador');
    }
  };

  // Actualizar estado de un jugador
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

  // Obtener color según prioridad
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'alta': return '#ef4444';
      case 'media': return '#f59e0b';
      case 'baja': return '#10b981';
      default: return '#6b7280';
    }
  };

  // Obtener color según estado
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'seguimiento': return '#3b82f6';
      case 'negociando': return '#f59e0b';
      case 'descartado': return '#6b7280';
      case 'fichado': return '#10b981';
      default: return '#6b7280';
    }
  };

  // Vista lista de mercados
  const MarketListView = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
          📊 Mercados de Fichajes
        </h2>
        <button
          onClick={() => setShowCreateMarket(true)}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          ➕ Nuevo Mercado
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem' }}>⚽ Cargando mercados...</div>
        </div>
      ) : markets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <p style={{ color: '#6b7280' }}>No hay mercados creados todavía</p>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Crea tu primer mercado para empezar a hacer seguimiento de jugadores</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {markets.map(market => (
            <div
              key={market.id}
              onClick={() => {
                setSelectedMarket(market);
                loadMarketPlayers(market.id);
                setActiveView('detail');
              }}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '2px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#1f2937' }}>
                    {market.name}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                    {market.start_date} - {market.end_date}
                  </p>
                  {market.notes && (
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                      {market.notes}
                    </p>
                  )}
                </div>
                <span style={{
                  padding: '0.5rem 1rem',
                  background: market.status === 'active' ? '#10b98120' : '#6b728020',
                  color: market.status === 'active' ? '#059669' : '#4b5563',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  {market.status === 'active' ? 'Activo' : 'Cerrado'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Vista detalle de un mercado
  const MarketDetailView = () => (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => setActiveView('list')}
          style={{
            padding: '0.5rem 1rem',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '1rem'
          }}
        >
          ← Volver a Mercados
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
            {selectedMarket?.name}
          </h2>
          <button
            onClick={() => setShowAddPlayer(true)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            ➕ Agregar Jugador
          </button>
        </div>
      </div>

      {marketPlayers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
          <p style={{ color: '#6b7280' }}>No hay jugadores en este mercado</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {marketPlayers.map(player => (
            <div key={player.id} style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '2px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#1f2937' }}>
                    {player.player_name}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    {player.position} • {player.age} años • {player.current_team}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem' }}>
                      💰 Est: €{player.estimated_price?.toLocaleString() || '0'}
                    </span>
                    <span style={{ fontSize: '0.875rem' }}>
                      📈 Max: €{player.max_price?.toLocaleString() || '0'}
                    </span>
                  </div>
                  {player.notes && (
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                      📝 {player.notes}
                    </p>
                  )}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: `${getPriorityColor(player.priority)}20`,
                    color: getPriorityColor(player.priority),
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    Prioridad {player.priority}
                  </span>
                  
                  <select
                    value={player.status}
                    onChange={(e) => updatePlayerStatus(player.id, e.target.value)}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '8px',
                      border: '2px solid',
                      borderColor: getStatusColor(player.status),
                      color: getStatusColor(player.status),
                      fontWeight: '600',
                      cursor: 'pointer',
                      background: 'white'
                    }}
                  >
                    <option value="seguimiento">📋 Seguimiento</option>
                    <option value="negociando">💬 Negociando</option>
                    <option value="descartado">❌ Descartado</option>
                    <option value="fichado">✅ Fichado</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ 
      background: 'white',
      borderRadius: '16px',
      padding: '2rem',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
      marginTop: '-150px',  // <-- AGREGAR ESTO
      position: 'relative',  // <-- AGREGAR ESTO
      zIndex: 1  // <-- AGREGAR ESTO
    }}>
      {activeView === 'list' ? <MarketListView /> : <MarketDetailView />}

      {/* Modal Crear Mercado */}
      {showCreateMarket && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              Crear Nuevo Mercado
            </h3>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Nombre del Mercado
                </label>
                <input
                  type="text"
                  value={marketForm.name}
                  onChange={(e) => setMarketForm({...marketForm, name: e.target.value})}
                  placeholder="Ej: Mercado Verano 2025"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={marketForm.start_date}
                    onChange={(e) => setMarketForm({...marketForm, start_date: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={marketForm.end_date}
                    onChange={(e) => setMarketForm({...marketForm, end_date: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Notas
                </label>
                <textarea
                  value={marketForm.notes}
                  onChange={(e) => setMarketForm({...marketForm, notes: e.target.value})}
                  placeholder="Objetivos, presupuesto, etc..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateMarket(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={createMarket}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Crear Mercado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Jugador */}
      {showAddPlayer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              Agregar Jugador al Mercado
            </h3>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Nombre del Jugador *
                  </label>
                  <input
                    type="text"
                    value={playerForm.player_name}
                    onChange={(e) => setPlayerForm({...playerForm, player_name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Posición
                  </label>
                  <input
                    type="text"
                    value={playerForm.position}
                    onChange={(e) => setPlayerForm({...playerForm, position: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Edad
                  </label>
                  <input
                    type="number"
                    value={playerForm.age}
                    onChange={(e) => setPlayerForm({...playerForm, age: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Equipo Actual
                </label>
                <input
                  type="text"
                  value={playerForm.current_team}
                  onChange={(e) => setPlayerForm({...playerForm, current_team: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Estado
                  </label>
                  <select
                    value={playerForm.status}
                    onChange={(e) => setPlayerForm({...playerForm, status: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  >
                    <option value="seguimiento">Seguimiento</option>
                    <option value="negociando">Negociando</option>
                    <option value="descartado">Descartado</option>
                    <option value="fichado">Fichado</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Prioridad
                  </label>
                  <select
                    value={playerForm.priority}
                    onChange={(e) => setPlayerForm({...playerForm, priority: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Precio Estimado (€)
                  </label>
                  <input
                    type="number"
                    value={playerForm.estimated_price}
                    onChange={(e) => setPlayerForm({...playerForm, estimated_price: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Precio Máximo (€)
                  </label>
                  <input
                    type="number"
                    value={playerForm.max_price}
                    onChange={(e) => setPlayerForm({...playerForm, max_price: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Notas
                </label>
                <textarea
                  value={playerForm.notes}
                  onChange={(e) => setPlayerForm({...playerForm, notes: e.target.value})}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddPlayer(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={addPlayerToMarket}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Agregar Jugador
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketSystem;