import React, { useState, useEffect } from 'react';

import { API_URL } from '../config';

interface MarketModalManagerProps {
  show: boolean;
  player: any;
  onClose: () => void;
}

const MarketModalManager: React.FC<MarketModalManagerProps> = ({ show, player, onClose }) => {
  const [availableMarkets, setAvailableMarkets] = useState<any[]>([]);
  const [marketForm, setMarketForm] = useState({
    market_id: '',
    priority: 'media',
    estimated_price: '',
    notes: ''
  });

  useEffect(() => {
    if (show && player) {
      loadMarkets();
    }
  }, [show, player]);

  const loadMarkets = async () => {
    try {
      const response = await fetch(`${API_URL}/api/markets`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const markets = await response.json();
        setAvailableMarkets(markets.filter((m: any) => m.status === 'active'));
      }
    } catch (error) {
      console.error('Error loading markets:', error);
    }
  };

  const handleSubmit = async () => {
    if (!marketForm.market_id) {
      alert('Selecciona un mercado');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/markets/${marketForm.market_id}/players`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          player_id: player.wyId || player.wyscout_id || player.manual_id || `temp_${Date.now()}`,
          player_name: player.name || player.player_name,
          short_name: player.shortName || player.player_name,
          player_type: player.wyId || player.wyscout_id ? 'wyscout' : 'manual',
          position: player.role?.name || player.position || '',
          age: player.age || null,
          birth_date: player.birthDate || null,
          current_team: player.currentTeam?.name || player.team || '',
          image_url: player.imageDataURL || null,
          nationality: player.passportArea?.name || null,
          status: 'seguimiento',
          priority: marketForm.priority,
          estimated_price: marketForm.estimated_price ? parseFloat(marketForm.estimated_price) : null,
          max_price: null,
          notes: marketForm.notes || ''
        })
      });

      if (response.ok) {
        alert('Jugador agregado al mercado');
        onClose();
        setMarketForm({
          market_id: '',
          priority: 'media',
          estimated_price: '',
          notes: ''
        });
      }
    } catch (error) {
      alert('Error al agregar jugador al mercado');
    }
  };

  if (!show || !player) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000]">
      <div className="bg-card border border-border-strong rounded-xl p-6 w-[90%] max-w-[500px]">
        <h3 className="text-lg font-semibold text-text mb-5">
          Agregar a Mercado: {player.name}
        </h3>

        {availableMarkets.length === 0 ? (
          <p className="text-text-muted text-sm">No hay mercados activos. Crea uno primero en la pestana Mercados.</p>
        ) : (
          <div className="grid gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
                Seleccionar Mercado
              </label>
              <select
                value={marketForm.market_id}
                onChange={(e) => setMarketForm({...marketForm, market_id: e.target.value})}
                className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
              >
                <option value="">Seleccionar...</option>
                {availableMarkets.map(market => (
                  <option key={market.id} value={market.id}>
                    {market.name} - {market.season || market.start_date}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
                Prioridad
              </label>
              <select
                value={marketForm.priority}
                onChange={(e) => setMarketForm({...marketForm, priority: e.target.value})}
                className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
              >
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
                Precio Estimado (EUR)
              </label>
              <input
                type="number"
                value={marketForm.estimated_price}
                onChange={(e) => setMarketForm({...marketForm, estimated_price: e.target.value})}
                placeholder="Ej: 5000000"
                className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none placeholder:text-text-muted"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
                Notas
              </label>
              <textarea
                value={marketForm.notes}
                onChange={(e) => setMarketForm({...marketForm, notes: e.target.value})}
                rows={3}
                className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none resize-none placeholder:text-text-muted"
              />
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-5 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-white/8 text-text-secondary border border-border rounded-lg text-sm cursor-pointer hover:bg-white/12 transition-colors"
          >
            Cancelar
          </button>
          {availableMarkets.length > 0 && (
            <button
              onClick={handleSubmit}
              className="px-4 py-2.5 bg-accent hover:bg-accent-dark text-white rounded-lg text-sm cursor-pointer font-semibold transition-colors"
            >
              Agregar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketModalManager;
