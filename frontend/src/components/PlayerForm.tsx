import React, { useState } from 'react';

const PlayerForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    birthArea: '',
    position: '',
    currentTeamName: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // URL de tu backend en Render - CAMBIA ESTO POR TU URL REAL
  const API_URL = 'https://football-scouting-backend-vd0x.onrender.com'; // <-- CAMBIA ESTO

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch(`${API_URL}/api/players/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage('¡Jugador creado exitosamente!');
        setFormData({
          firstName: '',
          lastName: '',
          birthDate: '',
          birthArea: '',
          position: '',
          currentTeamName: '',
          notes: ''
        });
      }
    } catch (error) {
      setMessage('Error al crear jugador');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Agregar Jugador Manual</h2>
      
      {message && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: message.includes('Error') ? '#ffcccc' : '#ccffcc',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Nombre"
          value={formData.firstName}
          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
          required
          style={{ display: 'block', margin: '10px 0', padding: '8px', width: '300px' }}
        />
        
        <input
          placeholder="Apellido"
          value={formData.lastName}
          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
          required
          style={{ display: 'block', margin: '10px 0', padding: '8px', width: '300px' }}
        />
        
        <input
          type="date"
          value={formData.birthDate}
          onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
          required
          style={{ display: 'block', margin: '10px 0', padding: '8px', width: '300px' }}
        />
        
        <input
          placeholder="País"
          value={formData.birthArea}
          onChange={(e) => setFormData({...formData, birthArea: e.target.value})}
          required
          style={{ display: 'block', margin: '10px 0', padding: '8px', width: '300px' }}
        />
        
        <select
          value={formData.position}
          onChange={(e) => setFormData({...formData, position: e.target.value})}
          required
          style={{ display: 'block', margin: '10px 0', padding: '8px', width: '300px' }}
        >
          <option value="">Seleccionar Posición</option>
          <option value="GK">Portero</option>
          <option value="CB">Defensa Central</option>
          <option value="LB">Lateral Izquierdo</option>
          <option value="RB">Lateral Derecho</option>
          <option value="CMF">Mediocentro</option>
          <option value="CF">Delantero</option>
        </select>
        
        <input
          placeholder="Club Actual"
          value={formData.currentTeamName}
          onChange={(e) => setFormData({...formData, currentTeamName: e.target.value})}
          style={{ display: 'block', margin: '10px 0', padding: '8px', width: '300px' }}
        />
        
        <textarea
          placeholder="Notas"
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          rows={3}
          style={{ display: 'block', margin: '10px 0', padding: '8px', width: '300px' }}
        />
        
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Guardando...' : 'Crear Jugador'}
        </button>
      </form>
    </div>
  );
};

export default PlayerForm;