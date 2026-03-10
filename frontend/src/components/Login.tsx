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
      setError('Email o contrasena incorrectos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background stadium image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/images/stadium-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.45,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#060608] via-[#0a0a12] to-[#060608]" style={{ opacity: 0.92 }} />
      <div className="absolute inset-0 bg-pitch-pattern" />

      <div className="relative z-10 card-elevated rounded-2xl p-10 w-full max-w-[420px] glow-accent animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/15 flex items-center justify-center">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-1">
            <span className="text-gradient">SCOUTPRO</span>
          </h2>
          <p className="text-text-muted text-sm">Plataforma de Scouting Profesional</p>
        </div>

        {error && (
          <div className="bg-red-500/15 text-red-400 p-3 rounded-lg mb-5 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="usuario@ejemplo.com"
              className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none placeholder:text-text-muted"
            />
          </div>

          <div className="mb-7">
            <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-2">
              Contrasena
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full p-3 bg-surface border border-border-strong rounded-md text-sm text-text focus:border-accent/50 focus:outline-none placeholder:text-text-muted"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 bg-accent hover:bg-accent-dark text-white rounded-lg text-base font-semibold cursor-pointer transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="mt-7 pt-5 border-t border-border text-center">
          <p className="text-text-muted text-xs">
            © 2025 Sistema de Scouting Profesional
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
