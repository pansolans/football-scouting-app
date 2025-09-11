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
<div style={{
  padding: '1rem'
}}>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
        {/* Mensaje de estado */}
        {message && (
          <div style={{
            padding: '1rem',
            position: 'relative',  
            zIndex: 1,  
            borderRadius: '8px',
            background: message.includes('✅') ? '#10b98120' : '#ef444420',
            color: message.includes('✅') ? '#059669' : '#dc2626',
            fontWeight: '600'
          }}>
            {message}
          </div>
        )}

        {/* Información Básica */}
        <div style={{
          background: '#f9fafb',
          padding: '1.5rem',
          borderRadius: '12px'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#374151' }}>📋 Información Básica</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Nombre *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
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
                Apellido *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
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
                Fecha de Nacimiento *
              </label>
              <input
                type="date"
                required
                value={formData.birthDate}
                onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
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
              <select
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px'
                }}
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
        <div style={{
          background: '#f9fafb',
          padding: '1.5rem',
          borderRadius: '12px'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#374151' }}>💪 Información Física</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Altura (cm)
              </label>
              <input
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({...formData, height: e.target.value})}
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
                Peso (kg)
              </label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({...formData, weight: e.target.value})}
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
                Pie Hábil
              </label>
              <select
                value={formData.foot}
                onChange={(e) => setFormData({...formData, foot: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px'
                }}
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
        <div style={{
          background: '#f9fafb',
          padding: '1.5rem',
          borderRadius: '12px'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#374151' }}>🌍 Nacionalidad y Origen</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                País de Nacimiento
              </label>
              <input
                type="text"
                value={formData.birthArea}
                onChange={(e) => setFormData({...formData, birthArea: e.target.value})}
                placeholder="Ej: Argentina"
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
                Nacionalidad Deportiva
              </label>
              <input
                type="text"
                value={formData.passportArea}
                onChange={(e) => setFormData({...formData, passportArea: e.target.value})}
                placeholder="Ej: Argentina"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Información del Club */}
        <div style={{
          background: '#f9fafb',
          padding: '1.5rem',
          borderRadius: '12px'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#374151' }}>🏟️ Información del Club</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Equipo Actual
              </label>
              <input
                type="text"
                value={formData.currentTeamName}
                onChange={(e) => setFormData({...formData, currentTeamName: e.target.value})}
                placeholder="Ej: Banfield Reserva"
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
                Liga/País del Equipo
              </label>
              <input
                type="text"
                value={formData.currentTeamArea}
                onChange={(e) => setFormData({...formData, currentTeamArea: e.target.value})}
                placeholder="Ej: Argentina - Reserva"
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
                Vencimiento de Contrato
              </label>
              <input
                type="date"
                value={formData.contractExpiration}
                onChange={(e) => setFormData({...formData, contractExpiration: e.target.value})}
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
                Valor de Mercado (€)
              </label>
              <input
                type="number"
                value={formData.marketValue}
                onChange={(e) => setFormData({...formData, marketValue: e.target.value})}
                placeholder="Ej: 500000"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Información Adicional */}
        <div style={{
          background: '#f9fafb',
          padding: '1.5rem',
          borderRadius: '12px'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#374151' }}>📝 Información Adicional</h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Representante/Agente
              </label>
              <input
                type="text"
                value={formData.agent}
                onChange={(e) => setFormData({...formData, agent: e.target.value})}
                placeholder="Nombre del representante"
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
                URL de Imagen
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                placeholder="https://ejemplo.com/foto.jpg"
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
                Notas / Observaciones
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={4}
                placeholder="Información adicional sobre el jugador..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
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
            style={{
              padding: '0.75rem 1.5rem',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Limpiar
          </button>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem 2rem',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            {loading ? 'Guardando...' : '💾 Guardar Jugador'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlayerForm;