import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import QuinielaCard from './components/QuinielaCard';
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
        console.error('Error al entrar en pantalla completa:', err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.error('Error al salir de pantalla completa:', err);
      });
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };

  if (loading && !resultados) {
    return (
      <div className={`app ${darkMode ? 'dark' : ''}`}>
        <Header />
        <div className="loading-container">
          <LoadingSpinner />
          <p>Cargando resultados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
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

        {/* Diseño de 3 columnas verticales una al lado de la otra */}
        <div className="results-grid">
          <QuinielaCard
            data={resultados?.quinielaSantaFe}
            title="Quiniela Santa Fe"
            color="green"
          />

          <QuinielaCard
            data={resultados?.quinielaBuenosAires}
            title="Quiniela Provincia Bs. As."
            color="purple"
          />

          <QuinielaCard
            data={resultados?.quinielaNacional}
            title="Quiniela Nacional"
            color="blue"
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
