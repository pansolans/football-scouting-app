import React, { useState, useEffect } from 'react';
import { playerService } from '../services/api';

import { API_URL } from '../config';

interface PlayerProfileData {
  // Datos básicos (automáticos de Wyscout)
  id?: string;
  wyscout_id?: number;
  player_id?: string;
  name: string;
  player_name?: string;
  shortName?: string;
  age?: number;
  position?: string;
  currentTeam?: string;
  current_team?: string;
  nationality?: string;
  height?: number;
  weight?: number;
  foot?: string;
  imageUrl?: string;
  image_url?: string;

  // Análisis personalizado
  position_analysis: string;
  general_info: string;
  strengths: string;
  weaknesses: string;

  // Información comercial
  agent_name: string;
  agent_contact: string;
  video_link: string;
  transfermarkt_link: string;

  // Metadatos
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  created_by_user?: { name: string; role: string };
  updated_by_user?: { name: string; role: string };
  created_by_name?: string;
  updated_by_name?: string;
}

interface PlayerProfileProps {
  onClose?: () => void;
  preselectedPlayer?: any;
  onClearPreselected?: () => void;
}

const PlayerProfile: React.FC<PlayerProfileProps> = ({ onClose, preselectedPlayer, onClearPreselected }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<PlayerProfileData>({
    name: '',
    position_analysis: '',
    general_info: '',
    strengths: '',
    weaknesses: '',
    agent_name: '',
    agent_contact: '',
    video_link: '',
    transfermarkt_link: ''
  });

  const [savedProfiles, setSavedProfiles] = useState<PlayerProfileData[]>([]);
  const [viewMode, setViewMode] = useState<'create' | 'view' | 'list'>('list');
  const [viewingProfile, setViewingProfile] = useState<PlayerProfileData | null>(null);

  // Estados para filtros de búsqueda
  const [profileFilters, setProfileFilters] = useState({
    name: '',
    team: '',
    position: '',
    created_by: '',
    nationality: ''
  });

  // Función para filtrar perfiles
  const getFilteredProfiles = () => {
    return savedProfiles.filter(profile => {
      const matchesName = !profileFilters.name ||
        (profile.name || profile.player_name || '').toLowerCase().includes(profileFilters.name.toLowerCase());

      const matchesTeam = !profileFilters.team ||
        (profile.currentTeam || profile.current_team || '').toLowerCase().includes(profileFilters.team.toLowerCase());

      const matchesPosition = !profileFilters.position ||
        (profile.position || '').toLowerCase().includes(profileFilters.position.toLowerCase());

      const matchesCreatedBy = !profileFilters.created_by ||
        (profile.created_by_name || '').toLowerCase().includes(profileFilters.created_by.toLowerCase());

      const matchesNationality = !profileFilters.nationality ||
        (profile.nationality || '').toLowerCase().includes(profileFilters.nationality.toLowerCase());

      return matchesName && matchesTeam && matchesPosition && matchesCreatedBy && matchesNationality;
    });
  };

  // Funciones para comunicarse con el backend
  const loadProfilesFromBackend = async () => {
    try {
      const response = await fetch(`${API_URL}/api/player-profiles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const profiles = await response.json();
        setSavedProfiles(profiles);
      }
    } catch (error) {
      console.error('Error loading profiles from backend:', error);
    }
  };

  const saveProfileToBackend = async (profileData: PlayerProfileData) => {
    const response = await fetch(`${API_URL}/api/player-profiles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      throw new Error(`Error saving profile: ${response.status}`);
    }

    return response.json();
  };

  const updateProfileInBackend = async (profileId: string, profileData: PlayerProfileData) => {
    const response = await fetch(`${API_URL}/api/player-profiles/${profileId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      throw new Error(`Error updating profile: ${response.status}`);
    }

    return response.json();
  };

  // Buscar jugador en Wyscout
  const handlePlayerSearch = async () => {
    if (searchQuery.length < 2) return;

    setLoading(true);
    try {
      const players = await playerService.searchPlayers(searchQuery);
      setSearchResults(Array.isArray(players) ? players : []);
    } catch (error) {
      console.error('Error searching players:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Seleccionar jugador y cargar datos básicos
  const selectPlayer = async (player: any) => {
    setSelectedPlayer(player);

    // Intentar cargar perfil completo de Wyscout si está disponible
    try {
      const profile = await playerService.getPlayerProfile(player.wyscout_id || player.id);

      setProfileData({
        ...profileData,
        wyscout_id: player.wyscout_id || player.id,
        name: profile.basic_info?.shortName || player.name,
        player_name: profile.basic_info?.shortName || player.name,
        shortName: profile.basic_info?.shortName,
        age: profile.basic_info?.birthDate ?
          new Date().getFullYear() - new Date(profile.basic_info.birthDate).getFullYear() :
          player.age,
        position: profile.basic_info?.role?.name || player.position,
        currentTeam: profile.basic_info?.currentTeam?.name || player.team,
        current_team: profile.basic_info?.currentTeam?.name || player.team,
        nationality: profile.basic_info?.passportArea?.name || player.nationality,
        height: profile.basic_info?.height,
        weight: profile.basic_info?.weight,
        foot: profile.basic_info?.foot,
        imageUrl: profile.basic_info?.imageDataURL,
        image_url: profile.basic_info?.imageDataURL
      });
    } catch (error) {
      // Si no se puede cargar el perfil completo, usar datos básicos
      setProfileData({
        ...profileData,
        wyscout_id: player.wyscout_id || player.id,
        name: player.name,
        player_name: player.name,
        age: player.age,
        position: player.position,
        currentTeam: player.team,
        current_team: player.team,
        nationality: player.nationality
      });
    }

    setViewMode('create');
  };

  // Guardar perfil - SIN VALIDACIONES OBLIGATORIAS
  const saveProfile = async () => {
    // Solo verificar que al menos tenga un nombre
    if (!profileData.name && !profileData.player_name) {
      alert('Por favor completa al menos el nombre del jugador');
      return;
    }

    setSaving(true);
    try {
      // Verificar si es edición (si ya existe el perfil)
      const existingIndex = savedProfiles.findIndex(p => p.id === profileData.id);

      if (existingIndex !== -1) {
        // Actualizar perfil existente en el backend
        const updatedProfile = await updateProfileInBackend(profileData.id!, profileData);

        // Actualizar en el estado local
        const updatedProfiles = [...savedProfiles];
        updatedProfiles[existingIndex] = updatedProfile;
        setSavedProfiles(updatedProfiles);

        alert('Perfil actualizado exitosamente');
      } else {
        // Crear nuevo perfil en el backend
        const newProfile = await saveProfileToBackend(profileData);

        // Agregar al estado local
        setSavedProfiles([...savedProfiles, newProfile]);
        alert('Perfil creado exitosamente');
      }

      setViewMode('list');
      resetForm();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  // Exportar a PDF (simulado)
  const exportToPDF = () => {
    // Aquí integrarías una librería como jsPDF o html2pdf
    alert('Funcionalidad de exportar PDF en desarrollo');
  };

  // Reset form
  const resetForm = () => {
    setSelectedPlayer(null);
    setSearchQuery('');
    setSearchResults([]);
    setProfileData({
      name: '',
      position_analysis: '',
      general_info: '',
      strengths: '',
      weaknesses: '',
      agent_name: '',
      agent_contact: '',
      video_link: '',
      transfermarkt_link: ''
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        handlePlayerSearch();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Cargar perfiles del backend al iniciar
  useEffect(() => {
    loadProfilesFromBackend();
  }, []);

  // Manejar jugador preseleccionado
  useEffect(() => {
    if (preselectedPlayer) {
      selectPlayer(preselectedPlayer);
      if (onClearPreselected) {
        onClearPreselected();
      }
    }
  }, [preselectedPlayer]);

  // Vista de lista de perfiles
  if (viewMode === 'list') {
    return (
      <div className="bg-card rounded-2xl p-8 shadow-lg">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-text m-0">
            Perfiles de Scouting
          </h2>
          <button
            onClick={() => setViewMode('create')}
            className="px-6 py-3 bg-accent text-white border-none rounded-lg text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
          >
            Crear Nuevo Perfil
          </button>
        </div>

        {/* Filtros de búsqueda */}
        <div className="p-6 bg-surface rounded-xl border border-border-strong mb-6">
          <h3 className="text-lg font-semibold mb-4 text-text">
            Filtros de Busqueda
          </h3>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={profileFilters.name}
              onChange={(e) => setProfileFilters({...profileFilters, name: e.target.value})}
              className="p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
            />

            <input
              type="text"
              placeholder="Buscar por equipo..."
              value={profileFilters.team}
              onChange={(e) => setProfileFilters({...profileFilters, team: e.target.value})}
              className="p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
            />

            <input
              type="text"
              placeholder="Buscar por posicion..."
              value={profileFilters.position}
              onChange={(e) => setProfileFilters({...profileFilters, position: e.target.value})}
              className="p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
            />

            <input
              type="text"
              placeholder="Creado por..."
              value={profileFilters.created_by}
              onChange={(e) => setProfileFilters({...profileFilters, created_by: e.target.value})}
              className="p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
            />

            <input
              type="text"
              placeholder="Nacionalidad..."
              value={profileFilters.nationality}
              onChange={(e) => setProfileFilters({...profileFilters, nationality: e.target.value})}
              className="p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
            />

            <button
              onClick={() => setProfileFilters({
                name: '', team: '', position: '', created_by: '', nationality: ''
              })}
              className="px-4 py-3 bg-white/8 text-text-secondary border border-border rounded-lg text-sm font-semibold cursor-pointer hover:bg-card-hover transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>

          <div className="mt-2 text-sm text-text-muted">
            Mostrando {getFilteredProfiles().length} de {savedProfiles.length} perfiles
          </div>
        </div>

        {savedProfiles.length === 0 ? (
          <div className="text-center p-12 text-text-muted">
            <p>No hay perfiles de scouting creados todavia</p>
            <p className="text-sm">Crea el primer perfil para empezar tu base de talentos analizados</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {getFilteredProfiles().map((profile) => (
              <div key={profile.id} className="bg-surface border border-border-strong rounded-xl p-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  {(profile.imageUrl || profile.image_url) ? (
                    <img
                      src={profile.imageUrl || profile.image_url}
                      alt={profile.name || profile.player_name}
                      className="w-[60px] h-[60px] rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-[60px] h-[60px] rounded-full bg-accent flex items-center justify-center text-white font-bold text-xl">
                      {(profile.name || profile.player_name || '').split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-semibold m-0 text-text">
                      {profile.name || profile.player_name}
                    </h3>
                    <div className="flex gap-3 mt-1 flex-wrap">
                      <span className="text-sm text-text-muted">
                        {profile.position}
                      </span>
                      {profile.age && (
                        <span className="text-sm text-text-muted">
                          {profile.age} anos
                        </span>
                      )}
                      {(profile.currentTeam || profile.current_team) && (
                        <span className="text-sm text-text-muted">
                          {profile.currentTeam || profile.current_team}
                        </span>
                      )}
                      {profile.nationality && (
                        <span className="text-sm text-text-muted">
                          {profile.nationality}
                        </span>
                      )}
                    </div>
                    {profile.created_by_name && (
                      <p className="m-0 mt-2 text-xs text-blue-400 font-medium">
                        Scout: {profile.created_by_name}
                        {profile.updated_by_name && profile.updated_by_name !== profile.created_by_name && (
                          <span> - Editado por: {profile.updated_by_name}</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setViewingProfile(profile);
                      setViewMode('view');
                    }}
                    className="px-4 py-2 bg-blue-500 text-white border-none rounded-md text-sm font-semibold cursor-pointer hover:bg-blue-600 transition-colors"
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => {
                      setProfileData(profile);
                      setSelectedPlayer({
                        id: profile.wyscout_id || profile.id,
                        name: profile.name || profile.player_name,
                        position: profile.position,
                        team: profile.currentTeam || profile.current_team
                      });
                      setViewMode('create');
                    }}
                    className="px-4 py-2 bg-accent text-white border-none rounded-md text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    Editar
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="px-4 py-2 bg-amber-500 text-white border-none rounded-md text-sm font-semibold cursor-pointer hover:bg-amber-600 transition-colors"
                  >
                    PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Vista de perfil individual
  if (viewMode === 'view' && viewingProfile) {
    return (
      <div className="bg-card rounded-2xl p-8 shadow-lg">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => setViewMode('list')}
            className="px-4 py-2 bg-white/8 text-text-secondary border border-border rounded-lg text-sm font-semibold cursor-pointer hover:bg-card-hover transition-colors"
          >
            ← Volver a la Lista
          </button>

          <button
            onClick={exportToPDF}
            className="px-6 py-3 bg-amber-500 text-white border-none rounded-lg text-sm font-semibold cursor-pointer hover:bg-amber-600 transition-colors"
          >
            Exportar PDF
          </button>
        </div>

        {/* Header del perfil */}
        <div className="flex gap-8 mb-8 p-8 bg-accent/5 rounded-xl border border-accent/20">
          {(viewingProfile.imageUrl || viewingProfile.image_url) ? (
            <img
              src={viewingProfile.imageUrl || viewingProfile.image_url}
              alt={viewingProfile.name || viewingProfile.player_name}
              className="w-[120px] h-[120px] rounded-full object-cover border-4 border-border"
            />
          ) : (
            <div className="w-[120px] h-[120px] rounded-full bg-accent flex items-center justify-center text-white font-bold text-4xl border-4 border-border">
              {(viewingProfile.name || viewingProfile.player_name || '').split(' ').map(n => n[0]).join('').substring(0, 2)}
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-4 mt-0 text-text">
              {viewingProfile.name || viewingProfile.player_name}
            </h1>

            <div className="flex flex-wrap gap-4 mb-4">
              <span className="px-4 py-2 bg-accent rounded-lg text-sm text-white font-semibold">
                {viewingProfile.position}
              </span>

              {viewingProfile.age && (
                <span className="text-sm text-text-secondary flex items-center">
                  {viewingProfile.age} anos
                </span>
              )}

              {(viewingProfile.currentTeam || viewingProfile.current_team) && (
                <span className="text-sm text-text-secondary flex items-center">
                  {viewingProfile.currentTeam || viewingProfile.current_team}
                </span>
              )}

              {viewingProfile.nationality && (
                <span className="text-sm text-text-secondary flex items-center">
                  {viewingProfile.nationality}
                </span>
              )}
            </div>

            <div className="flex gap-8 text-sm text-text-muted">
              {viewingProfile.height && <span>{viewingProfile.height} cm</span>}
              {viewingProfile.weight && <span>{viewingProfile.weight} kg</span>}
              {viewingProfile.foot && <span>{viewingProfile.foot}</span>}
            </div>
          </div>
        </div>

        {/* Contenido del análisis */}
        <div className="grid gap-8">
          {/* Análisis Posicional */}
          <div className="p-6 bg-surface rounded-xl border border-border-strong">
            <h3 className="text-xl font-semibold mb-4 text-accent">
              Analisis Posicional
            </h3>
            <p className="text-base leading-relaxed text-text-secondary m-0">
              {viewingProfile.position_analysis}
            </p>
          </div>

          {/* Información General */}
          {viewingProfile.general_info && (
            <div className="p-6 bg-blue-500/5 rounded-xl border border-blue-500/20">
              <h3 className="text-xl font-semibold mb-4 text-blue-400">
                Informacion General
              </h3>
              <p className="text-base leading-relaxed text-text-secondary m-0">
                {viewingProfile.general_info}
              </p>
            </div>
          )}

          {/* Fortalezas y Debilidades */}
          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
              <h3 className="text-xl font-semibold mb-4 text-emerald-400">
                Fortalezas
              </h3>
              <p className="text-base leading-relaxed text-text-secondary m-0">
                {viewingProfile.strengths}
              </p>
            </div>

            <div className="p-6 bg-red-500/5 rounded-xl border border-red-500/20">
              <h3 className="text-xl font-semibold mb-4 text-red-400">
                Debilidades
              </h3>
              <p className="text-base leading-relaxed text-text-secondary m-0">
                {viewingProfile.weaknesses}
              </p>
            </div>
          </div>

          {/* Información Comercial */}
          <div className="p-6 bg-amber-500/5 rounded-xl border border-amber-500/20">
            <h3 className="text-xl font-semibold mb-4 text-amber-400">
              Informacion Comercial
            </h3>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
              {viewingProfile.agent_name && (
                <div>
                  <strong>Representante:</strong> {viewingProfile.agent_name}
                  {viewingProfile.agent_contact && (
                    <div className="text-sm text-text-muted mt-1">
                      {viewingProfile.agent_contact}
                    </div>
                  )}
                </div>
              )}

              {viewingProfile.video_link && (
                <div>
                  <strong>Video:</strong>{' '}
                  <a
                    href={viewingProfile.video_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline hover:text-blue-300"
                  >
                    Ver Video
                  </a>
                </div>
              )}

              {viewingProfile.transfermarkt_link && (
                <div>
                  <strong>Transfermarkt:</strong>{' '}
                  <a
                    href={viewingProfile.transfermarkt_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline hover:text-blue-300"
                  >
                    Ver Perfil
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Información del Scout */}
          {viewingProfile.created_by_name && (
            <div className="p-6 bg-purple-500/5 rounded-xl border border-purple-500/20">
              <h3 className="text-xl font-semibold mb-4 text-purple-400">
                Informacion del Scout
              </h3>
              <div className="flex gap-8 items-center">
                <div>
                  <strong>Creado por:</strong> {viewingProfile.created_by_name}
                  {viewingProfile.created_at && (
                    <div className="text-sm text-text-muted mt-1">
                      {new Date(viewingProfile.created_at).toLocaleDateString('es-ES')}
                    </div>
                  )}
                </div>
                {viewingProfile.updated_by_name && viewingProfile.updated_by_name !== viewingProfile.created_by_name && (
                  <div>
                    <strong>Ultima edicion:</strong> {viewingProfile.updated_by_name}
                    {viewingProfile.updated_at && (
                      <div className="text-sm text-text-muted mt-1">
                        {new Date(viewingProfile.updated_at).toLocaleDateString('es-ES')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vista de creación/edición
  return (
    <div className="bg-card rounded-2xl p-8 shadow-lg">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-text m-0">
          {savedProfiles.some(p => p.id === profileData.id)
            ? 'Editar Perfil de Scouting'
            : 'Crear Perfil de Scouting'}
        </h2>
        <button
          onClick={() => setViewMode('list')}
          className="px-4 py-2 bg-white/8 text-text-secondary border border-border rounded-lg text-sm font-semibold cursor-pointer hover:bg-card-hover transition-colors"
        >
          ← Volver
        </button>
      </div>

      {!selectedPlayer ? (
        // Búsqueda de jugador
        <div>
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2 text-text-secondary">
              Buscar Jugador en Base de Datos
            </label>
            <input
              type="text"
              placeholder="Buscar jugador... (ej: Messi, Haaland, etc.)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 bg-surface border border-border-strong rounded-md text-base text-text focus:border-accent/50 focus:outline-none"
            />
          </div>

          {loading && (
            <div className="text-center p-8">
              <p className="text-text-muted">Buscando jugadores...</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="grid gap-4 mb-8">
              {searchResults.slice(0, 10).map((player: any) => (
                <div
                  key={player.id}
                  onClick={() => selectPlayer(player)}
                  className="p-4 border border-border-strong rounded-lg cursor-pointer transition-all flex items-center gap-4 hover:border-accent/30 hover:bg-card-hover"
                >
                  <div className="w-[50px] h-[50px] rounded-full bg-accent flex items-center justify-center text-white font-bold">
                    {player.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                  </div>

                  <div>
                    <h4 className="m-0 text-base font-semibold text-text">
                      {player.name}
                    </h4>
                    <div className="text-sm text-text-muted mt-1">
                      {player.position} - {player.team} - {player.age ? `${player.age} anos` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <button
              onClick={() => {
                setSelectedPlayer({ name: 'Jugador Manual', id: 'manual' });
                setViewMode('create');
              }}
              className="px-6 py-3 bg-amber-500 text-white border-none rounded-lg text-sm font-semibold cursor-pointer hover:bg-amber-600 transition-colors"
            >
              Crear Perfil Manual (Sin Wyscout)
            </button>
          </div>
        </div>
      ) : (
        // Formulario de perfil
        <div className="grid gap-6">
          {/* Datos básicos */}
          <div className="p-6 bg-surface rounded-xl border border-border-strong">
            <h3 className="text-xl font-semibold mb-4 text-text">
              Datos Basicos
            </h3>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-text-secondary">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={profileData.name || profileData.player_name || ''}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    name: e.target.value,
                    player_name: e.target.value
                  })}
                  className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-secondary">
                  Posicion
                </label>
                <input
                  type="text"
                  value={profileData.position || ''}
                  onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                  className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-secondary">
                  Equipo Actual
                </label>
                <input
                  type="text"
                  value={profileData.currentTeam || profileData.current_team || ''}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    currentTeam: e.target.value,
                    current_team: e.target.value
                  })}
                  className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-secondary">
                  Edad
                </label>
                <input
                  type="number"
                  value={profileData.age || ''}
                  onChange={(e) => setProfileData({ ...profileData, age: parseInt(e.target.value) || undefined })}
                  className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-secondary">
                  Nacionalidad
                </label>
                <input
                  type="text"
                  value={profileData.nationality || ''}
                  onChange={(e) => setProfileData({ ...profileData, nationality: e.target.value })}
                  className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Análisis de Scouting */}
          <div className="p-6 bg-accent/5 rounded-xl border border-accent/20">
            <h3 className="text-xl font-semibold mb-4 text-accent">
              Analisis de Scouting
            </h3>

            <div>
              <label className="block text-sm font-semibold mb-2 text-text-secondary">
                Analisis Posicional Detallado
              </label>
              <textarea
                placeholder="Describe su posicion preferida, versatilidad posicional, como se adapta a diferentes sistemas tacticos..."
                value={profileData.position_analysis}
                onChange={(e) => setProfileData({ ...profileData, position_analysis: e.target.value })}
                rows={4}
                className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text resize-y focus:border-accent/50 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-blue-400">
                  Informacion General
                </label>
                <textarea
                  placeholder="Informacion adicional, observaciones generales, contexto del jugador..."
                  value={profileData.general_info || ''}
                  onChange={(e) => setProfileData({ ...profileData, general_info: e.target.value })}
                  rows={4}
                  className="w-full p-3 bg-blue-500/5 border border-blue-500/20 rounded-md text-sm text-text resize-y focus:border-blue-400/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-emerald-400">
                  Fortalezas Principales
                </label>
                <textarea
                  placeholder="Principales virtudes tecnicas, fisicas y mentales del jugador..."
                  value={profileData.strengths}
                  onChange={(e) => setProfileData({ ...profileData, strengths: e.target.value })}
                  rows={4}
                  className="w-full p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-md text-sm text-text resize-y focus:border-emerald-400/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-red-400">
                  Debilidades a Mejorar
                </label>
                <textarea
                  placeholder="Aspectos que debe trabajar, limitaciones tecnicas o fisicas..."
                  value={profileData.weaknesses}
                  onChange={(e) => setProfileData({ ...profileData, weaknesses: e.target.value })}
                  rows={4}
                  className="w-full p-3 bg-red-500/5 border border-red-500/20 rounded-md text-sm text-text resize-y focus:border-red-400/50 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Información Comercial */}
          <div className="p-6 bg-amber-500/5 rounded-xl border border-amber-500/20">
            <h3 className="text-xl font-semibold mb-4 text-amber-400">
              Informacion Comercial y Enlaces
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-text-secondary">
                  Nombre del Representante
                </label>
                <input
                  type="text"
                  placeholder="Ej: Jorge Mendes"
                  value={profileData.agent_name}
                  onChange={(e) => setProfileData({ ...profileData, agent_name: e.target.value })}
                  className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-secondary">
                  Contacto del Representante
                </label>
                <input
                  type="text"
                  placeholder="Email o telefono"
                  value={profileData.agent_contact}
                  onChange={(e) => setProfileData({ ...profileData, agent_contact: e.target.value })}
                  className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-secondary">
                  Link de Video
                </label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={profileData.video_link}
                  onChange={(e) => setProfileData({ ...profileData, video_link: e.target.value })}
                  className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-secondary">
                  Link de Transfermarkt
                </label>
                <input
                  type="url"
                  placeholder="https://transfermarkt.com/..."
                  value={profileData.transfermarkt_link}
                  onChange={(e) => setProfileData({ ...profileData, transfermarkt_link: e.target.value })}
                  className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-between items-center p-6 bg-surface rounded-xl border border-border-strong">
            <div className="text-sm text-text-muted">
              Puedes editar cualquier campo que necesites modificar
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  resetForm();
                  setViewMode('list');
                }}
                className="px-6 py-3 bg-white/8 text-text-secondary border border-border rounded-lg text-sm font-semibold cursor-pointer hover:bg-card-hover transition-colors"
              >
                Cancelar
              </button>

              <button
                onClick={saveProfile}
                disabled={saving}
                className={`px-8 py-3 text-white border-none rounded-lg text-sm font-semibold transition-colors ${
                  saving
                    ? 'bg-gray-500 cursor-not-allowed opacity-70'
                    : 'bg-accent cursor-pointer hover:opacity-90'
                }`}
              >
                {saving ? 'Guardando...' : 'Guardar Perfil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerProfile;
