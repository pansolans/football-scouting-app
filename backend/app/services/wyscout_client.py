import asyncio
import base64
import httpx
from datetime import datetime
from typing import Dict, List, Optional, Any
import logging

logger = logging.getLogger(__name__)

class WyscoutError(Exception):
    def __init__(self, message: str, status_code: int = None):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class WyscoutClient:
    def __init__(self, username: str, password: str, base_url: str = "https://apirest.wyscout.com"):
        self.username = username
        self.password = password
        self.base_url = base_url.rstrip('/')
        
        # Create Basic Auth header
        credentials = f"{username}:{password}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        
        self.headers = {
            "Authorization": f"Basic {encoded_credentials}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    async def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        url = f"{self.base_url}{endpoint}"
        
        try:
            response = await self.client.request(
                method=method,
                url=url,
                headers=self.headers,
                **kwargs
            )
            
            if response.status_code >= 400:
                raise WyscoutError(
                    f"API request failed: {response.status_code} - {response.text}",
                    status_code=response.status_code
                )
            
            return response.json()
            
        except httpx.RequestError as e:
            raise WyscoutError(f"Request failed: {str(e)}")
    
    async def get(self, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        return await self._make_request("GET", endpoint, params=params)
    
    # ==============================================
    # AREAS
    # ==============================================
    
    async def get_areas(self) -> List[Dict[str, Any]]:
        response = await self.get("/v3/areas")
        if isinstance(response, list):
            return response
        return response.get("areas", [])
    
    # ==============================================
    # SEARCH
    # ==============================================
    
    async def search_players(self, query: str, gender: Optional[str] = None) -> List[Dict[str, Any]]:
        params = {"query": query, "objType": "player"}
        if gender:
            params["gender"] = gender
        
        response = await self.get("/v3/search", params=params)
        
        if isinstance(response, list):
            return response
        else:
            return response.get("players", response.get("data", []))
    
    async def search_teams(self, query: str, gender: Optional[str] = None) -> List[Dict[str, Any]]:
        params = {"query": query, "objType": "team"}
        if gender:
            params["gender"] = gender
        
        response = await self.get("/v3/search", params=params)
        
        if isinstance(response, list):
            return response
        else:
            return response.get("teams", response.get("data", []))
    
    # ==============================================
    # PLAYERS
    # ==============================================
    
    async def get_player(self, player_id: int, details: Optional[str] = None) -> Dict[str, Any]:
        params = {}
        if details:
            params["details"] = details
        return await self.get(f"/v3/players/{player_id}", params=params)
    
    async def get_player_matches(self, player_id: int) -> Dict[str, Any]:
        return await self.get(f"/v3/players/{player_id}/matches")
    
    async def get_player_career(self, player_id: int) -> Dict[str, Any]:
        return await self.get(f"/v3/players/{player_id}/career")
    
    async def get_player_transfers(self, player_id: int) -> Dict[str, Any]:
        return await self.get(f"/v3/players/{player_id}/transfers")
    
    # ==============================================
    # COMPETITIONS
    # ==============================================
    
    async def get_competitions(self, area_id: str) -> Dict[str, Any]:
        params = {"areaId": area_id}
        return await self.get("/v3/competitions", params=params)
    
    async def get_competition_matches(self, competition_id: int) -> Dict[str, Any]:
        return await self.get(f"/v3/competitions/{competition_id}/matches")
    
    async def get_competition_teams(self, competition_id: int) -> Dict[str, Any]:
        return await self.get(f"/v3/competitions/{competition_id}/teams")
    
    async def get_competition_players(self, competition_id: int) -> Dict[str, Any]:
        return await self.get(f"/v3/competitions/{competition_id}/players")
    
    # ==============================================
    # TEAMS
    # ==============================================
    
    async def get_team(self, team_id: int) -> Dict[str, Any]:
        return await self.get(f"/v3/teams/{team_id}")
    
    async def get_team_matches(self, team_id: int) -> Dict[str, Any]:
        return await self.get(f"/v3/teams/{team_id}/matches")
    
    async def get_team_squad(self, team_id: int) -> Dict[str, Any]:
        return await self.get(f"/v3/teams/{team_id}/squad")
    
    async def get_team_career(self, team_id: int) -> Dict[str, Any]:
        return await self.get(f"/v3/teams/{team_id}/career")
    
    # ==============================================
    # MATCHES
    # ==============================================
    
    async def get_match(self, match_id: int, details: Optional[str] = None) -> Dict[str, Any]:
        params = {}
        if details:
            params["details"] = details
        return await self.get(f"/v3/matches/{match_id}", params=params)
    
    async def get_match_players(self, match_id: int) -> Dict[str, Any]:
        return await self.get(f"/v3/matches/{match_id}", params={"details": "players"})
    
    async def get_match_formations(self, match_id: int) -> Dict[str, Any]:
        return await self.get(f"/v3/matches/{match_id}/formations")
    
    # ==============================================
    # SEASONS
    # ==============================================
    
    async def get_season_matches(self, season_id: int) -> Dict[str, Any]:
        return await self.get(f"/v3/seasons/{season_id}/matches")
    
    async def get_season_players(self, season_id: int) -> Dict[str, Any]:
        return await self.get(f"/v3/seasons/{season_id}/players")
    
    async def get_season_teams(self, season_id: int) -> Dict[str, Any]:
        return await self.get(f"/v3/seasons/{season_id}/teams")
    
    # ==============================================
    # ADVANCED STATS
    # ==============================================
    
    async def get_player_advanced_stats(self, player_id: int) -> Dict[str, Any]:
        return await self.get(f"/v3/players/{player_id}/advancedstats")
    
    async def get_team_advanced_stats(self, team_id: int) -> Dict[str, Any]:
        return await self.get(f"/v3/teams/{team_id}/advancedstats")
    
    async def get_match_advanced_stats(self, match_id: int) -> Dict[str, Any]:
        return await self.get(f"/v3/matches/{match_id}/advancedstats")
    
    # ==============================================
    # UTILITY
    # ==============================================
    
    async def test_connection(self) -> bool:
        try:
            await self.get_areas()
            logger.info("Wyscout API connection successful")
            return True
        except WyscoutError as e:
            logger.error(f"Wyscout API connection failed: {e.message}")
            return False