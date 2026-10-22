import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import QuinielaCard from './components/QuinielaCard';
import Quini6Card from './components/Quini6Card';
import TelekinoCard from './components/TelekinoCard';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const [resultados, setResultados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    obtenerResultados();
    // Actualizar cada 5 minutos
    const interval = setInterval(obtenerResultados, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const obtenerResultados = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/resultados');
      if (!response.ok) {
        throw new Error('Error al obtener los resultados');
      }
      const data = await response.json();
      setResultados(data);
      setUltimaActualizacion(data.ultimaActualizacion);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const actualizarResultados = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/actualizar', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Error al actualizar los resultados');
      }
      await obtenerResultados();
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error("Error al entrar en pantalla completa:", err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.error("Error al salir de pantalla completa:", err);
      });
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle("dark-mode");
  };

  if (loading && !resultados) {
    return (
      <div className={`app ${darkMode ? "dark" : ""}`}>
        <Header />
        <div className="loading-container">
          <LoadingSpinner />
          <p>Cargando resultados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`app ${darkMode ? "dark" : ""}`}>
      <Header 
        ultimaActualizacion={ultimaActualizacion}
        onActualizar={actualizarResultados}
        loading={loading}
        onToggleFullScreen={toggleFullScreen}
        onToggleDarkMode={toggleDarkMode}
      />
      
      <main className="main-content">
        {error && (
          <div className="error-message">
            <p>⚠️ {error}</p>
            <button onClick={obtenerResultados} className="retry-button">
              Reintentar
            </button>
          </div>
        )}

        <div className="results-grid">
          {/* Orden fijo de módulos */}
          <QuinielaCard 
            data={resultados?.quinielaNacional} 
            title="Quiniela Nacional"
            color="blue"
          />

          <QuinielaCard 
            data={resultados?.quinielaMendoza} 
            title="Quiniela Mendoza"
            color="green"
          />

          <Quini6Card 
            data={resultados?.quini6} 
            title="Quini 6"
            color="purple"
          />

          <TelekinoCard 
            data={resultados?.telekino} 
            title="Telekino"
            color="orange"
          />
        </div>

        {loading && (
          <div className="loading-overlay">
            <LoadingSpinner />
            <p>Actualizando...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
