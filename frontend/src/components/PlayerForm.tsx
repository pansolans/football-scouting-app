import React, { useState } from 'react';
import { playerService } from '../services/api';

const PlayerForm: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    birthArea: '',
    passportArea: '',
    height: '',
    weight: '',
    foot: '',
    position: '',
    currentTeamName: '',
    currentTeamArea: '',
    contractExpiration: '',
    marketValue: '',
    agent: '',
    imageUrl: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await playerService.createManualPlayer(formData);
      setMessage('✅ Jugador agregado exitosamente!');
      // Limpiar formulario
      setFormData({
        firstName: '',
        lastName: '',
        birthDate: '',
        birthArea: '',
        passportArea: '',
        height: '',
        weight: '',
        foot: '',
        position: '',
        currentTeamName: '',
        currentTeamArea: '',
        contractExpiration: '',
        marketValue: '',
        agent: '',
        imageUrl: '',
        notes: ''
      });
    } catch (error) {
      setMessage('❌ Error al agregar jugador');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="grid gap-6">
        {/* Mensaje de estado */}
        {message && (
          <div className={`p-4 relative rounded-lg font-semibold ${
            message.includes('✅')
              ? 'bg-emerald-500/10 text-emerald-600'
              : 'bg-red-500/10 text-red-600'
          }`}>
            {message}
          </div>
        )}

        {/* Información Básica */}
        <div className="bg-surface p-6 rounded-xl">
          <h3 className="mb-4 text-text">📋 Información Básica</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-semibold text-text">
                Nombre *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-text">
                Apellido *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-text">
                Fecha de Nacimiento *
              </label>
              <input
                type="date"
                required
                value={formData.birthDate}
                onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-text">
                Posición
              </label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
              >
                <option value="">Seleccionar...</option>
                <option value="Arquero">🥅 Arquero</option>
                <option value="Defensor Central">🛡️ Defensor Central</option>
                <option value="Lateral Derecho">📐 Lateral Derecho</option>
                <option value="Lateral Izquierdo">📐 Lateral Izquierdo</option>
                <option value="Mediocampista Defensivo">🔰 Mediocampista Defensivo</option>
                <option value="Mediocampista Central">⚙️ Mediocampista Central</option>
                <option value="Mediocampista Ofensivo">🎯 Mediocampista Ofensivo</option>
                <option value="Extremo Derecho">⚡ Extremo Derecho</option>
                <option value="Extremo Izquierdo">⚡ Extremo Izquierdo</option>
                <option value="Delantero Centro">⚽ Delantero Centro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Información Física */}
        <div className="bg-surface p-6 rounded-xl">
          <h3 className="mb-4 text-text">💪 Información Física</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block mb-2 font-semibold text-text">
                Altura (cm)
              </label>
              <input
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({...formData, height: e.target.value})}
                className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-text">
                Peso (kg)
              </label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({...formData, weight: e.target.value})}
                className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-text">
                Pie Hábil
              </label>
              <select
                value={formData.foot}
                onChange={(e) => setFormData({...formData, foot: e.target.value})}
                className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
              >
                <option value="">Seleccionar...</option>
                <option value="Derecho">Derecho</option>
                <option value="Izquierdo">Izquierdo</option>
                <option value="Ambidiestro">Ambidiestro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Nacionalidad y Origen */}
        <div className="bg-surface p-6 rounded-xl">
          <h3 className="mb-4 text-text">🌍 Nacionalidad y Origen</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-semibold text-text">
                País de Nacimiento
              </label>
              <input
                type="text"
                value={formData.birthArea}
                onChange={(e) => setFormData({...formData, birthArea: e.target.value})}
                placeholder="Ej: Argentina"
                className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-text">
                Nacionalidad Deportiva
              </label>
              <input
                type="text"
                value={formData.passportArea}
                onChange={(e) => setFormData({...formData, passportArea: e.target.value})}
                placeholder="Ej: Argentina"
                className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Información del Club */}
        <div className="bg-surface p-6 rounded-xl">
          <h3 className="mb-4 text-text">🏟️ Información del Club</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-semibold text-text">
                Equipo Actual
              </label>
              <input
                type="text"
                value={formData.currentTeamName}
                onChange={(e) => setFormData({...formData, currentTeamName: e.target.value})}
                placeholder="Ej: Banfield Reserva"
                className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-text">
                Liga/País del Equipo
              </label>
              <input
                type="text"
                value={formData.currentTeamArea}
                onChange={(e) => setFormData({...formData, currentTeamArea: e.target.value})}
                placeholder="Ej: Argentina - Reserva"
                className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-text">
                Vencimiento de Contrato
              </label>
              <input
                type="date"
                value={formData.contractExpiration}
                onChange={(e) => setFormData({...formData, contractExpiration: e.target.value})}
                className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-text">
                Valor de Mercado (€)
              </label>
              <input
                type="number"
                value={formData.marketValue}
                onChange={(e) => setFormData({...formData, marketValue: e.target.value})}
                placeholder="Ej: 500000"
                className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Información Adicional */}
        <div className="bg-surface p-6 rounded-xl">
          <h3 className="mb-4 text-text">📝 Información Adicional</h3>
          <div className="grid gap-4">
            <div>
              <label className="block mb-2 font-semibold text-text">
                Representante/Agente
              </label>
              <input
                type="text"
                value={formData.agent}
                onChange={(e) => setFormData({...formData, agent: e.target.value})}
                placeholder="Nombre del representante"
                className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-text">
                URL de Imagen
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                placeholder="https://ejemplo.com/foto.jpg"
                className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-text">
                Notas / Observaciones
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={4}
                placeholder="Información adicional sobre el jugador..."
                className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none resize-y"
              />
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => setFormData({
              firstName: '',
              lastName: '',
              birthDate: '',
              birthArea: '',
              passportArea: '',
              height: '',
              weight: '',
              foot: '',
              position: '',
              currentTeamName: '',
              currentTeamArea: '',
              contractExpiration: '',
              marketValue: '',
              agent: '',
              imageUrl: '',
              notes: ''
            })}
            className="px-6 py-3 bg-white/8 text-text-secondary border-none rounded-lg cursor-pointer font-semibold hover:bg-white/12 transition-colors"
          >
            Limpiar
          </button>

          <button
            type="submit"
            disabled={loading}
            className={`px-8 py-3 text-white border-none rounded-lg font-semibold transition-colors ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-accent cursor-pointer hover:bg-accent/80'
            }`}
          >
            {loading ? 'Guardando...' : '💾 Guardar Jugador'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlayerForm;
