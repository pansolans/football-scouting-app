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
    status: 'seguimiento',
    position: '',
    agent: ''
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
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      alert('Ingresa al menos 2 caracteres para buscar');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/search/players?query=${encodeURIComponent(searchQuery)}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : (data.players || []);
        setSearchResults(list.map((p: any) => ({ ...p, source: 'wyscout' })));
      } else {
        alert('Error en la busqueda');
      }
    } catch (error) {
      console.error('Error searching Wyscout:', error);
      alert('Error al conectar con el buscador');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async () => {
    if (!selectedPlayer) {
      alert('Selecciona un jugador primero');
      return;
    }

    const isWyscout = selectedPlayer.source === 'wyscout';
    const body = {
      player_id: String(
        isWyscout
          ? (selectedPlayer.wyscout_id ?? selectedPlayer.id)
          : selectedPlayer.id
      ),
      player_name: isWyscout
        ? (selectedPlayer.name || 'Sin nombre')
        : (selectedPlayer.player_name || 'Sin nombre'),
      player_type: isWyscout ? 'wyscout' : 'manual',
      position: playerForm.position || selectedPlayer.position || '',
      age: selectedPlayer.age ?? null,
      current_team: selectedPlayer.team || selectedPlayer.current_team || '',
      status: playerForm.status,
      priority: playerForm.priority,
      estimated_price: playerForm.estimated_price ? parseFloat(playerForm.estimated_price) : null,
      max_price: playerForm.max_price ? parseFloat(playerForm.max_price) : null,
      notes: playerForm.notes,
      agent: playerForm.agent || null
    };

    try {
      const response = await fetch(`${API_URL}/api/markets/${marketId}/players`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        onPlayerAdded();
        handleClose();
      } else {
        const err = await response.json().catch(() => null);
        alert(err?.detail || 'Error al agregar jugador');
      }
    } catch (error) {
      console.error('Error adding player:', error);
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
      status: 'seguimiento',
      position: '',
      agent: ''
    });
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4">
      <div className="bg-card border border-border-strong rounded-xl w-[90%] max-w-[700px] max-h-[90vh] flex flex-col">
        <div className="px-6 pt-6 pb-4 shrink-0">
          <h3 className="text-lg font-semibold text-text">
            Agregar Jugador al Mercado
          </h3>
        </div>
        <div className="px-6 flex-1 overflow-y-auto">

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
                {searchResults.map((player) => {
                  const pid = player.wyscout_id ?? player.id;
                  const selectedId = selectedPlayer?.source === 'wyscout'
                    ? (selectedPlayer.wyscout_id ?? selectedPlayer.id)
                    : null;
                  return (
                    <div
                      key={pid}
                      onClick={() => setSelectedPlayer({ ...player, source: 'wyscout' })}
                      className={`p-3 border-b border-border cursor-pointer transition-colors ${
                        selectedId === pid ? 'bg-accent/15' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="font-semibold text-sm text-text">{player.name}</div>
                      <div className="text-xs text-text-muted mt-0.5">
                        {player.position || '-'} - {player.age ?? '?'} anos - {player.team || '-'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {searchResults.length === 0 && !loading && searchQuery && (
              <div className="text-center py-6 text-text-muted text-sm">
                Pulsa Buscar o presiona Enter para ver resultados
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
              manualPlayers.map((player) => {
                const selectedId = selectedPlayer?.source === 'manual' ? selectedPlayer.id : null;
                return (
                  <div
                    key={player.id}
                    onClick={() => setSelectedPlayer({ ...player, source: 'manual' })}
                    className={`p-3 border-b border-border cursor-pointer transition-colors ${
                      selectedId === player.id ? 'bg-accent/15' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="font-semibold text-sm text-text">{player.player_name}</div>
                    <div className="text-xs text-text-muted mt-0.5">
                      {player.position || '-'} - {player.age ?? '?'} anos - {player.team || player.current_team || '-'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Selected Player Info */}
        {selectedPlayer && (
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-semibold text-text mb-1">Jugador Seleccionado:</h4>
            <p className="text-sm text-text-secondary m-0">
              <strong>{selectedPlayer.name || selectedPlayer.player_name}</strong>
              {' - '}
              {selectedPlayer.position || '-'}
              {' - '}
              {selectedPlayer.age ?? '?'} anos
              {' - '}
              {selectedPlayer.team || selectedPlayer.current_team || '-'}
            </p>
          </div>
        )}

        {/* Form Fields */}
        {selectedPlayer && (
          <div className="grid gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
                Posicion Asignada
              </label>
              <select
                value={playerForm.position}
                onChange={(e) => setPlayerForm({...playerForm, position: e.target.value})}
                className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none cursor-pointer"
              >
                <option value="">
                  {selectedPlayer.position
                    ? `Mantener (${selectedPlayer.position})`
                    : 'Seleccionar posicion...'}
                </option>
                <optgroup label="Arqueros">
                  <option value="Arquero - Clasico">Arquero - Clasico</option>
                  <option value="Arquero - De juego">Arquero - De juego</option>
                </optgroup>
                <optgroup label="Laterales Derechos">
                  <option value="Lateral Derecho - Equilibrado">Lateral Derecho - Equilibrado</option>
                  <option value="Lateral Derecho - Ofensivo">Lateral Derecho - Ofensivo</option>
                  <option value="Lateral Derecho - Defensivo">Lateral Derecho - Defensivo</option>
                </optgroup>
                <optgroup label="Laterales Izquierdos">
                  <option value="Lateral Izquierdo - Equilibrado">Lateral Izquierdo - Equilibrado</option>
                  <option value="Lateral Izquierdo - Ofensivo">Lateral Izquierdo - Ofensivo</option>
                  <option value="Lateral Izquierdo - Defensivo">Lateral Izquierdo - Defensivo</option>
                </optgroup>
                <optgroup label="Centrales Derechos">
                  <option value="Central Derecho - Equilibrado">Central Derecho - Equilibrado</option>
                  <option value="Central Derecho - Duelista">Central Derecho - Duelista</option>
                  <option value="Central Derecho - Asociativo">Central Derecho - Asociativo</option>
                </optgroup>
                <optgroup label="Centrales Izquierdos">
                  <option value="Central Izquierdo - Equilibrado">Central Izquierdo - Equilibrado</option>
                  <option value="Central Izquierdo - Duelista">Central Izquierdo - Duelista</option>
                  <option value="Central Izquierdo - Asociativo">Central Izquierdo - Asociativo</option>
                </optgroup>
                <optgroup label="Volantes Centrales">
                  <option value="Volante Central - De construccion">Volante Central - De construccion</option>
                  <option value="Volante Central - Defensivo">Volante Central - Defensivo</option>
                </optgroup>
                <optgroup label="Volantes Internos">
                  <option value="Volante Interno - Box to box">Volante Interno - Box to box</option>
                  <option value="Volante Interno - Ofensivo">Volante Interno - Ofensivo</option>
                </optgroup>
                <optgroup label="Volantes por Afuera">
                  <option value="Volante por Afuera - Carrilero">Volante por Afuera - Carrilero</option>
                  <option value="Volante por Afuera - Ofensivo">Volante por Afuera - Ofensivo</option>
                </optgroup>
                <optgroup label="Extremos Derechos">
                  <option value="Extremo Derecho - Finalizador">Extremo Derecho - Finalizador</option>
                  <option value="Extremo Derecho - Asociativo">Extremo Derecho - Asociativo</option>
                  <option value="Extremo Derecho - Desequilibrante">Extremo Derecho - Desequilibrante</option>
                </optgroup>
                <optgroup label="Extremos Izquierdos">
                  <option value="Extremo Izquierdo - Finalizador">Extremo Izquierdo - Finalizador</option>
                  <option value="Extremo Izquierdo - Asociativo">Extremo Izquierdo - Asociativo</option>
                  <option value="Extremo Izquierdo - Desequilibrante">Extremo Izquierdo - Desequilibrante</option>
                </optgroup>
                <optgroup label="Delanteros">
                  <option value="Delantero - De area">Delantero - De area</option>
                  <option value="Delantero - Mediapunta">Delantero - Mediapunta</option>
                </optgroup>
              </select>
            </div>

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
                Agente
              </label>
              <input
                type="text"
                value={playerForm.agent}
                onChange={(e) => setPlayerForm({...playerForm, agent: e.target.value})}
                placeholder="Nombre / contacto del agente"
                className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none placeholder:text-text-muted"
              />
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
        </div>

        {/* Buttons (footer fijo) */}
        <div className="flex gap-3 px-6 py-4 justify-end shrink-0 border-t border-border-strong bg-card rounded-b-xl">
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
