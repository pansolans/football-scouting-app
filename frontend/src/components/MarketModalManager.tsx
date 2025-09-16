import React, { useState, useEffect } from 'react';

const API_URL = 'https://football-scouting-backend-vd0x.onrender.com';

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
        borderRadius: '12px',
        padding: '2rem',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        <h2 style={{ marginBottom: '1.5rem' }}>
          Agregar a Mercado: {player.name}
        </h2>
        
        {availableMarkets.length === 0 ? (
          <p>No hay mercados activos. Crea uno primero en la pestaña Mercados.</p>
        ) : (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label>Seleccionar Mercado:</label>
              <select
                value={marketForm.market_id}
                onChange={(e) => setMarketForm({...marketForm, market_id: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              >
                <option value="">Seleccionar...</option>
                {availableMarkets.map(market => (
                  <option key={market.id} value={market.id}>
                    {market.name} - {market.season || market.start_date}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label>Prioridad:</label>
              <select
                value={marketForm.priority}
                onChange={(e) => setMarketForm({...marketForm, priority: e.target.value})}
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

            <div style={{ marginBottom: '1rem' }}>
              <label>Precio Estimado (€):</label>
              <input
                type="number"
                value={marketForm.estimated_price}
                onChange={(e) => setMarketForm({...marketForm, estimated_price: e.target.value})}
                placeholder="Ej: 5000000"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label>Notas:</label>
              <textarea
                value={marketForm.notes}
                onChange={(e) => setMarketForm({...marketForm, notes: e.target.value})}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
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
          {availableMarkets.length > 0 && (
            <button
              onClick={handleSubmit}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#006600',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
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