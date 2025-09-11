import React, { useState, useEffect } from 'react';
import { scoutingService } from '../services/api';
import MarketEditor from './MarketEditor';
import MarketPlayerSelector from './MarketPlayerSelector';
import MarketPitchView from './MarketPitchView';

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
  const [showEditMarket, setShowEditMarket] = useState(false);
  const [marketToEdit, setMarketToEdit] = useState<Market | null>(null);
  
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
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMarketToEdit(market);
                      setShowEditMarket(true);
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    ✏️ Editar
                  </button>
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

      <MarketPitchView 
        marketPlayers={marketPlayers}
        onUpdateFormation={(formation) => {
          console.log('Formación actualizada:', formation);
        }}
      />
    </div>
  );

  return (
<div style={{ 
  background: 'white',
  borderRadius: '16px',
  padding: '2rem',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  minHeight: 'auto',
  height: 'auto'
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