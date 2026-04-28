import React, { useState, useEffect, useRef, useMemo } from 'react';
import { playerService } from '../services/api';

import { API_URL } from '../config';

interface MarketPitchViewProps {
  marketPlayers: any[];
  marketId: string;
  market?: any;
  onUpdateFormation: (formation: any) => void;
  onPlayerDeleted?: () => void;
  onPlayerUpdated?: () => void;
  onMarketUpdated?: (updated: any) => void;
}

const DEFAULT_POSITIONS = {
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

const EMPTY_FORMATION: {[key: string]: any[]} = {
  GK: [],
  LB: [], CB1: [], CB2: [], RB: [],
  CDM1: [], CDM2: [],
  CM: [], LM: [], RM: [],
  LW: [], ST: [], RW: []
};

// Categorias de posicion (mismas que el formulario de reportes)
const POSITION_CATEGORIES: { key: string; label: string; match: string[] }[] = [
  { key: 'gk',     label: 'Arqueros',             match: ['arquero', 'goalkeeper', 'portero'] },
  { key: 'lat_r',  label: 'Laterales Derechos',   match: ['lateral derecho', 'right back'] },
  { key: 'lat_l',  label: 'Laterales Izquierdos', match: ['lateral izquierdo', 'left back'] },
  { key: 'cb_r',   label: 'Centrales Derechos',   match: ['central derecho', 'right centre back', 'right center back'] },
  { key: 'cb_l',   label: 'Centrales Izquierdos', match: ['central izquierdo', 'left centre back', 'left center back'] },
  { key: 'cb',     label: 'Centrales',            match: ['central', 'centre back', 'center back'] },
  { key: 'vol_c',  label: 'Volantes Centrales',   match: ['volante central', 'defensive midfielder'] },
  { key: 'vol_i',  label: 'Volantes Internos',    match: ['volante interno', 'central midfielder'] },
  { key: 'vol_a',  label: 'Volantes por Afuera',  match: ['volante por afuera', 'wide midfielder', 'right midfielder', 'left midfielder'] },
  { key: 'ext_r',  label: 'Extremos Derechos',    match: ['extremo derecho', 'right winger'] },
  { key: 'ext_l',  label: 'Extremos Izquierdos',  match: ['extremo izquierdo', 'left winger'] },
  { key: 'fwd',    label: 'Delanteros',           match: ['delantero', 'striker', 'centre forward', 'center forward', 'forward'] },
];

const getPositionCategory = (position: string | undefined): string => {
  const p = (position || '').toLowerCase();
  if (!p) return 'other';
  for (const cat of POSITION_CATEGORIES) {
    if (cat.match.some(m => p.includes(m))) return cat.key;
  }
  return 'other';
};

const positionOrderIndex = (position: string | undefined): number => {
  const cat = getPositionCategory(position);
  const idx = POSITION_CATEGORIES.findIndex(c => c.key === cat);
  return idx === -1 ? 99 : idx;
};

const PRIORITY_ORDER: Record<string, number> = { alta: 0, media: 1, baja: 2 };

const STATUS_OPTIONS = [
  { value: 'seguimiento', label: 'Seguimiento', color: '#3b82f6' },
  { value: 'negociando',  label: 'Negociando',  color: '#f59e0b' },
  { value: 'descartado',  label: 'Descartado',  color: '#6b7280' },
  { value: 'fichado',     label: 'Fichado',     color: '#10b981' },
];

const getStatusInfo = (status: string | undefined) => {
  return STATUS_OPTIONS.find(s => s.value === status) || { value: status || '', label: status || 'Sin estado', color: '#6b7280' };
};

const MarketPitchView: React.FC<MarketPitchViewProps> = ({ marketPlayers, marketId, market, onUpdateFormation, onPlayerDeleted, onPlayerUpdated, onMarketUpdated }) => {
  const [formation, setFormation] = useState<{[key: string]: any[]}>(
    () => ({ ...EMPTY_FORMATION, ...(market?.formation_data || {}) })
  );

  const [draggedPlayer, setDraggedPlayer] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'pitch'>('list');
  const [selectedFormation, setSelectedFormation] = useState(
    () => market?.formation_layout?.formation_name || 'custom'
  );
  const [playerDetails, setPlayerDetails] = useState<{[key: string]: any}>({});
  const [hoveredPlayer, setHoveredPlayer] = useState<any>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const hoverHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showHover = (player: any) => {
    if (hoverHideTimerRef.current) {
      clearTimeout(hoverHideTimerRef.current);
      hoverHideTimerRef.current = null;
    }
    setHoveredPlayer(player);
  };

  const scheduleHideHover = () => {
    if (hoverHideTimerRef.current) clearTimeout(hoverHideTimerRef.current);
    hoverHideTimerRef.current = setTimeout(() => {
      setHoveredPlayer(null);
      hoverHideTimerRef.current = null;
    }, 140);
  };

  const cancelHideHover = () => {
    if (hoverHideTimerRef.current) {
      clearTimeout(hoverHideTimerRef.current);
      hoverHideTimerRef.current = null;
    }
  };

  const computeHoverPopupStyle = (mouseX: number, mouseY: number) => {
    const margin = 12;
    const popupWidth = 360;
    const minHeight = 220;
    const idealTop = Math.max(mouseY - 60, margin);
    const maxAllowedTop = window.innerHeight - minHeight - margin;
    const top = Math.min(idealTop, Math.max(maxAllowedTop, margin));
    const maxHeight = window.innerHeight - top - margin;
    const left = Math.min(mouseX + 16, window.innerWidth - popupWidth - margin);
    return { left, top, maxHeight: `${maxHeight}px` };
  };
  const [editMode, setEditMode] = useState(false);
  const [draggingPosition, setDraggingPosition] = useState<string | null>(null);
  const pitchRef = useRef<HTMLDivElement>(null);

  // Notas / info por jugador
  const [notesModalPlayer, setNotesModalPlayer] = useState<any | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [notesEditing, setNotesEditing] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  // Detalles editables (status / precios / agente)
  const [detailsDraft, setDetailsDraft] = useState({
    status: 'seguimiento',
    estimated_price: '',
    max_price: '',
    agent: '',
  });
  const [savingDetails, setSavingDetails] = useState(false);

  // Orden del listado
  const [listSort, setListSort] = useState<'date' | 'position' | 'priority'>('date');

  // Filtros del listado
  const [filters, setFilters] = useState({
    priority: 'all',
    positionCategory: 'all',
    status: 'all',
    ageMin: '',
    ageMax: '',
  });
  const resetFilters = () => setFilters({ priority: 'all', positionCategory: 'all', status: 'all', ageMin: '', ageMax: '' });
  const activeFilterCount = (
    (filters.priority !== 'all' ? 1 : 0) +
    (filters.positionCategory !== 'all' ? 1 : 0) +
    (filters.status !== 'all' ? 1 : 0) +
    (filters.ageMin ? 1 : 0) +
    (filters.ageMax ? 1 : 0)
  );

  const filteredPlayers = useMemo(() => {
    return marketPlayers.filter(p => {
      if (filters.priority !== 'all' && p.priority !== filters.priority) return false;
      if (filters.status !== 'all' && p.status !== filters.status) return false;
      if (filters.positionCategory !== 'all' && getPositionCategory(p.position) !== filters.positionCategory) return false;
      const age = Number(p.age);
      if (filters.ageMin && (!age || age < Number(filters.ageMin))) return false;
      if (filters.ageMax && (!age || age > Number(filters.ageMax))) return false;
      return true;
    });
  }, [marketPlayers, filters]);

  const sortedPlayers = useMemo(() => {
    const arr = [...filteredPlayers];
    if (listSort === 'position') {
      arr.sort((a, b) => {
        const ca = positionOrderIndex(a.position);
        const cb = positionOrderIndex(b.position);
        if (ca !== cb) return ca - cb;
        return (a.position || '').localeCompare(b.position || '');
      });
    } else if (listSort === 'priority') {
      arr.sort((a, b) => {
        const pa = PRIORITY_ORDER[a.priority] ?? 99;
        const pb = PRIORITY_ORDER[b.priority] ?? 99;
        return pa - pb;
      });
    }
    return arr;
  }, [filteredPlayers, listSort]);

  const groupedByPosition = useMemo(() => {
    if (listSort !== 'position') return null;
    const groups: Record<string, any[]> = {};
    sortedPlayers.forEach(p => {
      const cat = getPositionCategory(p.position);
      (groups[cat] = groups[cat] || []).push(p);
    });
    return groups;
  }, [sortedPlayers, listSort]);

  const openNotesModal = (player: any) => {
    setNotesModalPlayer(player);
    setNotesDraft(player.notes || '');
    setNotesEditing(!player.notes);
    setDetailsDraft({
      status: player.status || 'seguimiento',
      estimated_price: player.estimated_price != null ? String(player.estimated_price) : '',
      max_price: player.max_price != null ? String(player.max_price) : '',
      agent: player.agent || '',
    });
  };

  const closeNotesModal = () => {
    setNotesModalPlayer(null);
    setNotesDraft('');
    setNotesEditing(false);
    setSavingNotes(false);
    setDetailsDraft({ status: 'seguimiento', estimated_price: '', max_price: '', agent: '' });
    setSavingDetails(false);
  };

  const saveDetails = async () => {
    if (!notesModalPlayer) return;
    setSavingDetails(true);
    try {
      const payload: any = {
        status: detailsDraft.status,
        agent: detailsDraft.agent || null,
        estimated_price: detailsDraft.estimated_price ? parseFloat(detailsDraft.estimated_price) : null,
        max_price: detailsDraft.max_price ? parseFloat(detailsDraft.max_price) : null,
      };
      const response = await fetch(`${API_URL}/api/markets/players/${notesModalPlayer.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        Object.assign(notesModalPlayer, payload);
        if (onPlayerUpdated) onPlayerUpdated();
      } else {
        const err = await response.json().catch(() => null);
        alert(err?.detail || 'Error al guardar los detalles');
      }
    } catch (error) {
      console.error('Error saving details:', error);
      alert('Error al guardar los detalles');
    } finally {
      setSavingDetails(false);
    }
  };

  const saveNotes = async () => {
    if (!notesModalPlayer) return;
    setSavingNotes(true);
    try {
      const response = await fetch(`${API_URL}/api/markets/players/${notesModalPlayer.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: notesDraft })
      });
      if (response.ok) {
        notesModalPlayer.notes = notesDraft;
        if (onPlayerUpdated) onPlayerUpdated();
        setNotesEditing(false);
      } else {
        alert('Error al guardar la informacion');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Error al guardar la informacion');
    } finally {
      setSavingNotes(false);
    }
  };

  const updatePlayerPosition = async (newPosition: string) => {
    if (!notesModalPlayer) return;
    const previous = notesModalPlayer.position;
    if (previous === newPosition) return;

    notesModalPlayer.position = newPosition;
    setFormation(prev => {
      const next: {[key: string]: any[]} = {};
      for (const [pos, players] of Object.entries(prev)) {
        next[pos] = players.map((p: any) =>
          p.id === notesModalPlayer.id ? { ...p, position: newPosition } : p
        );
      }
      return next;
    });

    try {
      const response = await fetch(`${API_URL}/api/markets/players/${notesModalPlayer.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ position: newPosition })
      });
      if (response.ok) {
        if (onPlayerUpdated) onPlayerUpdated();
      } else {
        notesModalPlayer.position = previous;
        alert('Error al actualizar posicion');
      }
    } catch (error) {
      console.error('Error updating position:', error);
      notesModalPlayer.position = previous;
      alert('Error al actualizar posicion');
    }
  };

  const updatePriority = async (newPriority: 'alta' | 'media' | 'baja') => {
    if (!notesModalPlayer) return;
    const previous = notesModalPlayer.priority;
    if (previous === newPriority) return;

    // Update local state optimistically (mutate prop & also propagate to formation copies)
    notesModalPlayer.priority = newPriority;
    setFormation(prev => {
      const next: {[key: string]: any[]} = {};
      for (const [pos, players] of Object.entries(prev)) {
        next[pos] = players.map((p: any) =>
          p.id === notesModalPlayer.id ? { ...p, priority: newPriority } : p
        );
      }
      return next;
    });

    try {
      const response = await fetch(`${API_URL}/api/markets/players/${notesModalPlayer.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ priority: newPriority })
      });
      if (response.ok) {
        if (onPlayerUpdated) onPlayerUpdated();
      } else {
        notesModalPlayer.priority = previous;
        alert('Error al actualizar prioridad');
      }
    } catch (error) {
      console.error('Error updating priority:', error);
      notesModalPlayer.priority = previous;
      alert('Error al actualizar prioridad');
    }
  };

  // Posiciones personalizables — se cargan desde el market (Supabase) o usan valores por defecto
  const [customPositions, setCustomPositions] = useState<{[key: string]: {top: string, left: string}}>(
    () => ({ ...DEFAULT_POSITIONS, ...(market?.formation_layout?.positions || {}) })
  );

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

  // Guardado debounced al backend cuando cambian formation / positions / formation_name.
  // Usamos un snapshot del estado inicial para no PATCH'ear si nada cambio realmente
  // (evita loops cuando Supabase devuelve nuevas referencias JSON con mismo contenido).
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedSnapshotRef = useRef<string>('');
  if (lastSavedSnapshotRef.current === '') {
    lastSavedSnapshotRef.current = JSON.stringify({
      formation_data: formation,
      formation_layout: { positions: customPositions, formation_name: selectedFormation },
    });
  }

  useEffect(() => {
    if (!marketId) return;

    const snapshot = JSON.stringify({
      formation_data: formation,
      formation_layout: { positions: customPositions, formation_name: selectedFormation },
    });
    if (snapshot === lastSavedSnapshotRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        const payload = {
          formation_data: formation,
          formation_layout: {
            positions: customPositions,
            formation_name: selectedFormation,
          },
        };
        const response = await fetch(`${API_URL}/api/markets/${marketId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          const updated = await response.json();
          lastSavedSnapshotRef.current = snapshot;
          if (updated && onMarketUpdated) onMarketUpdated(updated);
          onUpdateFormation(formation);
        }
      } catch (error) {
        console.error('Error saving formation:', error);
      }
    }, 600);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [formation, customPositions, selectedFormation, marketId]);

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
      case 'alta': return '#10b981';
      case 'media': return '#f59e0b';
      case 'baja': return '#ef4444';
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

  const getPlayerTeamImage = (player: any): string | undefined => {
    const details = playerDetails[player.player_id];
    return details?.team_image;
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
    const renderPlayerCard = (player: any) => (
            <div
              key={player.id}
              className="bg-card rounded-xl p-6 border-2 border-border-strong grid grid-cols-[1fr_auto_1fr] items-start gap-4"
            >
              <div className="flex items-start gap-4 min-w-0">
                {/* Mini cuadro con foto del jugador y logo del equipo */}
                <div
                  className="relative shrink-0 w-[56px] h-[56px] rounded-lg bg-surface border border-border-strong overflow-hidden flex items-center justify-center cursor-pointer"
                  onMouseEnter={(e) => {
                    showHover(player);
                    setMousePosition({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseMove={(e) => setMousePosition({ x: e.clientX, y: e.clientY })}
                  onMouseLeave={scheduleHideHover}
                >
                  {getPlayerImage(player) ? (
                    <img
                      src={getPlayerImage(player)}
                      alt={player.player_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-xs font-bold text-text-muted">
                      {player.player_name.split(' ').map((s: string) => s[0]).slice(0, 2).join('')}
                    </span>
                  )}
                  {getPlayerTeamImage(player) && (
                    <img
                      src={getPlayerTeamImage(player)}
                      alt=""
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white object-contain border border-border-strong p-[1px]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>

                <div className="flex-1">
                  <h3
                    className="text-xl font-semibold m-0 text-text inline-block cursor-pointer hover:text-accent transition-colors"
                    onMouseEnter={(e) => {
                      showHover(player);
                      setMousePosition({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseMove={(e) => setMousePosition({ x: e.clientX, y: e.clientY })}
                    onMouseLeave={scheduleHideHover}
                    onClick={() => openNotesModal(player)}
                  >
                    {player.player_name}
                  </h3>
                  <p className="text-sm text-text-muted mt-1">
                    {player.position} - {getPlayerAge(player)} anos - {getPlayerCurrentTeam(player)}
                  </p>
                  {player.notes && (
                    <p className="text-sm text-text-muted mt-2 line-clamp-2 italic">
                      {player.notes}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 items-center justify-self-center mt-2">
                {(() => {
                  const s = getStatusInfo(player.status);
                  return (
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-medium"
                      style={{ background: `${s.color}15`, color: s.color }}
                    >
                      <span className="opacity-60">Estado</span>
                      <span className="mx-1 opacity-50">·</span>
                      {s.label}
                    </span>
                  );
                })()}
                {(() => {
                  const c = getPriorityColor(player.priority);
                  const label = player.priority ? player.priority.charAt(0).toUpperCase() + player.priority.slice(1) : '-';
                  return (
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-medium"
                      style={{ background: `${c}15`, color: c }}
                    >
                      <span className="opacity-60">Prioridad</span>
                      <span className="mx-1 opacity-50">·</span>
                      {label}
                    </span>
                  );
                })()}
              </div>

              <div className="flex gap-1.5 items-center justify-self-end mt-2">
                <button
                  onClick={() => openNotesModal(player)}
                  className="px-2.5 py-1 bg-white/8 text-text-secondary border border-border rounded-md cursor-pointer text-xs font-medium hover:bg-white/12 transition-colors"
                  title={player.notes ? 'Ver/editar informacion' : 'Agregar informacion'}
                >
                  {player.notes ? 'Info' : '+ Info'}
                </button>
                <button
                  onClick={() => handleDeletePlayer(player.id, player.player_name)}
                  className="px-2.5 py-1 bg-white/8 text-text-secondary border border-border rounded-md cursor-pointer text-xs font-medium hover:bg-white/12 transition-colors"
                  title="Eliminar del mercado"
                >
                  Eliminar
                </button>
              </div>
            </div>
    );

    return (
      <div>
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <button
            onClick={() => setViewMode('pitch')}
            className="px-6 py-3 bg-accent text-white border-none rounded-lg cursor-pointer font-semibold hover:opacity-90 transition-opacity"
          >
            Ver en Cancha
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-text-muted font-medium">Ordenar por</span>
            <select
              value={listSort}
              onChange={(e) => setListSort(e.target.value as 'date' | 'position' | 'priority')}
              className="px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-sm text-text font-semibold cursor-pointer focus:border-accent/50 focus:outline-none"
            >
              <option value="date">Orden de carga</option>
              <option value="position">Posicion</option>
              <option value="priority">Prioridad</option>
            </select>
          </div>
        </div>

        {/* Barra de filtros */}
        <div className="bg-surface/50 border border-border-strong rounded-lg p-3 mb-4 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase tracking-widest text-text-muted font-medium">Filtros</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-accent text-white">
                {activeFilterCount}
              </span>
            )}
          </div>

          <select
            value={filters.priority}
            onChange={(e) => setFilters(f => ({ ...f, priority: e.target.value }))}
            className="px-2.5 py-1.5 bg-surface border border-border-strong rounded-md text-xs text-text cursor-pointer focus:border-accent/50 focus:outline-none"
          >
            <option value="all">Prioridad: Todas</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
            className="px-2.5 py-1.5 bg-surface border border-border-strong rounded-md text-xs text-text cursor-pointer focus:border-accent/50 focus:outline-none"
          >
            <option value="all">Estado: Todos</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <select
            value={filters.positionCategory}
            onChange={(e) => setFilters(f => ({ ...f, positionCategory: e.target.value }))}
            className="px-2.5 py-1.5 bg-surface border border-border-strong rounded-md text-xs text-text cursor-pointer focus:border-accent/50 focus:outline-none"
          >
            <option value="all">Posicion: Todas</option>
            {POSITION_CATEGORIES.map(c => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
            <option value="other">Sin posicion</option>
          </select>

          <div className="flex items-center gap-1 px-2 py-1.5 bg-surface border border-border-strong rounded-md">
            <span className="text-[10px] text-text-muted">Edad</span>
            <input
              type="number"
              min={14}
              max={50}
              placeholder="min"
              value={filters.ageMin}
              onChange={(e) => setFilters(f => ({ ...f, ageMin: e.target.value }))}
              className="w-12 bg-transparent text-xs text-text focus:outline-none placeholder:text-text-muted"
            />
            <span className="text-[10px] text-text-muted">-</span>
            <input
              type="number"
              min={14}
              max={50}
              placeholder="max"
              value={filters.ageMax}
              onChange={(e) => setFilters(f => ({ ...f, ageMax: e.target.value }))}
              className="w-12 bg-transparent text-xs text-text focus:outline-none placeholder:text-text-muted"
            />
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="ml-auto px-2.5 py-1.5 bg-white/8 text-text-secondary border border-border rounded-md text-xs cursor-pointer hover:bg-white/12 transition-colors"
            >
              Limpiar filtros
            </button>
          )}

          <span className="text-xs text-text-muted ml-2">
            Mostrando {filteredPlayers.length} / {marketPlayers.length}
          </span>
        </div>

        {listSort === 'position' && groupedByPosition ? (
          <div className="grid gap-6">
            {POSITION_CATEGORIES.map(cat => (
              groupedByPosition[cat.key]?.length ? (
                <div key={cat.key}>
                  <h3 className="text-xs uppercase tracking-widest text-accent font-semibold mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    {cat.label}
                    <span className="text-text-muted font-normal normal-case tracking-normal">
                      ({groupedByPosition[cat.key].length})
                    </span>
                  </h3>
                  <div className="grid gap-4">
                    {groupedByPosition[cat.key].map(renderPlayerCard)}
                  </div>
                </div>
              ) : null
            ))}
            {groupedByPosition.other?.length ? (
              <div>
                <h3 className="text-xs uppercase tracking-widest text-text-muted font-semibold mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-text-muted" />
                  Sin posicion
                  <span className="text-text-muted font-normal normal-case tracking-normal">
                    ({groupedByPosition.other.length})
                  </span>
                </h3>
                <div className="grid gap-4">
                  {groupedByPosition.other.map(renderPlayerCard)}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-4">
            {sortedPlayers.map(renderPlayerCard)}
          </div>
        )}

        {/* Popup hover en lista */}
        {hoveredPlayer && !notesModalPlayer && (
          <div
            className="fixed bg-card rounded-xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.3)] z-[1500] min-w-[280px] max-w-[360px] border-2 border-border-strong flex flex-col"
            style={computeHoverPopupStyle(mousePosition.x, mousePosition.y)}
            onMouseEnter={cancelHideHover}
            onMouseLeave={scheduleHideHover}
          >
            <div className="flex items-center gap-3 mb-2">
              {getPlayerImage(hoveredPlayer) ? (
                <img
                  src={getPlayerImage(hoveredPlayer)}
                  alt={hoveredPlayer.player_name}
                  className="w-[60px] h-[60px] rounded-full object-cover border-2 border-border-strong"
                />
              ) : (
                <div className="w-[60px] h-[60px] rounded-full bg-surface border-2 border-border-strong flex items-center justify-center text-sm font-bold text-text-muted">
                  {hoveredPlayer.player_name.split(' ').map((s: string) => s[0]).slice(0, 2).join('')}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="m-0 text-base font-bold text-text truncate">
                  {hoveredPlayer.player_name}
                </h4>
                <p className="my-1 text-xs text-text-muted">
                  {hoveredPlayer.position} - {getPlayerAge(hoveredPlayer)} anos
                </p>
                <div className="flex items-center gap-2">
                  {getPlayerTeamImage(hoveredPlayer) && (
                    <img
                      src={getPlayerTeamImage(hoveredPlayer)}
                      alt=""
                      className="w-5 h-5 object-contain bg-white rounded-full p-[2px]"
                    />
                  )}
                  <span className="text-xs text-text-muted truncate">
                    {getPlayerCurrentTeam(hoveredPlayer)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span
                className="px-2 py-0.5 rounded-lg text-[0.625rem] font-semibold"
                style={{
                  background: `${getPriorityColor(hoveredPlayer.priority)}20`,
                  color: getPriorityColor(hoveredPlayer.priority),
                }}
              >
                Prioridad {hoveredPlayer.priority}
              </span>
              {hoveredPlayer.estimated_price && (
                <span className="text-xs font-bold text-emerald-500">
                  EUR {Number(hoveredPlayer.estimated_price).toLocaleString()}
                </span>
              )}
            </div>

            {hoveredPlayer.notes && (
              <div className="mt-3 pt-3 border-t border-border flex-1 min-h-0 flex flex-col">
                <p className="text-[10px] uppercase tracking-widest text-text-muted font-medium mb-1 shrink-0">
                  Informacion
                </p>
                <p className="text-xs text-text whitespace-pre-wrap break-words overflow-y-auto flex-1">
                  {hoveredPlayer.notes}
                </p>
              </div>
            )}
          </div>
        )}

        {notesModalPlayer && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[2000] p-4"
            onClick={closeNotesModal}
          >
            <div
              className="bg-card border-2 border-border-strong rounded-xl w-[90%] max-w-[600px] max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 pt-6 pb-4 shrink-0 flex justify-between items-start border-b border-border-strong">
                <div>
                  <h3 className="text-lg font-semibold text-text m-0">
                    {notesModalPlayer.player_name}
                  </h3>
                  <p className="text-sm text-text-muted mt-1">
                    {notesModalPlayer.position} - {getPlayerAge(notesModalPlayer)} anos - {getPlayerCurrentTeam(notesModalPlayer)}
                  </p>
                </div>
                <button
                  onClick={closeNotesModal}
                  className="text-text-muted hover:text-text text-xl cursor-pointer bg-transparent border-none"
                >
                  x
                </button>
              </div>

              <div className="px-6 py-4 flex-1 overflow-y-auto">

              <div className="mb-4">
                <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
                  Posicion
                </label>
                <select
                  value={notesModalPlayer.position || ''}
                  onChange={(e) => updatePlayerPosition(e.target.value)}
                  className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none cursor-pointer"
                >
                  <option value="">Sin posicion asignada</option>
                  <optgroup label="Arqueros">
                    <option value="Arquero - Clasico">Arquero - Clasico</option>
                    <option value="Arquero - De juego">Arquero - De juego</option>
                  </optgroup>
                  <optgroup label="Laterales Derechos">
                    <option value="Lateral Derecho - Equilibrado">Lateral Derecho - Equilibrado</option>
                    <option value="Lateral Derecho - Ofensivo">Lateral Derecho - Ofensivo</option>
                    <option value="Lateral Derecho - Defensivo">Lateral Derecho - Defensivo</option>
                  </optgroup>
                  <optgroup label="Laterales Izquierdos">
                    <option value="Lateral Izquierdo - Equilibrado">Lateral Izquierdo - Equilibrado</option>
                    <option value="Lateral Izquierdo - Ofensivo">Lateral Izquierdo - Ofensivo</option>
                    <option value="Lateral Izquierdo - Defensivo">Lateral Izquierdo - Defensivo</option>
                  </optgroup>
                  <optgroup label="Centrales Derechos">
                    <option value="Central Derecho - Equilibrado">Central Derecho - Equilibrado</option>
                    <option value="Central Derecho - Duelista">Central Derecho - Duelista</option>
                    <option value="Central Derecho - Asociativo">Central Derecho - Asociativo</option>
                  </optgroup>
                  <optgroup label="Centrales Izquierdos">
                    <option value="Central Izquierdo - Equilibrado">Central Izquierdo - Equilibrado</option>
                    <option value="Central Izquierdo - Duelista">Central Izquierdo - Duelista</option>
                    <option value="Central Izquierdo - Asociativo">Central Izquierdo - Asociativo</option>
                  </optgroup>
                  <optgroup label="Volantes Centrales">
                    <option value="Volante Central - De construccion">Volante Central - De construccion</option>
                    <option value="Volante Central - Defensivo">Volante Central - Defensivo</option>
                  </optgroup>
                  <optgroup label="Volantes Internos">
                    <option value="Volante Interno - Box to box">Volante Interno - Box to box</option>
                    <option value="Volante Interno - Ofensivo">Volante Interno - Ofensivo</option>
                  </optgroup>
                  <optgroup label="Volantes por Afuera">
                    <option value="Volante por Afuera - Carrilero">Volante por Afuera - Carrilero</option>
                    <option value="Volante por Afuera - Ofensivo">Volante por Afuera - Ofensivo</option>
                  </optgroup>
                  <optgroup label="Extremos Derechos">
                    <option value="Extremo Derecho - Finalizador">Extremo Derecho - Finalizador</option>
                    <option value="Extremo Derecho - Asociativo">Extremo Derecho - Asociativo</option>
                    <option value="Extremo Derecho - Desequilibrante">Extremo Derecho - Desequilibrante</option>
                  </optgroup>
                  <optgroup label="Extremos Izquierdos">
                    <option value="Extremo Izquierdo - Finalizador">Extremo Izquierdo - Finalizador</option>
                    <option value="Extremo Izquierdo - Asociativo">Extremo Izquierdo - Asociativo</option>
                    <option value="Extremo Izquierdo - Desequilibrante">Extremo Izquierdo - Desequilibrante</option>
                  </optgroup>
                  <optgroup label="Delanteros">
                    <option value="Delantero - De area">Delantero - De area</option>
                    <option value="Delantero - Mediapunta">Delantero - Mediapunta</option>
                  </optgroup>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
                  Prioridad
                </label>
                <div className="flex gap-2">
                  {(['alta', 'media', 'baja'] as const).map(level => {
                    const active = notesModalPlayer.priority === level;
                    const color = getPriorityColor(level);
                    return (
                      <button
                        key={level}
                        onClick={() => updatePriority(level)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border-2"
                        style={{
                          background: active ? color : `${color}20`,
                          color: active ? '#ffffff' : color,
                          borderColor: active ? color : 'transparent',
                        }}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-5 p-4 bg-surface/50 rounded-lg border border-border-strong">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium">
                    Detalles
                  </label>
                  <button
                    onClick={saveDetails}
                    disabled={savingDetails}
                    className="px-3 py-1.5 bg-accent hover:bg-accent-dark text-white rounded-md text-xs cursor-pointer font-semibold transition-colors disabled:opacity-50"
                  >
                    {savingDetails ? 'Guardando...' : 'Guardar Detalles'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-text-muted font-medium mb-1.5">
                      Estado
                    </label>
                    <select
                      value={detailsDraft.status}
                      onChange={(e) => setDetailsDraft(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full p-2 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none cursor-pointer"
                    >
                      <option value="seguimiento">Seguimiento</option>
                      <option value="negociando">Negociando</option>
                      <option value="descartado">Descartado</option>
                      <option value="fichado">Fichado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-text-muted font-medium mb-1.5">
                      Agente
                    </label>
                    <input
                      type="text"
                      value={detailsDraft.agent}
                      onChange={(e) => setDetailsDraft(prev => ({ ...prev, agent: e.target.value }))}
                      placeholder="Nombre / contacto del agente"
                      className="w-full p-2 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none placeholder:text-text-muted"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-text-muted font-medium mb-1.5">
                      Valor estimado (EUR)
                    </label>
                    <input
                      type="number"
                      value={detailsDraft.estimated_price}
                      onChange={(e) => setDetailsDraft(prev => ({ ...prev, estimated_price: e.target.value }))}
                      placeholder="Ej: 5000000"
                      className="w-full p-2 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none placeholder:text-text-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-text-muted font-medium mb-1.5">
                      Valor maximo (EUR)
                    </label>
                    <input
                      type="number"
                      value={detailsDraft.max_price}
                      onChange={(e) => setDetailsDraft(prev => ({ ...prev, max_price: e.target.value }))}
                      placeholder="Ej: 7000000"
                      className="w-full p-2 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none placeholder:text-text-muted"
                    />
                  </div>
                </div>
              </div>

              <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
                Informacion del jugador
              </label>

              {notesEditing ? (
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Escribi informacion sobre el jugador (caracteristicas, contacto, condiciones, etc.)..."
                  rows={8}
                  autoFocus
                  className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none resize-y min-h-[200px]"
                />
              ) : (
                <div className="p-3 bg-surface border border-border-strong rounded-md text-sm text-text whitespace-pre-wrap min-h-[200px]">
                  {notesModalPlayer.notes || (
                    <span className="text-text-muted italic">Sin informacion cargada todavia.</span>
                  )}
                </div>
              )}

              </div>

              <div className="flex gap-3 px-6 py-4 justify-end shrink-0 border-t border-border-strong bg-card rounded-b-xl">
                <button
                  onClick={closeNotesModal}
                  className="px-4 py-2.5 bg-white/8 text-text-secondary border border-border rounded-lg text-sm cursor-pointer hover:bg-white/12 transition-colors"
                >
                  Cerrar
                </button>
                {notesEditing ? (
                  <>
                    <button
                      onClick={() => {
                        setNotesDraft(notesModalPlayer.notes || '');
                        setNotesEditing(false);
                      }}
                      disabled={savingNotes}
                      className="px-4 py-2.5 bg-white/8 text-text-secondary border border-border rounded-lg text-sm cursor-pointer hover:bg-white/12 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveNotes}
                      disabled={savingNotes}
                      className="px-4 py-2.5 bg-accent hover:bg-accent-dark text-white rounded-lg text-sm cursor-pointer font-semibold transition-colors disabled:opacity-50"
                    >
                      {savingNotes ? 'Guardando...' : 'Guardar'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setNotesEditing(true)}
                    className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm cursor-pointer font-semibold transition-colors"
                  >
                    Editar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
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
                        showHover(player);
                        setMousePosition({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseMove={(e) => {
                        setMousePosition({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={scheduleHideHover}
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

      {/* Popup de informacion del jugador (cancha) */}
      {hoveredPlayer && !notesModalPlayer && (
        <div
          className="fixed bg-card rounded-xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.3)] z-[2000] min-w-[280px] max-w-[360px] border-2 border-border-strong flex flex-col"
          style={computeHoverPopupStyle(mousePosition.x, mousePosition.y)}
          onMouseEnter={cancelHideHover}
          onMouseLeave={scheduleHideHover}
        >
          <div className="flex items-center gap-3 mb-2">
            {getPlayerImage(hoveredPlayer) ? (
              <img
                src={getPlayerImage(hoveredPlayer)}
                alt={hoveredPlayer.player_name}
                className="w-[60px] h-[60px] rounded-full object-cover border-2 border-border-strong"
              />
            ) : (
              <div className="w-[60px] h-[60px] rounded-full bg-surface border-2 border-border-strong flex items-center justify-center text-sm font-bold text-text-muted">
                {hoveredPlayer.player_name.split(' ').map((s: string) => s[0]).slice(0, 2).join('')}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="m-0 text-base font-bold text-text truncate">
                {hoveredPlayer.player_name}
              </h4>
              <p className="my-1 text-xs text-text-muted">
                {hoveredPlayer.position} - {getPlayerAge(hoveredPlayer)} anos
              </p>
              <div className="flex items-center gap-2">
                {getPlayerTeamImage(hoveredPlayer) && (
                  <img
                    src={getPlayerTeamImage(hoveredPlayer)}
                    alt=""
                    className="w-5 h-5 object-contain bg-white rounded-full p-[2px]"
                  />
                )}
                <span className="text-xs text-text-muted truncate">
                  {getPlayerCurrentTeam(hoveredPlayer)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span
              className="px-2 py-0.5 rounded-lg text-[0.625rem] font-semibold"
              style={{
                background: `${getPriorityColor(hoveredPlayer.priority)}20`,
                color: getPriorityColor(hoveredPlayer.priority),
              }}
            >
              Prioridad {hoveredPlayer.priority}
            </span>
            {hoveredPlayer.estimated_price && (
              <span className="text-xs font-bold text-emerald-500">
                EUR {Number(hoveredPlayer.estimated_price).toLocaleString()}
              </span>
            )}
          </div>

          {hoveredPlayer.notes && (
            <div className="mt-3 pt-3 border-t border-border flex-1 min-h-0 flex flex-col">
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-medium mb-1 shrink-0">
                Informacion
              </p>
              <p className="text-xs text-text whitespace-pre-wrap break-words overflow-y-auto flex-1">
                {hoveredPlayer.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MarketPitchView;
