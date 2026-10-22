import React, { useState, useEffect } from 'react';
import './TVMode.css';

const TVMode = ({ children }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentView, setCurrentView] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  // Función para entrar en pantalla completa
  const enterFullscreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
    setIsFullscreen(true);
  };

  // Función para salir de pantalla completa
  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    setIsFullscreen(false);
  };

  // Detectar cambios en pantalla completa
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Rotación automática cada 30 segundos
  useEffect(() => {
    if (!isAutoRotating) return;

    const interval = setInterval(() => {
      setCurrentView(prev => (prev + 1) % 4); // 4 vistas: todas, quinielas, quini6, telekino
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [isAutoRotating]);

  // Función para alternar rotación automática
  const toggleAutoRotate = () => {
    setIsAutoRotating(!isAutoRotating);
  };

  // Función para cambiar vista manualmente
  const changeView = (viewIndex) => {
    setCurrentView(viewIndex);
    setIsAutoRotating(false); // Detener rotación automática al cambio manual
  };

  return (
    <div className="tv-mode">
      {/* Controles de TV */}
      <div className="tv-controls">
        <button 
          className="control-button fullscreen-button"
          onClick={isFullscreen ? exitFullscreen : enterFullscreen}
          title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
        >
          {isFullscreen ? "⤓" : "⤢"}
        </button>
        
        <button 
          className={`control-button auto-rotate-button ${isAutoRotating ? 'active' : ''}`}
          onClick={toggleAutoRotate}
          title="Rotación automática"
        >
          🔄
        </button>

        <div className="view-selector">
          <button 
            className={`view-button ${currentView === 0 ? 'active' : ''}`}
            onClick={() => changeView(0)}
            title="Todas las loterías"
          >
            🎲 Todas
          </button>
          <button 
            className={`view-button ${currentView === 1 ? 'active' : ''}`}
            onClick={() => changeView(1)}
            title="Solo Quinielas"
          >
            🎯 Quinielas
          </button>
          <button 
            className={`view-button ${currentView === 2 ? 'active' : ''}`}
            onClick={() => changeView(2)}
            title="Solo Quini 6"
          >
            🎰 Quini 6
          </button>
          <button 
            className={`view-button ${currentView === 3 ? 'active' : ''}`}
            onClick={() => changeView(3)}
            title="Solo Telekino"
          >
            📺 Telekino
          </button>
        </div>
      </div>

      {/* Indicador de estado */}
      <div className="tv-status">
        <div className="status-indicator">
          <span className="status-dot"></span>
          <span>EN VIVO</span>
        </div>
        {isAutoRotating && (
          <div className="rotation-indicator">
            <span>Rotación automática activa</span>
            <div className="rotation-progress"></div>
          </div>
        )}
      </div>

      {/* Contenido con filtro de vista */}
      <div className={`tv-content view-${currentView}`}>
        {children}
      </div>
    </div>
  );
};

export default TVMode;
