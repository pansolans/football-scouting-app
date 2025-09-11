import React, { useState, useEffect } from 'react';

interface MarketPitchViewProps {
  marketPlayers: any[];
  onUpdateFormation: (formation: any) => void;
}

const MarketPitchView: React.FC<MarketPitchViewProps> = ({ marketPlayers, onUpdateFormation }) => {
  const [formation, setFormation] = useState<{[key: string]: any}>({
    GK: null,
    LB: null,
    CB1: null,
    CB2: null,
    RB: null,
    CDM: null,
    CM1: null,
    CM2: null,
    LW: null,
    ST: null,
    RW: null
  });

  const [draggedPlayer, setDraggedPlayer] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'pitch'>('list');

  // Posiciones en el campo (porcentajes relativos)
  const positions = {
    GK: { top: '85%', left: '50%' },
    LB: { top: '70%', left: '15%' },
    CB1: { top: '70%', left: '35%' },
    CB2: { top: '70%', left: '65%' },
    RB: { top: '70%', left: '85%' },
    CDM: { top: '55%', left: '50%' },
    CM1: { top: '40%', left: '30%' },
    CM2: { top: '40%', left: '70%' },
    LW: { top: '20%', left: '15%' },
    ST: { top: '15%', left: '50%' },
    RW: { top: '20%', left: '85%' }
  };

  const handleDragStart = (player: any) => {
    setDraggedPlayer(player);
  };

  const handleDrop = (position: string) => {
    if (draggedPlayer) {
      setFormation({ ...formation, [position]: draggedPlayer });
      setDraggedPlayer(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeFromFormation = (position: string) => {
    setFormation({ ...formation, [position]: null });
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'alta': return '#ef4444';
      case 'media': return '#f59e0b';
      case 'baja': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (viewMode === 'list') {
    return (
      <div>
        <button
          onClick={() => setViewMode('pitch')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            marginBottom: '1rem'
          }}
        >
          ⚽ Ver en Cancha
        </button>
        
        {/* Lista normal de jugadores */}
        <div style={{ display: 'grid', gap: '1rem' }}>
          {marketPlayers.map(player => (
            <div key={player.id} style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '2px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#1f2937' }}>
                    {player.player_name}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    {player.position} • {player.age} años • {player.current_team}
                  </p>
                </div>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  background: `${getPriorityColor(player.priority)}20`,
                  color: getPriorityColor(player.priority),
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  Prioridad {player.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setViewMode('list')}
        style={{
          padding: '0.75rem 1.5rem',
          background: '#6b7280',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '1rem'
        }}
      >
        ← Ver Lista
      </button>

      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* Panel izquierdo - Jugadores disponibles */}
        <div style={{ width: '300px' }}>
          <h3 style={{ marginBottom: '1rem' }}>Jugadores Disponibles</h3>
          <div style={{
            background: '#f9fafb',
            borderRadius: '8px',
            padding: '1rem',
            maxHeight: '600px',
            overflow: 'auto'
          }}>
            {marketPlayers
              .filter(p => !Object.values(formation).some(f => f?.id === p.id))
              .map(player => (
                <div
                  key={player.id}
                  draggable
                  onDragStart={() => handleDragStart(player)}
                  style={{
                    background: 'white',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    cursor: 'grab',
                    border: '2px solid #e5e7eb'
                  }}
                >
                  <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                    {player.player_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {player.position} • {player.age} años
                  </div>
                  <span style={{
                    display: 'inline-block',
                    marginTop: '0.25rem',
                    padding: '0.125rem 0.5rem',
                    background: `${getPriorityColor(player.priority)}20`,
                    color: getPriorityColor(player.priority),
                    borderRadius: '8px',
                    fontSize: '0.625rem',
                    fontWeight: '600'
                  }}>
                    {player.priority}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Cancha */}
        <div style={{ flex: 1 }}>
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '700px',
            margin: '0 auto',
            aspectRatio: '1.5',
            background: 'linear-gradient(to bottom, #10b981 0%, #059669 50%, #10b981 100%)',
            borderRadius: '12px',
            border: '3px solid white',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            {/* Líneas del campo */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '10%',
              right: '10%',
              height: '2px',
              background: 'rgba(255,255,255,0.5)'
            }} />
            
            {/* Círculo central */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80px',
              height: '80px',
              border: '2px solid rgba(255,255,255,0.5)',
              borderRadius: '50%'
            }} />

            {/* Área grande */}
            <div style={{
              position: 'absolute',
              bottom: '0',
              left: '25%',
              right: '25%',
              height: '20%',
              border: '2px solid rgba(255,255,255,0.5)',
              borderBottom: 'none'
            }} />

            {/* Área chica */}
            <div style={{
              position: 'absolute',
              bottom: '0',
              left: '35%',
              right: '35%',
              height: '10%',
              border: '2px solid rgba(255,255,255,0.5)',
              borderBottom: 'none'
            }} />

            {/* Posiciones de jugadores */}
            {Object.entries(positions).map(([pos, coords]) => (
              <div
                key={pos}
                onDrop={() => handleDrop(pos)}
                onDragOver={handleDragOver}
                style={{
                  position: 'absolute',
                  top: coords.top,
                  left: coords.left,
                  transform: 'translate(-50%, -50%)',
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: formation[pos] ? 'white' : 'rgba(255,255,255,0.2)',
                  border: '2px dashed rgba(255,255,255,0.5)',
                  cursor: 'pointer'
                }}
              >
                {formation[pos] ? (
                  <>
                    <div style={{
                      fontSize: '0.625rem',
                      fontWeight: 'bold',
                      color: '#1f2937',
                      textAlign: 'center',
                      lineHeight: 1
                    }}>
                      {formation[pos].player_name.split(' ').pop()}
                    </div>
                    <div style={{
                      fontSize: '0.5rem',
                      color: '#6b7280'
                    }}>
                      {pos}
                    </div>
                    <button
                      onClick={() => removeFromFormation(pos)}
                      style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        fontSize: '0.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.8)',
                    fontWeight: '600'
                  }}>
                    {pos}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Leyenda de formación */}
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: 'white',
            borderRadius: '8px',
            border: '2px solid #e5e7eb'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Formación 4-3-3</h4>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
              Arrastra jugadores desde el panel izquierdo a las posiciones en la cancha
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketPitchView;