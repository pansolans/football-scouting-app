from supabase import create_client, Client
from typing import List, Optional
import os
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class SupabaseService:
    def __init__(self):
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        
        if not url or not key:
            raise ValueError("Supabase credentials not configured")
        
        try:
            self.client: Client = create_client(url, key)
            logger.info("✅ Cliente Supabase creado exitosamente")
        except Exception as e:
            logger.error(f"❌ Error creando cliente Supabase: {e}")
            raise
    
    def create_report(self, report_data: dict) -> dict:
        """Crear reporte en Supabase"""
        try:
            if 'created_at' not in report_data:
                report_data['created_at'] = datetime.now().isoformat()
            
            logger.info(f"Guardando reporte para: {report_data.get('player_name', 'Unknown')}")
            response = self.client.table('scout_reports').insert(report_data).execute()
            logger.info(f"✅ Reporte guardado exitosamente")
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"❌ Error guardando en Supabase: {str(e)}")
            raise
    
    def get_all_reports(self) -> List[dict]:
        """Obtener todos los reportes"""
        try:
            response = self.client.table('scout_reports').select("*").order('created_at', desc=True).execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Error obteniendo reportes: {e}")
            return []
    
    def get_reports_by_player(self, player_name: str) -> List[dict]:
        """Obtener reportes de un jugador específico"""
        try:
            response = self.client.table('scout_reports').select("*").eq('player_name', player_name).execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Error obteniendo reportes del jugador {player_name}: {e}")
            return []
    
    def update_report(self, report_id: str, updates: dict) -> dict:
        """Actualizar un reporte"""
        try:
            updates['updated_at'] = datetime.now().isoformat()
            response = self.client.table('scout_reports').update(updates).eq('id', report_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error actualizando reporte {report_id}: {e}")
            raise
    
    def delete_report(self, report_id: str) -> bool:
        """Eliminar un reporte"""
        try:
            response = self.client.table('scout_reports').delete().eq('id', report_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error eliminando reporte {report_id}: {e}")
            return False