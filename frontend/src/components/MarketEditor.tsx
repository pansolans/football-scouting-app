import React, { useState } from 'react';

import { API_URL } from '../config';

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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000]">
      <div className="bg-card border border-border-strong rounded-xl p-6 w-[400px]">
        <h3 className="text-lg font-semibold text-text mb-5">
          Editar Mercado: {market.name}
        </h3>

        <div className="mb-4">
          <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
            Estado
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
          >
            <option value="active">Activo</option>
            <option value="closed">Cerrado</option>
          </select>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-white/8 text-text-secondary border border-border rounded-lg text-sm cursor-pointer hover:bg-white/12 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleStatusUpdate}
            disabled={updating}
            className={`px-4 py-2.5 bg-accent hover:bg-accent-dark text-white rounded-lg text-sm cursor-pointer font-semibold transition-colors ${
              updating ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {updating ? 'Actualizando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketEditor;
