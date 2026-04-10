import React, { useState, useEffect, useRef } from 'react';
import { playerService } from '../services/api';

import { API_URL } from '../config';

interface MarketPitchViewProps {
  marketPlayers: any[];
  marketId: string;
  onUpdateFormation: (formation: any) => void;
  onPlayerDeleted?: () => void;
}

const MarketPitchView: React.FC<MarketPitchViewProps> = ({ marketPlayers, marketId, onUpdateFormation, onPlayerDeleted }) => {
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
    const saved = localStorage.getItem(`customPositions_${marketId}`);
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
    if (selectedFormation === 'custom' && marketId) {
      localStorage.setItem(`customPositions_${marketId}`, JSON.stringify(customPositions));
    }
  }, [customPositions, selectedFormation, marketId]);

  // Cargar formacion guardada de localStorage al montar
  useEffect(() => {
    if (!marketId) return;

    const savedFormation = localStorage.getItem(`marketFormation_${marketId}`);
    if (savedFormation && marketPlayers.length > 0) {
      try {
        const parsed = JSON.parse(savedFormation);
        setFormation(parsed);
      } catch (e) {
        console.error('Error loading saved formation:', e);
      }
    }
  }, [marketId, marketPlayers]);

  // Guardar formacion cuando cambie
  useEffect(() => {
    if (marketId && Object.values(formation).some(pos => pos.length > 0)) {
      localStorage.setItem(`marketFormation_${marketId}`, JSON.stringify(formation));
      onUpdateFormation(formation);
    }
  }, [formation, marketId]);

  // Cargar detalles de todos los jugadores Wyscout en una sola llamada batch
  const fetchedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const wyscoutIds = marketPlayers
      .filter(p => p.player_type === 'wyscout' && p.player_id)
      .map(p => String(p.player_id))
      .filter(id => !fetchedIdsRef.current.has(id));

    if (wyscoutIds.length === 0) return;

    // Marcar como en proceso para no duplicar
    wyscoutIds.forEach(id => fetchedIdsRef.current.add(id));

    const fetchBatch = async () => {
      try {
        const numericIds = wyscoutIds.map(id => parseInt(id)).filter(id => !isNaN(id));
        const batchData = await playerService.getPlayersBatchInfo(numericIds, [], true);
        setPlayerDetails(prev => ({ ...prev, ...batchData }));
      } catch (error) {
        console.error('Error fetching batch player details:', error);
        // Permitir reintentar si fallo
        wyscoutIds.forEach(id => fetchedIdsRef.current.delete(id));
      }
    };

    fetchBatch();
  }, [marketPlayers]);

  // Manejar el arrastre de posiciones vacias
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

      // Cambiar automaticamente a formacion personalizada cuando se mueva una posicion
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

  // Cambiar formacion
  const changeFormation = (formationName: string) => {
    setSelectedFormation(formationName);
    if (formationName !== 'custom' && formations[formationName]) {
      // Copiar la formacion predefinida a las posiciones personalizadas
      setCustomPositions(formations[formationName]);
    }
  };

  const handleDragStart = (player: any) => {
    setDraggedPlayer(player);
  };

  const handleDrop = (position: string) => {
    if (draggedPlayer) {
      const currentPositionPlayers = formation[position] || [];
      const maxPlayers = 3;

      if (currentPositionPlayers.length < maxPlayers) {
        const newFormation = { ...formation };
        Object.keys(newFormation).forEach(pos => {
          newFormation[pos] = newFormation[pos].filter((p: any) => p.id !== draggedPlayer.id);
        });

        newFormation[position] = [...(newFormation[position] || []), draggedPlayer];
        setFormation(newFormation);
      } else {
        alert(`Maximo ${maxPlayers} jugador(es) en esta posicion`);
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
    return details?.player_image;
  };

  const getPlayerShortName = (player: any): string => {
    const details = playerDetails[player.player_id];
    return details?.short_name || player.player_name;
  };

  const getPlayerAge = (player: any): number | string => {
    const details = playerDetails[player.player_id];
    return details?.age || player.age || '?';
  };

  const getPlayerNationality = (player: any): string | undefined => {
    const details = playerDetails[player.player_id];
    return details?.nationality || details?.birth_country;
  };

  const getPlayerCurrentTeam = (player: any): string => {
    const details = playerDetails[player.player_id];
    return details?.team_name || player.current_team || 'Sin equipo';
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
      'Serbia': 'rs',
      'Paraguay': 'py',
      'Peru': 'pe',
      'Chile': 'cl',
      'Ecuador': 'ec',
      'Bolivia': 'bo',
      'Venezuela': 've',
      'United States': 'us',
      'Canada': 'ca',
      'Japan': 'jp',
      'South Korea': 'kr',
      'Australia': 'au',
      'Turkey': 'tr',
      'Russia': 'ru',
      'Ukraine': 'ua',
      'Sweden': 'se',
      'Norway': 'no',
      'Denmark': 'dk',
      'Switzerland': 'ch',
      'Austria': 'at',
      'Czech Republic': 'cz',
      'Greece': 'gr',
      'Morocco': 'ma',
      'Egypt': 'eg',
      'Senegal': 'sn',
      'Nigeria': 'ng',
      'Ghana': 'gh',
      'Cameroon': 'cm',
      'Ivory Coast': 'ci',
      'Algeria': 'dz',
      'Tunisia': 'tn'
    };

    return countryMap[nationality] || '';
  };


  // Funcion para eliminar jugador del mercado
  const handleDeletePlayer = async (playerId: string, playerName: string) => {
    if (!window.confirm(`Eliminar a ${playerName} del mercado?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/markets/players/${playerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Jugador eliminado del mercado');
        if (onPlayerDeleted) {
          onPlayerDeleted();
        }
      } else {
        alert('Error al eliminar jugador');
      }
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('Error al eliminar jugador');
    }
  };

  if (viewMode === 'list') {
    return (
      <div>
        <button
          onClick={() => setViewMode('pitch')}
          className="px-6 py-3 bg-accent text-white border-none rounded-lg cursor-pointer font-semibold mb-4 hover:opacity-90 transition-opacity"
        >
          Ver en Cancha
        </button>

        <div className="grid gap-4">
          {marketPlayers.map(player => (
            <div
              key={player.id}
              className="bg-card rounded-xl p-6 border-2 border-border-strong flex justify-between items-start"
            >
              <div className="flex-1">
                <h3 className="text-xl font-semibold m-0 text-text">
                  {player.player_name}
                </h3>
                <p className="text-sm text-text-muted mt-1">
                  {player.position} - {getPlayerAge(player)} anos - {getPlayerCurrentTeam(player)}
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <span
                  className="px-3 py-1 rounded-xl text-xs font-semibold"
                  style={{
                    background: `${getPriorityColor(player.priority)}20`,
                    color: getPriorityColor(player.priority),
                  }}
                >
                  Prioridad {player.priority}
                </span>
                <button
                  onClick={() => handleDeletePlayer(player.id, player.player_name)}
                  className="px-4 py-2 bg-red-500 text-white border-none rounded-lg cursor-pointer text-sm font-semibold hover:bg-red-600 transition-colors"
                >
                  Eliminar
                </button>
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
        className="w-10 h-10 rounded-full object-cover"
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
        className={`rounded-full object-cover border-2 border-white shadow ${
          playersInPosition ? 'w-[30px] h-[30px]' : 'w-[35px] h-[35px]'
        }`}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  };

  // Obtener las posiciones actuales segun la formacion seleccionada
  const getCurrentPositions = () => {
    return selectedFormation === 'custom' ? customPositions : formations[selectedFormation];
  };

  return (
    <div>
      <div className="flex gap-4 mb-4 items-center">
        <button
          onClick={() => setViewMode('list')}
          className="px-6 py-3 bg-white/8 text-text-secondary border-none rounded-lg cursor-pointer hover:bg-card-hover transition-colors"
        >
          &larr; Ver Lista
        </button>

        <select
          value={selectedFormation}
          onChange={(e) => changeFormation(e.target.value)}
          className="px-6 py-3 bg-surface border border-border-strong rounded-lg cursor-pointer font-semibold text-sm text-text"
        >
          <option value="custom">Personalizada</option>
          <option value="4-3-3">4-3-3</option>
          <option value="4-4-2">4-4-2</option>
          <option value="3-5-2">3-5-2</option>
        </select>

        <button
          onClick={() => setEditMode(!editMode)}
          className={`px-6 py-3 text-white border-none rounded-lg cursor-pointer font-semibold transition-colors ${
            editMode ? 'bg-red-500 hover:bg-red-600' : 'bg-accent hover:opacity-90'
          }`}
        >
          {editMode ? 'Guardar Posiciones' : 'Editar Posiciones'}
        </button>

        {editMode && (
          <span className="text-text-muted text-sm">
            Arrastra las cajas vacias para reorganizar
          </span>
        )}
      </div>

      <div className="flex gap-8">
        {/* Panel izquierdo - Jugadores disponibles */}
        <div className="w-[350px]">
          <h3 className="mb-4 text-text">Jugadores Disponibles</h3>
          <div className="bg-surface rounded-lg p-4 max-h-[700px] overflow-auto">
            {marketPlayers
              .filter(p => !Object.values(formation).flat().some((f: any) => f?.id === p.id))
              .map(player => (
                <div
                  key={player.id}
                  draggable={!editMode}
                  onDragStart={() => handleDragStart(player)}
                  className={`bg-card rounded-lg p-3 mb-2 border-2 border-border-strong flex items-center gap-3 ${
                    editMode ? 'cursor-not-allowed opacity-50' : 'cursor-grab hover:border-accent/30'
                  }`}
                >
                  {playerImage(player)}
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-text">
                      {getPlayerShortName(player)}
                    </div>
                    <div className="text-xs text-text-muted">
                      {player.position} - {getPlayerAge(player)} anos
                    </div>
                    <span
                      className="inline-block mt-1 px-2 py-0.5 rounded-lg text-[0.625rem] font-semibold"
                      style={{
                        background: `${getPriorityColor(player.priority)}20`,
                        color: getPriorityColor(player.priority),
                      }}
                    >
                      {player.priority}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Cancha */}
        <div className="flex-1">
          <div
            ref={pitchRef}
            className="relative w-full max-w-[1100px] mx-auto rounded-xl border-[3px] border-white shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
            style={{
              aspectRatio: '1.2',
              background: 'linear-gradient(to bottom, #10b981 0%, #059669 50%, #10b981 100%)',
            }}
          >
            {/* Lineas del campo */}
            <div className="absolute top-1/2 left-[10%] right-[10%] h-[2px] bg-white/50" />

            {/* Circulo central */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] border-2 border-white/50 rounded-full" />

            {/* Area grande */}
            <div className="absolute bottom-0 left-1/4 right-1/4 h-[20%] border-2 border-white/50 border-b-0" />

            {/* Area chica */}
            <div className="absolute bottom-0 left-[35%] right-[35%] h-[10%] border-2 border-white/50 border-b-0" />

            {/* Posiciones de jugadores */}
            {Object.entries(getCurrentPositions()).map(([pos, coords]) => (
              <div
                key={pos}
                onDrop={() => !editMode && handleDrop(pos)}
                onDragOver={handleDragOver}
                onMouseDown={(e) => handlePositionMouseDown(pos, e)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 min-w-[100px] min-h-[60px] rounded-lg flex flex-col items-center justify-center p-2 gap-1 transition-[border] duration-200 ${
                  editMode ? 'cursor-move' : 'cursor-default'
                }`}
                style={{
                  top: coords.top,
                  left: coords.left,
                  background: formation[pos]?.length > 0 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.2)',
                  border: editMode
                    ? (draggingPosition === pos ? '3px solid #ef4444' : '3px solid #3b82f6')
                    : '2px dashed rgba(255,255,255,0.5)',
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
                      className="flex flex-col items-center relative"
                      style={{
                        marginBottom: index < formation[pos].length - 1 ? '0.75rem' : 0,
                      }}
                    >
                      {playerImageSmall(player)}
                      <div className="text-[0.625rem] font-bold text-gray-900 text-center leading-none mt-1">
                        {getPlayerShortName(player)}
                      </div>
                      <div className="text-[0.5rem] text-gray-500 flex items-center gap-1">
                        {getPlayerAge(player)}
                        {getPlayerNationality(player) && (
                          <img
                            src={`https://flagcdn.com/16x12/${getCountryCode(getPlayerNationality(player)!)}.png`}
                            alt={getPlayerNationality(player)}
                            className="w-4 h-3"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                      {!editMode && (
                        <button
                          onClick={() => removeFromFormation(pos, player.id)}
                          className="absolute -top-2 -right-2 w-[18px] h-[18px] rounded-full bg-red-500 text-white border-none text-[0.625rem] cursor-pointer flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          x
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-white/80 font-semibold">
                    {pos}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Leyenda de formacion */}
          <div className="mt-4 p-4 bg-card rounded-lg border-2 border-border-strong">
            <h4 className="m-0 mb-2 text-text">
              Formacion {selectedFormation === 'custom' ? 'Personalizada' : selectedFormation}
            </h4>
            <p className="text-sm text-text-muted m-0">
              {editMode
                ? 'Modo edicion: Arrastra las cajas para reorganizar las posiciones. Click en "Guardar Posiciones" cuando termines.'
                : 'Arrastra jugadores desde el panel izquierdo a las posiciones en la cancha. Maximo 3 jugadores por posicion (1 para portero).'}
            </p>
          </div>
        </div>
      </div>

      {/* Popup de informacion del jugador */}
      {hoveredPlayer && (
        <div
          className="fixed bg-card rounded-xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.3)] z-[2000] min-w-[250px] border-2 border-border-strong"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 100,
          }}
        >
          <div className="flex items-center gap-4">
            {getPlayerImage(hoveredPlayer) && (
              <img
                src={getPlayerImage(hoveredPlayer)}
                alt={hoveredPlayer.player_name}
                className="w-[60px] h-[60px] rounded-full object-cover"
              />
            )}
            <div>
              <h4 className="m-0 text-base font-bold text-text">
                {hoveredPlayer.player_name}
              </h4>
              <p className="my-1 text-sm text-text-muted">
                {hoveredPlayer.position} - {getPlayerAge(hoveredPlayer)} anos
              </p>
              <p className="m-0 text-sm text-text-muted">
                {getPlayerCurrentTeam(hoveredPlayer)}
              </p>
              {hoveredPlayer.estimated_price && (
                <p className="my-1 text-sm font-bold text-emerald-500">
                  EUR {hoveredPlayer.estimated_price.toLocaleString()}
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
