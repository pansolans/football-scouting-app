import React, { useState, useEffect } from 'react';

import { API_URL } from '../config';

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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000]">
      <div className="bg-card border border-border-strong rounded-xl p-6 w-[90%] max-w-[700px] max-h-[80vh] overflow-auto">
        <h3 className="text-lg font-semibold text-text mb-5">
          Agregar Jugador al Mercado
        </h3>

        {/* Tabs */}
        <div className="flex gap-3 mb-5">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-colors ${
              activeTab === 'search'
                ? 'bg-accent text-white'
                : 'bg-white/8 text-text-muted hover:bg-white/12'
            }`}
          >
            Buscar en Wyscout
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-colors ${
              activeTab === 'manual'
                ? 'bg-accent text-white'
                : 'bg-white/8 text-text-muted hover:bg-white/12'
            }`}
          >
            Jugadores Manuales ({manualPlayers.length})
          </button>
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchWyscout()}
                placeholder="Buscar jugador en Wyscout..."
                className="flex-1 p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none placeholder:text-text-muted"
              />
              <button
                onClick={searchWyscout}
                disabled={loading}
                className={`px-4 py-2.5 bg-accent hover:bg-accent-dark text-white rounded-lg text-sm cursor-pointer font-semibold transition-colors ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="max-h-[200px] overflow-auto border border-border-strong rounded-lg mb-4">
                {searchResults.map((player) => (
                  <div
                    key={player.wyId}
                    onClick={() => setSelectedPlayer(player)}
                    className={`p-3 border-b border-border cursor-pointer transition-colors ${
                      selectedPlayer?.wyId === player.wyId
                        ? 'bg-accent/15'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="font-semibold text-sm text-text">{player.name}</div>
                    <div className="text-xs text-text-muted mt-0.5">
                      {player.role?.name} - {player.age} anos - {player.currentTeam?.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Manual Players Tab */}
        {activeTab === 'manual' && (
          <div className="max-h-[200px] overflow-auto border border-border-strong rounded-lg mb-4">
            {manualPlayers.length === 0 ? (
              <div className="p-6 text-center text-text-muted text-sm">
                No hay jugadores manuales creados
              </div>
            ) : (
              manualPlayers.map((player) => (
                <div
                  key={player.id}
                  onClick={() => setSelectedPlayer(player)}
                  className={`p-3 border-b border-border cursor-pointer transition-colors ${
                    selectedPlayer?.id === player.id
                      ? 'bg-accent/15'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="font-semibold text-sm text-text">{player.player_name}</div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {player.position} - {player.age} anos - {player.team}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Selected Player Info */}
        {selectedPlayer && (
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-semibold text-text mb-1">Jugador Seleccionado:</h4>
            <p className="text-sm text-text-secondary m-0">
              <strong>{selectedPlayer.name || selectedPlayer.player_name}</strong> - {' '}
              {selectedPlayer.role?.name || selectedPlayer.position} - {' '}
              {selectedPlayer.age} anos
            </p>
          </div>
        )}

        {/* Form Fields */}
        {selectedPlayer && (
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
                  Prioridad
                </label>
                <select
                  value={playerForm.priority}
                  onChange={(e) => setPlayerForm({...playerForm, priority: e.target.value})}
                  className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
                >
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
                  Estado
                </label>
                <select
                  value={playerForm.status}
                  onChange={(e) => setPlayerForm({...playerForm, status: e.target.value})}
                  className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
                >
                  <option value="seguimiento">Seguimiento</option>
                  <option value="negociando">Negociando</option>
                  <option value="descartado">Descartado</option>
                  <option value="fichado">Fichado</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
                  Precio Estimado (EUR)
                </label>
                <input
                  type="number"
                  value={playerForm.estimated_price}
                  onChange={(e) => setPlayerForm({...playerForm, estimated_price: e.target.value})}
                  placeholder="Ej: 5000000"
                  className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none placeholder:text-text-muted"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
                  Precio Maximo (EUR)
                </label>
                <input
                  type="number"
                  value={playerForm.max_price}
                  onChange={(e) => setPlayerForm({...playerForm, max_price: e.target.value})}
                  placeholder="Ej: 7000000"
                  className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none placeholder:text-text-muted"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
                Notas
              </label>
              <textarea
                value={playerForm.notes}
                onChange={(e) => setPlayerForm({...playerForm, notes: e.target.value})}
                rows={3}
                className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none resize-none placeholder:text-text-muted"
              />
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 mt-5 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2.5 bg-white/8 text-text-secondary border border-border rounded-lg text-sm cursor-pointer hover:bg-white/12 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleAddPlayer}
            disabled={!selectedPlayer}
            className={`px-4 py-2.5 bg-accent hover:bg-accent-dark text-white rounded-lg text-sm cursor-pointer font-semibold transition-colors ${
              !selectedPlayer ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Agregar al Mercado
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketPlayerSelector;
