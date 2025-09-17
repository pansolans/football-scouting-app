import React, { useState, useEffect } from 'react';
import { playerService, healthService, scoutingService, Player, ScoutReport, ScoutReportCreate, HealthStatus } from './services/api';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import PlayerForm from './components/PlayerForm';
import MarketSystem from './components/MarketSystem';
import MarketModalManager from './components/MarketModalManager';
const API_URL = 'https://football-scouting-backend-vd0x.onrender.com';


// Componente para proteger rutas 
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};



const MainApp: React.FC = () => {
  const { user, logout } = useAuth();
  const userClub = user?.organization || 'Club Atlético Banfield';

  const clubConfig = {
    'Club Atlético Banfield': {
      primaryColor: '#0a5f1c',
      secondaryColor: '#0d7328',
      logo: 'https://logodownload.org/wp-content/uploads/2020/05/banfield-logo-0.png',
      name: 'CA Banfield'
    },
    'Boca Juniors': {
      primaryColor: '#003f7f',
      secondaryColor: '#ffd700',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Escudo_del_Club_Atl%C3%A9tico_Boca_Juniors.svg/1696px-Escudo_del_Club_Atl%C3%A9tico_Boca_Juniors.svg.png',
      name: 'Boca Juniors'
    },
    'Santa Fe Fútbol Club': {
      primaryColor: '#003f7f',
      secondaryColor: '#ffd700',
      logo: 'https://santafefc.do/wp-content/uploads/2021/08/logo_sf_footer_300x300-16.png',
      name: 'Santa Fe FC'
    }
  };

  const currentClub = clubConfig[userClub as keyof typeof clubConfig] || clubConfig['Club Atlético Banfield'];
  const [activeTab, setActiveTab] = useState<'dashboard' | 'quick-search' | 'browse' | 'reports' | 'player-profile' | 'recommendations' | 'add-player' | 'manual-players' | 'markets'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [wyscoutStatus, setWyscoutStatus] = useState<any>(null);
  const [scoutReports, setScoutReports] = useState<ScoutReport[]>([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [selectedPlayerForDetail, setSelectedPlayerForDetail] = useState<string | null>(null);
  const [playerDetailReports, setPlayerDetailReports] = useState<ScoutReport[]>([]);
  const [filterLeague, setFilterLeague] = useState('');
  const [filterRecommendation, setFilterRecommendation] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterPlayerName, setFilterPlayerName] = useState('');
  const [filterTeam, setFilterTeam] = useState('');


  // Browse filters
  const [areas, setAreas] = useState<any[]>([]);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<number | null>(null);
  const [competitionTeams, setCompetitionTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [teamPlayers, setTeamPlayers] = useState<any[]>([]);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [manualPlayers, setManualPlayers] = useState<any[]>([]);
  const [filteredManualPlayers, setFilteredManualPlayers] = useState<any[]>([]);
  const [manualPlayerFilters, setManualPlayerFilters] = useState({
    name: '',
    team: '',
    nationality: '',
    minAge: '',
    maxAge: '',
    position: ''
  });
  const [loadingManualPlayers, setLoadingManualPlayers] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    teams: [] as string[],
    countries: [] as string[],
    positions: [] as string[]
  });

  // Estados para el sistema de mercados - AGREGAR ESTOS
  const [selectedMarketPlayer, setSelectedMarketPlayer] = useState<any>(null);
  const [showMarketModal, setShowMarketModal] = useState(false);
  const [availableMarkets, setAvailableMarkets] = useState<any[]>([]);
  const [marketForm, setMarketForm] = useState({
    market_id: '',
    priority: 'media',
    estimated_price: '',
    max_price: '',
    notes: ''
  });

  // Agregar estos estados con los otros estados existentes
const [selectedNationalities, setSelectedNationalities] = useState<string[]>([]);
const [ageFilter, setAgeFilter] = useState({ min: '', max: '' });
const [showNationalityFilter, setShowNationalityFilter] = useState(false);
const [availableNationalities, setAvailableNationalities] = useState<string[]>([]);
const [isLoadingFiltered, setIsLoadingFiltered] = useState(false);
const [selectedTeams, setSelectedTeams] = useState<number[]>([]);

  const [reportForm, setReportForm] = useState<ScoutReportCreate>({
    player_id: '',
    player_name: '',
    match_context: '',
    position_played: '',

    overall_rating: 7,

    // Técnicos
    tecnica_individual: 7,
    pase: 7,
    primer_toque: 7,
    control_balon: 7,
    vision_juego: 7,

    // Físicos
    velocidad: 7,
    resistencia: 7,
    fuerza: 7,
    salto: 7,
    agilidad: 7,

    // Mentales
    inteligencia_tactica: 7,
    posicionamiento: 7,
    concentracion: 7,
    liderazgo: 7,
    trabajo_equipo: 7,

    notes: '',
    fortalezas: '',
    debilidades: '',

    // Seguimiento
    recomendacion: '',
    condicion_mercado: '',
    agente: '',
    tags: [],
    precio_estimado: 0,

    fecha_observacion: new Date().toISOString().split('T')[0],
    tipo_visionado: '',
    competicion: '',
    rival: '',
    resultado: '',
    minutos_observados: 90
  });

  // Agregar estado para la sección activa del formulario
  const [formSection, setFormSection] = useState<'general' | 'tecnico' | 'fisico' | 'mental' | 'seguimiento'>('general');
  const [playerMatches, setPlayerMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const health = await healthService.checkHealth();
        setHealthStatus(health);

        const wyscout = await healthService.testWyscout();
        setWyscoutStatus(wyscout);

        const reports = await scoutingService.getReports();
        setScoutReports(Array.isArray(reports) ? reports : []);


        const areasData = await playerService.getAreas();
        setAreas(Array.isArray(areasData) ? areasData : []);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    loadInitialData();
  }, []);

  // Smart search
  // Smart search with fallback to regular search
  const handleSmartSearch = async () => {
    if (searchQuery.length < 2) return;

    setLoading(true);
    try {
      // Just use regular player search and format as search results
      const players = await playerService.searchPlayers(searchQuery);
      const playersArray = Array.isArray(players) ? players : [];
      const results = playersArray.map(p => ({
        ...p,
        type: 'player',
        imageDataURL: null
      }));
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2 && activeTab === 'quick-search') {
        handleSmartSearch();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // NUEVAS FUNCIONES PARA VISTA DETALLADA (VERSIÓN FINAL)
  // Función para abrir vista detallada de jugador
  const openPlayerDetail = (playerName: string) => {
    const playerReports = scoutReports.filter(report => report.player_name === playerName);
    setPlayerDetailReports(playerReports);
    setSelectedPlayerForDetail(playerName);
  };

// Función para abrir modal de mercado
const openMarketModal = async (player: any) => {
  setSelectedMarketPlayer(player);
  
  // Cargar mercados activos
  try {
    const response = await fetch(`${API_URL}/api/markets`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const markets = await response.json();
      setAvailableMarkets(markets.filter((m: any) => m.status === 'active'));
      setShowMarketModal(true);
    }
  } catch (error) {
    console.error('Error loading markets:', error);
    alert('Error al cargar mercados');
  }
};

  // Función para cerrar vista detallada
  const closePlayerDetail = () => {
    setSelectedPlayerForDetail(null);
    setPlayerDetailReports([]);
  };

  // Calcular promedio general
  const calculateAverageScore = (reports: ScoutReport[]) => {
    if (!reports || !Array.isArray(reports) || reports.length === 0) return '0';  // AGREGAR Array.isArray
    const sum = reports.reduce((acc, report) => acc + report.overall_rating, 0);
    return (sum / reports.length).toFixed(1);
  };
  // Obtener la última recomendación
  const getLatestRecommendation = (reports: ScoutReport[]) => {
    if (reports.length === 0) return null;

    // Ordenar por fecha y tomar la más reciente
    const sortedReports = [...reports].sort((a, b) => {
      const dateA = new Date(a.fecha_observacion || a.created_at).getTime();
      const dateB = new Date(b.fecha_observacion || b.created_at).getTime();
      return dateB - dateA; // Más reciente primero
    });

    return sortedReports[0].recomendacion;
  };

  // Función para obtener jugadores únicos con su último reporte
  const getFilteredPlayers = () => {
    // Agrupar reportes por jugador
    const playerMap = new Map();

    scoutReports.forEach(report => {
      if (!playerMap.has(report.player_name)) {
        playerMap.set(report.player_name, []);
      }
      playerMap.get(report.player_name).push(report);
    });

    // Crear resumen de cada jugador con promedio
    const playerSummaries = Array.from(playerMap.entries()).map(([playerName, reports]) => {
      // Calcular promedio de rating
      const avgRating = reports.reduce((sum: number, r: any) => sum + r.overall_rating, 0) / reports.length;

      // Obtener el reporte más reciente para otros datos
      const latestReport = reports.sort((a: any, b: any) => {
        const dateA = new Date(a.fecha_observacion || a.created_at).getTime();
        const dateB = new Date(b.fecha_observacion || b.created_at).getTime();
        return dateB - dateA;
      })[0];

      return {
        ...latestReport,
        player_name: playerName,
        overall_rating: Math.round(avgRating * 10) / 10, // Promedio redondeado a 1 decimal
        total_reports: reports.length,
        // Estos campos los necesitaremos agregar desde Wyscout idealmente
        team: latestReport.rival || 'Sin equipo', // Por ahora usamos rival como referencia
        age: null // Necesitaríamos obtener esto de Wyscout
      };
    });

    // Filtrar según los criterios seleccionados
    return playerSummaries.filter(player => {
      if (filterLeague && player.competicion !== filterLeague) return false;
      if (filterRecommendation && player.recomendacion !== filterRecommendation) return false;
      if (filterPosition && player.position_played !== filterPosition) return false;
      return true;
    });
  };

  // Filtrar reportes por jugador, equipo o liga
  const getFilteredReports = () => {
    return scoutReports.filter(report => {
      // Filtro por nombre de jugador
      if (filterPlayerName && !report.player_name.toLowerCase().includes(filterPlayerName.toLowerCase())) {
        return false;
      }

      // Filtro por equipo (usando el campo rival como referencia de equipo)
      if (filterTeam && report.rival && !report.rival.toLowerCase().includes(filterTeam.toLowerCase())) {
        return false;
      }

      // Filtro por liga/competición
      if (filterLeague && report.competicion !== filterLeague) {
        return false;
      }

      return true;
    });
  };

  // Obtener ligas únicas de los reportes
  const getUniqueLeagues = () => {
    const leagues = new Set(scoutReports.map(r => r.competicion).filter(Boolean));
    return Array.from(leagues).sort();
  };

  // Obtener posiciones únicas
  const getUniquePositions = () => {
    const positions = new Set(scoutReports.map(r => r.position_played).filter(Boolean));
    return Array.from(positions).sort();
  };

  // Calcular promedios por categoría
  const calculateCategoryAverages = (reports: ScoutReport[]) => {
    if (!reports || !Array.isArray(reports) || reports.length === 0) {  // AGREGAR validación
      return { technical: '0', physical: '0', mental: '0' };
    }

    // Calcular promedios de categorías técnicas
    const technical = reports.reduce((acc, report) => {
      const techSum = (report.tecnica_individual + report.pase + report.primer_toque +
        report.control_balon + report.vision_juego) / 5;
      return acc + techSum;
    }, 0) / reports.length;

    // Calcular promedios de categorías físicas  
    const physical = reports.reduce((acc, report) => {
      const physSum = (report.velocidad + report.resistencia + report.fuerza +
        report.salto + report.agilidad) / 5;
      return acc + physSum;
    }, 0) / reports.length;

    // Calcular promedios de categorías mentales
    const mental = reports.reduce((acc, report) => {
      const mentSum = (report.inteligencia_tactica + report.posicionamiento +
        report.concentracion + report.liderazgo + report.trabajo_equipo) / 5;
      return acc + mentSum;
    }, 0) / reports.length;

    return {
      technical: technical.toFixed(1),
      physical: physical.toFixed(1),
      mental: mental.toFixed(1)
    };
  };



  // Load competitions when area is selected
  useEffect(() => {
    const loadCompetitions = async () => {
      if (selectedArea) {
        setLoading(true);
        try {
          const comps = await playerService.getCompetitions(selectedArea);
          setCompetitions(Array.isArray(comps) ? comps : []);
          setSelectedCompetition(null);
          setCompetitionTeams([]);
          setSelectedTeam(null);
          setSelectedTeams([]);
          setTeamPlayers([]);
        } catch (error) {
          console.error('Failed to load competitions:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadCompetitions();
  }, [selectedArea]);

  // Load teams when competition is selected
  useEffect(() => {
    const loadTeams = async () => {
      if (selectedCompetition) {
        setLoading(true);
        try {
          const teams = await playerService.getCompetitionTeams(selectedCompetition);
          setCompetitionTeams(Array.isArray(teams) ? teams : []);
          setSelectedTeam(null);
          setSelectedTeams([]);
          setTeamPlayers([]);
          searchPlayersWithFilters();
        } catch (error) {
          console.error('Failed to load teams:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadTeams();
  }, [selectedCompetition]);

// Load players when teams are selected WITH FILTERING
useEffect(() => {
  const loadTeamPlayers = async () => {
    if (selectedTeams.length > 0) {
      setLoading(true);
      try {
        const allPlayers = [];
        for (const teamId of selectedTeams) {
          const players = await playerService.getTeamPlayers(teamId);
          if (Array.isArray(players)) {
            allPlayers.push(...players);
          }
        }
        
        // Aplicar filtros en tiempo real
        let filteredPlayers = [...allPlayers];
        
        // Filtro por nacionalidad
        if (selectedNationalities.length > 0) {
          filteredPlayers = filteredPlayers.filter(player => {
            const nationality = player.nationality;
            return selectedNationalities.includes(nationality);
          });
        }
        
        // Filtro por edad
        if (ageFilter.min || ageFilter.max) {
          filteredPlayers = filteredPlayers.filter(player => {
            if (!player.birthDate) return false;
            const age = new Date().getFullYear() - new Date(player.birthDate).getFullYear();
            const meetsMin = !ageFilter.min || age >= parseInt(ageFilter.min);
            const meetsMax = !ageFilter.max || age <= parseInt(ageFilter.max);
            return meetsMin && meetsMax;
          });
        }
        
        setTeamPlayers(filteredPlayers);
        
        // Extraer nacionalidades de TODOS los jugadores (no filtrados)
        const nationalities = Array.from(new Set(
          allPlayers.map((player: any) => 
            player.nationality
          ).filter(Boolean)
        )).sort();
        setAvailableNationalities(nationalities);
        
      } catch (error) {
        console.error('Failed to load players:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setTeamPlayers([]);
      setAvailableNationalities([]);
    }
  };
  loadTeamPlayers();
}, [selectedTeams, selectedNationalities, ageFilter.min, ageFilter.max]);

  // View player profile
  const viewPlayerProfile = async (playerId: number) => {
    setLoadingProfile(true);
    setActiveTab('player-profile');
    try {
      const profile = await playerService.getPlayerProfile(playerId);
      console.log('Profile loaded:', profile);  // <-- AGREGAR ESTA
      setPlayerProfile(profile);
    } catch (error) {
      console.error('Failed to load player profile:', error);
      setPlayerProfile(null);  // <-- AGREGAR ESTA
    } finally {
      setLoadingProfile(false);
    }
  };

  // Submit scout report
  const handleSubmitReport = async () => {
    if (!selectedPlayer) return;

    try {
      const reportData = {
        ...reportForm,
        player_id: String(selectedPlayer.id),
        player_name: selectedPlayer.name
      };

      console.log('Sending to backend:', reportData);

      let result: ScoutReport;
      if (editingReportId) {
        // ACTUALIZAR reporte existente
        result = await scoutingService.updateReport(editingReportId, reportData);
        // Actualizar en la lista local
        setScoutReports(scoutReports.map(r =>
          r.id === editingReportId ? result : r
        ));
        alert('Reporte actualizado exitosamente!');
      } else {
        // CREAR nuevo reporte
        result = await scoutingService.createReport(reportData);
        setScoutReports([...scoutReports, result]);
        alert('Reporte creado exitosamente!');
      }

      setShowReportForm(false);
      setEditingReportId(null); // Limpiar el ID de edición

      // Reset form con todos los campos nuevos
      setReportForm({
        player_id: '',
        player_name: '',
        match_context: '',
        position_played: '',
        overall_rating: 7,
        tecnica_individual: 7,
        pase: 7,
        primer_toque: 7,
        control_balon: 7,
        vision_juego: 7,
        velocidad: 7,
        resistencia: 7,
        fuerza: 7,
        salto: 7,
        agilidad: 7,
        inteligencia_tactica: 7,
        posicionamiento: 7,
        concentracion: 7,
        liderazgo: 7,
        trabajo_equipo: 7,
        notes: '',
        fortalezas: '',
        debilidades: '',
        recomendacion: '',
        condicion_mercado: '',
        agente: '',
        tags: [],
        precio_estimado: 0,
        fecha_observacion: new Date().toISOString().split('T')[0],
        tipo_visionado: '',
        competicion: '',
        rival: '',
        resultado: '',
        minutos_observados: 90
      });

      setActiveTab('reports');
    } catch (error) {
      console.error('Failed to save report:', error);
      alert(editingReportId ? 'Error al actualizar el reporte' : 'Error al crear el reporte');
    }
  };
  // Función para editar un reporte existente
  const editReport = (report: ScoutReport) => {
    // Cargar el reporte en el formulario
    setReportForm({
      player_id: report.player_id,
      player_name: report.player_name,
      match_context: report.match_context || '',
      position_played: report.position_played || '',
      overall_rating: report.overall_rating,
      tecnica_individual: report.tecnica_individual,
      pase: report.pase,
      primer_toque: report.primer_toque,
      control_balon: report.control_balon,
      vision_juego: report.vision_juego,
      velocidad: report.velocidad,
      resistencia: report.resistencia,
      fuerza: report.fuerza,
      salto: report.salto,
      agilidad: report.agilidad,
      inteligencia_tactica: report.inteligencia_tactica,
      posicionamiento: report.posicionamiento,
      concentracion: report.concentracion,
      liderazgo: report.liderazgo,
      trabajo_equipo: report.trabajo_equipo,
      notes: report.notes,
      fortalezas: report.fortalezas || '',
      debilidades: report.debilidades || '',
      recomendacion: report.recomendacion || '',
      condicion_mercado: report.condicion_mercado || '',
      agente: report.agente || '',
      tags: report.tags || [],
      precio_estimado: report.precio_estimado || 0,
      fecha_observacion: report.fecha_observacion || new Date().toISOString().split('T')[0],
      tipo_visionado: report.tipo_visionado || '',
      competicion: report.competicion || '',
      rival: report.rival || '',
      resultado: report.resultado || '',
      minutos_observados: report.minutos_observados || 90
    });

    setSelectedPlayer({
      id: report.player_id,
      name: report.player_name,
      position: report.position_played || '',
      team: '',
      wyscout_id: report.player_wyscout_id
    });

    setEditingReportId(report.id);
    setShowReportForm(true);
  };

  // AGREGAR ESTA FUNCIÓN QUE FALTA
  const openReportForm = (player: Player) => {
    setSelectedPlayer(player);
    setReportForm({
      ...reportForm,
      player_id: String(player.id),
      player_name: player.name
    });
    setShowReportForm(true);

    // Cargar partidos del jugador
    if (player.wyscout_id || player.id) {
      loadPlayerMatches(player.wyscout_id || parseInt(player.id));
    }
  };



  // Cargar partidos cuando se abre el formulario


  const loadPlayerMatches = async (playerId: number) => {
    setLoadingMatches(true);
    try {
      const matches = await playerService.getPlayerRecentMatches(playerId);
      setPlayerMatches(matches);
    } catch (error) {
      console.error('Failed to load matches:', error);
      setPlayerMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  };

// Reemplazar las funciones con estas versiones corregidas
const searchPlayersWithFilters = () => {
  if (teamPlayers.length > 0) {
    const nationalities = Array.from(new Set(
      teamPlayers.map((player: any) => 
        player.nationality || player.nationality
      ).filter(Boolean)
    )).sort();
    setAvailableNationalities(nationalities);
  }
};

const clearAllFilters = () => {
  setSelectedNationalities([] as any);
  setAgeFilter({ min: '', max: '' });
  setShowNationalityFilter(false);
  
  // Volver a cargar sin filtros
  if (selectedCompetition) {
    setTeamPlayers([]);
  }
};
  
  // Cargar jugadores manuales
  const loadManualPlayers = async () => {
    setLoadingManualPlayers(true);
    try {
      const response = await fetch(`${API_URL}/api/players/manual`, {
        method: 'GET',  // Asegúrate de que sea GET
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Error response:', response.status);
        setManualPlayers([]);
        setFilteredManualPlayers([]);
        return;
      }

      const data = await response.json();
      console.log('Data received:', data); // Para debug

      // Asegurarse de que data sea un array
      const playersArray = Array.isArray(data) ? data : [];
      setManualPlayers(playersArray);
      setFilteredManualPlayers(playersArray);
    } catch (error) {
      console.error('Error loading manual players:', error);
      setManualPlayers([]);
      setFilteredManualPlayers([]);
    } finally {
      setLoadingManualPlayers(false);
    }
  };

  // Cargar opciones de filtros
  const loadFilterOptions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/players/manual/filters`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFilterOptions(data);
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  // Filtrar jugadores manuales
  const filterManualPlayers = () => {
    let filtered = [...manualPlayers];

    if (manualPlayerFilters.name) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(manualPlayerFilters.name.toLowerCase())
      );
    }

    if (manualPlayerFilters.team) {
      filtered = filtered.filter(p =>
        p.current_team_name?.toLowerCase().includes(manualPlayerFilters.team.toLowerCase())
      );
    }

    if (manualPlayerFilters.nationality) {
      filtered = filtered.filter(p =>
        (p.passport_area || p.birth_area || '').toLowerCase().includes(manualPlayerFilters.nationality.toLowerCase())
      );
    }

    if (manualPlayerFilters.position) {
      filtered = filtered.filter(p =>
        p.position?.toLowerCase().includes(manualPlayerFilters.position.toLowerCase())
      );
    }

    if (manualPlayerFilters.minAge) {
      filtered = filtered.filter(p => p.age >= parseInt(manualPlayerFilters.minAge));
    }

    if (manualPlayerFilters.maxAge) {
      filtered = filtered.filter(p => p.age <= parseInt(manualPlayerFilters.maxAge));
    }

    setFilteredManualPlayers(filtered);
  };

  // useEffect para cargar jugadores manuales cuando se selecciona el tab
  useEffect(() => {
    if (activeTab === 'manual-players') {
      loadManualPlayers();
      loadFilterOptions(); // Agregar esta línea
    }
  }, [activeTab]);

  // useEffect para aplicar filtros
  useEffect(() => {
    filterManualPlayers();
  }, [manualPlayerFilters, manualPlayers]);


  // Helper function for position badge color
  // Helper function for position badge color
  const getPositionColor = (position: string) => {
    const pos = position?.toLowerCase() || '';
    if (pos.includes('goalkeeper')) return '#dc2626';
    if (pos.includes('defender')) return '#3b82f6';
    if (pos.includes('midfielder')) return '#10b981';
    if (pos.includes('forward') || pos.includes('striker')) return '#f59e0b';
    return '#6b7280';
  };

  // Calculate stats
  const totalReports = Array.isArray(scoutReports) ? scoutReports.length : 0;
  const avgRating = totalReports > 0 && Array.isArray(scoutReports)
    ? (scoutReports.reduce((sum, r) => sum + r.overall_rating, 0) / totalReports).toFixed(1)
    : '0';

  // VISTA DETALLADA DEL JUGADOR
  if (selectedPlayerForDetail) {
    const averages = calculateCategoryAverages(playerDetailReports);
    const overallAverage = calculateAverageScore(playerDetailReports);
    const latestRecommendation = getLatestRecommendation(playerDetailReports);

    // Función para obtener color según rating
    const getDetailRatingColor = (rating: number) => {
      if (rating >= 8) return '#10b981';
      if (rating >= 6) return '#f59e0b';
      if (rating >= 4) return '#ef4444';
      return '#6b7280';
    };

    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '2rem'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Header con botón de volver */}
          <div style={{ marginBottom: '2rem' }}>
            <button
              onClick={closePlayerDetail}
              style={{
                background: '#3b82f6',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                marginBottom: '1rem'
              }}
            >
              ← Volver a Mis Reportes
            </button>

            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
              📊 {selectedPlayerForDetail} - Análisis Completo
            </h1>
            <p style={{ fontSize: '1.25rem', color: '#4b5563' }}>
              Promedio General: <strong style={{ color: getDetailRatingColor(Number(overallAverage)) }}>
                {overallAverage}/10
              </strong> ({playerDetailReports.length} evaluación{playerDetailReports.length !== 1 ? 'es' : ''})
            </p>
          </div>
          <p style={{ fontSize: '1rem', marginTop: '0.5rem' }}>
            Recomendación Actual:
            <span style={{
              background: latestRecommendation === 'comprar' ? '#10b981' :
                latestRecommendation === 'seguir' ? '#3b82f6' : '#ef4444',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              marginLeft: '0.5rem',
              fontWeight: 'bold'
            }}>
              {latestRecommendation?.toUpperCase() || 'N/A'}
            </span>
          </p>
          {/* Promedios por categoría */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              padding: '1.5rem',
              borderRadius: '12px',
              color: 'white',
              textAlign: 'center'
            }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Técnica</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{averages.technical}/10</p>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '1.5rem',
              borderRadius: '12px',
              color: 'white',
              textAlign: 'center'
            }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Física</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{averages.physical}/10</p>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              padding: '1.5rem',
              borderRadius: '12px',
              color: 'white',
              textAlign: 'center'
            }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Mental</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{averages.mental}/10</p>
            </div>
          </div>

          {/* Gráfico de evolución (simplificado) */}
          {playerDetailReports.length > 1 && (
            <div style={{
              background: '#f9fafb',
              padding: '1.5rem',
              borderRadius: '12px',
              marginBottom: '2rem'
            }}>
              <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>📈 Evolución de Calificaciones</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '200px' }}>
                {playerDetailReports.map((report, index) => (
                  <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: '100%',
                      background: getDetailRatingColor(report.overall_rating),
                      height: `${(report.overall_rating / 10) * 180}px`,
                      borderRadius: '8px 8px 0 0',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'center',
                      paddingTop: '0.5rem'
                    }}>
                      <span style={{ color: 'white', fontWeight: 'bold' }}>{report.overall_rating}/10</span>
                    </div>
                    <small style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                      {report.fecha_observacion ? new Date(report.fecha_observacion).toLocaleDateString() : 'N/A'}
                    </small>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reportes individuales */}
          <div>
            <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>📋 Reportes Individuales</h3>
            {playerDetailReports.map((report, index) => (
              <div key={index} style={{
                background: '#ffffff',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ margin: 0, color: '#1f2937' }}>
                      {report.fecha_observacion ? new Date(report.fecha_observacion).toLocaleDateString() : 'N/A'} | {report.competicion || 'N/A'}
                    </h4>
                    <p style={{ margin: '0.5rem 0', fontSize: '1.25rem' }}>
                      Overall: <strong style={{ color: getDetailRatingColor(report.overall_rating) }}>
                        {report.overall_rating}/10
                      </strong>
                    </p>
                  </div>
                  {report.recomendacion && (
                    <span style={{
                      background: report.recomendacion === 'comprar' ? '#10b981' :
                        report.recomendacion === 'seguir' ? '#3b82f6' : '#ef4444',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                      fontWeight: 'bold'
                    }}>
                      {report.recomendacion.toUpperCase()}
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <strong>Técnica:</strong> {
                      Math.round((report.tecnica_individual + report.pase + report.primer_toque +
                        report.control_balon + report.vision_juego) / 5)
                    }/10
                  </div>
                  <div>
                    <strong>Física:</strong> {
                      Math.round((report.velocidad + report.resistencia + report.fuerza +
                        report.salto + report.agilidad) / 5)
                    }/10
                  </div>
                  <div>
                    <strong>Mental:</strong> {
                      Math.round((report.inteligencia_tactica + report.posicionamiento +
                        report.concentracion + report.liderazgo + report.trabajo_equipo) / 5)
                    }/10
                  </div>
                </div>

                {report.fortalezas && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Fortalezas:</strong> {report.fortalezas}
                  </div>
                )}

                {report.debilidades && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Debilidades:</strong> {report.debilidades}
                  </div>
                )}

                {report.notes && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f9fafb', borderRadius: '8px' }}>
                    <strong>Notas:</strong> {report.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }




  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative'
    }}>
      {/* Franja verde superior estilo Banfield */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '200px',
        background: `linear-gradient(135deg, ${currentClub.primaryColor} 0%, ${currentClub.secondaryColor} 50%, ${currentClub.primaryColor} 100%)`,
        zIndex: 0
      }} />
      <header style={{
        background: 'transparent',
        padding: '1rem 0',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img
                  src={currentClub.logo}
                  alt={currentClub.name}
                  style={{
                    width: '45px',
                    height: '45px',
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
                    objectFit: 'contain'
                  }}
                />
                <h1 style={{
                  fontSize: '1.75rem',
                  fontWeight: 'bold',
                  margin: 0,
                  color: 'white',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
                }}>
                  Departamento de Scouting {currentClub.name}
                </h1>
              </div>
              {healthStatus && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: healthStatus.status === 'healthy' ? '#10b981' : '#ef4444',
                    boxShadow: `0 0 8px ${healthStatus.status === 'healthy' ? '#10b981' : '#ef4444'}`
                  }}></span>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)', fontWeight: '500' }}>
                    {healthStatus.status === 'healthy' ? 'System Online' : 'System Offline'}
                  </span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right', color: 'white' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                  {user?.name || 'Usuario'}
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                  {user?.role === 'admin' ? 'Administrador' :
                    user?.role === 'head_scout' ? 'Jefe Scout' :
                      user?.role === 'scout' ? 'Scout' :
                        user?.role === 'viewer' ? 'Observador' : 'Scout'}
                </div>
              </div>
              <button
                onClick={logout}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{
        background: currentClub.name === 'Boca Juniors' ? '#003f7f' : 'white',
        borderBottom: '2px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', gap: '2rem', overflowX: 'auto' }}>
            {[
              { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
              { id: 'quick-search', label: '🔍 Búsqueda Rápida', icon: '🔍' },
              { id: 'browse', label: '🌍 Explorar por Liga', icon: '🌍' },
              { id: 'reports', label: '📝 Mis Reportes', icon: '📝' },
              { id: 'recommendations', label: '🎯 Recomendaciones', icon: '🎯' },
              { id: 'add-player', label: '➕ Agregar Jugador', icon: '➕' },
              { id: 'manual-players', label: '👥 Jugadores Creados', icon: '👥' },
              { id: 'markets', label: '💰 Mercados', icon: '💰' }

            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '1rem 0',
                  border: 'none',
                  background: 'none',
                  borderBottom: activeTab === tab.id ? `3px solid ${currentClub.primaryColor}` : '3px solid transparent',
                  color: activeTab === tab.id ? currentClub.primaryColor : currentClub.name === 'Boca Juniors' ? '#ffd700' : '#6b7280',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

{/* Main Content */}
<main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
  <div>
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'grid', gap: '2rem' }}>
              {/* Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                  transform: 'translateY(0)',
                  transition: 'transform 0.2s',
                  cursor: 'pointer'
                }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      background: 'linear-gradient(135deg, #0a5f1c, #0d7328)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem'
                    }}>
                      📊
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>Total Reports</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937' }}>{totalReports}</div>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                  transform: 'translateY(0)',
                  transition: 'transform 0.2s',
                  cursor: 'pointer'
                }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem'
                    }}>
                      ⭐
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>Avg Rating</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937' }}>{avgRating}/10</div>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                  transform: 'translateY(0)',
                  transition: 'transform 0.2s',
                  cursor: 'pointer'
                }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem'
                    }}>
                      🔍
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>Players Scouted</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937' }}>
                        {new Set(scoutReports.map(r => r.player_id)).size}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Status */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
              }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
                  🎯 System Status
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  <div style={{
                    padding: '1.5rem',
                    background: healthStatus?.status === 'healthy'
                      ? 'linear-gradient(135deg, #10b98115, #10b98125)'
                      : 'linear-gradient(135deg, #ef444415, #ef444425)',
                    borderRadius: '12px',
                    border: `2px solid ${healthStatus?.status === 'healthy' ? '#10b98130' : '#ef444430'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <span style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: healthStatus?.status === 'healthy' ? '#10b981' : '#ef4444',
                        boxShadow: `0 0 10px ${healthStatus?.status === 'healthy' ? '#10b981' : '#ef4444'}`
                      }}></span>
                      <h3 style={{ margin: 0, fontWeight: '600', fontSize: '1rem', color: '#1f2937' }}>Backend API</h3>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>
                      {healthStatus?.message || 'Checking...'}
                    </p>
                    {healthStatus?.environment && (
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        Supabase: {healthStatus.environment.supabase_configured ? '✅' : '❌'} |
                        Wyscout: {healthStatus.environment.wyscout_configured ? '✅' : '❌'}
                      </div>
                    )}
                  </div>

                  <div style={{
                    padding: '1.5rem',
                    background: wyscoutStatus?.status === 'success'
                      ? 'linear-gradient(135deg, #10b98115, #10b98125)'
                      : 'linear-gradient(135deg, #ef444415, #ef444425)',
                    borderRadius: '12px',
                    border: `2px solid ${wyscoutStatus?.status === 'success' ? '#10b98130' : '#ef444430'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <span style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: wyscoutStatus?.status === 'success' ? '#10b981' : '#ef4444',
                        boxShadow: `0 0 10px ${wyscoutStatus?.status === 'success' ? '#10b981' : '#ef4444'}`
                      }}></span>
                      <h3 style={{ margin: 0, fontWeight: '600', fontSize: '1rem', color: '#1f2937' }}>Wyscout API</h3>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>
                      {wyscoutStatus?.message || 'Checking...'}
                    </p>
                    {wyscoutStatus?.areas_count && (
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        Areas loaded: {wyscoutStatus.areas_count}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Search Tab */}
          {activeTab === 'quick-search' && (
            <div style={{ display: 'grid', gap: '2rem' }}>
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
              }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
                  🔍 Búsqueda Rápida
                </h2>

                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '1.25rem'
                  }}>
                    🔎
                  </span>
                  <input
                    type="text"
                    placeholder="Search for teams or players... (e.g., 'Barcelona', 'Messi')"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '1rem 1rem 1rem 3rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
              </div>

              {/* Search Results */}
              {loading && (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>⚽</div>
                  <p style={{ color: '#6b7280', fontSize: '1rem' }}>Searching...</p>
                </div>
              )}

              {!loading && searchResults.length > 0 && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {searchResults.map((result: any) => (
                    <div key={`${result.type}-${result.id}`} style={{
                      background: 'white',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                      transform: 'translateY(0)',
                      transition: 'transform 0.2s',
                      cursor: 'pointer'
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          {result.type === 'team' ? (
                            <>
                              {result.imageDataURL ? (
                                <img
                                  src={result.imageDataURL}
                                  alt={result.name}
                                  style={{
                                    width: '60px',
                                    height: '60px',
                                    objectFit: 'contain',
                                    borderRadius: '8px',
                                    background: '#f3f4f6'
                                  }}
                                />
                              ) : (
                                <div style={{
                                  width: '60px',
                                  height: '60px',
                                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '1.5rem',
                                  color: 'white',
                                  fontWeight: 'bold'
                                }}>
                                  🏟️
                                </div>
                              )}
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#1f2937' }}>
                                    {result.name}
                                  </h3>
                                  <span style={{
                                    padding: '0.25rem 0.5rem',
                                    background: 'linear-gradient(135deg, #0a5f1c, #0d7328)',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    color: 'white',
                                    fontWeight: '600'
                                  }}>
                                    TEAM
                                  </span>
                                </div>
                                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                                  {result.area?.name || 'International'}
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              {result.imageDataURL ? (
                                <img
                                  src={result.imageDataURL}
                                  alt={result.name}
                                  style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '3px solid #e5e7eb'
                                  }}
                                />
                              ) : (
                                <div style={{
                                  width: '60px',
                                  height: '60px',
                                  background: 'linear-gradient(135deg, #10b981, #059669)',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '1.25rem',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  border: '3px solid rgba(255, 255, 255, 0.5)'
                                }}>
                                  {result.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                </div>
                              )}
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#1f2937' }}>
                                    {result.name}
                                  </h3>
                                  <span style={{
                                    padding: '0.25rem 0.5rem',
                                    background: `linear-gradient(135deg, ${getPositionColor(result.position)}, ${getPositionColor(result.position)}dd)`,
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    color: 'white',
                                    fontWeight: '600'
                                  }}>
                                    {result.position || 'PLAYER'}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                  <span>{result.team || 'Free Agent'}</span>
                                  {result.age && <span>Age: {result.age}</span>}
                                  {result.nationality && <span>🌍 {result.nationality}</span>}
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {result.type === 'team' ? (
                            <button
                              onClick={() => {
                                setSelectedTeam(result.id);
                                setActiveTab('browse');
                              }}
                              style={{
                                padding: '0.5rem 1rem',
                                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'transform 0.1s'
                              }}
                              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              👥 View Squad
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => viewPlayerProfile(result.wyscout_id || result.id)}
                                style={{
                                  padding: '0.5rem 1rem',
                                  background: 'linear-gradient(135deg, #0a5f1c, #0d7328)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontSize: '0.875rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  transition: 'transform 0.1s'
                                }}
                                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              >
                                👤 View Profile
                              </button>
                              <button
                                onClick={() => openReportForm(result)}
                                style={{
                                  padding: '0.5rem 1rem',
                                  background: 'linear-gradient(135deg, #10b981, #059669)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontSize: '0.875rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  transition: 'transform 0.1s'
                                }}
                                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              >
📝 Create Report
                              </button>
                              <button
                                onClick={() => openMarketModal(result)}
                                style={{
                                  padding: '0.5rem 1rem',
                                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontSize: '0.875rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  transition: 'transform 0.1s'
                                }}
                                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              >
                                💰 A Mercado
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Browse by Area Tab */}
          {activeTab === 'browse' && (
            <div style={{ display: 'grid', gap: '2rem' }}>
              {/* Filter Section */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
              }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
                  🌍 Explorar por Liga
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                      🌍 Area/Country
                    </label>
                    <select
                      value={selectedArea || ''}
                      onChange={(e) => setSelectedArea(e.target.value ? parseInt(e.target.value) : null)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="">Select an area...</option>
                      {areas.map(area => (
                        <option key={area.id} value={area.id}>{area.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                      🏆 Competition
                    </label>
                    <select
                      value={selectedCompetition || ''}
                      onChange={(e) => setSelectedCompetition(e.target.value ? parseInt(e.target.value) : null)}
                      disabled={!selectedArea}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        cursor: selectedArea ? 'pointer' : 'not-allowed',
                        opacity: selectedArea ? 1 : 0.5,
                        outline: 'none'
                      }}
                    >
                      <option value="">Select a competition...</option>
                      {competitions.map(comp => (
                        <option key={comp.id} value={comp.id}>{comp.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                      🏟️ Teams
                    </label>
                    <div style={{ 
                      border: '2px solid #e5e7eb', 
                      borderRadius: '8px', 
                      padding: '0.5rem',
                      maxHeight: '150px',
                      overflowY: 'auto',
                      opacity: selectedCompetition ? 1 : 0.5
                    }}>
                      <label style={{ display: 'flex', alignItems: 'center', padding: '0.25rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={selectedTeams.length === competitionTeams.length && competitionTeams.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTeams(competitionTeams.map(team => team.id));
                            } else {
                              setSelectedTeams([]);
                            }
                          }}
                          disabled={!selectedCompetition}
                          style={{ marginRight: '0.5rem' }}
                        />
                        <strong>Todos los equipos</strong>
                      </label>
                      {competitionTeams.map(team => (
                        <label key={team.id} style={{ display: 'flex', alignItems: 'center', padding: '0.25rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={selectedTeams.includes(team.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTeams([...selectedTeams, team.id]);
                              } else {
                                setSelectedTeams(selectedTeams.filter(id => id !== team.id));
                              }
                            }}
                            disabled={!selectedCompetition}
                            style={{ marginRight: '0.5rem' }}
                          />
                          {team.name}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

{/* Filtros avanzados - AGREGAR SOLO ESTO */}
{selectedCompetition && (
  <div style={{
    borderTop: '1px solid #e5e7eb',
    paddingTop: '1.5rem',
    marginTop: '1.5rem'
  }}>
    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
      Filtros Avanzados
    </h3>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
      {/* Filtro de Nacionalidad */}
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
          Nacionalidades
        </label>
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setShowNationalityFilter(!showNationalityFilter)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '0.875rem',
              cursor: 'pointer',
              background: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>
              {selectedNationalities.length === 0 
                ? 'Todas las nacionalidades' 
                : `${selectedNationalities.length} seleccionadas`
              }
            </span>
            <span>▼</span>
          </div>
          
          {showNationalityFilter && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 10,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              {availableNationalities.map(nationality => (
                <label key={nationality} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.5rem 0.75rem',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedNationalities.includes(nationality)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedNationalities([...selectedNationalities, nationality]);
                      } else {
                        setSelectedNationalities(selectedNationalities.filter(n => n !== nationality));
                      }
                    }}
                    style={{ marginRight: '0.5rem' }}
                  />
                  {nationality}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filtro de Edad */}
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
          Rango de Edad
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="number"
            placeholder="Mín"
            value={ageFilter.min}
            onChange={(e) => setAgeFilter({...ageFilter, min: e.target.value})}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '0.875rem'
            }}
          />
          <span style={{ color: '#6b7280' }}>-</span>
          <input
            type="number"
            placeholder="Máx"
            value={ageFilter.max}
            onChange={(e) => setAgeFilter({...ageFilter, max: e.target.value})}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '0.875rem'
            }}
          />
        </div>
      </div>
    </div>
  </div>    
)}           

              {/* Players List */}
              {teamPlayers.length > 0 && (
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '2rem',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
                }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1f2937' }}>
                    👥 Squad ({teamPlayers.length} players)
                  </h3>

                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {teamPlayers.map((player: any) => (
                      <div key={player.id} style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '1rem',
                        border: '1px solid #e5e7eb',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        cursor: 'pointer'
                      }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateX(4px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateX(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          {player.imageDataURL ? (
                            <img
                              src={player.imageDataURL}
                              alt={player.name}
                              style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '2px solid #e5e7eb'
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '50px',
                              height: '50px',
                              background: `linear-gradient(135deg, ${getPositionColor(player.position)}, ${getPositionColor(player.position)}dd)`,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1rem',
                              color: 'white',
                              fontWeight: 'bold'
                            }}>
                              {player.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                            </div>
                          )}

                          <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: '600', margin: 0, color: '#1f2937' }}>
                              {player.name}
                            </h4>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                              <span style={{
                                fontSize: '0.75rem',
                                padding: '0.125rem 0.5rem',
                                background: `${getPositionColor(player.position)}20`,
                                color: getPositionColor(player.position),
                                borderRadius: '4px',
                                fontWeight: '600'
                              }}>
                                {player.position}
                              </span>
                              {player.age && (
                                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                  Age: {player.age}
                                </span>
                              )}
                              {player.nationality && (
                                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                  🌍 {player.nationality}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => viewPlayerProfile(player.wyscout_id || player.id)}
                            style={{
                              padding: '0.5rem 0.75rem',
                              background: 'linear-gradient(135deg, #0a5f1c, #0d7328)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            👤 Profile
                          </button>
                          <button
                            onClick={() => openReportForm(player)}
                            style={{
                              padding: '0.5rem 0.75rem',
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
📝 Report
                          </button>
                          <button
                            onClick={() => openMarketModal(player)}
                            style={{
                              padding: '0.5rem 0.75rem',
                              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            💰 Mercado
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* My Reports Tab */}
          {activeTab === 'reports' && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
                📝 Mis Reportes
              </h2>

              {/* FILTROS */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem',
                padding: '1.5rem',
                background: '#f9fafb',
                borderRadius: '12px'
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                    🔍 Buscar Jugador
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre del jugador..."
                    value={filterPlayerName}
                    onChange={(e) => setFilterPlayerName(e.target.value)}
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
                    🏟️ Filtrar por Equipo/Rival
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre del equipo..."
                    value={filterTeam}
                    onChange={(e) => setFilterTeam(e.target.value)}
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
                    🏆 Filtrar por Liga
                  </label>
                  <select
                    value={filterLeague}
                    onChange={(e) => setFilterLeague(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Todas las ligas</option>
                    {getUniqueLeagues().map(league => (
                      <option key={league} value={league}>{league}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setFilterPlayerName('');
                      setFilterTeam('');
                      setFilterLeague('');
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    🔄 Limpiar Filtros
                  </button>
                </div>
              </div>

              {/* CONTADOR DE RESULTADOS */}
              <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                Mostrando {getFilteredReports().length} de {scoutReports.length} reportes
              </div>

              {getFilteredReports().length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                  <p style={{ fontSize: '1rem' }}>
                    {scoutReports.length === 0
                      ? "No hay reportes todavía. ¡Empieza a scoutear jugadores!"
                      : "No se encontraron reportes con estos filtros"}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  {getFilteredReports().map((report) => (
                    <div key={report.id} style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      border: '1px solid #e5e7eb',
                      transition: 'transform 0.2s',
                      cursor: 'pointer'
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                          <h3 style={{
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            margin: 0,
                            color: '#3b82f6',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            transition: 'color 0.2s'
                          }}
                            onClick={() => openPlayerDetail(report.player_name)}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#1d4ed8'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#3b82f6'}>
                            {report.player_name} 🔍
                          </h3>
                          {report.created_by_name && (
                            <p style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              margin: '0.25rem 0 0 0',
                              fontStyle: 'italic'
                            }}>
                              👤 Evaluado por: {report.created_by_name}
                              {report.created_by_role && ` (${report.created_by_role === 'admin' ? 'Administrador' :
                                report.created_by_role === 'head_scout' ? 'Jefe Scout' :
                                  report.created_by_role === 'scout' ? 'Scout' :
                                    'Observador'
                                })`}
                            </p>
                          )}
                          {report.match_context && (
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                              📅 {report.match_context}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            onClick={() => editReport(report)}
                            style={{
                              padding: '0.5rem 0.75rem',
                              background: '#f59e0b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: '600'
                            }}
                          >
                            ✏️ Editar
                          </button>
                          <div style={{
                            padding: '0.5rem 1rem',
                            background: `linear-gradient(135deg, ${report.overall_rating >= 8 ? '#10b981, #059669' :
                              report.overall_rating >= 6 ? '#f59e0b, #d97706' :
                                '#ef4444, #dc2626'
                              })`,
                            borderRadius: '8px',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '1.25rem'
                          }}>
                            {report.overall_rating}/10
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                        {[
                          { label: '⚽ Técnica', value: report.tecnica_individual, color: '#10b981' },
                          { label: '💪 Físico', value: report.velocidad, color: '#f59e0b' },
                          { label: '🧠 Mental', value: report.inteligencia_tactica, color: '#8b5cf6' }
                        ].map((rating) => (
                          <div key={rating.label} style={{ textAlign: 'center' }}>
                            <div style={{
                              fontSize: '1.5rem',
                              fontWeight: 'bold',
                              color: rating.color
                            }}>
                              {rating.value}/10
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>{rating.label}</div>
                          </div>
                        ))}
                      </div>

                      {report.notes && (
                        <div style={{ marginBottom: '1.5rem' }}>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '600' }}>📝 Notes</div>
                          <p style={{ fontSize: '0.875rem', margin: 0, lineHeight: '1.6', color: '#374151' }}>{report.notes}</p>
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {report.fortalezas && (
                          <div style={{
                            padding: '1rem',
                            background: 'linear-gradient(135deg, #10b98115, #10b98125)',
                            borderRadius: '8px',
                            border: '2px solid #10b98130'
                          }}>
                            <div style={{ fontSize: '0.875rem', color: '#059669', marginBottom: '0.5rem', fontWeight: '600' }}>✅ Fortalezas</div>
                            <p style={{ fontSize: '0.875rem', margin: 0, color: '#374151' }}>{report.fortalezas}</p>
                          </div>
                        )}
                        {report.debilidades && (
                          <div style={{
                            padding: '1rem',
                            background: 'linear-gradient(135deg, #ef444415, #ef444425)',
                            borderRadius: '8px',
                            border: '2px solid #ef444430'
                          }}>
                            <div style={{ fontSize: '0.875rem', color: '#dc2626', marginBottom: '0.5rem', fontWeight: '600' }}>⚠️ Debilidades</div>
                            <p style={{ fontSize: '0.875rem', margin: 0, color: '#374151' }}>{report.debilidades}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
                🎯 Recomendaciones de Jugadores
              </h2>

              {/* Estadísticas rápidas */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  padding: '1rem',
                  borderRadius: '12px',
                  color: 'white',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                    {scoutReports.filter(r => r.recomendacion === 'Comprar').length}
                  </div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Para Comprar</div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #0a5f1c, #0d7328)',
                  padding: '1rem',
                  borderRadius: '12px',
                  color: 'white',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                    {scoutReports.filter(r => r.recomendacion === 'Seguir').length}
                  </div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Para Seguir</div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  padding: '1rem',
                  borderRadius: '12px',
                  color: 'white',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                    {scoutReports.filter(r => r.recomendacion === 'Descartar').length}
                  </div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Para Descartar</div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  padding: '1rem',
                  borderRadius: '12px',
                  color: 'white',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                    {new Set(scoutReports.map(r => r.player_name)).size}
                  </div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Jugadores Únicos</div>
                </div>
              </div>

              {/* Filtros */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                marginBottom: '2rem',
                padding: '1.5rem',
                background: '#f9fafb',
                borderRadius: '12px'
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '500' }}>
                    📍 Liga/Competición
                  </label>
                  <select
                    value={filterLeague}
                    onChange={(e) => setFilterLeague(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '1rem',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Todas las Ligas</option>
                    {getUniqueLeagues().map(league => (
                      <option key={league} value={league}>{league}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '500' }}>
                    🎯 Recomendación
                  </label>
                  <select
                    value={filterRecommendation}
                    onChange={(e) => setFilterRecommendation(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '1rem',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Todas</option>
                    <option value="Comprar">✅ Para Comprar</option>
                    <option value="Seguir">👀 Para Seguir</option>
                    <option value="Descartar">❌ Para Descartar</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '500' }}>
                    ⚽ Posición
                  </label>
                  <select
                    value={filterPosition}
                    onChange={(e) => setFilterPosition(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '1rem',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Todas las Posiciones</option>
                    {getUniquePositions().map(position => (
                      <option key={position} value={position}>{position}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lista de jugadores filtrados */}
              <div style={{ display: 'grid', gap: '1rem' }}>
                {getFilteredPlayers().length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    background: '#f9fafb',
                    borderRadius: '12px',
                    color: '#6b7280'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
                    <p>No se encontraron jugadores con estos filtros</p>
                  </div>
                ) : (
                  getFilteredPlayers().map((player: any) => (
                    <div key={player.player_name} style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      border: '2px solid #e5e7eb',
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                      alignItems: 'center',
                      gap: '1rem',
                      transition: 'transform 0.2s',
                      cursor: 'pointer'
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                      <div>
                        <h3 style={{
                          margin: 0,
                          color: '#1f2937',
                          fontSize: '1.125rem',
                          fontWeight: '600'
                        }}>
                          {player.player_name}
                        </h3>
                        <p style={{ margin: '0.25rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
                          {player.position_played || 'N/A'} • {player.competicion || 'N/A'}
                        </p>
                        <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.75rem' }}>
                          {player.team !== 'Sin equipo' ? `Equipo: ${player.team}` : ''}
                          {player.age ? ` • ${player.age} años` : ''}
                          • {player.total_reports} {player.total_reports === 1 ? 'reporte' : 'reportes'}
                        </p>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          fontSize: '1.5rem',
                          fontWeight: 'bold',
                          color: player.overall_rating >= 8 ? '#10b981' :
                            player.overall_rating >= 6 ? '#f59e0b' : '#ef4444'
                        }}>
                          {player.overall_rating}/10
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Rating Promedio</div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#10b981' }}>
                          €{player.precio_estimado ? (player.precio_estimado / 1000000).toFixed(1) + 'M' : 'N/A'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Valor</div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <span style={{
                          background: player.recomendacion === 'Comprar' ? '#10b981' :
                            player.recomendacion === 'Seguir' ? '#3b82f6' : '#ef4444',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          borderRadius: '20px',
                          fontSize: '0.875rem',
                          fontWeight: 'bold'
                        }}>
                          {player.recomendacion?.toUpperCase() || 'N/A'}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          const playerForMarket = {
                            name: player.player_name,
                            position: player.position_played || '',
                            age: player.age || null,
                            team: player.team || '',
                            manual_id: player.manual_id || null,
                            wyscout_id: player.player_wyscout_id || player.player_id || null
                          };
                          openMarketModal(playerForMarket);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          color: 'white',
                          border: 'none',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          whiteSpace: 'nowrap',
                          marginRight: '0.5rem'
                        }}
                      >
                        💰 A Mercado
                      </button>

                      <button
                        onClick={() => openPlayerDetail(player.player_name)}
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Ver Detalles →
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}


          {/* Player Profile Tab */}
          {activeTab === 'player-profile' && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
            }}>
              {loadingProfile ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>⚽</div>
                  <p style={{ color: '#6b7280', fontSize: '1rem' }}>Loading player profile...</p>
                </div>
              ) : playerProfile ? (
                <div>
                  <button
                    onClick={() => setActiveTab('quick-search')}
                    style={{
                      marginBottom: '1rem',
                      padding: '0.5rem 1rem',
                      background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    ← Back to Search
                  </button>

                  {/* Player Header */}
                  <div style={{
                    display: 'flex',
                    gap: '2rem',
                    marginBottom: '2rem',
                    padding: '2rem',
                    background: 'linear-gradient(135deg, #667eea15, #764ba215)',
                    borderRadius: '12px',
                    border: '2px solid #667eea30'
                  }}>
                    {playerProfile.basic_info?.imageDataURL ? (
                      <img
                        src={playerProfile.basic_info.imageDataURL}
                        alt={playerProfile.basic_info.shortName}
                        style={{
                          width: '120px',
                          height: '120px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '4px solid white',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '120px',
                        height: '120px',
                        background: 'linear-gradient(135deg, #0a5f1c, #0d7328)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5rem',
                        color: 'white',
                        fontWeight: 'bold',
                        border: '4px solid white',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }}>
                        {playerProfile.basic_info?.shortName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                      </div>
                    )}

                    <div style={{ flex: 1 }}>
                      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: '#1f2937' }}>
                        {playerProfile.basic_info?.shortName || 'Unknown Player'}
                      </h1>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: `linear-gradient(135deg, ${getPositionColor(playerProfile.basic_info?.role?.name)}, ${getPositionColor(playerProfile.basic_info?.role?.name)}dd)`,
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          color: 'white',
                          fontWeight: '600'
                        }}>
                          {playerProfile.basic_info?.role?.name || 'Unknown Position'}
                        </span>

                        {playerProfile.basic_info?.currentTeam && (
                          <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                            🏟️ {playerProfile.basic_info.currentTeam.name}
                          </span>
                        )}

                        {playerProfile.basic_info?.birthDate && (
                          <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                            🎂 Age: {new Date().getFullYear() - new Date(playerProfile.basic_info.birthDate).getFullYear()}
                          </span>
                        )}

                        {playerProfile.basic_info?.passportArea && (
                          <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                            🌍 {playerProfile.basic_info.passportArea.name}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        {playerProfile.basic_info?.height && (
                          <span>📏 {playerProfile.basic_info.height} cm</span>
                        )}
                        {playerProfile.basic_info?.weight && (
                          <span>⚖️ {playerProfile.basic_info.weight} kg</span>
                        )}
                        {playerProfile.basic_info?.foot && (
                          <span>👟 {playerProfile.basic_info.foot}</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <button
                        onClick={() => openReportForm({
                          id: String(playerProfile.basic_info?.wyId || ''),
                          name: playerProfile.basic_info?.shortName || '',
                          position: playerProfile.basic_info?.role?.name || '',
                          team: playerProfile.basic_info?.currentTeam?.name || '',
                          wyscout_id: playerProfile.basic_info?.wyId
                        })}
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
                        📝 Create Report
                      </button>
                    </div>
                  </div>
                  {/* Contract Information */}
                  {playerProfile.contract_info && (
                    <div style={{
                      marginBottom: '2rem',
                      padding: '1.5rem',
                      background: 'linear-gradient(135deg, #fbbf2415, #f59e0b15)',
                      borderRadius: '12px',
                      border: '2px solid #f59e0b30'
                    }}>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
                        📄 Contract Information
                      </h2>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        {playerProfile.contract_info.team && (
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: '500' }}>
                              Current Team
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                              🏟️ {playerProfile.contract_info.team}
                            </div>
                          </div>
                        )}

                        {playerProfile.contract_info.jersey_number && (
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: '500' }}>
                              Jersey Number
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                              👕 #{playerProfile.contract_info.jersey_number}
                            </div>
                          </div>
                        )}

                        {playerProfile.contract_info.contract_expires && (
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: '500' }}>
                              Contract Expires
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                              📅 {new Date(playerProfile.contract_info.contract_expires).toLocaleDateString()}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                              ({Math.ceil((new Date(playerProfile.contract_info.contract_expires).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30))} months remaining)
                            </div>
                          </div>
                        )}

                        {playerProfile.contract_info.joined_date && (
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: '500' }}>
                              Joined Date
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                              📆 {new Date(playerProfile.contract_info.joined_date).toLocaleDateString()}
                            </div>
                          </div>
                        )}

                        {playerProfile.contract_info.market_value && (
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: '500' }}>
                              Market Value
                            </div>
                            <div style={{
                              fontSize: '1.25rem',
                              fontWeight: 'bold',
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent'
                            }}>
                              €{(playerProfile.contract_info.market_value / 1000000).toFixed(1)}M
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Contract Status Badge */}
                      {playerProfile.contract_info.contract_expires && (
                        <div style={{ marginTop: '1rem' }}>
                          {(() => {
                            const monthsRemaining = Math.ceil(
                              (new Date(playerProfile.contract_info.contract_expires).getTime() - new Date().getTime()) /
                              (1000 * 60 * 60 * 24 * 30)
                            );

                            let status, color, background;
                            if (monthsRemaining <= 6) {
                              status = "⚠️ Expiring Soon";
                              color = "#dc2626";
                              background = "#ef444420";
                            } else if (monthsRemaining <= 12) {
                              status = "📝 Final Year";
                              color = "#f59e0b";
                              background = "#fbbf2420";
                            } else {
                              status = "✅ Under Contract";
                              color = "#10b981";
                              background = "#10b98120";
                            }

                            return (
                              <span style={{
                                padding: '0.5rem 1rem',
                                background: background,
                                color: color,
                                borderRadius: '6px',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                display: 'inline-block'
                              }}>
                                {status}
                              </span>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Career Timeline */}
                  {playerProfile.career && playerProfile.career.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
                        🏆 Career Timeline
                      </h2>
                      <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                        {/* Línea vertical */}
                        <div style={{
                          position: 'absolute',
                          left: '1rem',
                          top: '0',
                          bottom: '0',
                          width: '2px',
                          backgroundColor: '#e5e7eb'
                        }}></div>

                        {playerProfile.career.map((entry: any, idx: number) => (
                          <div key={idx} style={{
                            position: 'relative',
                            marginBottom: '1.5rem',
                            backgroundColor: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '1rem'
                          }}>
                            {/* Punto en la línea */}
                            <div style={{
                              position: 'absolute',
                              left: '-2.15rem',
                              top: '1rem',
                              width: '12px',
                              height: '12px',
                              backgroundColor: '#3b82f6',
                              borderRadius: '50%',
                              border: '2px solid white'
                            }}></div>

                            {/* Contenido */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                              <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
                                  {entry.team_name}
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                                  📍 {entry.team_city}, {entry.team_country}
                                </p>
                                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                  🏆 {entry.competition}
                                </p>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{
                                  fontSize: '0.875rem',
                                  fontWeight: '600',
                                  color: '#3b82f6',
                                  backgroundColor: '#eff6ff',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '4px'
                                }}>
                                  {entry.period}
                                </span>
                              </div>
                            </div>

                            {/* Estadísticas */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '0.75rem' }}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
                                  {entry.appearances}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Partidos</div>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#059669' }}>
                                  {entry.goals}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Goles</div>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#7c3aed' }}>
                                  {entry.minutes_played}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Minutos</div>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#f59e0b' }}>
                                  {entry.avg_minutes_per_game || 0}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Min/Partido</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Matches */}
                  {playerProfile.recent_matches && playerProfile.recent_matches.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
                        ⚽ Recent Matches
                      </h2>
                      <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {playerProfile.recent_matches.slice(0, 5).map((match: any, idx: number) => (
                          <div key={idx} style={{
                            padding: '1rem',
                            background: '#f9fafb',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div>
                              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
                                {match.homeTeam?.name} vs {match.awayTeam?.name}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                {new Date(match.date).toLocaleDateString()}
                              </div>
                            </div>
                            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
                              {match.homeScore} - {match.awayScore}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transfers */}
                  {playerProfile.transfers && playerProfile.transfers.length > 0 && (
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
                        💰 Transfer History
                      </h2>
                      <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {playerProfile.transfers.map((transfer: any, idx: number) => (
                          <div key={idx} style={{
                            padding: '1rem',
                            background: '#f9fafb',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div>
                              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
                                {transfer.fromTeam?.name || 'Unknown'} → {transfer.toTeam?.name || 'Unknown'}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                {new Date(transfer.date).toLocaleDateString()}
                              </div>
                            </div>
                            {transfer.fee && (
                              <div style={{
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: '#059669',
                                padding: '0.25rem 0.75rem',
                                background: '#10b98120',
                                borderRadius: '6px'
                              }}>
                                €{(transfer.fee / 1000000).toFixed(1)}M
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                  <p>No player profile loaded</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Report Form Modal - Professional */}
      {showReportForm && selectedPlayer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '1000px',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.5rem 2rem',
              borderBottom: '2px solid #e5e7eb',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white'
            }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>
                📋 Reporte de Scouting Profesional
              </h2>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
                Jugador: {selectedPlayer.name} | {selectedPlayer.team}
              </p>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #e5e7eb',
              background: '#f9fafb'
            }}>
              {[
                { id: 'general', label: '📝 General', icon: '📝' },
                { id: 'tecnico', label: '⚽ Técnico', icon: '⚽' },
                { id: 'fisico', label: '💪 Físico', icon: '💪' },
                { id: 'mental', label: '🧠 Mental/Táctico', icon: '🧠' },
                { id: 'seguimiento', label: '📊 Seguimiento', icon: '📊' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFormSection(tab.id as any)}
                  style={{
                    padding: '1rem 1.5rem',
                    border: 'none',
                    background: formSection === tab.id ? 'white' : 'transparent',
                    borderBottom: formSection === tab.id ? '3px solid #006600' : 'none',
                    color: formSection === tab.id ? '#006600' : '#6b7280',
                    cursor: 'pointer',
                    fontWeight: formSection === tab.id ? '600' : '400',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '2rem'
            }}>
              {/* General Section */}
              {formSection === 'general' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                        📅 Fecha de Observación
                      </label>
                      <input
                        type="date"
                        value={reportForm.fecha_observacion}
                        onChange={(e) => setReportForm({ ...reportForm, fecha_observacion: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                    {/* AGREGAR ESTE NUEVO CAMPO AQUÍ 👇 */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                        📺 Tipo de Visionado
                      </label>
                      <select
                        value={reportForm.tipo_visionado}
                        onChange={(e) => setReportForm({ ...reportForm, tipo_visionado: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="Estadio">🏟️ Estadio</option>
                        <option value="TV">📺 TV</option>
                      </select>
                    </div>

                    {/* Selector de Partido */}
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                        ⚽ Seleccionar Partido Jugado
                      </label>
                      {loadingMatches ? (
                        <div style={{ padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '8px', textAlign: 'center' }}>
                          Cargando partidos...
                        </div>
                      ) : (
                        <select
                          onChange={(e) => {
                            const selectedMatch = playerMatches.find(m => m.match_id === parseInt(e.target.value));
                            if (selectedMatch) {
                              setReportForm({
                                ...reportForm,
                                competicion: selectedMatch.competition,
                                rival: selectedMatch.player_team === 'home' ? selectedMatch.away_team : selectedMatch.home_team,
                                resultado: selectedMatch.result,
                                fecha_observacion: selectedMatch.date.split(' ')[0],
                                minutos_observados: selectedMatch.minutes_played
                              });
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="">Seleccionar partido o ingresar manualmente...</option>
                          {playerMatches.map(match => (
                            <option key={match.match_id} value={match.match_id}>
                              {match.date.split(' ')[0]} | {match.competition} | {match.description} | {match.minutes_played} min
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Campos manuales/automáticos */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                        🏆 Competición
                      </label>
                      <input
                        type="text"
                        placeholder="Se completa al seleccionar partido"
                        value={reportForm.competicion}
                        onChange={(e) => setReportForm({ ...reportForm, competicion: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          backgroundColor: reportForm.competicion ? '#f9fafb' : 'white'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                        ⚔️ Rival
                      </label>
                      <input
                        type="text"
                        placeholder="Se completa al seleccionar partido"
                        value={reportForm.rival}
                        onChange={(e) => setReportForm({ ...reportForm, rival: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          backgroundColor: reportForm.rival ? '#f9fafb' : 'white'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                        📊 Resultado
                      </label>
                      <input
                        type="text"
                        placeholder="Se completa al seleccionar partido"
                        value={reportForm.resultado}
                        onChange={(e) => setReportForm({ ...reportForm, resultado: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          backgroundColor: reportForm.resultado ? '#f9fafb' : 'white'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                        🎯 Posición Jugada
                      </label>
                      <select
                        value={reportForm.position_played}
                        onChange={(e) => setReportForm({ ...reportForm, position_played: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">Seleccionar...</option>
                        <optgroup label="🥅 Arqueros">
                          <option value="Arquero - Clásico">Arquero - Clásico</option>
                          <option value="Arquero - De juego">Arquero - De juego</option>
                        </optgroup>
                        <optgroup label="🔰 Laterales Derechos">
                          <option value="Lateral Derecho - Equilibrado">Lateral Derecho - Equilibrado</option>
                          <option value="Lateral Derecho - Ofensivo">Lateral Derecho - Ofensivo</option>
                          <option value="Lateral Derecho - Defensivo">Lateral Derecho - Defensivo</option>
                        </optgroup>
                        <optgroup label="🔰 Laterales Izquierdos">
                          <option value="Lateral Izquierdo - Equilibrado">Lateral Izquierdo - Equilibrado</option>
                          <option value="Lateral Izquierdo - Ofensivo">Lateral Izquierdo - Ofensivo</option>
                          <option value="Lateral Izquierdo - Defensivo">Lateral Izquierdo - Defensivo</option>
                        </optgroup>
                        <optgroup label="🛡️ Centrales Derechos">
                          <option value="Central Derecho - Equilibrado">Central Derecho - Equilibrado</option>
                          <option value="Central Derecho - Duelista">Central Derecho - Duelista</option>
                          <option value="Central Derecho - Asociativo">Central Derecho - Asociativo</option>
                        </optgroup>
                        <optgroup label="🛡️ Centrales Izquierdos">
                          <option value="Central Izquierdo - Equilibrado">Central Izquierdo - Equilibrado</option>
                          <option value="Central Izquierdo - Duelista">Central Izquierdo - Duelista</option>
                          <option value="Central Izquierdo - Asociativo">Central Izquierdo - Asociativo</option>
                        </optgroup>
                        <optgroup label="⚙️ Volantes Centrales">
                          <option value="Volante Central - De construcción">Volante Central - De construcción</option>
                          <option value="Volante Central - Defensivo">Volante Central - Defensivo</option>
                        </optgroup>
                        <optgroup label="📦 Volantes Internos">
                          <option value="Volante Interno - Box to box">Volante Interno - Box to box</option>
                          <option value="Volante Interno - Ofensivo">Volante Interno - Ofensivo</option>
                        </optgroup>
                        <optgroup label="🏃 Volantes por Afuera">
                          <option value="Volante por Afuera - Carrilero">Volante por Afuera - Carrilero</option>
                          <option value="Volante por Afuera - Ofensivo">Volante por Afuera - Ofensivo</option>
                        </optgroup>
                        <optgroup label="⚡ Extremos Derechos">
                          <option value="Extremo Derecho - Finalizador">Extremo Derecho - Finalizador</option>
                          <option value="Extremo Derecho - Asociativo">Extremo Derecho - Asociativo</option>
                          <option value="Extremo Derecho - Desequilibrante">Extremo Derecho - Desequilibrante</option>
                        </optgroup>
                        <optgroup label="⚡ Extremos Izquierdos">
                          <option value="Extremo Izquierdo - Finalizador">Extremo Izquierdo - Finalizador</option>
                          <option value="Extremo Izquierdo - Asociativo">Extremo Izquierdo - Asociativo</option>
                          <option value="Extremo Izquierdo - Desequilibrante">Extremo Izquierdo - Desequilibrante</option>
                        </optgroup>
                        <optgroup label="⚽ Delanteros">
                          <option value="Delantero - De área">Delantero - De área</option>
                          <option value="Delantero - Mediapunta">Delantero - Mediapunta</option>
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                        ⏱️ Minutos Observados
                      </label>
                      <input
                        type="number"
                        value={reportForm.minutos_observados}
                        onChange={(e) => setReportForm({ ...reportForm, minutos_observados: parseInt(e.target.value) })}
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

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                      ⭐ Rating General: {reportForm.overall_rating}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={reportForm.overall_rating}
                      onChange={(e) => setReportForm({ ...reportForm, overall_rating: parseInt(e.target.value) })}
                      style={{ width: '100%', accentColor: '#006600' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9ca3af' }}>
                      <span>1</span>
                      <span>5</span>
                      <span>10</span>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                      📝 Notas Generales
                    </label>
                    <textarea
                      placeholder="Observaciones generales sobre el rendimiento del jugador..."
                      value={reportForm.notes}
                      onChange={(e) => setReportForm({ ...reportForm, notes: e.target.value })}
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
                </div>
              )}

              {/* Técnico Section */}
              {formSection === 'tecnico' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
                    ⚽ Aspectos Técnicos
                  </h3>

                  {[
                    { key: 'tecnica_individual', label: 'Técnica Individual', icon: '🎯' },
                    { key: 'pase', label: 'Pase', icon: '📍' },
                    { key: 'primer_toque', label: 'Primer Toque', icon: '👟' },
                    { key: 'control_balon', label: 'Control del Balón', icon: '⚽' },
                    { key: 'vision_juego', label: 'Visión de Juego', icon: '👁️' }
                  ].map(skill => (
                    <div key={skill.key}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                        {skill.icon} {skill.label}: {reportForm[skill.key as keyof ScoutReportCreate]}/10
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={reportForm[skill.key as keyof ScoutReportCreate] as number}
                        onChange={(e) => setReportForm({ ...reportForm, [skill.key]: parseInt(e.target.value) })}
                        style={{ width: '100%', accentColor: '#10b981' }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Físico Section */}
              {formSection === 'fisico' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
                    💪 Aspectos Físicos
                  </h3>

                  {[
                    { key: 'velocidad', label: 'Velocidad', icon: '🏃' },
                    { key: 'resistencia', label: 'Resistencia', icon: '🔋' },
                    { key: 'fuerza', label: 'Fuerza', icon: '💪' },
                    { key: 'salto', label: 'Salto', icon: '🦘' },
                    { key: 'agilidad', label: 'Agilidad', icon: '🤸' }
                  ].map(skill => (
                    <div key={skill.key}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                        {skill.icon} {skill.label}: {reportForm[skill.key as keyof ScoutReportCreate]}/10
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={reportForm[skill.key as keyof ScoutReportCreate] as number}
                        onChange={(e) => setReportForm({ ...reportForm, [skill.key]: parseInt(e.target.value) })}
                        style={{ width: '100%', accentColor: '#f59e0b' }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Mental Section */}
              {formSection === 'mental' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
                    🧠 Aspectos Mentales/Tácticos
                  </h3>

                  {[
                    { key: 'inteligencia_tactica', label: 'Inteligencia Táctica', icon: '🧠' },
                    { key: 'posicionamiento', label: 'Posicionamiento', icon: '📍' },
                    { key: 'concentracion', label: 'Concentración', icon: '🎯' },
                    { key: 'liderazgo', label: 'Liderazgo', icon: '👑' },
                    { key: 'trabajo_equipo', label: 'Trabajo en Equipo', icon: '🤝' }
                  ].map(skill => (
                    <div key={skill.key}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                        {skill.icon} {skill.label}: {reportForm[skill.key as keyof ScoutReportCreate]}/10
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={reportForm[skill.key as keyof ScoutReportCreate] as number}
                        onChange={(e) => setReportForm({ ...reportForm, [skill.key]: parseInt(e.target.value) })}
                        style={{ width: '100%', accentColor: '#8b5cf6' }}
                      />
                    </div>
                  ))}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#059669' }}>
                        ✅ Fortalezas
                      </label>
                      <textarea
                        placeholder="Principales fortalezas del jugador..."
                        value={reportForm.fortalezas}
                        onChange={(e) => setReportForm({ ...reportForm, fortalezas: e.target.value })}
                        rows={3}
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
                        ⚠️ Debilidades
                      </label>
                      <textarea
                        placeholder="Áreas de mejora..."
                        value={reportForm.debilidades}
                        onChange={(e) => setReportForm({ ...reportForm, debilidades: e.target.value })}
                        rows={3}
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
              )}

              {/* Seguimiento Section */}
              {formSection === 'seguimiento' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
                    📊 Seguimiento y Mercado
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                        🎯 Recomendación
                      </label>
                      <select
                        value={reportForm.recomendacion}
                        onChange={(e) => setReportForm({ ...reportForm, recomendacion: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="Comprar">✅ Comprar</option>
                        <option value="Seguir">👁️ Seguir Observando</option>
                        <option value="Descartar">❌ Descartar</option>
                        <option value="Prestamo">🔄 Préstamo</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                        📄 Condición de Mercado
                      </label>
                      <select
                        value={reportForm.condicion_mercado}
                        onChange={(e) => setReportForm({ ...reportForm, condicion_mercado: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="Libre">🆓 Agente Libre</option>
                        <option value="Ultimo año">⏰ Último Año de Contrato</option>
                        <option value="Contrato largo">📝 Contrato Largo</option>
                        <option value="Clausula">💰 Con Cláusula de Rescisión</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                        💰 Precio Estimado (€M)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="ej: 15.5"
                        value={reportForm.precio_estimado}
                        onChange={(e) => setReportForm({ ...reportForm, precio_estimado: parseFloat(e.target.value) || 0 })}
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
                        🤝 Agente/Representante
                      </label>
                      <input
                        type="text"
                        placeholder="Nombre del agente..."
                        value={reportForm.agente}
                        onChange={(e) => setReportForm({ ...reportForm, agente: e.target.value })}
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

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                      🏷️ Etiquetas
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {['Promesa', 'Listo para primer equipo', 'Proyecto', 'Titular inmediato', 'Suplente de calidad', 'Para revender'].map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            const tags = reportForm.tags || [];
                            if (tags.includes(tag)) {
                              setReportForm({ ...reportForm, tags: tags.filter(t => t !== tag) });
                            } else {
                              setReportForm({ ...reportForm, tags: [...tags, tag] });
                            }
                          }}
                          style={{
                            padding: '0.5rem 1rem',
                            background: (reportForm.tags || []).includes(tag)
                              ? 'linear-gradient(135deg, #667eea, #764ba2)'
                              : '#f3f4f6',
                            color: (reportForm.tags || []).includes(tag) ? 'white' : '#6b7280',
                            border: 'none',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '1.5rem 2rem',
              borderTop: '2px solid #e5e7eb',
              background: '#f9fafb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {formSection === 'general' && 'Complete la información general del partido'}
                {formSection === 'tecnico' && 'Evalúe las habilidades técnicas del jugador'}
                {formSection === 'fisico' && 'Evalúe las capacidades físicas del jugador'}
                {formSection === 'mental' && 'Evalúe aspectos mentales y tácticos'}
                {formSection === 'seguimiento' && 'Complete la información de seguimiento y mercado'}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setShowReportForm(false)}
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
                  onClick={handleSubmitReport}
                  style={{
                    padding: '0.75rem 2rem',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)'
                  }}
                >
                  💾 Guardar Reporte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Add Player Tab */}
      {/* DESPUÉS - sin espacio en blanco */}
      {activeTab === 'add-player' && (
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
            ➕ Agregar Nuevo Jugador
          </h2>
          <PlayerForm />
        </div>
      )}

 {/* DESPUÉS */}
      {activeTab === 'manual-players' && (
        <div>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
              👥 Jugadores Creados Manualmente
            </h2>

            {/* Filtros */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              padding: '1.5rem',
              background: '#f9fafb',
              borderRadius: '12px',
              marginBottom: '1.5rem'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                  🔍 Nombre
                </label>
                <input
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={manualPlayerFilters.name}
                  onChange={(e) => setManualPlayerFilters({ ...manualPlayerFilters, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              {/* Reemplaza el input de equipo por un select */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                  🏟️ Equipo
                </label>
                <select
                  value={manualPlayerFilters.team}
                  onChange={(e) => setManualPlayerFilters({ ...manualPlayerFilters, team: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Todos los equipos</option>
                  {filterOptions.teams.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>

              {/* Reemplaza el input de nacionalidad por un select */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                  🌍 Nacionalidad
                </label>
                <select
                  value={manualPlayerFilters.nationality}
                  onChange={(e) => setManualPlayerFilters({ ...manualPlayerFilters, nationality: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Todos los países</option>
                  {filterOptions.countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              {/* El select de posición ya existente, actualízalo para usar las opciones dinámicas */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                  ⚽ Posición
                </label>
                <select
                  value={manualPlayerFilters.position}
                  onChange={(e) => setManualPlayerFilters({ ...manualPlayerFilters, position: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Todas las posiciones</option>
                  {filterOptions.positions.map(position => (
                    <option key={position} value={position}>{position}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                  📅 Edad Mínima
                </label>
                <input
                  type="number"
                  placeholder="Desde..."
                  value={manualPlayerFilters.minAge}
                  onChange={(e) => setManualPlayerFilters({ ...manualPlayerFilters, minAge: e.target.value })}
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
                  📅 Edad Máxima
                </label>
                <input
                  type="number"
                  placeholder="Hasta..."
                  value={manualPlayerFilters.maxAge}
                  onChange={(e) => setManualPlayerFilters({ ...manualPlayerFilters, maxAge: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    setManualPlayerFilters({
                      name: '',
                      team: '',
                      nationality: '',
                      minAge: '',
                      maxAge: '',
                      position: ''
                    });
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  🔄 Limpiar
                </button>

                <button
                  onClick={loadManualPlayers}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  🔄 Recargar
                </button>
              </div>
            </div>

            {/* Contador de resultados */}
            <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
              Mostrando {filteredManualPlayers.length} de {manualPlayers.length} jugadores
            </div>
          </div>

          {/* Lista de jugadores */}
          {loadingManualPlayers ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>⚽</div>
              <p style={{ color: '#6b7280' }}>Cargando jugadores...</p>
            </div>
          ) : filteredManualPlayers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
              <p>
                {manualPlayers.length === 0
                  ? "No hay jugadores creados manualmente todavía"
                  : "No se encontraron jugadores con estos filtros"}
              </p>
              <p>Usa el botón "➕ Agregar Jugador" para crear uno.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {filteredManualPlayers.map((player) => (
                <div key={player.id || player.manual_id} style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '2px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {/* Avatar */}
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
                      {player.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>

                    {/* Info del jugador */}
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#1f2937' }}>
                        {player.name}
                      </h3>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                        {player.position && (
                          <span style={{
                            fontSize: '0.875rem',
                            padding: '0.25rem 0.75rem',
                            background: '#3b82f620',
                            color: '#3b82f6',
                            borderRadius: '12px',
                            fontWeight: '500'
                          }}>
                            ⚽ {player.position}
                          </span>
                        )}
                        {player.age && (
                          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            📅 {player.age} años
                          </span>
                        )}
                        {(player.passport_area || player.birth_area) && (
                          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            🌍 {player.passport_area || player.birth_area}
                          </span>
                        )}
                      </div>
                      {player.current_team_name && (
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                          🏟️ {player.current_team_name}
                          {player.current_team_area && ` (${player.current_team_area})`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openReportForm({
                          id: player.manual_id || player.id,
                          name: player.name,
                          position: player.position || '',
                          team: player.current_team_name || '',
                          wyscout_id: undefined
                        });
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
📝 Crear Reporte
                    </button>
                    <button
                      onClick={(e) => {
                      e.stopPropagation();
                      openMarketModal(player);
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      💰 A Mercado
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Markets Tab - NUEVO */}
      {activeTab === 'markets' && (
        <MarketSystem />
      )}

      <MarketModalManager 
        show={showMarketModal} 
        player={selectedMarketPlayer}
        onClose={() => {
          setShowMarketModal(false);
          setSelectedMarketPlayer(null);
        }}
      />

    </div>
  );
};



// Nueva función App que maneja las rutas 
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );

}

export default App;