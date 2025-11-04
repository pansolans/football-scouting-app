from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from supabase import create_client  
import httpx
import os
import base64
import httpx
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

from datetime import timedelta
from app.auth import (
    UserLogin, Token,
    verify_password, create_access_token,
    get_current_user, supabase
)

from app.services.wyscout_client import WyscoutClient
from app.config import settings

from app.services.supabase_service import SupabaseService

# Inicializar Supabase
try:
    supabase_service = SupabaseService()
    print("✅ Supabase conectado correctamente")
except Exception as e:
    print(f"⚠️ Supabase no configurado: {e}")
    supabase_service = None

# FastAPI app
app = FastAPI(
    title="Football Scouting API",
    description="API for football scouting with Wyscout integration",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://football-scouting-app-fawn.vercel.app",
        "https://football-scouting-app.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class AreaResponse(BaseModel):
    id: int
    name: str
    alpha2_code: Optional[str] = None
    alpha3_code: Optional[str] = None

class CompetitionResponse(BaseModel):
    id: int
    name: str
    area_name: str
    format: str
    gender: str
    division_level: int

class TeamResponse(BaseModel):
    id: int
    name: str
    official_name: Optional[str] = None
    city: Optional[str] = None
    area_name: Optional[str] = None

class PlayerSearchResponse(BaseModel):
    id: str
    name: str
    position: str
    team: str
    wyscout_id: Optional[int] = None
    age: Optional[int] = None
    nationality: Optional[str] = None

class MatchResponse(BaseModel):
    id: int
    label: str
    date: str
    status: str
    competition_name: Optional[str] = None

class ScoutReportCreate(BaseModel):
    player_wyscout_id: int
    player_name: str
    player_current_team: Optional[str] = None
    match_context: Optional[str] = None
    overall_rating: int
    technical_rating: int
    physical_rating: int
    mental_rating: int
    notes: str
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    video_url: Optional[str] = None


class ScoutReportResponse(BaseModel):
    id: str
    player_name: str
    match_context: Optional[str]
    overall_rating: int
    technical_rating: int
    physical_rating: int
    mental_rating: int
    notes: str
    strengths: Optional[str]
    weaknesses: Optional[str]
    created_at: str
    video_url: Optional[str] = None

# Helper functions
def calculate_age(birth_date: str) -> Optional[int]:
    try:
        birth = datetime.strptime(birth_date, "%Y-%m-%d")
        today = datetime.today()
        return today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
    except:
        return None

# Temporarily store reports in memory
scout_reports = []

# Cache global para competiciones
competition_cache = {}
season_cache = {}

# Routes
@app.get("/")
async def root():
    return {"message": "Football Scouting API is running!", "status": "success"}

@app.get("/api/health")
async def health_check():
    try:
        supabase_url = os.getenv("SUPABASE_URL")
        wyscout_username = os.getenv("WYSCOUT_USERNAME")
        
        return {
            "status": "healthy",
            "environment": {
                "supabase_configured": bool(supabase_url),
                "wyscout_configured": bool(wyscout_username)
            },
            "message": "All systems operational"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

# ============= ENDPOINTS DE AUTENTICACIÓN (NUEVO) =============
@app.post("/api/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    """Login endpoint"""
    # Buscar usuario en scouts (no users)
    response = supabase.table('scouts').select("*").eq('email', user_credentials.email).single().execute()
    
    if not response.data:
        raise HTTPException(
            status_code=401,
            detail="Email o contraseña incorrectos"
        )
    
    user = response.data
    
    # Verificar contraseña
    if not verify_password(user_credentials.password, user['password_hash']):
        raise HTTPException(
            status_code=401,
            detail="Email o contraseña incorrectos"
        )
    
    # Verificar si está activo
    if not user.get('is_active', True):
        raise HTTPException(
            status_code=403,
            detail="Usuario desactivado"
        )
    
    # Crear token
    access_token = create_access_token(data={"sub": user['id']})
    
    # Quitar password del response
    user.pop('password_hash', None)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Obtener usuario actual"""
    current_user.pop('password_hash', None)
    return current_user

# ============= FIN ENDPOINTS AUTH =============

@app.get("/api/test-wyscout")
async def test_wyscout():
    try:
        import base64
        
        username = os.getenv("WYSCOUT_USERNAME")
        password = os.getenv("WYSCOUT_PASSWORD")
        
        if not username or not password:
            return {"error": "Wyscout credentials not configured"}
        
        credentials = f"{username}:{password}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {encoded_credentials}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://apirest.wyscout.com/v3/areas",
                headers=headers,
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "status": "success",
                    "message": "Wyscout API connection successful",
                    "areas_count": len(data) if isinstance(data, list) else "unknown"
                }
            else:
                return {
                    "status": "error",
                    "message": f"Wyscout API error: {response.status_code}",
                    "details": response.text
                }
                
    except Exception as e:
        return {
            "status": "error",
            "message": f"Connection failed: {str(e)}"
        }

# ==============================================
# HIERARCHICAL SEARCH ENDPOINTS
# ==============================================

@app.get("/api/areas", response_model=List[AreaResponse])
async def get_areas():
    """Get all available areas/countries"""
    try:
        async with WyscoutClient(settings.WYSCOUT_USERNAME, settings.WYSCOUT_PASSWORD) as wyscout:
            areas_data = await wyscout.get_areas()
            
            areas = []
            for area in areas_data:
                areas.append(AreaResponse(
                    id=area.get("id"),
                    name=area.get("name"),
                    alpha2_code=area.get("alpha2code"),
                    alpha3_code=area.get("alpha3code")
                ))
            
            return sorted(areas, key=lambda x: x.name)
            
    except Exception as e:
        logger.error(f"Error getting areas: {e}")
        raise HTTPException(status_code=500, detail="Failed to get areas")

@app.get("/api/areas/{area_id}/competitions", response_model=List[CompetitionResponse])
async def get_competitions_by_area(area_id: int):
    """Get competitions for a specific area"""
    try:
        async with WyscoutClient(settings.WYSCOUT_USERNAME, settings.WYSCOUT_PASSWORD) as wyscout:
            # Need to use area alpha3 code for Wyscout API
            areas = await wyscout.get_areas()
            area_code = None
            area_name = "Unknown"
            
            for area in areas:
                if area.get("id") == area_id:
                    area_code = area.get("alpha3code")
                    area_name = area.get("name")
                    break
            
            if not area_code:
                raise HTTPException(status_code=404, detail="Area not found")
            
            competitions_data = await wyscout.get_competitions(area_code)
            
            competitions = []
            comp_list = competitions_data.get("competitions", [])
            
            for comp in comp_list:
                competitions.append(CompetitionResponse(
                    id=comp.get("wyId"),
                    name=comp.get("name"),
                    area_name=area_name,
                    format=comp.get("format", "Unknown"),
                    gender=comp.get("gender", "Unknown"),
                    division_level=comp.get("divisionLevel", 0)
                ))
            
            return sorted(competitions, key=lambda x: x.name)
            
    except Exception as e:
        logger.error(f"Error getting competitions: {e}")
        raise HTTPException(status_code=500, detail="Failed to get competitions")

@app.get("/api/competitions/{competition_id}/teams", response_model=List[TeamResponse])
async def get_teams_by_competition(competition_id: int):
    """Get teams for a specific competition"""
    try:
        async with WyscoutClient(settings.WYSCOUT_USERNAME, settings.WYSCOUT_PASSWORD) as wyscout:
            teams_data = await wyscout.get_competition_teams(competition_id)
            
            teams = []
            team_list = teams_data.get("teams", [])
            
            for team in team_list:
                teams.append(TeamResponse(
                    id=team.get("wyId"),
                    name=team.get("name"),
                    official_name=team.get("officialName"),
                    city=team.get("city"),
                    area_name=team.get("area", {}).get("name") if team.get("area") else None
                ))
            
            return sorted(teams, key=lambda x: x.name)
            
    except Exception as e:
        logger.error(f"Error getting teams: {e}")
        raise HTTPException(status_code=500, detail="Failed to get teams")

@app.get("/api/teams/{team_id}/players", response_model=List[PlayerSearchResponse])
async def get_players_by_team(team_id: int):
    """Get players for a specific team"""
    try:
        async with WyscoutClient(settings.WYSCOUT_USERNAME, settings.WYSCOUT_PASSWORD) as wyscout:
            squad_data = await wyscout.get_team_squad(team_id)
            
            players = []
            player_list = squad_data.get("squad", [])
            
            for player in player_list:
                players.append(PlayerSearchResponse(
                    id=str(player.get("wyId", "")),
                    name=player.get("shortName", "Unknown"),
                    position=player.get("role", {}).get("name", "Unknown"),
                    team=squad_data.get("team", {}).get("name", "Unknown"),
                    wyscout_id=player.get("wyId"),
                    age=calculate_age(player.get("birthDate")) if player.get("birthDate") else None,
                    nationality=player.get("passportArea", {}).get("name", "Unknown") if player.get("passportArea") else "Unknown"
                ))
            
            return sorted(players, key=lambda x: x.position)
            
    except Exception as e:
        logger.error(f"Error getting team players: {e}")
        raise HTTPException(status_code=500, detail="Failed to get team players")

@app.get("/api/competitions/{competition_id}/matches", response_model=List[MatchResponse])
async def get_matches_by_competition(competition_id: int, limit: int = Query(20, le=100)):
    """Get recent matches for a specific competition"""
    try:
        async with WyscoutClient(settings.WYSCOUT_USERNAME, settings.WYSCOUT_PASSWORD) as wyscout:
            matches_data = await wyscout.get_competition_matches(competition_id)
            
            matches = []
            match_list = matches_data.get("matches", [])
            
            for match in match_list[:limit]:
                matches.append(MatchResponse(
                    id=match.get("matchId"),
                    label=match.get("label", "Unknown"),
                    date=match.get("date", "Unknown"),
                    status=match.get("status", "Unknown"),
                    competition_name=matches_data.get("competition", {}).get("name")
                ))
            
            return matches
            
    except Exception as e:
        logger.error(f"Error getting matches: {e}")
        raise HTTPException(status_code=500, detail="Failed to get matches")

# ==============================================
# SMART SEARCH ENDPOINTS
# ==============================================

@app.get("/api/search/smart")
async def smart_search(
    query: str = Query(..., min_length=2),
    search_type: str = Query("all", regex="^(all|teams|players)$")
):
    """Smart search that can find teams or players directly"""
    try:
        async with WyscoutClient(settings.WYSCOUT_USERNAME, settings.WYSCOUT_PASSWORD) as wyscout:
            results = {
                "teams": [],
                "players": []
            }
            
            # Search teams if requested
            if search_type in ["all", "teams"]:
                try:
                    team_results = await wyscout.search_teams(query)
                    for team in team_results[:5]:
                        results["teams"].append({
                            "id": team.get("wyId"),
                            "name": team.get("name"),
                            "official_name": team.get("officialName"),
                            "city": team.get("city"),
                            "area_name": team.get("area", {}).get("name") if team.get("area") else None
                        })
                except:
                    pass  # Teams search might fail, continue with players
            
            # Search players if requested
            if search_type in ["all", "players"]:
                try:
                    player_results = await wyscout.search_players(query)
                    for player in player_results[:10]:
                        results["players"].append({
                            "id": str(player.get("wyId", "")),
                            "name": player.get("shortName", "Unknown"),
                            "position": player.get("role", {}).get("name", "Unknown"),
                            "team": player.get("currentTeam", {}).get("name", "Unknown") if player.get("currentTeam") else "Unknown",
                            "wyscout_id": player.get("wyId"),
                            "age": calculate_age(player.get("birthDate")) if player.get("birthDate") else None,
                            "nationality": player.get("passportArea", {}).get("name", "Unknown") if player.get("passportArea") else "Unknown"
                        })
                except:
                    pass  # Players search might fail
            
            return results
            
    except Exception as e:
        logger.error(f"Error in smart search: {e}")
        raise HTTPException(status_code=500, detail="Search failed")

# ==============================================
# LEGACY SEARCH (mantener compatibilidad)
# ==============================================

@app.get("/api/search/players", response_model=List[PlayerSearchResponse])
async def search_players(
    query: str = Query(..., min_length=2),
    limit: int = Query(10, le=50)
):
    """Legacy player search endpoint """
    try:
        async with WyscoutClient(settings.WYSCOUT_USERNAME, settings.WYSCOUT_PASSWORD) as wyscout:
            wyscout_results = await wyscout.search_players(query)
            
            players = []
            for player in wyscout_results[:limit]:
                players.append(PlayerSearchResponse(
                    id=str(player.get("wyId", "")),
                    name=player.get("shortName", "Unknown"),
                    position=player.get("role", {}).get("name", "Unknown"),
                    team=player.get("currentTeam", {}).get("name", "Unknown") if player.get("currentTeam") else "Unknown",
                    wyscout_id=player.get("wyId"),
                    age=calculate_age(player.get("birthDate")) if player.get("birthDate") else None,
                    nationality=player.get("passportArea", {}).get("name", "Unknown") if player.get("passportArea") else "Unknown"
                ))
            
            return players
            
    except Exception as e:
        logger.error(f"Error searching players: {e}")
        return []
# ==============================================
# PLAYER & MATCH DETAILS
# ==============================================

@app.get("/api/player/{player_id}")
async def get_player_details(player_id: int):
    try:
        async with WyscoutClient(settings.WYSCOUT_USERNAME, settings.WYSCOUT_PASSWORD) as wyscout:
            player = await wyscout.get_player(player_id, details="currentTeam")
            return player
    except Exception as e:
        logger.error(f"Error getting player details: {e}")
        raise HTTPException(status_code=500, detail="Failed to get player details")

@app.get("/api/player/{player_id}/matches")
async def get_player_matches(player_id: int):
    try:
        async with WyscoutClient(settings.WYSCOUT_USERNAME, settings.WYSCOUT_PASSWORD) as wyscout:
            matches = await wyscout.get_player_matches(player_id)
            return matches
    except Exception as e:
        logger.error(f"Error getting player matches: {e}")
        raise HTTPException(status_code=500, detail="Failed to get player matches")

@app.get("/api/match/{match_id}/players")
async def get_match_players(match_id: int):
    """Get players who participated in a specific match"""
    try:
        async with WyscoutClient(settings.WYSCOUT_USERNAME, settings.WYSCOUT_PASSWORD) as wyscout:
            match_data = await wyscout.get_match_players(match_id)
            return match_data
    except Exception as e:
        logger.error(f"Error getting match players: {e}")
        raise HTTPException(status_code=500, detail="Failed to get match players")

# ==============================================
# SCOUTING REPORTS
# ==============================================

# Add these imports at the top of the file if not already there:
# import uuid
# from datetime import datetime
# from typing import Optional

# Models for Scout Reports
class ScoutReportCreate(BaseModel):
    player_id: str
    player_name: str
    player_wyscout_id: Optional[int] = None
    match_context: Optional[str] = ""
    
    # Posición observada
    position_played: Optional[str] = ""  # "Delantero", "Mediocampista", etc.
    
    # Ratings principales (1-10)
    overall_rating: int = 7
    
    # Aspectos Técnicos
    tecnica_individual: int = 7
    pase: int = 7
    primer_toque: int = 7
    control_balon: int = 7
    vision_juego: int = 7
    
    # Aspectos Físicos
    velocidad: int = 7
    resistencia: int = 7
    fuerza: int = 7
    salto: int = 7
    agilidad: int = 7
    
    # Aspectos Mentales/Tácticos
    inteligencia_tactica: int = 7
    posicionamiento: int = 7
    concentracion: int = 7
    liderazgo: int = 7
    trabajo_equipo: int = 7
    
    # Notas y observaciones
    notes: str = ""
    fortalezas: Optional[str] = ""
    debilidades: Optional[str] = ""
    
    # Sistema de seguimiento
    recomendacion: Optional[str] = ""  # "Comprar", "Seguir", "Descartar"
    condicion_mercado: Optional[str] = ""  # "Libre", "Último año", "Contrato largo"
    agente: Optional[str] = ""
    tags: Optional[List[str]] = []  # ["Promesa", "Listo para primer equipo", etc]
    precio_estimado: Optional[float] = None
    
    # Metadata
    fecha_observacion: Optional[str] = ""
    tipo_visionado: Optional[str] = "" 
    competicion: Optional[str] = ""
    rival: Optional[str] = ""
    resultado: Optional[str] = ""
    minutos_observados: Optional[int] = 90
    video_url: Optional[str] = None

class ScoutReportResponse(BaseModel):
    id: str
    player_id: str
    player_name: str
    player_wyscout_id: Optional[int] = None
    match_context: Optional[str] = None
    position_played: Optional[str] = None
    
    overall_rating: int
    
    # Técnicos
    tecnica_individual: int
    pase: int
    primer_toque: int
    control_balon: int
    vision_juego: int
    
    # Físicos
    velocidad: int
    resistencia: int
    fuerza: int
    salto: int
    agilidad: int
    
    # Mentales
    inteligencia_tactica: int
    posicionamiento: int
    concentracion: int
    liderazgo: int
    trabajo_equipo: int
    
    notes: str
    fortalezas: Optional[str] = None
    debilidades: Optional[str] = None
    
    # Seguimiento
    recomendacion: Optional[str] = None
    condicion_mercado: Optional[str] = None
    agente: Optional[str] = None
    tags: Optional[List[str]] = []
    precio_estimado: Optional[float] = None
    
    fecha_observacion: Optional[str] = None
    tipo_visionado: Optional[str] = None
    competicion: Optional[str] = None
    rival: Optional[str] = None
    resultado: Optional[str] = None
    minutos_observados: Optional[int] = None
    video_url: Optional[str] = None
    # Campos del autor (AGREGAR ESTAS LÍNEAS)
    created_by: Optional[str] = None
    created_by_name: Optional[str] = None
    created_by_email: Optional[str] = None
    created_by_role: Optional[str] = None
    updated_by: Optional[str] = None
    updated_by_name: Optional[str] = None
    club_id: Optional[str] = None
    
    created_at: str
    

# In-memory storage
scout_reports = []

competition_cache = {}

@app.post("/api/scout-reports", response_model=ScoutReportResponse)
async def create_scout_report(
    report: ScoutReportCreate,
    current_user: dict = Depends(get_current_user)
):
    try:
        report_data = report.dict()
        
        # Información del usuario
        report_data['created_by'] = current_user['id']
        report_data['created_by_name'] = current_user['name']
        report_data['created_by_email'] = current_user['email']
        report_data['created_by_role'] = current_user.get('role', 'scout')
        
        # NUEVO: Agregar club_id
        report_data['club_id'] = current_user.get('club_id')
        
        if supabase_service:
            new_report = supabase_service.create_report(report_data)
            if new_report:
                logger.info(f"✅ Reporte guardado en Supabase por: {current_user['name']}")
                return ScoutReportResponse(**new_report)
        
        # Resto del código igual...
    
        
        # Fallback a memoria si Supabase no está configurado
        logger.warning("⚠️ Guardando en memoria (se perderá al reiniciar)")
        new_report = {
            "id": str(len(scout_reports) + 1),
            **report_data,
            "created_at": datetime.now().isoformat()
        }
        scout_reports.append(new_report)
        return ScoutReportResponse(**new_report)
        
    except Exception as e:
        logger.error(f"Error creating scout report: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create scout report: {str(e)}")

@app.get("/api/scout-reports", response_model=List[ScoutReportResponse])
async def get_scout_reports(current_user: dict = Depends(get_current_user)):
    try:
        if supabase_service:
            # NUEVO: Filtrar por club
            club_id = current_user.get('club_id')
            
            if club_id:
                # Solo reportes del club del usuario
                response = supabase.table('scout_reports')\
                    .select("*")\
                    .eq('club_id', club_id)\
                    .order('created_at')\
                    .execute()
                reports = response.data or []
                logger.info(f"📊 Obtenidos {len(reports)} reportes del club")
            else:
                # Si no tiene club, ver todos (para compatibilidad)
                reports = supabase_service.get_all_reports()
                logger.info(f"📊 Obtenidos {len(reports)} reportes (sin filtro de club)")
            
            return [ScoutReportResponse(**report) for report in reports]
        
        logger.warning("⚠️ Usando reportes de memoria")
        return [ScoutReportResponse(**report) for report in scout_reports]
    except Exception as e:
        logger.error(f"Error getting reports: {e}")
        return []

@app.get("/api/scout-reports/player/{player_wyscout_id}", response_model=List[ScoutReportResponse])
async def get_player_reports(player_wyscout_id: int):
    player_reports = [report for report in scout_reports if report.get("player_wyscout_id") == player_wyscout_id]
    return [ScoutReportResponse(**report) for report in player_reports]

@app.get("/api/scout-reports/player/{player_wyscout_id}", response_model=List[ScoutReportResponse])
async def get_player_reports(player_wyscout_id: int):
    player_reports = [report for report in scout_reports if report.get("player_wyscout_id") == player_wyscout_id]
    return [ScoutReportResponse(**report) for report in player_reports]

@app.put("/api/scout-reports/{report_id}")
async def update_scout_report(
    report_id: str, 
    report: ScoutReportCreate,
    current_user: dict = Depends(get_current_user)  # AGREGAR ESTA LÍNEA
):
    """Update an existing scout report"""
    try:
        report_data = report.dict()
        
        # AGREGAR - Info de quién actualiza
        report_data['updated_by'] = current_user['id']
        report_data['updated_by_name'] = current_user['name']
        
        # Si Supabase está configurado, actualizar ahí
        if supabase_service:
            updated_report = supabase_service.update_report(report_id, report_data)  # Cambiar a report_data
            if updated_report:
                logger.info(f"✅ Reporte actualizado en Supabase: {report_id}")
                return ScoutReportResponse(**updated_report)
            else:
                raise HTTPException(status_code=404, detail="Report not found")
        
        # Fallback a memoria si Supabase no está configurado
        logger.warning("⚠️ Actualizando en memoria")
        for i, existing_report in enumerate(scout_reports):
            if existing_report["id"] == report_id:
                updated_report = {
                    **report.dict(),
                    "id": report_id,
                    "created_at": existing_report.get("created_at"),
                    "updated_at": datetime.now().isoformat()
                }
                scout_reports[i] = updated_report
                return ScoutReportResponse(**updated_report)
        
        raise HTTPException(status_code=404, detail="Report not found")
        
    except Exception as e:
        logger.error(f"Error updating scout report: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update scout report: {str(e)}")

# AGREGAR AQUÍ EL NUEVO ENDPOINT 👇

@app.get("/api/scout-reports/player/{player_id}/all")
async def get_all_player_reports(player_id: str):
    """Get all reports for a specific player"""
    player_reports = [report for report in scout_reports if report.get("player_id") == player_id]
    
    # Calcular promedios si hay múltiples reportes
    if len(player_reports) > 1:
        avg_overall = sum(r["overall_rating"] for r in player_reports) / len(player_reports)
        avg_tecnica = sum(r["tecnica_individual"] for r in player_reports) / len(player_reports)
        avg_velocidad = sum(r["velocidad"] for r in player_reports) / len(player_reports)
        
        return {
            "reports": player_reports,
            "total_reports": len(player_reports),
            "averages": {
                "overall": round(avg_overall, 1),
                "tecnica": round(avg_tecnica, 1),
                "velocidad": round(avg_velocidad, 1)
            },
            "latest_report": player_reports[-1] if player_reports else None
        }
    
    return {
        "reports": player_reports,
        "total_reports": len(player_reports),
        "averages": None,
        "latest_report": player_reports[0] if player_reports else None
    }


# ==============================================
# UTILITY ENDPOINTS
# ==============================================

@app.get("/api/sync/areas")
async def sync_areas():
   try:
       async with WyscoutClient(settings.WYSCOUT_USERNAME, settings.WYSCOUT_PASSWORD) as wyscout:
           areas_data = await wyscout.get_areas()
           
           return {
               "message": f"Found {len(areas_data)} areas from Wyscout",
               "areas": areas_data[:10]
           }
           
   except Exception as e:
       logger.error(f"Error syncing areas: {e}")
       raise HTTPException(status_code=500, detail="Sync failed")
   # Agregar estos endpoints al archivo backend/app/main.py
# (agregar después de los endpoints existentes)

async def process_career_data_async(career_raw, wyscout_client):
    """Process career data - Con nombres reales de competiciones"""
    if not career_raw or "career" not in career_raw:
        return []
    
    career_timeline = []
    career_list = career_raw["career"]
    
    # Solo últimas 6 entradas
    recent_entries = career_list[-6:]
    
    for entry in recent_entries:
        if entry.get("appearances", 0) == 0:
            continue
        
        team_id = entry.get("teamId")
        competition_id = entry.get("competitionId")
        season_id = entry.get("seasonId")
        
        # EQUIPO - Una consulta
        team_name = "Equipo Desconocido"
        try:
            if team_id:
                team_data = await wyscout_client.get_team(team_id)
                if team_data:
                    team_name = team_data.get("name", "Equipo Desconocido")
        except:
            pass
        
        # COMPETICIÓN - Usar el sistema que ya funciona
        competition_name = "Liga Desconocida"
        if competition_id:
            if competition_id in competition_cache:
                competition_name = competition_cache[competition_id]
            else:
                try:
                    credentials = f"{settings.WYSCOUT_USERNAME}:{settings.WYSCOUT_PASSWORD}"
                    encoded = base64.b64encode(credentials.encode()).decode()
                    headers = {"Authorization": f"Basic {encoded}"}
                    
                    async with httpx.AsyncClient() as client:
                        response = await client.get(
                            f"https://apirest.wyscout.com/v3/competitions/{competition_id}",
                            headers=headers,
                            timeout=5.0
                        )
                        
                        if response.status_code == 200:
                            comp_data = response.json()
                            competition_name = comp_data.get("name", "Liga Desconocida")
                            competition_cache[competition_id] = competition_name
                except:
                    competition_name = "Liga Desconocida"
        
        # Estimación de temporada
        if season_id and season_id > 190000:
            period = "2024/25"
            season_year = 2024
        elif season_id and season_id > 185000:
            period = "2023/24"
            season_year = 2023
        else:
            period = "2022/23"
            season_year = 2022
        
        timeline_entry = {
            "period": period,
            "season_year": season_year,
            "team_name": team_name,
            "team_city": "",
            "team_country": "",
            "appearances": entry.get("appearances", 0),
            "goals": entry.get("goal", 0),
            "minutes_played": entry.get("minutesPlayed", 0),
            "competition": competition_name,  # <-- AHORA CON NOMBRE REAL
            "avg_minutes_per_game": round(entry.get("minutesPlayed", 0) / max(entry.get("appearances", 1), 1))
        }
        
        career_timeline.append(timeline_entry)

    # Ordenar por año (más reciente primero)
    career_timeline.sort(key=lambda x: x.get("season_year", 0), reverse=True)
    
    return career_timeline


@app.get("/api/player/{player_id}/profile")
async def get_player_profile(player_id: int):
    """Get complete player profile with all data"""
    try:
        async with WyscoutClient(settings.WYSCOUT_USERNAME, settings.WYSCOUT_PASSWORD) as wyscout:
            # Get basic player info
            player = None
            try:
                player = await wyscout.get_player(player_id, details="currentTeam")
                print(f"Player loaded: {player.get('shortName')}")
            except Exception as e:
                print(f"Error getting player {player_id}: {e}")
                player = {"wyId": player_id, "shortName": f"Player {player_id}"}
            
            # Get career data (NEW)
            career_data = None
            try:
                async with httpx.AsyncClient() as client:
                    credentials = f"{settings.WYSCOUT_USERNAME}:{settings.WYSCOUT_PASSWORD}"
                    encoded = base64.b64encode(credentials.encode()).decode()
                    headers = {"Authorization": f"Basic {encoded}"}
                    
                    response = await client.get(
                        f"https://apirest.wyscout.com/v3/players/{player_id}/career",
                        headers=headers,
                        timeout=10.0
                    )
                    
                    if response.status_code == 200:
                        career_raw = response.json()
                        career_data = await process_career_data_async(career_raw, wyscout)
                        print(f"Career loaded: {len(career_data)} teams")
                    else:
                        print(f"Career API error: {response.status_code}")
                        
            except Exception as e:
                print(f"Error getting career: {e}")
            
            # Get transfers
            transfers = None
            try:
                transfers = await wyscout.get_player_transfers(player_id)
                print(f"Transfers loaded: {transfers is not None}")
            except Exception as e:
                print(f"Error getting transfers: {e}")
            
            # Create contract info
            contract_info = None
            if player:
                current_team = player.get("currentTeam", {})
                
                contract_info = {
                    "team": current_team.get("name", "Unknown"),
                    "team_id": current_team.get("wyId"),
                    "contract_expires": player.get("contractExpirationDate", "2025-06-30"),
                    "joined_date": "2023-07-01",
                    "market_value": player.get("marketValue", 50000000),
                    "jersey_number": player.get("jerseyNumber", 10)
                }
                
                print(f"Contract info created: {contract_info}")
            
            # Build complete profile
            profile = {
                "basic_info": player,
                "career": career_data,  # NEW
                "recent_matches": None, 
                "transfers": transfers,
                "contract_info": contract_info
            }
            
            print(f"Returning profile with career: {career_data is not None}")
            return profile
            
    except Exception as e:
        print(f"ERROR GENERAL: {str(e)}")
        return {
            "basic_info": {"wyId": player_id, "shortName": f"Player {player_id}"},
            "career": None,
            "recent_matches": None,
            "transfers": None,
            "contract_info": None
        }
   

@app.get("/api/team/{team_id}/profile")
async def get_team_profile(team_id: int):
   """Get complete team profile with logo and details"""
   try:
       async with WyscoutClient(settings.WYSCOUT_USERNAME, settings.WYSCOUT_PASSWORD) as wyscout:
           # Get basic team info
           team = await wyscout.get_team(team_id)
           
           # Get squad
           try:
               squad = await wyscout.get_team_squad(team_id)
           except:
               squad = None
           
           # Get recent matches
           try:
               matches = await wyscout.get_team_matches(team_id)
           except:
               matches = None
           
           profile = {
               "basic_info": team,
               "squad": squad,
               "recent_matches": matches
           }
           
           return profile
           
   except Exception as e:
       logger.error(f"Error getting team profile: {e}")
       raise HTTPException(status_code=500, detail="Failed to get team profile")

@app.get("/api/player/{player_id}/recent-matches")
async def get_player_recent_matches(player_id: int, limit: int = 50):
    """Get recent matches for a player"""
    try:
        async with WyscoutClient(settings.WYSCOUT_USERNAME, settings.WYSCOUT_PASSWORD) as wyscout:
            matches = await wyscout.get_player_matches(player_id)
            
            # Debug: ver qué datos llegan
            logger.info(f"Raw matches data for player {player_id}: Found {len(matches.get('matches', []))} matches")
            
            # Procesar los partidos para formato más simple
            formatted_matches = []
            if matches and isinstance(matches, dict):
                matches_list = matches.get("matches", [])
            elif isinstance(matches, list):
                matches_list = matches
            else:
                matches_list = []
            
            for match in matches_list[:limit]:
                # Extraer información del campo 'label' que tiene el formato: "Equipo1 - Equipo2, X-Y"
                match_id = match.get("matchId", 0)
                date = match.get("date", "")
                label = match.get("label", "")
                
                # Formatear fecha para que sea compatible
                if date and " " in date:
                    formatted_date = date.split(" ")[0]  # Solo la fecha, sin hora
                else:
                    formatted_date = date or "2025-07-29"
                
                # Extraer información del label
                home_team = "Unknown"
                away_team = "Unknown"
                result = "0-0"
                
                if label:
                    try:
                        # Formato esperado: "Equipo1 - Equipo2, X-Y"
                        if ", " in label:
                            teams_part, score_part = label.split(", ")
                            result = score_part
                            
                            if " - " in teams_part:
                                home_team, away_team = teams_part.split(" - ")
                    except:
                        pass  # Si falla el parsing, mantener valores por defecto
                
                # Obtener competición por ID (mapeo básico)
# Obtener competición con cache automático
                competition_id = match.get("competitionId", 0)
                competition_name = "Unknown"
                
                if competition_id:
                    # Verificar si ya está en cache
                    if competition_id in competition_cache:
                        competition_name = competition_cache[competition_id]
                    else:
                        # Si no está en cache, obtenerlo de Wyscout
                        try:
                            credentials = f"{settings.WYSCOUT_USERNAME}:{settings.WYSCOUT_PASSWORD}"
                            encoded = base64.b64encode(credentials.encode()).decode()
                            headers = {"Authorization": f"Basic {encoded}"}
                            
                            async with httpx.AsyncClient() as client:
                                response = await client.get(
                                    f"https://apirest.wyscout.com/v3/competitions/{competition_id}",
                                    headers=headers,
                                    timeout=5.0
                                )
                                
                                if response.status_code == 200:
                                    comp_data = response.json()
                                    competition_name = comp_data.get("name", f"Liga {competition_id}")
                                    # Guardar en cache
                                    competition_cache[competition_id] = competition_name
                                    logger.info(f"✅ Nueva competición: {competition_name}")
                                else:
                                    competition_name = f"Liga {competition_id}"
                                    competition_cache[competition_id] = competition_name
                                    
                        except Exception as e:
                            logger.warning(f"❌ Error obteniendo competición {competition_id}: {e}")
                            competition_name = f"Liga {competition_id}"
                            competition_cache[competition_id] = competition_name
                
                # Extraer scores del resultado
                home_score = 0
                away_score = 0
                if "-" in result:
                    try:
                        scores = result.split("-")
                        home_score = int(scores[0])
                        away_score = int(scores[1])
                    except:
                        pass
                
                formatted_match = {
                    "match_id": match_id,
                    "date": formatted_date,
                    "competition": competition_name,
                    "home_team": home_team,
                    "away_team": away_team,
                    "home_score": home_score,
                    "away_score": away_score,
                    "result": result,
                    "minutes_played": 90,  # Por defecto
                    "player_team": "home",  # Por defecto
                    "description": f"{home_team} vs {away_team} ({result})"
                }
                
                logger.info(f"Formatted match: {formatted_match['description']}")
                formatted_matches.append(formatted_match)
            
            logger.info(f"Returning {len(formatted_matches)} formatted matches")
            return formatted_matches
            
    except Exception as e:
        logger.error(f"Error getting player matches: {e}")
        return [
            {
                "match_id": 1,
                "date": "2025-07-29",
                "competition": "La Liga",
                "home_team": "Barcelona",
                "away_team": "Real Madrid",
                "home_score": 2,
                "away_score": 1,
                "result": "2-1",
                "minutes_played": 90,
                "description": "Barcelona vs Real Madrid (2-1)",
                "player_team": "home"
            }
        ]
    
# ========== ENDPOINTS PARA JUGADORES MANUALES ==========

from typing import Optional, Dict, Any
from datetime import datetime
import uuid

class ManualPlayerCreate(BaseModel):
    firstName: str
    lastName: str
    birthDate: str
    birthArea: str
    passportArea: Optional[str] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    foot: Optional[str] = "right"
    position: str
    currentTeamName: Optional[str] = None
    currentTeamArea: Optional[str] = None
    contractExpiration: Optional[str] = None
    marketValue: Optional[float] = None
    agent: Optional[str] = None
    imageUrl: Optional[str] = None
    notes: Optional[str] = None

@app.post("/api/players/manual")
async def create_manual_player(player_data: ManualPlayerCreate):
    """Crear un jugador manualmente"""
    try:
        # Generar ID único
        manual_player_id = str(uuid.uuid4())
        
        # Calcular edad
        birth_date = datetime.strptime(player_data.birthDate, "%Y-%m-%d")
        age = (datetime.now() - birth_date).days // 365
        
        # Preparar datos
        player_insert = {
            "manual_id": manual_player_id,
            "wyscout_id": None,
            "first_name": player_data.firstName,
            "last_name": player_data.lastName,
            "name": f"{player_data.firstName} {player_data.lastName}",
            "birth_date": player_data.birthDate,
            "birth_area": player_data.birthArea,
            "passport_area": player_data.passportArea or player_data.birthArea,
            "age": age,
            "height": player_data.height,
            "weight": player_data.weight,
            "foot": player_data.foot,
            "position": player_data.position,
            "current_team_name": player_data.currentTeamName,
            "current_team_area": player_data.currentTeamArea,
            "contract_expiration": player_data.contractExpiration,
            "market_value": player_data.marketValue,
            "agent": player_data.agent,
            "image_url": player_data.imageUrl or "/default-player.png",
            "notes": player_data.notes,
            "source": "manual",
            "manually_created": True,
            "created_at": datetime.now().isoformat()
        }
        
        # Insertar en Supabase
        result = supabase.table("players").insert(player_insert).execute()
        
        if result.data:
            return {
                "success": True,
                "message": "Jugador creado exitosamente",
                "player_id": result.data[0]["id"]
            }
        else:
            raise HTTPException(status_code=400, detail="Error al crear jugador")
            
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/api/players/manual")
async def get_manual_players(current_user: dict = Depends(get_current_user)):
    """Obtener jugadores creados manualmente"""
    try:
        # Obtener el club_id del usuario
        club_id = current_user.get('club_id')
        
        # Query base
        query = supabase.table("players").select("*").eq('manually_created', True)
        
        # Si el usuario tiene club_id, filtrar por ese club
        if club_id:
            query = query.eq('organization_id', club_id)
        
        # Ejecutar query
        result = query.execute()
        
        return result.data or []
        
    except Exception as e:
        print(f"Error getting manual players: {str(e)}")
        return []


@app.get("/api/players/manual/filters")
async def get_manual_players_filters(current_user: dict = Depends(get_current_user)):
    """Obtener opciones únicas para filtros"""
    try:
        club_id = current_user.get('club_id')
        
        # Query base
        query = supabase.table("players").select("current_team_name, passport_area, position").eq('manually_created', True)
        
        if club_id:
            query = query.eq('organization_id', club_id)
        
        result = query.execute()
        
        # Extraer valores únicos
        teams = set()
        countries = set()
        positions = set()
        
        for player in result.data or []:
            if player.get('current_team_name'):
                teams.add(player['current_team_name'])
            if player.get('passport_area'):
                countries.add(player['passport_area'])
            if player.get('position'):
                positions.add(player['position'])
        
        return {
            "teams": sorted(list(teams)),
            "countries": sorted(list(countries)),
            "positions": sorted(list(positions))
        }
        
    except Exception as e:
        print(f"Error getting filter options: {str(e)}")
        return {"teams": [], "countries": [], "positions": []}
    


# ========== ENDPOINTS PARA SISTEMA DE MERCADOS ==========

@app.get("/api/markets")
async def get_markets(current_user: dict = Depends(get_current_user)):
    """Obtener mercados según permisos del usuario"""
    try:
        if current_user["role"] in ["admin", "head_scout"]:
            # Admin y Head Scout ven TODOS los mercados del club
            query = supabase.table('markets').select("*").eq('club_id', current_user['club_id']).order('created_at', desc=True)
        else:
            # Scout y Viewer solo ven mercados que ELLOS crearon
            query = supabase.table('markets').select("*").eq('created_by', current_user['id']).order('created_at', desc=True)
        
        result = query.execute()
        return result.data or []
    except Exception as e:
        logger.error(f"Error getting markets: {e}")
        return []

@app.post("/api/markets")
async def create_market(market_data: dict, current_user: dict = Depends(get_current_user)):
    """Crear nuevo mercado"""
    try:
        market_data['club_id'] = current_user.get('club_id')
        market_data['created_by'] = current_user['id']
        result = supabase.table('markets').insert(market_data).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        logger.error(f"Error creating market: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/markets/{market_id}/players")
async def get_market_players(market_id: str, current_user: dict = Depends(get_current_user)):
    """Obtener jugadores de un mercado"""
    try:
        result = supabase.table('market_players').select("*").eq('market_id', market_id).execute()
        return result.data or []
    except Exception as e:
        logger.error(f"Error getting market players: {e}")
        return []

@app.post("/api/markets/{market_id}/players")
async def add_player_to_market(market_id: str, player_data: dict, current_user: dict = Depends(get_current_user)):
    """Agregar jugador a mercado"""
    try:
        player_data['market_id'] = market_id
        player_data['added_by'] = current_user['id']
        result = supabase.table('market_players').insert(player_data).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        logger.error(f"Error adding player to market: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/api/markets/players/{player_id}")
async def update_market_player_status(player_id: str, update_data: dict, current_user: dict = Depends(get_current_user)):
    """Actualizar estado de jugador en mercado"""
    try:
        result = supabase.table('market_players').update(update_data).eq('id', player_id).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        logger.error(f"Error updating market player: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.patch("/api/markets/{market_id}")
async def update_market(market_id: str, update_data: dict, current_user: dict = Depends(get_current_user)):
    """Actualizar mercado """
    try:
        result = supabase.table('markets').update(update_data).eq('id', market_id).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        logger.error(f"Error updating market: {e}")
        raise HTTPException(status_code=500, detail=str(e))    
    

# ========== ENDPOINT PARA JUGADORES MANUALES ==========
@app.get("/api/manual-players")
async def get_manual_players(current_user: dict = Depends(get_current_user)):
    """Obtener todos los jugadores manuales del club"""
    try:
        club_id = current_user.get('club_id')
        query = supabase.table('manual_players').select("*").eq('club_id', club_id).order('created_at', desc=True)
        result = query.execute()
        return result.data or []
    except Exception as e:
        logger.error(f"Error getting manual players: {e}")
        return []

@app.get("/api/wyscout/player/{player_id}")
async def get_wyscout_player_details(player_id: str, current_user: dict = Depends(get_current_user)):
    """Obtener detalles de un jugador específico de Wyscout"""
    try:
        wyscout_headers = {
            'Authorization': 'Basic ' + base64.b64encode(f'{WYSCOUT_USERNAME}:{WYSCOUT_PASSWORD}'.encode()).decode()
        }
        
        response = requests.get(
            f'https://apirest.wyscout.com/v3/players/{player_id}',
            headers=wyscout_headers
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return {}
            
    except Exception as e:
        logger.error(f"Error getting player details: {e}")
        return {}
    


# Endpoints para Player Profiles
# Endpoints para Player Profiles
@app.get("/api/player-profiles")
async def get_player_profiles(current_user: dict = Depends(get_current_user)):
    try:
        if current_user["role"] in ["admin", "head_scout"]:
            # Admin y Head Scout ven TODOS los perfiles del club
            response = supabase.table("player_profiles")\
                .select("*")\
                .eq("club_id", current_user["club_id"])\
                .execute()
        else:
            # Scout y Viewer solo ven SUS PROPIOS perfiles
            response = supabase.table("player_profiles")\
                .select("*")\
                .eq("created_by", current_user["id"])\
                .execute()
        
        return response.data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/api/player-profiles")
async def create_player_profile(profile_data: dict, current_user: dict = Depends(get_current_user)):
    try:
        # Si es un jugador manual, crear primero en la tabla players si no existe
        player_id = None
        if not profile_data.get("wyscout_id"):
            # Es jugador manual, buscar o crear en tabla players
            player_check = supabase.table("players").select("id").eq("name", profile_data["player_name"]).execute()
            
            if player_check.data:
                player_id = player_check.data[0]["id"]
            else:
                # Crear jugador manual
                new_player = {
                    "name": profile_data["player_name"],
                    "position": profile_data.get("position"),
                    "age": profile_data.get("age"),
                    "current_team_name": profile_data.get("current_team"),
                    "passport_area": profile_data.get("nationality"),
                    "height": profile_data.get("height"),
                    "weight": profile_data.get("weight"),
                    "foot": profile_data.get("foot"),
                    "image_url": profile_data.get("image_url"),
                    "source": "manual",
                    "manually_created": True,
                    "organization_id": current_user["club_id"]
                }
                
                player_response = supabase.table("players").insert(new_player).execute()
                if player_response.data:
                    player_id = player_response.data[0]["id"]
        
        # Preparar datos para el perfil de scouting
        insert_data = {
            "wyscout_id": profile_data.get("wyscout_id"),
            "player_id": player_id,
            "player_name": profile_data["player_name"],
            "position": profile_data.get("position"),
            "current_team": profile_data.get("current_team") or profile_data.get("currentTeam"),
            "age": profile_data.get("age"),
            "nationality": profile_data.get("nationality"),
            "height": profile_data.get("height"),
            "weight": profile_data.get("weight"),
            "foot": profile_data.get("foot"),
            "image_url": profile_data.get("image_url") or profile_data.get("imageUrl"),
            "position_analysis": profile_data["position_analysis"],
            "general_info": profile_data.get("general_info"),
            "strengths": profile_data.get("strengths"),
            "weaknesses": profile_data.get("weaknesses"),
            "agent_name": profile_data.get("agent_name"),
            "agent_contact": profile_data.get("agent_contact"),
            "video_link": profile_data.get("video_link"),
            "transfermarkt_link": profile_data.get("transfermarkt_link"),
            "club_id": current_user["club_id"],
            "created_by": current_user["id"],
            "updated_by": current_user["id"],
            "created_by_name": current_user["name"],
            "updated_by_name": current_user["name"]
        }
        
        response = supabase.table("player_profiles").insert(insert_data).execute()
        
        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=400, detail="Failed to create player profile")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating player profile: {str(e)}")

@app.put("/api/player-profiles/{profile_id}")
async def update_player_profile(profile_id: str, profile_data: dict, current_user: dict = Depends(get_current_user)):
    try:
        # Preparar datos para actualización
        update_data = {
            "player_name": profile_data["player_name"],
            "position": profile_data.get("position"),
            "current_team": profile_data.get("current_team") or profile_data.get("currentTeam"),
            "age": profile_data.get("age"),
            "nationality": profile_data.get("nationality"),
            "height": profile_data.get("height"),
            "weight": profile_data.get("weight"),
            "foot": profile_data.get("foot"),
            "image_url": profile_data.get("image_url") or profile_data.get("imageUrl"),
            "position_analysis": profile_data["position_analysis"],
            "general_info": profile_data.get("general_info"),
            "strengths": profile_data.get("strengths"),
            "weaknesses": profile_data.get("weaknesses"),
            "agent_name": profile_data.get("agent_name"),
            "agent_contact": profile_data.get("agent_contact"),
            "video_link": profile_data.get("video_link"),
            "transfermarkt_link": profile_data.get("transfermarkt_link"),
            "updated_by": current_user["id"],
            "updated_by_name": current_user["name"],
            "updated_at": "NOW()"
        }
        
        response = supabase.table("player_profiles").update(update_data).eq("id", profile_id).eq("club_id", current_user["club_id"]).execute()
        
        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=404, detail="Player profile not found")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating player profile: {str(e)}")

@app.delete("/api/player-profiles/{profile_id}")
async def delete_player_profile(profile_id: str, current_user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("player_profiles").delete().eq("id", profile_id).eq("club_id", current_user["club_id"]).execute()
        
        if response.data:
            return {"message": "Player profile deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Player profile not found")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting player profile: {str(e)}")

if __name__ == "__main__":
   import uvicorn
   uvicorn.run(app, host="0.0.0.0", port=8000)