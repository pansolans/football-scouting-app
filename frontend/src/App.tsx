import React, { useState, useEffect, useMemo } from 'react';
import { playerService, healthService, scoutingService, Player, ScoutReport, ScoutReportCreate, HealthStatus } from './services/api';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import PlayerForm from './components/PlayerForm';
import MarketSystem from './components/MarketSystem';
import MarketModalManager from './components/MarketModalManager';
import PlayerProfile from './components/PlayerProfile';
import { API_URL } from './config';
import { DashboardTab, PlayerDetailView, QuickSearchTab, BrowseTab, ReportsTab, RecommendationsTab, PlayerProfileTab, ReportFormModal, ManualPlayersTab, InformesTab } from './pages';
import { getClubConfig } from './utils/clubConfig';
import { reportBuilderService } from './services/reportBuilderService';
import { calculateAverageScore, getLatestRecommendation, calculateCategoryAverages, getRatingColor, getPositionColor } from './utils/reportUtils';
import { TabId } from './types';


// Componente para proteger rutas 
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-10 text-center text-white">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};



const MainApp: React.FC = () => {
  const { user, logout } = useAuth();
  const userClub = user?.organization || 'Club Atlético Banfield';
  const currentClub = getClubConfig(userClub);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const [filterCondicionMercado, setFilterCondicionMercado] = useState('');
  const [allPlayersData, setAllPlayersData] = useState<any[]>([]);
  const [browseExtraInfo, setBrowseExtraInfo] = useState<Record<string, any>>({});
  const [preselectedPlayer, setPreselectedPlayer] = useState<any>(null);


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

  // Estado para pre-cargar jugador en Informes
  const [informePlayerData, setInformePlayerData] = useState<{ playerId: string; playerName: string } | null>(null);
  const [existingInformeNames, setExistingInformeNames] = useState<string[]>([]);

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
const [contractFilter, setContractFilter] = useState({ from: '', to: '' });
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

  // Jugadores pendientes de informe: 3+ visorias O recomendación "Hacer informe"
  const pendingInformePlayers = useMemo(() => {
    const counts = new Map<string, { name: string; id: string; count: number; hacerInforme: boolean }>();
    // Agrupar reportes por jugador, ordenados por fecha desc para obtener la última recomendación
    const sortedReports = [...scoutReports].sort((a, b) =>
      new Date(b.fecha_observacion || b.created_at || '').getTime() -
      new Date(a.fecha_observacion || a.created_at || '').getTime()
    );
    sortedReports.forEach(r => {
      const existing = counts.get(r.player_name);
      if (existing) {
        existing.count++;
      } else {
        counts.set(r.player_name, {
          name: r.player_name,
          id: r.player_id,
          count: 1,
          hacerInforme: r.recomendacion === 'Hacer informe',
        });
      }
    });
    const namesLower = existingInformeNames.map(n => n.toLowerCase());
    return Array.from(counts.values())
      .filter(p => (p.count >= 3 || p.hacerInforme) && !namesLower.includes(p.name.toLowerCase()))
      .sort((a, b) => b.count - a.count);
  }, [scoutReports, existingInformeNames]);

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

        // Cargar nombres de informes existentes
        try {
          const informes = await reportBuilderService.list(false);
          setExistingInformeNames(informes.map(i => i.player_name).filter(Boolean) as string[]);
        } catch (e) { console.error('Error loading informes:', e); }

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

  // Helper functions imported from utils/reportUtils

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
        team: latestReport.player_current_team || latestReport.rival || 'Sin equipo',
        age: null // Necesitaríamos obtener esto de Wyscout
      };
    });

    // Filtrar según los criterios seleccionados
    return playerSummaries.filter(player => {
      if (filterLeague && player.competicion !== filterLeague) return false;
      if (filterRecommendation && player.recomendacion !== filterRecommendation) return false;
      if (filterPosition && player.position_played !== filterPosition) return false;
      if (filterCondicionMercado && player.condicion_mercado !== filterCondicionMercado) return false;
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

      // Filtro por condición de mercado
      if (filterCondicionMercado && report.condicion_mercado !== filterCondicionMercado) {
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

  // calculateCategoryAverages imported from utils/reportUtils



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
        } catch (error) {
          console.error('Failed to load teams:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadTeams();
  }, [selectedCompetition]);

// Load players: usa endpoint de competición (1 sola llamada, con caché)
useEffect(() => {
  const loadTeamPlayers = async () => {
    if (selectedTeams.length > 0 && selectedCompetition) {
      setLoading(true);
      try {
        const rawPlayers = await playerService.getCompetitionPlayers(selectedCompetition, selectedTeams);

        // Deduplicar por wyscout_id (un jugador puede aparecer en múltiples equipos)
        const seen = new Set<string>();
        const allPlayers = rawPlayers.filter((p: any) => {
          const pid = String(p.wyscout_id || p.id);
          if (seen.has(pid)) return false;
          seen.add(pid);
          return true;
        });

        setAllPlayersData(allPlayers);
        setTeamPlayers(allPlayers);

        // Extraer nacionalidades individuales (separar "Argentina / Spain" en dos)
        const natSet = new Set<string>();
        for (const player of allPlayers) {
          if (player.nationalities && Array.isArray(player.nationalities)) {
            player.nationalities.forEach((n: string) => natSet.add(n));
          } else if (player.nationality) {
            player.nationality.split(' / ').forEach((n: string) => natSet.add(n.trim()));
          }
        }
        setAvailableNationalities(Array.from(natSet).sort());

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [selectedTeams.join(','), selectedCompetition]);


// Filtrar jugadores sin recargar datos
useEffect(() => {
  if (allPlayersData.length === 0) return;

  let filtered = [...allPlayersData];
  
  if (selectedNationalities.length > 0) {
    filtered = filtered.filter(player => {
      // Soporta nacionalidades múltiples: "Argentina / Spain"
      const playerNats: string[] = player.nationalities && Array.isArray(player.nationalities)
        ? player.nationalities
        : (player.nationality || '').split(' / ').map((s: string) => s.trim()).filter(Boolean);
      return selectedNationalities.some((nat: string) => playerNats.includes(nat));
    });
  }
  
  const minAge = ageFilter.min ? parseInt(ageFilter.min) : 0;
  const maxAge = ageFilter.max ? parseInt(ageFilter.max) : 0;
  if (minAge >= 15 || maxAge >= 15) {
    filtered = filtered.filter(player => {
      const age = player.age;
      if (!age && age !== 0) return false;
      const meetsMin = minAge < 15 || age >= minAge;
      const meetsMax = maxAge < 15 || age <= maxAge;
      return meetsMin && meetsMax;
    });
  }

  // Filtro de vencimiento de contrato (usa info extra de batch-info)
  if (contractFilter.from || contractFilter.to) {
    filtered = filtered.filter(player => {
      const wid = String(player.wyscout_id || player.id);
      const extra = browseExtraInfo[wid];
      const contractExp = extra?.contract_expires || player.contractExpires;
      // Si no hay datos de contrato, mantener al jugador (no excluirlo)
      if (!contractExp) return true;
      const contractDate = new Date(contractExp);
      if (isNaN(contractDate.getTime())) return true;
      const meetsFrom = !contractFilter.from || contractDate >= new Date(contractFilter.from);
      const meetsTo = !contractFilter.to || contractDate <= new Date(contractFilter.to);
      return meetsFrom && meetsTo;
    });
  }

  setTeamPlayers(filtered);
}, [selectedNationalities, ageFilter.min, ageFilter.max, contractFilter.from, contractFilter.to, allPlayersData, browseExtraInfo]);

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
        player_name: selectedPlayer.name,
        player_current_team: selectedPlayer.team || ''
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

const clearAllFilters = () => {
  setSelectedNationalities([]);
  setAgeFilter({ min: '', max: '' });
  setShowNationalityFilter(false);
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


  // getPositionColor imported from utils/reportUtils

  // Calculate stats
  const totalReports = Array.isArray(scoutReports) ? scoutReports.length : 0;
  const avgRating = totalReports > 0 && Array.isArray(scoutReports)
    ? (scoutReports.reduce((sum, r) => sum + r.overall_rating, 0) / totalReports).toFixed(1)
    : '0';

  // Player Detail View (early return)
  if (selectedPlayerForDetail) {
    return (
      <PlayerDetailView
        playerName={selectedPlayerForDetail}
        reports={playerDetailReports}
        onClose={closePlayerDetail}
      />
    );
  }




  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'quick-search', label: 'Busqueda' },
    { id: 'browse', label: 'Explorar Ligas' },
    { id: 'reports', label: 'Mis Reportes' },
    { id: 'recommendations', label: 'Recomendaciones' },
    { id: 'add-player', label: 'Agregar Jugador' },
    { id: 'manual-players', label: 'Jugadores' },
    { id: 'markets', label: 'Mercados' },
    { id: 'informes', label: 'Informes' },
    // { id: 'player-profiles', label: 'Perfiles' } // Oculto temporalmente
  ];

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside className={`w-[240px] sidebar-bg border-r border-border-strong fixed top-0 left-0 h-screen flex flex-col z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        {/* Logo area */}
        <div className="px-5 py-6 border-b border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent" />
          <div className="relative flex items-center gap-3">
            <div className="relative">
              <img
                src={currentClub.logo}
                alt={currentClub.name}
                className="w-9 h-9 object-contain"
              />
              <div className="absolute -inset-1 bg-accent/10 rounded-full blur-md -z-10" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight m-0">
                <span className="text-gradient">SCOUTPRO</span>
              </h1>
              <p className="text-[11px] text-text-muted m-0 tracking-wide">{currentClub.name}</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id as any); setSidebarOpen(false); }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 border-none cursor-pointer ${
                  activeTab === item.id
                    ? 'sidebar-nav-active text-accent-light'
                    : 'bg-transparent text-text-muted hover:text-text-secondary hover:bg-white/[0.04]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* User section at bottom */}
        <div className="px-4 py-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center text-accent text-xs font-bold flex-shrink-0">
                {(user?.name || 'U').charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-text m-0 truncate">
                  {user?.name || 'Usuario'}
                </p>
                <p className="text-[11px] text-text-muted m-0">
                  {user?.role === 'admin' ? 'Admin' :
                    user?.role === 'head_scout' ? 'Jefe Scout' :
                      user?.role === 'scout' ? 'Scout' : 'Viewer'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-[11px] text-text-muted hover:text-danger bg-transparent border-none cursor-pointer px-2 py-1 rounded hover:bg-danger/10 transition-colors"
            >
              Salir
            </button>
          </div>
          {healthStatus && (
            <div className="flex items-center gap-1.5 mt-3">
              <span className={`w-1.5 h-1.5 rounded-full ${
                healthStatus.status === 'healthy' ? 'bg-success animate-pulse-glow' : 'bg-danger'
              }`}></span>
              <span className="text-[11px] text-text-muted">
                {healthStatus.status === 'healthy' ? 'Sistema activo' : 'Sistema offline'}
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="ml-0 md:ml-[240px] flex-1 min-h-screen relative">
        {/* Background image layer - persistent across all tabs */}
        <div className="fixed inset-0 ml-0 md:ml-[240px] pointer-events-none z-0">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'url(/images/stadium-bg.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.35,
            }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(6,6,8,0.5) 0%, rgba(6,6,8,0.65) 50%, rgba(6,6,8,0.55) 100%)' }} />
          <div className="absolute inset-0 bg-grid-pattern" />
        </div>

        {/* Top bar */}
        <header className="h-16 border-b border-border header-gradient sticky top-0 z-40 flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-text p-2 -ml-2 mr-1 bg-transparent border-none cursor-pointer"
              onClick={() => setSidebarOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-accent to-accent-dark" />
            <h2 className="text-base font-bold text-text tracking-wide uppercase">
              {navItems.find(n => n.id === activeTab)?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-text-muted hidden md:block">
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <button
              className="md:hidden text-[11px] text-text-muted hover:text-danger bg-transparent border-none cursor-pointer px-2 py-1 rounded hover:bg-danger/10 transition-colors"
              onClick={logout}
            >
              Salir
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="px-4 md:px-10 py-4 md:py-8 animate-fade-in relative z-10 min-h-[calc(100vh-64px)] max-w-[1200px] mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardTab
              totalReports={totalReports}
              avgRating={avgRating}
              scoutReports={scoutReports}
              healthStatus={healthStatus}
              wyscoutStatus={wyscoutStatus}
              onCreateInforme={(playerId, playerName) => {
                setInformePlayerData({ playerId, playerName });
                setActiveTab('informes' as TabId);
              }}
              existingInformeNames={existingInformeNames}
            />
          )}

          {activeTab === 'quick-search' && (
            <QuickSearchTab
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              loading={loading}
              searchResults={searchResults}
              setSelectedTeam={setSelectedTeam}
              setActiveTab={setActiveTab}
              viewPlayerProfile={viewPlayerProfile}
              openReportForm={openReportForm}
              openMarketModal={openMarketModal}
              setPreselectedPlayer={setPreselectedPlayer}
            />
          )}

          {activeTab === 'browse' && (
            <BrowseTab
              areas={areas}
              selectedArea={selectedArea}
              setSelectedArea={setSelectedArea}
              competitions={competitions}
              selectedCompetition={selectedCompetition}
              setSelectedCompetition={setSelectedCompetition}
              competitionTeams={competitionTeams}
              selectedTeams={selectedTeams}
              setSelectedTeams={setSelectedTeams}
              teamPlayers={teamPlayers}
              hasLoadedPlayers={allPlayersData.length > 0}
              selectedNationalities={selectedNationalities}
              setSelectedNationalities={setSelectedNationalities}
              showNationalityFilter={showNationalityFilter}
              setShowNationalityFilter={setShowNationalityFilter}
              availableNationalities={availableNationalities}
              ageFilter={ageFilter}
              setAgeFilter={setAgeFilter}
              contractFilter={contractFilter}
              setContractFilter={setContractFilter}
              browseExtraInfo={browseExtraInfo}
              setBrowseExtraInfo={setBrowseExtraInfo}
              viewPlayerProfile={viewPlayerProfile}
              openReportForm={openReportForm}
              openMarketModal={openMarketModal}
              setPreselectedPlayer={setPreselectedPlayer}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsTab
              scoutReports={scoutReports}
              filterPlayerName={filterPlayerName}
              setFilterPlayerName={setFilterPlayerName}
              filterTeam={filterTeam}
              setFilterTeam={setFilterTeam}
              filterLeague={filterLeague}
              setFilterLeague={setFilterLeague}
              filterCondicionMercado={filterCondicionMercado}
              setFilterCondicionMercado={setFilterCondicionMercado}
              getFilteredReports={getFilteredReports}
              getUniqueLeagues={getUniqueLeagues}
              openPlayerDetail={openPlayerDetail}
              editReport={editReport}
              onDeleteReport={async (reportId: string) => {
                try {
                  await scoutingService.deleteReport(reportId);
                  setScoutReports(scoutReports.filter(r => r.id !== reportId));
                } catch (error) {
                  alert('Error al eliminar el reporte');
                }
              }}
              onCreateInforme={(playerId, playerName) => {
                setInformePlayerData({ playerId, playerName });
                setActiveTab('informes' as TabId);
              }}
            />
          )}

          {activeTab === 'recommendations' && (
            <RecommendationsTab
              scoutReports={scoutReports}
              filterLeague={filterLeague}
              setFilterLeague={setFilterLeague}
              filterRecommendation={filterRecommendation}
              setFilterRecommendation={setFilterRecommendation}
              filterPosition={filterPosition}
              setFilterPosition={setFilterPosition}
              filterCondicionMercado={filterCondicionMercado}
              setFilterCondicionMercado={setFilterCondicionMercado}
              getUniqueLeagues={getUniqueLeagues}
              getUniquePositions={getUniquePositions}
              getFilteredPlayers={getFilteredPlayers}
              openMarketModal={openMarketModal}
              openPlayerDetail={openPlayerDetail}
              onCreateInforme={(playerId, playerName) => {
                setInformePlayerData({ playerId, playerName });
                setActiveTab('informes' as TabId);
              }}
            />
          )}

          {activeTab === 'player-profile' && (
            <PlayerProfileTab
              loadingProfile={loadingProfile}
              playerProfile={playerProfile}
              setActiveTab={setActiveTab}
              openReportForm={openReportForm}
            />
          )}

          {activeTab === 'add-player' && (
            <div>
              <PlayerForm />
            </div>
          )}

          {activeTab === 'manual-players' && (
            <ManualPlayersTab
              manualPlayerFilters={manualPlayerFilters}
              setManualPlayerFilters={setManualPlayerFilters}
              filterOptions={filterOptions}
              filteredManualPlayers={filteredManualPlayers}
              manualPlayers={manualPlayers}
              loadingManualPlayers={loadingManualPlayers}
              loadManualPlayers={loadManualPlayers}
              openReportForm={openReportForm}
              openMarketModal={openMarketModal}
            />
          )}

          {activeTab === 'markets' && (
            <MarketSystem />
          )}

          {activeTab === 'informes' && (
            <InformesTab
              preselectedPlayer={informePlayerData}
              onClearPreselected={() => setInformePlayerData(null)}
              pendingPlayers={pendingInformePlayers}
            />
          )}

          {activeTab === 'player-profiles' && (
            <PlayerProfile
              preselectedPlayer={preselectedPlayer}
              onClearPreselected={() => setPreselectedPlayer(null)}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <ReportFormModal
        showReportForm={showReportForm}
        setShowReportForm={setShowReportForm}
        selectedPlayer={selectedPlayer}
        reportForm={reportForm}
        setReportForm={setReportForm}
        formSection={formSection}
        setFormSection={setFormSection}
        handleSubmitReport={handleSubmitReport}
        playerMatches={playerMatches}
        loadingMatches={loadingMatches}
      />

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