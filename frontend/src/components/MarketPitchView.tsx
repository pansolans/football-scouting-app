import React, { useState, useEffect, useRef } from 'react';

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
  const [selectedFormation, setSelectedFormation] = useState('custom');
  const [playerDetails, setPlayerDetails] = useState<{[key: string]: any}>({});
  const [hoveredPlayer, setHoveredPlayer] = useState<any>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [editMode, setEditMode] = useState(false);
  const [draggingPosition, setDraggingPosition] = useState<string | null>(null);
  const pitchRef = useRef<HTMLDivElement>(null);

  // Posiciones personalizables - se cargan de localStorage o usan valores por defecto
  const [customPositions, setCustomPositions] = useState<{[key: string]: {top: string, left: string}}>(() => {
    const saved = localStorage.getItem('customPositions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading custom positions:', e);
      }
    }
    return {
      GK: { top: '90%', left: '50%' },
      LB: { top: '75%', left: '15%' },
      CB1: { top: '75%', left: '35%' },
      CB2: { top: '75%', left: '65%' },
      RB: { top: '75%', left: '85%' },
      CDM1: { top: '55%', left: '35%' },
      CDM2: { top: '55%', left: '65%' },
      CM: { top: '45%', left: '50%' },
      LM: { top: '45%', left: '15%' },
      RM: { top: '45%', left: '85%' },
      LW: { top: '20%', left: '20%' },
      ST: { top: '15%', left: '50%' },
      RW: { top: '20%', left: '80%' }
    };
  });

  // Formaciones predefinidas
  const formations: {[key: string]: {[key: string]: {top: string, left: string}}} = {
    '4-3-3': {
      GK: { top: '90%', left: '50%' },
      LB: { top: '75%', left: '15%' },
      CB1: { top: '75%', left: '35%' },
      CB2: { top: '75%', left: '65%' },
      RB: { top: '75%', left: '85%' },
      CDM1: { top: '55%', left: '50%' },
      CM: { top: '45%', left: '35%' },
      RM: { top: '45%', left: '65%' },
      LW: { top: '20%', left: '20%' },
      ST: { top: '15%', left: '50%' },
      RW: { top: '20%', left: '80%' }
    },
    '4-4-2': {
      GK: { top: '90%', left: '50%' },
      LB: { top: '75%', left: '15%' },
      CB1: { top: '75%', left: '35%' },
      CB2: { top: '75%', left: '65%' },
      RB: { top: '75%', left: '85%' },
      LM: { top: '50%', left: '15%' },
      CDM1: { top: '50%', left: '35%' },
      CDM2: { top: '50%', left: '65%' },
      RM: { top: '50%', left: '85%' },
      ST: { top: '20%', left: '35%' },
      RW: { top: '20%', left: '65%' }
    },
    '3-5-2': {
      GK: { top: '90%', left: '50%' },
      CB1: { top: '75%', left: '25%' },
      CB2: { top: '75%', left: '50%' },
      RB: { top: '75%', left: '75%' },
      LM: { top: '50%', left: '10%' },
      CDM1: { top: '55%', left: '35%' },
      CM: { top: '40%', left: '50%' },
      CDM2: { top: '55%', left: '65%' },
      RM: { top: '50%', left: '90%' },
      ST: { top: '20%', left: '35%' },
      RW: { top: '20%', left: '65%' }
    }
  };

  // Guardar posiciones personalizadas cuando cambien
  useEffect(() => {
    if (selectedFormation === 'custom') {
      localStorage.setItem('customPositions', JSON.stringify(customPositions));
    }
  }, [customPositions, selectedFormation]);

  // Cargar formación guardada de localStorage al montar
  useEffect(() => {
    const savedFormation = localStorage.getItem('marketFormation');
    if (savedFormation) {
      try {
        const parsed = JSON.parse(savedFormation);
        const validFormation: {[key: string]: any[]} = {};
        Object.keys(parsed).forEach(pos => {
          validFormation[pos] = parsed[pos].filter((savedPlayer: any) => 
            marketPlayers.some(mp => mp.id === savedPlayer.id)
          );
        });
        setFormation(validFormation);
      } catch (e) {
        console.error('Error loading saved formation:', e);
      }
    }
  }, [marketPlayers]);

  // Guardar formación cuando cambie
  useEffect(() => {
    if (Object.values(formation).some(pos => pos.length > 0)) {
      localStorage.setItem('marketFormation', JSON.stringify(formation));
      onUpdateFormation(formation);
    }
  }, [formation]);

  // Función para obtener detalles de Wyscout
  const fetchPlayerDetails = async (playerId: string) => {
    if (playerDetails[playerId] || !playerId) return;
    
    try {
      const response = await fetch(`${API_URL}/api/player/${playerId}/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const details = await response.json();
        console.log('Details for player', playerId, ':', details);
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

  // Manejar el arrastre de posiciones vacías
  const handlePositionMouseDown = (pos: string, e: React.MouseEvent) => {
    if (!editMode || !pitchRef.current) return;
    
    e.preventDefault();
    setDraggingPosition(pos);
    
    const pitch = pitchRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const positions = selectedFormation === 'custom' ? customPositions : formations[selectedFormation];
    const startTop = parseFloat(positions[pos].top);
    const startLeft = parseFloat(positions[pos].left);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      const newLeft = Math.max(5, Math.min(95, startLeft + (deltaX / pitch.width) * 100));
      const newTop = Math.max(5, Math.min(95, startTop + (deltaY / pitch.height) * 100));
      
      setCustomPositions(prev => ({
        ...prev,
        [pos]: { top: `${newTop}%`, left: `${newLeft}%` }
      }));
      
      // Cambiar automáticamente a formación personalizada cuando se mueva una posición
      if (selectedFormation !== 'custom') {
        setSelectedFormation('custom');
      }
    };
    
    const handleMouseUp = () => {
      setDraggingPosition(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Cambiar formación
  const changeFormation = (formationName: string) => {
    setSelectedFormation(formationName);
    if (formationName !== 'custom' && formations[formationName]) {
      // Copiar la formación predefinida a las posiciones personalizadas
      setCustomPositions(formations[formationName]);
    }
  };

  const handleDragStart = (player: any) => {
    setDraggedPlayer(player);
  };

  const handleDrop = (position: string) => {
    if (draggedPlayer) {
      const currentPositionPlayers = formation[position] || [];
      const maxPlayers = position === 'GK' ? 1 : 3;
      
      if (currentPositionPlayers.length < maxPlayers) {
        const newFormation = { ...formation };
        Object.keys(newFormation).forEach(pos => {
          newFormation[pos] = newFormation[pos].filter((p: any) => p.id !== draggedPlayer.id);
        });
        
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

  const getPlayerImage = (player: any): string | undefined => {
    const details = playerDetails[player.player_id];
    return details?.basic_info?.imageDataURL || details?.imageDataURL;
  };

  const getPlayerShortName = (player: any): string => {
    const details = playerDetails[player.player_id];
    return details?.basic_info?.shortName || player.player_name;
  };

  const getPlayerAge = (player: any): number | string => {
    const details = playerDetails[player.player_id];
    if (details?.basic_info?.birthDate) {
      const birthDate = new Date(details.basic_info.birthDate);
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

  const getPlayerNationality = (player: any): string | undefined => {
    const details = playerDetails[player.player_id];
    return details?.basic_info?.passportArea?.name || details?.basic_info?.birthArea?.name;
  };

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
    
    const playersInPosition = Object.values(formation).flat().filter((p: any) => 
      Object.values(formation).some(pos => pos.includes(player) && pos.length > 2)
    ).length > 0;
    
    return (
      <img 
        src={imgSrc}
        alt={player.player_name}
        style={{
          width: playersInPosition ? '30px' : '35px',
          height: playersInPosition ? '30px' : '35px',
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

  // Obtener las posiciones actuales según la formación seleccionada
  const getCurrentPositions = () => {
    return selectedFormation === 'custom' ? customPositions : formations[selectedFormation];
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
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
          onChange={(e) => changeFormation(e.target.value)}
          style={{
            padding: '0.75rem 1.5rem',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          <option value="custom">Personalizada</option>
          <option value="4-3-3">4-3-3</option>
          <option value="4-4-2">4-4-2</option>
          <option value="3-5-2">3-5-2</option>
        </select>
        
        <button
          onClick={() => setEditMode(!editMode)}
          style={{
            padding: '0.75rem 1.5rem',
            background: editMode ? '#ef4444' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          {editMode ? '✓ Guardar Posiciones' : '✏️ Editar Posiciones'}
        </button>
        
        {editMode && (
          <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Arrastra las cajas vacías para reorganizar
          </span>
        )}
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
                  draggable={!editMode}
                  onDragStart={() => handleDragStart(player)}
                  style={{
                    background: 'white',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    cursor: editMode ? 'not-allowed' : 'grab',
                    opacity: editMode ? 0.5 : 1,
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
          <div 
            ref={pitchRef}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '1100px',
              margin: '0 auto',
              aspectRatio: '1.2',
              background: 'linear-gradient(to bottom, #10b981 0%, #059669 50%, #10b981 100%)',
              borderRadius: '12px',
              border: '3px solid white',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}
          >
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
            {Object.entries(getCurrentPositions()).map(([pos, coords]) => (
              <div
                key={pos}
                onDrop={() => !editMode && handleDrop(pos)}
                onDragOver={handleDragOver}
                onMouseDown={(e) => handlePositionMouseDown(pos, e)}
                style={{
                  position: 'absolute',
                  top: coords.top,
                  left: coords.left,
                  transform: 'translate(-50%, -50%)',
                  minWidth: '100px',
                  minHeight: '60px',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: formation[pos]?.length > 0 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.2)',
                  border: editMode 
                    ? (draggingPosition === pos ? '3px solid #ef4444' : '3px solid #3b82f6')
                    : '2px dashed rgba(255,255,255,0.5)',
                  padding: '0.5rem',
                  gap: '0.25rem',
                  cursor: editMode ? 'move' : 'default',
                  transition: 'border 0.2s'
                }}
              >
                {formation[pos]?.length > 0 ? (
                  formation[pos].map((player: any, index: number) => (
                    <div 
                      key={player.id}
                      onMouseEnter={(e) => {
                        setHoveredPlayer(player);
                        setMousePosition({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseMove={(e) => {
                        setMousePosition({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={() => setHoveredPlayer(null)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'relative',
                        marginBottom: index < formation[pos].length - 1 ? '0.75rem' : 0,
                      }}
                    >
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
                      {!editMode && (
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
                      )}
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
            <h4 style={{ margin: '0 0 0.5rem 0' }}>
              Formación {selectedFormation === 'custom' ? 'Personalizada' : selectedFormation}
            </h4>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
              {editMode 
                ? 'Modo edición: Arrastra las cajas para reorganizar las posiciones. Click en "Guardar Posiciones" cuando termines.'
                : 'Arrastra jugadores desde el panel izquierdo a las posiciones en la cancha. Máximo 3 jugadores por posición (1 para portero).'}
            </p>
          </div>
        </div>
      </div>

      {/* Popup de información del jugador */}
      {hoveredPlayer && (
        <div style={{
          position: 'fixed',
          left: mousePosition.x + 10,
          top: mousePosition.y - 100,
          background: 'white',
          borderRadius: '12px',
          padding: '1rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          zIndex: 2000,
          minWidth: '250px',
          border: '2px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {getPlayerImage(hoveredPlayer) && (
              <img 
                src={getPlayerImage(hoveredPlayer)}
                alt={hoveredPlayer.player_name}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            )}
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>
                {hoveredPlayer.player_name}
              </h4>
              <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                {hoveredPlayer.position} • {getPlayerAge(hoveredPlayer)} años
              </p>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                {hoveredPlayer.current_team}
              </p>
              {hoveredPlayer.estimated_price && (
                <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', fontWeight: 'bold', color: '#10b981' }}>
                  €{hoveredPlayer.estimated_price.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketPitchView;