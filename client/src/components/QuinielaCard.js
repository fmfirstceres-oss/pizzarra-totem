import React from 'react';
import './QuinielaCard.css';

const QuinielaCard = ({ data, title, color }) => {
  if (!data || data.error) {
    return (
      <div className={`quiniela-card ${color}`}>
        <div className="card-header">
          <h2>{title}</h2>
        </div>
        <div className="card-content">
          <p className="error-message">
            {data?.error || 'No hay datos disponibles'}
          </p>
        </div>
      </div>
    );
  }

  // Función para extraer la descripción del sueño del texto de cabeza
  const extractSuenoDescripcion = (texto) => {
    if (!texto) return '';
    // Buscar el patrón "número - descripción"
    const match = texto.match(/\d{4}\s*-\s*(.+)/);
    return match ? match[1] : '';
  };

  const renderSorteo = (sorteoData, nombreSorteo, textoCompleto = '') => {
    if (!sorteoData || !sorteoData.numeros || sorteoData.numeros.length === 0) {
      return null;
    }

    // Obtener descripción del sueño si existe
    const suenoDescripcion = extractSuenoDescripcion(textoCompleto);

    return (
      <div className="sorteo-section" key={nombreSorteo}>
        <div className="sorteo-header">
          <h3 className="sorteo-title">{nombreSorteo.toUpperCase()}</h3>
          {sorteoData.cabeza && (
            <div className="cabeza-info">
              <span className="cabeza-label">Cabeza:</span>
              <span className="cabeza-numero">{sorteoData.cabeza}</span>
              {suenoDescripcion && (
                <span className="cabeza-descripcion">- {suenoDescripcion}</span>
              )}
            </div>
          )}
        </div>
        
        <div className="numeros-grid">
          {sorteoData.numeros.map((item, index) => (
            <div 
              key={`${nombreSorteo}-${item.sorteo}-${index}`}
              className={`numero-item ${item.sorteo === 1 ? 'cabeza' : ''}`}
            >
              <div className="numero-sorteo">{item.sorteo}°</div>
              <div className="numero-ganador">{item.numero}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Definir el orden y nombres de los sorteos
  const sorteosDisponibles = [
    { key: 'previa', nombre: 'La Previa', textoCompleto: data.sorteos?.previa?.textoCompleto },
    { key: 'primera', nombre: 'La Primera', textoCompleto: data.sorteos?.primera?.textoCompleto },
    { key: 'matutina', nombre: 'Matutina', textoCompleto: data.sorteos?.matutina?.textoCompleto },
    { key: 'vespertina', nombre: 'Vespertina', textoCompleto: data.sorteos?.vespertina?.textoCompleto },
    { key: 'nocturna', nombre: 'Nocturna', textoCompleto: data.sorteos?.nocturna?.textoCompleto }
  ];

  // Filtrar solo los sorteos que tienen datos
  const sorteosConDatos = sorteosDisponibles.filter(sorteo => 
    data.sorteos && 
    data.sorteos[sorteo.key] && 
    data.sorteos[sorteo.key].numeros && 
    data.sorteos[sorteo.key].numeros.length > 0
  );

  return (
    <div className={`quiniela-card ${color}`}>
      <div className="card-header">
        <h2>{title}</h2>
        <span className="card-date">{data.fecha}</span>
      </div>
      <div className="card-content">
        {sorteosConDatos.length > 0 ? (
          <div className="sorteos-container">
            {sorteosConDatos.map(sorteo => 
              renderSorteo(
                data.sorteos[sorteo.key], 
                sorteo.nombre, 
                sorteo.textoCompleto
              )
            )}
          </div>
        ) : (
          <div className="no-data">
            <p>No hay sorteos disponibles en este momento</p>
            <small>Los sorteos se publican según el horario establecido</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuinielaCard;