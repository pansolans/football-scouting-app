import React from 'react';

interface HeaderProps {
  currentClub: {
    primaryColor: string;
    secondaryColor: string;
    logo: string;
    name: string;
  };
  user: any;
  healthStatus: any;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentClub, user, healthStatus, onLogout }) => {
  return (
    <>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50px',
        background: `linear-gradient(135deg, ${currentClub.primaryColor} 0%, ${currentClub.secondaryColor} 50%, ${currentClub.primaryColor} 100%)`,
        zIndex: 0
      }}/>
      
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
                onClick={onLogout}
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
    </>
  );
};

export default Header;