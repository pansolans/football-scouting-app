import React, { useState, useEffect } from 'react';
import { playerService } from '../services/api';

interface PlayerProfileData {
  // Datos básicos (automáticos de Wyscout)
  id?: string;
  wyscout_id?: number;
  name: string;
  shortName?: string;
  age?: number;
  position?: string;
  currentTeam?: string;
  nationality?: string;
  height?: number;
  weight?: number;
  foot?: string;
  imageUrl?: string;
  
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
  created_at?: string;
  updated_at?: string;
}

interface PlayerProfileProps {
  onClose?: () => void;
}

const PlayerProfile: React.FC<PlayerProfileProps> = ({ onClose }) => {
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
        id: String(player.id),
        wyscout_id: player.wyscout_id || player.id,
        name: profile.basic_info?.shortName || player.name,
        shortName: profile.basic_info?.shortName,
        age: profile.basic_info?.birthDate ? 
          new Date().getFullYear() - new Date(profile.basic_info.birthDate).getFullYear() : 
          player.age,
        position: profile.basic_info?.role?.name || player.position,
        currentTeam: profile.basic_info?.currentTeam?.name || player.team,
        nationality: profile.basic_info?.passportArea?.name || player.nationality,
        height: profile.basic_info?.height,
        weight: profile.basic_info?.weight,
        foot: profile.basic_info?.foot,
        imageUrl: profile.basic_info?.imageDataURL
      });
    } catch (error) {
      // Si no se puede cargar el perfil completo, usar datos básicos
      setProfileData({
        ...profileData,
        id: String(player.id),
        wyscout_id: player.wyscout_id || player.id,
        name: player.name,
        age: player.age,
        position: player.position,
        currentTeam: player.team,
        nationality: player.nationality
      });
    }
    
    setViewMode('create');
  };

  // Guardar perfil
  const saveProfile = async () => {
    if (!profileData.name || !profileData.position_analysis) {
      alert('Por favor completa al menos el nombre y análisis posicional');
      return;
    }

    setSaving(true);
    try {
      // Aquí harías la llamada al backend para guardar
      // Por ahora simularemos guardado local
      const newProfile = {
        ...profileData,
        id: profileData.id || Date.now().toString(),
        created_at: new Date().toISOString(),
        created_by: 'Current User' // Reemplazar con usuario actual
      };

      setSavedProfiles([...savedProfiles, newProfile]);
      alert('Perfil guardado exitosamente');
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

  // Vista de lista de perfiles
  if (viewMode === 'list') {
    return (
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
            📋 Perfiles de Scouting
          </h2>
          <button
            onClick={() => setViewMode('create')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ➕ Crear Nuevo Perfil
          </button>
        </div>

        {savedProfiles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <p>No hay perfiles de scouting creados todavía</p>
            <p style={{ fontSize: '0.875rem' }}>Crea el primer perfil para empezar tu base de talentos analizados</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {savedProfiles.map((profile) => (
              <div key={profile.id} style={{
                background: '#f9fafb',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {profile.imageUrl ? (
                    <img
                      src={profile.imageUrl}
                      alt={profile.name}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1.25rem'
                    }}>
                      {profile.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                  )}
                  
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#1f2937' }}>
                      {profile.name}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        ⚽ {profile.position}
                      </span>
                      {profile.age && (
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          📅 {profile.age} años
                        </span>
                      )}
                      {profile.currentTeam && (
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          🏟️ {profile.currentTeam}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      setViewingProfile(profile);
                      setViewMode('view');
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    👁️ Ver
                  </button>
                  <button
                    onClick={exportToPDF}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    📄 PDF
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
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '0.5rem 1rem',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ← Volver a la Lista
          </button>
          
          <button
            onClick={exportToPDF}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            📄 Exportar PDF
          </button>
        </div>

        {/* Header del perfil */}
        <div style={{
          display: 'flex',
          gap: '2rem',
          marginBottom: '2rem',
          padding: '2rem',
          background: 'linear-gradient(135deg, #667eea15, #764ba215)',
          borderRadius: '12px',
          border: '2px solid #667eea30'
        }}>
          {viewingProfile.imageUrl ? (
            <img
              src={viewingProfile.imageUrl}
              alt={viewingProfile.name}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid white'
              }}
            />
          ) : (
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '2.5rem',
              border: '4px solid white'
            }}>
              {viewingProfile.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </div>
          )}

          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 1rem 0', color: '#1f2937' }}>
              {viewingProfile.name}
            </h1>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <span style={{
                padding: '0.5rem 1rem',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: 'white',
                fontWeight: '600'
              }}>
                ⚽ {viewingProfile.position}
              </span>
              
              {viewingProfile.age && (
                <span style={{ fontSize: '0.875rem', color: '#4b5563', display: 'flex', alignItems: 'center' }}>
                  🎂 {viewingProfile.age} años
                </span>
              )}
              
              {viewingProfile.currentTeam && (
                <span style={{ fontSize: '0.875rem', color: '#4b5563', display: 'flex', alignItems: 'center' }}>
                  🏟️ {viewingProfile.currentTeam}
                </span>
              )}
              
              {viewingProfile.nationality && (
                <span style={{ fontSize: '0.875rem', color: '#4b5563', display: 'flex', alignItems: 'center' }}>
                  🌍 {viewingProfile.nationality}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: '#6b7280' }}>
              {viewingProfile.height && <span>📏 {viewingProfile.height} cm</span>}
              {viewingProfile.weight && <span>⚖️ {viewingProfile.weight} kg</span>}
              {viewingProfile.foot && <span>👟 {viewingProfile.foot}</span>}
            </div>
          </div>
        </div>

        {/* Contenido del análisis */}
        <div style={{ display: 'grid', gap: '2rem' }}>
          {/* Análisis Posicional */}
          <div style={{
            padding: '1.5rem',
            background: '#f9fafb',
            borderRadius: '12px',
            border: '2px solid #e5e7eb'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
              🎯 Análisis Posicional
            </h3>
            <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#374151', margin: 0 }}>
              {viewingProfile.position_analysis}
            </p>
          </div>

          {/* Información General */}
{viewingProfile.general_info && (
  <div style={{
    padding: '1.5rem',
    background: 'linear-gradient(135deg, #3b82f615, #3b82f625)',
    borderRadius: '12px',
    border: '2px solid #3b82f630'
  }}>
    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1d4ed8' }}>
      📝 Información General
    </h3>
    <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#374151', margin: 0 }}>
      {viewingProfile.general_info}
    </p>
  </div>
)}

          {/* Fortalezas y Debilidades */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #10b98115, #10b98125)',
              borderRadius: '12px',
              border: '2px solid #10b98130'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#059669' }}>
                ✅ Fortalezas
              </h3>
              <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#374151', margin: 0 }}>
                {viewingProfile.strengths}
              </p>
            </div>

            <div style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #ef444415, #ef444425)',
              borderRadius: '12px',
              border: '2px solid #ef444430'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#dc2626' }}>
                ⚠️ Debilidades
              </h3>
              <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#374151', margin: 0 }}>
                {viewingProfile.weaknesses}
              </p>
            </div>
          </div>

          {/* Información Comercial */}
          <div style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #f59e0b15, #f59e0b25)',
            borderRadius: '12px',
            border: '2px solid #f59e0b30'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#d97706' }}>
              💼 Información Comercial
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {viewingProfile.agent_name && (
                <div>
                  <strong>🤝 Representante:</strong> {viewingProfile.agent_name}
                  {viewingProfile.agent_contact && (
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      📞 {viewingProfile.agent_contact}
                    </div>
                  )}
                </div>
              )}
              
              {viewingProfile.video_link && (
                <div>
                  <strong>🎥 Video:</strong>{' '}
                  <a 
                    href={viewingProfile.video_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#3b82f6', textDecoration: 'underline' }}
                  >
                    Ver Video
                  </a>
                </div>
              )}
              
              {viewingProfile.transfermarkt_link && (
                <div>
                  <strong>📊 Transfermarkt:</strong>{' '}
                  <a 
                    href={viewingProfile.transfermarkt_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#3b82f6', textDecoration: 'underline' }}
                  >
                    Ver Perfil
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista de creación/edición
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '2rem',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
          📋 Crear Perfil de Scouting
        </h2>
        <button
          onClick={() => setViewMode('list')}
          style={{
            padding: '0.5rem 1rem',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          ← Volver
        </button>
      </div>

      {!selectedPlayer ? (
        // Búsqueda de jugador
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
              🔍 Buscar Jugador en Base de Datos
            </label>
            <input
              type="text"
              placeholder="Buscar jugador... (ej: Messi, Haaland, etc.)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚽</div>
              <p>Buscando jugadores...</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
              {searchResults.slice(0, 10).map((player: any) => (
                <div
                  key={player.id}
                  onClick={() => selectPlayer(player)}
                  style={{
                    padding: '1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.backgroundColor = '#f8faff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    {player.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                  </div>
                  
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                      {player.name}
                    </h4>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      {player.position} • {player.team} • {player.age ? `${player.age} años` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button
              onClick={() => {
                setSelectedPlayer({ name: 'Jugador Manual', id: 'manual' });
                setViewMode('create');
              }}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ✏️ Crear Perfil Manual (Sin Wyscout)
            </button>
          </div>
        </div>
      ) : (
        // Formulario de perfil
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Datos básicos */}
          <div style={{
            padding: '1.5rem',
            background: '#f9fafb',
            borderRadius: '12px',
            border: '2px solid #e5e7eb'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
              👤 Datos Básicos
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              {selectedPlayer?.id !== 'manual' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                      Posición
                    </label>
                    <input
                      type="text"
                      value={profileData.position || ''}
                      readOnly
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        backgroundColor: '#f3f4f6'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                      Equipo Actual
                    </label>
                    <input
                      type="text"
                      value={profileData.currentTeam || ''}
                      readOnly
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        backgroundColor: '#f3f4f6'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                      Edad
                    </label>
                    <input
                      type="text"
                      value={profileData.age ? `${profileData.age} años` : ''}
                      readOnly
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        backgroundColor: '#f3f4f6'
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Análisis de Scouting */}
          <div style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #667eea15, #764ba215)',
            borderRadius: '12px',
            border: '2px solid #667eea30'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
              🎯 Análisis de Scouting
            </h3>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                Análisis Posicional Detallado
              </label>
              <textarea
                placeholder="Describe su posición preferida, versatilidad posicional, cómo se adapta a diferentes sistemas tácticos..."
                value={profileData.position_analysis}
                onChange={(e) => setProfileData({ ...profileData, position_analysis: e.target.value })}
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  resize: 'vertical'
                }}
              />
            </div>

<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
  <div>
    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#3b82f6' }}>
      📝 Información General
    </label>
    <textarea
      placeholder="Información adicional, observaciones generales, contexto del jugador..."
      value={profileData.general_info || ''}
      onChange={(e) => setProfileData({ ...profileData, general_info: e.target.value })}
      rows={4}
      style={{
        width: '100%',
        padding: '0.75rem',
        border: '2px solid #3b82f630',
        borderRadius: '8px',
        fontSize: '0.875rem',
        backgroundColor: '#3b82f608',
        resize: 'vertical'
      }}
    />
  </div>

  <div>
    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#059669' }}>
      ✅ Fortalezas Principales
    </label>
    <textarea
      placeholder="Principales virtudes técnicas, físicas y mentales del jugador..."
      value={profileData.strengths}
      onChange={(e) => setProfileData({ ...profileData, strengths: e.target.value })}
      rows={4}
      style={{
        width: '100%',
        padding: '0.75rem',
        border: '2px solid #10b98130',
        borderRadius: '8px',
        fontSize: '0.875rem',
        backgroundColor: '#10b98108',
        resize: 'vertical'
      }}
    />
  </div>

  <div>
    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#dc2626' }}>
      ⚠️ Debilidades a Mejorar
    </label>
    <textarea
      placeholder="Aspectos que debe trabajar, limitaciones técnicas o físicas..."
      value={profileData.weaknesses}
      onChange={(e) => setProfileData({ ...profileData, weaknesses: e.target.value })}
      rows={4}
      style={{
        width: '100%',
        padding: '0.75rem',
        border: '2px solid #ef444430',
        borderRadius: '8px',
        fontSize: '0.875rem',
        backgroundColor: '#ef444408',
        resize: 'vertical'
      }}
    />
  </div>
</div>
          </div>

          {/* Información Comercial */}
          <div style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #f59e0b15, #f59e0b25)',
            borderRadius: '12px',
            border: '2px solid #f59e0b30'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
              💼 Información Comercial y Enlaces
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                  🤝 Nombre del Representante
                </label>
                <input
                  type="text"
                  placeholder="Ej: Jorge Mendes"
                  value={profileData.agent_name}
                  onChange={(e) => setProfileData({ ...profileData, agent_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                  📞 Contacto del Representante
                </label>
                <input
                  type="text"
                  placeholder="Email o teléfono"
                  value={profileData.agent_contact}
                  onChange={(e) => setProfileData({ ...profileData, agent_contact: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                  🎥 Link de Video
                </label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={profileData.video_link}
                  onChange={(e) => setProfileData({ ...profileData, video_link: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                  📊 Link de Transfermarkt
                </label>
                <input
                  type="url"
                  placeholder="https://transfermarkt.com/..."
                  value={profileData.transfermarkt_link}
                  onChange={(e) => setProfileData({ ...profileData, transfermarkt_link: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.5rem',
            background: '#f9fafb',
            borderRadius: '12px',
            border: '2px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Complete al menos el análisis posicional para guardar el perfil
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => {
                  resetForm();
                  setViewMode('list');
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ❌ Cancelar
              </button>
              
              <button
                onClick={saveProfile}
                disabled={saving || !profileData.name || !profileData.position_analysis}
                style={{
                  padding: '0.75rem 2rem',
                  background: (!profileData.name || !profileData.position_analysis) ? 
                    '#9ca3af' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: (!profileData.name || !profileData.position_analysis) ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? '💾 Guardando...' : '💾 Guardar Perfil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerProfile;