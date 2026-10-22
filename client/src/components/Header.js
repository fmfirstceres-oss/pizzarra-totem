import React from 'react';
import './Header.css';

const Header = ({ ultimaActualizacion, onActualizar, loading, onToggleFullScreen, onToggleDarkMode }) => {
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-title">
          <h1>🎲 Resultados de Loterías Argentinas</h1>
          <p>Quinielas, Quini 6 y Telekino en tiempo real</p>
        </div>

        <div className="header-actions">
          {ultimaActualizacion && (
            <span className="update-time">
              ⏱ {formatearFecha(ultimaActualizacion)}
            </span>
          )}

          <div className="header-buttons">
            <button 
              className={`header-btn ${loading ? 'loading' : ''}`} 
              onClick={onActualizar} 
              disabled={loading}
            >
              {loading ? "Actualizando..." : "🔄"}
            </button>

            <button className="header-btn" onClick={onToggleFullScreen}>
              🖥
            </button>

            <button className="header-btn" onClick={onToggleDarkMode}>
              🌙
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
