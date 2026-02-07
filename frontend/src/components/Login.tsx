import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      window.location.href = '/';
    } catch (err: any) {
      setError('Email o contraseña incorrectos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9FAFB',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '0',
        maxWidth: '900px',
        width: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 20px rgba(0, 0, 0, 0.05)'
      }}>
        {/* Panel izquierdo - Contenido */}
        <div style={{
          background: '#1F2937',
          color: 'white',
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: '500px'
        }}>
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#059669',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              marginBottom: '20px'
            }}>
              ⚽
            </div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              margin: '0 0 12px 0',
              lineHeight: '1.2'
            }}>
              Análisis de Jugadores
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#D1D5DB',
              margin: '0',
              fontWeight: '400'
            }}>
              Plataforma profesional de scouting
            </p>
          </div>

          <div style={{ marginTop: '48px' }}>
            <div style={{
              borderLeft: '3px solid #059669',
              paddingLeft: '16px'
            }}>
              <p style={{
                fontSize: '14px',
                color: '#E5E7EB',
                margin: '0',
                lineHeight: '1.6'
              }}>
                Accede a análisis detallados, reportes de desempeño y evaluaciones de jugadores en tiempo real.
              </p>
            </div>
          </div>
        </div>

        {/* Panel derecho - Formulario */}
        <div style={{
          background: 'white',
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#1F2937',
            margin: '0 0 8px 0'
          }}>
            Bienvenido
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#6B7280',
            margin: '0 0 32px 0'
          }}>
            Inicia sesión en tu cuenta
          </p>

          {error && (
            <div style={{
              background: '#FEE2E2',
              border: '1px solid #FECACA',
              color: '#991B1B',
              padding: '12px 14px',
              borderRadius: '8px',
              marginBottom: '24px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ejemplo@correo.com"
                style={{
                  width: '100%',
                  padding: '11px 13px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  background: '#F9FAFB',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#059669';
                  e.target.style.background = 'white';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#D1D5DB';
                  e.target.style.background = '#F9FAFB';
                }}
              />
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '11px 13px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  background: '#F9FAFB',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#059669';
                  e.target.style.background = 'white';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#D1D5DB';
                  e.target.style.background = '#F9FAFB';
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '11px 16px',
                background: isLoading ? '#9CA3AF' : '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) e.currentTarget.style.background = '#047857';
              }}
              onMouseLeave={(e) => {
                if (!isLoading) e.currentTarget.style.background = '#059669';
              }}
            >
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div style={{
            marginTop: '24px',
            paddingTop: '24px',
            borderTop: '1px solid #E5E7EB',
            textAlign: 'center'
          }}>
            <p style={{
              color: '#9CA3AF',
              fontSize: '12px',
              margin: '0'
            }}>
              © 2025 Plataforma de Scouting Profesional
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
