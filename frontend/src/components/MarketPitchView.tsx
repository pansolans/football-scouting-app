import React, { useState, useEffect } from 'react';

const API_URL = 'https://football-scouting-backend-vd0x.onrender.com';

interface MarketPitchViewProps {
  marketPlayers: any[];
  onUpdateFormation: (formation: any) => void;
}

const MarketPitchView: React.FC<MarketPitchViewProps> = ({ marketPlayers, onUpdateFormation }) => {
  const [formation, setFormation] = useState<{[key: string]: any[]}>({
    GK: [],
    LB: [], CB1: [], CB2: [], RB: [],
    CDM1: [], CDM2: [],
    CM: [], LM: [], RM: [],
    LW: [], ST: [], RW: []
  });

  const [draggedPlayer, setDraggedPlayer] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'pitch'>('list');
  const [selectedFormation, setSelectedFormation] = useState('4-3-3');
  const [playerDetails, setPlayerDetails] = useState<{[key: string]: any}>({});

  // Diferentes formaciones tácticas
  const formations: {[key: string]: {[key: string]: {top: string, left: string}}} = {
    '4-3-3': {
      GK: { top: '85%', left: '50%' },
      LB: { top: '70%', left: '15%' },
      CB1: { top: '70%', left: '35%' },
      CB2: { top: '70%', left: '65%' },
      RB: { top: '70%', left: '85%' },
      CDM1: { top: '50%', left: '50%' },
      CM: { top: '40%', left: '35%' },
      RM: { top: '40%', left: '65%' },
      LW: { top: '20%', left: '15%' },
      ST: { top: '15%', left: '50%' },
      RW: { top: '20%', left: '85%' }
    },
    '4-4-2': {
      GK: { top: '85%', left: '50%' },
      LB: { top: '70%', left: '15%' },
      CB1: { top: '70%', left: '35%' },
      CB2: { top: '70%', left: '65%' },
      RB: { top: '70%', left: '85%' },
      LM: { top: '45%', left: '15%' },
      CDM1: { top: '50%', left: '35%' },
      CDM2: { top: '50%', left: '65%' },
      RM: { top: '45%', left: '85%' },
      ST: { top: '20%', left: '35%' },
      RW: { top: '20%', left: '65%' }
    },
    '3-5-2': {
      GK: { top: '85%', left: '50%' },
      CB1: { top: '70%', left: '25%' },
      CB2: { top: '70%', left: '50%' },
      RB: { top: '70%', left: '75%' },
      LM: { top: '45%', left: '10%' },
      CDM1: { top: '50%', left: '35%' },
      CM: { top: '45%', left: '50%' },
      CDM2: { top: '50%', left: '65%' },
      RM: { top: '45%', left: '90%' },
      ST: { top: '20%', left: '35%' },
      RW: { top: '20%', left: '65%' }
    }
  };

  // Función para obtener detalles de Wyscout
  const fetchPlayerDetails = async (playerId: string) => {
    if (playerDetails[playerId]) return; // Ya lo tenemos
    
    try {
      const response = await fetch(`${API_URL}/api/wyscout/player/${playerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const details = await response.json();
        setPlayerDetails(prev => ({...prev, [playerId]: details}));
      }
    } catch (error) {
      console.error('Error fetching player details:', error);
    }
  };

  // UseEffect para cargar detalles cuando cambien los jugadores
  useEffect(() => {
    marketPlayers.forEach(player => {
      if (player.player_type === 'wyscout' && player.player_id) {
        fetchPlayerDetails(player.player_id);
      }
    });
  }, [marketPlayers]);

  const handleDragStart = (player: any) => {
    setDraggedPlayer(player);
  };

  const handleDrop = (position: string) => {
    if (draggedPlayer) {
      const currentPositionPlayers = formation[position] || [];
      // Permitir hasta 3 jugadores por posición (excepto portero)
      const maxPlayers = position === 'GK' ? 1 : 3;
      
      if (currentPositionPlayers.length < maxPlayers) {
        // Remover jugador de su posición anterior si existe
        const newFormation = { ...formation };
        Object.keys(newFormation).forEach(pos => {
          newFormation[pos] = newFormation[pos].filter((p: any) => p.id !== draggedPlayer.id);
        });
        
        // Agregar a la nueva posición
        newFormation[position] = [...(newFormation[position] || []), draggedPlayer];
        setFormation(newFormation);
      } else {
        alert(`Máximo ${maxPlayers} jugador(es) en esta posición`);
      }
      setDraggedPlayer(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeFromFormation = (position: string, playerId: string) => {
    const newFormation = { ...formation };
    newFormation[position] = newFormation[position].filter((p: any) => p.id !== playerId);
    setFormation(newFormation);
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'alta': return '#ef4444';
      case 'media': return '#f59e0b';
      case 'baja': return '#10b981';
      default: return '#6b7280';
    }
  };

  // Función para obtener la imagen del jugador
  const getPlayerImage = (player: any): string | undefined => {
    const details = playerDetails[player.player_id];
    return details?.imageDataURL;
  };

  // Función para obtener el nombre corto
  const getPlayerShortName = (player: any): string => {
    const details = playerDetails[player.player_id];
    return details?.shortName || player.player_name;
  };

  // Función para calcular edad desde fecha de nacimiento
  const getPlayerAge = (player: any): number | string => {
    const details = playerDetails[player.player_id];
    if (details?.birthDate) {
      const birthDate = new Date(details.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    }
    return player.age || '?';
  };

  // Función para obtener la nacionalidad
  const getPlayerNationality = (player: any): string | undefined => {
    const details = playerDetails[player.player_id];
    return details?.passportArea?.name;
  };

  // Función para obtener código de país de 2 letras
  const getCountryCode = (nationality: string): string => {
    const countryMap: {[key: string]: string} = {
      'Argentina': 'ar',
      'Brazil': 'br',
      'Spain': 'es',
      'France': 'fr',
      'Germany': 'de',
      'Italy': 'it',
      'England': 'gb',
      'United Kingdom': 'gb',
      'Portugal': 'pt',
      'Netherlands': 'nl',
      'Belgium': 'be',
      'Uruguay': 'uy',
      'Colombia': 'co',
      'Mexico': 'mx',
      'Poland': 'pl',
      'Croatia': 'hr',
      'Serbia': 'rs'
    };
    
    return countryMap[nationality] || nationality?.toLowerCase().substring(0, 2) || '';
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
                    {player.position} • {getPlayerAge(player)} años • {player.current_team}
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

  const playerImage = (player: any) => {
    const imgSrc = getPlayerImage(player);
    if (!imgSrc) return null;
    
    return (
      <img 
        src={imgSrc}
        alt={player.player_name}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          objectFit: 'cover'
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  };

  const playerImageSmall = (player: any) => {
    const imgSrc = getPlayerImage(player);
    if (!imgSrc) return null;
    
    return (
      <img 
        src={imgSrc}
        alt={player.player_name}
        style={{
          width: '35px',
          height: '35px',
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setViewMode('list')}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          ← Ver Lista
        </button>
        
        <select
          value={selectedFormation}
          onChange={(e) => setSelectedFormation(e.target.value)}
          style={{
            padding: '0.75rem 1.5rem',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          <option value="4-3-3">4-3-3</option>
          <option value="4-4-2">4-4-2</option>
          <option value="3-5-2">3-5-2</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* Panel izquierdo - Jugadores disponibles */}
        <div style={{ width: '350px' }}>
          <h3 style={{ marginBottom: '1rem' }}>Jugadores Disponibles</h3>
          <div style={{
            background: '#f9fafb',
            borderRadius: '8px',
            padding: '1rem',
            maxHeight: '700px',
            overflow: 'auto'
          }}>
            {marketPlayers
              .filter(p => !Object.values(formation).flat().some((f: any) => f?.id === p.id))
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
                    border: '2px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  {playerImage(player)}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                      {getPlayerShortName(player)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {player.position} • {getPlayerAge(player)} años
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
                </div>
              ))}
          </div>
        </div>

        {/* Cancha */}
        <div style={{ flex: 1 }}>
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '900px',
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
              width: '100px',
              height: '100px',
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
            {Object.entries(formations[selectedFormation]).map(([pos, coords]) => (
              <div
                key={pos}
                onDrop={() => handleDrop(pos)}
                onDragOver={handleDragOver}
                style={{
                  position: 'absolute',
                  top: coords.top,
                  left: coords.left,
                  transform: 'translate(-50%, -50%)',
                  minWidth: '90px',
                  minHeight: '110px',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: formation[pos]?.length > 0 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.2)',
                  border: '2px dashed rgba(255,255,255,0.5)',
                  padding: '0.5rem',
                  gap: '0.25rem'
                }}
              >
                {formation[pos]?.length > 0 ? (
                  formation[pos].map((player: any, index: number) => (
                    <div key={player.id} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      marginBottom: index < formation[pos].length - 1 ? '0.5rem' : 0
                    }}>
                      {playerImageSmall(player)}
                      <div style={{
                        fontSize: '0.625rem',
                        fontWeight: 'bold',
                        color: '#1f2937',
                        textAlign: 'center',
                        lineHeight: 1,
                        marginTop: '0.25rem'
                      }}>
                        {getPlayerShortName(player)}
                      </div>
                      <div style={{
                        fontSize: '0.5rem',
                        color: '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {getPlayerAge(player)}
                        {getPlayerNationality(player) && (
                          <img 
                            src={`https://flagcdn.com/16x12/${getCountryCode(getPlayerNationality(player)!)}.png`}
                            alt={getPlayerNationality(player)}
                            style={{ width: '16px', height: '12px' }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                      <button
                        onClick={() => removeFromFormation(pos, player.id)}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          fontSize: '0.625rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{
                    fontSize: '0.875rem',
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
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Formación {selectedFormation}</h4>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
              Arrastra jugadores desde el panel izquierdo a las posiciones en la cancha.
              Máximo 3 jugadores por posición (1 para portero).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketPitchView;