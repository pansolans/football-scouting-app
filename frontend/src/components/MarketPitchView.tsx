import React, { useState, useEffect, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { useSupabase } from '../hooks/useSupabase';

interface Player {
  id: string;
  player_id: string;
  player_name: string;
  position?: string;
  pitch_position?: { top: number; left: number }; // Posición en la cancha
  image_url?: string;
  nationality?: string;
  age?: number;
  birth_date?: string;
  current_team?: string;
  short_name?: string;
}

interface MarketPitchViewProps {
  marketId: string;
  players: Player[];
  onPositionUpdate: (playerId: string, position: string) => void;
  onRemovePlayer?: (playerId: string) => void;
}

const MarketPitchView: React.FC<MarketPitchViewProps> = ({
  marketId,
  players,
  onPositionUpdate,
  onRemovePlayer
}) => {
  const [editMode, setEditMode] = useState(true); // Siempre en modo edición
  const [positions, setPositions] = useState<Array<{ id: string; top: number; left: number; label: string }>>([]);
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);
  const [playerImages, setPlayerImages] = useState<Record<string, string>>({});
  const [playerPositions, setPlayerPositions] = useState<Record<string, { top: number; left: number }>>({});
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const pitchRef = useRef<HTMLDivElement>(null);
  const supabase = useSupabase();

  // Posiciones iniciales (11 cajas vacías)
  const initialPositions = [
    { id: 'pos1', top: 90, left: 50, label: 'GK' },
    { id: 'pos2', top: 75, left: 20, label: 'DEF' },
    { id: 'pos3', top: 75, left: 40, label: 'DEF' },
    { id: 'pos4', top: 75, left: 60, label: 'DEF' },
    { id: 'pos5', top: 75, left: 80, label: 'DEF' },
    { id: 'pos6', top: 50, left: 30, label: 'MED' },
    { id: 'pos7', top: 50, left: 50, label: 'MED' },
    { id: 'pos8', top: 50, left: 70, label: 'MED' },
    { id: 'pos9', top: 25, left: 25, label: 'DEL' },
    { id: 'pos10', top: 25, left: 50, label: 'DEL' },
    { id: 'pos11', top: 25, left: 75, label: 'DEL' },
  ];

  // Inicializar posiciones
  useEffect(() => {
    setPositions(initialPositions);
    loadPlayerPositions();
  }, [marketId]);

  // Cargar posiciones guardadas de los jugadores
  const loadPlayerPositions = async () => {
    try {
      const { data, error } = await supabase
        .from('market_players')
        .select('id, pitch_position')
        .eq('market_id', marketId)
        .not('pitch_position', 'is', null);

      if (data && !error) {
        const positionsMap: Record<string, { top: number; left: number }> = {};
        data.forEach(item => {
          if (item.pitch_position) {
            positionsMap[item.id] = item.pitch_position;
          }
        });
        setPlayerPositions(positionsMap);
      }
    } catch (error) {
      console.error('Error loading player positions:', error);
    }
  };

  // Guardar posición del jugador en la base de datos
  const savePlayerPosition = async (playerId: string, position: { top: number; left: number }) => {
    try {
      const { error } = await supabase
        .from('market_players')
        .update({ 
          pitch_position: position,
          position: `custom_${position.top}_${position.left}` // Guardamos también como string para compatibilidad
        })
        .eq('id', playerId);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving player position:', error);
    }
  };

  // Cargar imágenes de jugadores
  useEffect(() => {
    const fetchPlayerImages = async () => {
      const imagePromises = players.map(async (player) => {
        if (player.player_id && !player.image_url) {
          try {
            const response = await fetch(
              `https://football-scouting-backend-vd0x.onrender.com/api/player/${player.player_id}/profile`
            );
            if (response.ok) {
              const data = await response.json();
              return { id: player.id, imageUrl: data.imageDataURL };
            }
          } catch (error) {
            console.error('Error fetching player image:', error);
          }
        }
        return { id: player.id, imageUrl: player.image_url || '' };
      });

      const results = await Promise.all(imagePromises);
      const imagesMap = results.reduce((acc, { id, imageUrl }) => {
        if (imageUrl) acc[id] = imageUrl;
        return acc;
      }, {} as Record<string, string>);

      setPlayerImages(imagesMap);
    };

    if (players.length > 0) {
      fetchPlayerImages();
    }
  }, [players]);

  // Manejar el arrastre de posiciones vacías
  const handlePositionDrag = (posId: string, e: React.MouseEvent) => {
    if (!pitchRef.current) return;
    
    e.preventDefault();
    setIsDragging(posId);

    const pitch = pitchRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const position = positions.find(p => p.id === posId);
    if (!position) return;

    const startLeft = position.left;
    const startTop = position.top;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      const newLeft = Math.max(5, Math.min(95, startLeft + (deltaX / pitch.width) * 100));
      const newTop = Math.max(5, Math.min(95, startTop + (deltaY / pitch.height) * 100));

      setPositions(prev => prev.map(p => 
        p.id === posId ? { ...p, top: newTop, left: newLeft } : p
      ));
    };

    const handleMouseUp = () => {
      setIsDragging(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Agregar nueva posición
  const addPosition = () => {
    const newPosition = {
      id: `pos${positions.length + 1}`,
      top: 50,
      left: 50,
      label: 'NUEVA'
    };
    setPositions([...positions, newPosition]);
  };

  // Eliminar posición
  const removePosition = (posId: string) => {
    setPositions(positions.filter(p => p.id !== posId));
  };

  // Obtener jugadores en una posición específica
  const getPlayersAtPosition = (posId: string) => {
    const position = positions.find(p => p.id === posId);
    if (!position) return [];
    
    return players.filter(player => {
      const playerPos = playerPositions[player.id] || player.pitch_position;
      if (!playerPos) return false;
      
      // Verificar si el jugador está cerca de esta posición (tolerancia de 5%)
      const distance = Math.sqrt(
        Math.pow(playerPos.top - position.top, 2) + 
        Math.pow(playerPos.left - position.left, 2)
      );
      return distance < 10;
    });
  };

  const calculateAge = (birthDate: string | undefined) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Renderizar una posición/caja
  const renderPosition = (position: { id: string; top: number; left: number; label: string }) => {
    const playersHere = getPlayersAtPosition(position.id);

    const [{ isOver }, drop] = useDrop(() => ({
      accept: 'player',
      drop: (item: { playerId: string }) => {
        // Guardar la posición del jugador
        const newPosition = { top: position.top, left: position.left };
        setPlayerPositions(prev => ({
          ...prev,
          [item.playerId]: newPosition
        }));
        savePlayerPosition(item.playerId, newPosition);
        onPositionUpdate(item.playerId, position.id);
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }));

    return (
      <div
        ref={drop}
        key={position.id}
        className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move
          ${isDragging === position.id ? 'z-50' : 'z-10'}`}
        style={{
          top: `${position.top}%`,
          left: `${position.left}%`,
          width: '120px',
          minHeight: '60px',
        }}
        onMouseDown={(e) => handlePositionDrag(position.id, e)}
      >
        <div
          className={`
            border-2 border-dashed rounded-lg p-2
            ${isOver ? 'border-blue-500 bg-blue-50' : 'border-white bg-white/20'}
            ${playersHere.length > 0 ? 'bg-white' : ''}
          `}
        >
          <div className="text-xs font-bold text-center text-white mb-1">
            {position.label}
          </div>
          
          {playersHere.length === 0 && (
            <div className="text-xs text-white/70 text-center">Vacío</div>
          )}

          <div className="space-y-1">
            {playersHere.slice(0, 3).map((player) => {
              const age = calculateAge(player.birth_date);
              const imageUrl = playerImages[player.id] || player.image_url;
              
              return (
                <div
                  key={player.id}
                  className="relative"
                  onMouseEnter={() => setHoveredPlayer(player.id)}
                  onMouseLeave={() => setHoveredPlayer(null)}
                >
                  <div className="flex items-center gap-1 bg-white rounded p-1 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt={player.short_name || player.player_name}
                        className="w-6 h-6 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate text-gray-800">
                        {player.short_name || player.player_name.split(' ').slice(-1)[0]}
                      </div>
                      {player.nationality && (
                        <div className="flex items-center gap-1">
                          <img
                            src={`https://flagcdn.com/24x18/${player.nationality.toLowerCase()}.png`}
                            alt={player.nationality}
                            className="w-4 h-3"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          {age && <span className="text-xs text-gray-500">({age})</span>}
                        </div>
                      )}
                    </div>
                    {onRemovePlayer && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Eliminar posición del jugador
                          setPlayerPositions(prev => {
                            const newPositions = { ...prev };
                            delete newPositions[player.id];
                            return newPositions;
                          });
                          savePlayerPosition(player.id, { top: 0, left: 0 });
                          onRemovePlayer(player.id);
                        }}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {hoveredPlayer === player.id && (
                    <div className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-64 bottom-full mb-2 left-1/2 transform -translate-x-1/2">
                      <div className="flex items-start gap-3">
                        {imageUrl && (
                          <img
                            src={imageUrl}
                            alt={player.player_name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-bold text-sm">{player.player_name}</h4>
                          {player.current_team && (
                            <p className="text-xs text-gray-600">{player.current_team}</p>
                          )}
                          {player.nationality && (
                            <div className="flex items-center gap-1 mt-1">
                              <img
                                src={`https://flagcdn.com/24x18/${player.nationality.toLowerCase()}.png`}
                                alt={player.nationality}
                                className="w-4 h-3"
                              />
                              <span className="text-xs">{player.nationality.toUpperCase()}</span>
                            </div>
                          )}
                          {age && (
                            <p className="text-xs text-gray-600 mt-1">Edad: {age} años</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {playersHere.length > 3 && (
            <div className="text-xs text-gray-500 text-center mt-1">
              +{playersHere.length - 3} más
            </div>
          )}

          {editMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                removePosition(position.id);
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-700"
            >
              ×
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-bold">Vista de Cancha</h3>
        <div className="flex gap-2">
          <button
            onClick={addPosition}
            className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            + Agregar Posición
          </button>
          <button
            onClick={() => setPositions(initialPositions)}
            className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Resetear
          </button>
        </div>
      </div>

      <div 
        ref={pitchRef}
        className="relative bg-gradient-to-b from-green-400 to-green-500 rounded-lg overflow-hidden" 
        style={{ aspectRatio: '1', minHeight: '500px' }}
      >
        {/* Líneas del campo */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white opacity-50"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                          w-20 h-20 border-2 border-white opacity-50 rounded-full"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 
                          w-44 h-16 border-2 border-b-0 border-white opacity-50"></div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 
                          w-44 h-16 border-2 border-t-0 border-white opacity-50"></div>
        </div>

        {/* Renderizar posiciones */}
        {positions.map(position => renderPosition(position))}
      </div>

      <div className="mt-4 text-xs text-gray-600">
        <p>• Arrastra las cajas blancas para posicionarlas donde quieras</p>
        <p>• Luego arrastra jugadores desde la lista a las cajas</p>
        <p>• Los jugadores permanecerán en su posición hasta que los muevas</p>
        <p>• Botón × para eliminar cajas o jugadores</p>
      </div>
    </div>
  );
};

export default MarketPitchView;