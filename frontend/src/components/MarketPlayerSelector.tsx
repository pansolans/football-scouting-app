import React, { useState, useEffect } from 'react';

const API_URL = 'https://football-scouting-backend-vd0x.onrender.com';

interface MarketPlayerSelectorProps {
  show: boolean;
  marketId: string;
  onClose: () => void;
  onPlayerAdded: () => void;
}

const MarketPlayerSelector: React.FC<MarketPlayerSelectorProps> = ({ 
  show, 
  marketId, 
  onClose, 
  onPlayerAdded 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [manualPlayers, setManualPlayers] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'manual'>('search');
  
  const [playerForm, setPlayerForm] = useState({
    priority: 'media',
    estimated_price: '',
    max_price: '',
    notes: '',
    status: 'seguimiento'
  });

  useEffect(() => {
    if (show) {
      loadManualPlayers();
    }
  }, [show]);

  const loadManualPlayers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/manual-players`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setManualPlayers(data);
      }
    } catch (error) {
      console.error('Error loading manual players:', error);
    }
  };

  const searchWyscout = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/wyscout/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.players || []);
      }
    } catch (error) {
      console.error('Error searching Wyscout:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async () => {
    if (!selectedPlayer) {
      alert('Selecciona un jugador primero');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/markets/${marketId}/players`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          player_id: selectedPlayer.wyId || selectedPlayer.id || `temp_${Date.now()}`,
          player_name: selectedPlayer.name || selectedPlayer.player_name,
          player_type: selectedPlayer.wyId ? 'wyscout' : 'manual',
          position: selectedPlayer.role?.name || selectedPlayer.position || '',
          age: selectedPlayer.age || null,
          current_team: selectedPlayer.currentTeam?.name || selectedPlayer.team || '',
          status: playerForm.status,
          priority: playerForm.priority,
          estimated_price: playerForm.estimated_price ? parseFloat(playerForm.estimated_price) : null,
          max_price: playerForm.max_price ? parseFloat(playerForm.max_price) : null,
          notes: playerForm.notes
        })
      });

      if (response.ok) {
        alert('Jugador agregado al mercado');
        onPlayerAdded();
        handleClose();
      }
    } catch (error) {
      alert('Error al agregar jugador');
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedPlayer(null);
    setPlayerForm({
      priority: 'media',
      estimated_price: '',
      max_price: '',
      notes: '',
      status: 'seguimiento'
    });
    onClose();
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '2rem',
        width: '90%',
        maxWidth: '700px',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
          Agregar Jugador al Mercado
        </h3>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setActiveTab('search')}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'search' ? '#3b82f6' : '#e5e7eb',
              color: activeTab === 'search' ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            🔍 Buscar en Wyscout
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'manual' ? '#3b82f6' : '#e5e7eb',
              color: activeTab === 'manual' ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            📝 Jugadores Manuales ({manualPlayers.length})
          </button>
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchWyscout()}
                placeholder="Buscar jugador en Wyscout..."
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <button
                onClick={searchWyscout}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1
                }}
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div style={{
                maxHeight: '200px',
                overflow: 'auto',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                {searchResults.map((player) => (
                  <div
                    key={player.wyId}
                    onClick={() => setSelectedPlayer(player)}
                    style={{
                      padding: '0.75rem',
                      borderBottom: '1px solid #e5e7eb',
                      cursor: 'pointer',
                      background: selectedPlayer?.wyId === player.wyId ? '#3b82f620' : 'white'
                    }}
                  >
                    <div style={{ fontWeight: '600' }}>{player.name}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {player.role?.name} • {player.age} años • {player.currentTeam?.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Manual Players Tab */}
        {activeTab === 'manual' && (
          <div style={{
            maxHeight: '200px',
            overflow: 'auto',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            {manualPlayers.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                No hay jugadores manuales creados
              </div>
            ) : (
              manualPlayers.map((player) => (
                <div
                  key={player.id}
                  onClick={() => setSelectedPlayer(player)}
                  style={{
                    padding: '0.75rem',
                    borderBottom: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    background: selectedPlayer?.id === player.id ? '#3b82f620' : 'white'
                  }}
                >
                  <div style={{ fontWeight: '600' }}>{player.player_name}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {player.position} • {player.age} años • {player.team}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Selected Player Info */}
        {selectedPlayer && (
          <div style={{
            background: '#f3f4f6',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Jugador Seleccionado:</h4>
            <p style={{ margin: 0 }}>
              <strong>{selectedPlayer.name || selectedPlayer.player_name}</strong> - 
              {selectedPlayer.role?.name || selectedPlayer.position} - 
              {selectedPlayer.age} años
            </p>
          </div>
        )}

        {/* Form Fields */}
        {selectedPlayer && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                  placeholder="Ej: 5000000"
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
                  placeholder="Ej: 7000000"
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
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <button
            onClick={handleClose}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleAddPlayer}
            disabled={!selectedPlayer}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: selectedPlayer ? '#10b981' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: selectedPlayer ? 'pointer' : 'not-allowed',
              fontWeight: '600'
            }}
          >
            Agregar al Mercado
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketPlayerSelector;