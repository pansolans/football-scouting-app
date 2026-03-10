export const API_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD
    ? 'https://football-scouting-backend-vd0x.onrender.com'
    : 'http://localhost:8000');
