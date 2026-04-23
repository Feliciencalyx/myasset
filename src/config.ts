// Dynamic API Base URL detection
// This ensures that cookies work whether you use localhost, 127.0.0.1 or your network IP
export const API_BASE = import.meta.env.PROD 
  ? '' 
  : `http://${window.location.hostname}:3001`;
