import React, { useState } from 'react';

const API_URL = 'https://football-scouting-backend-vd0x.onrender.com';

interface MarketEditorProps {
  market: any;
  onUpdate: () => void;
  onClose: () => void;
}

const MarketEditor: React.FC<MarketEditorProps> = ({ market, onUpdate, onClose }) => {
  const [status, setStatus] = useState(market.status);
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`${API_URL}/api/markets/${market.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        alert('Estado actualizado');
        onUpdate();
        onClose();
      }
    } catch (error) {
      alert('Error al actualizar');
    }
    setUpdating(false);
  };

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
        width: '400px'
      }}>
        <h3>Editar Mercado: {market.name}</h3>
        
        <div style={{ marginBottom: '1rem' }}>
          <label>Estado:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e5e7eb',
              borderRadius: '8px'
            }}
          >
            <option value="active">Activo</option>
            <option value="closed">Cerrado</option>
          </select>
        </div>

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
          <button
            onClick={handleStatusUpdate}
            disabled={updating}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: updating ? 'not-allowed' : 'pointer',
              opacity: updating ? 0.5 : 1
            }}
          >
            {updating ? 'Actualizando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketEditor;