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

  // Extraer la descripción del sueño del texto de cabeza
  const extractSuenoDescripcion = (texto) => {
    if (!texto) return '';
    const match = texto.match(/\d{4}\s*-\s*([^(]+)/);
    return match ? match[1].trim() : '';
  };

  // Formatear según posición: 1° con 4 cifras, 2° al 10° con 3 cifras
  const formatearNumero = (pos, numeroRaw) => {
    if (!numeroRaw) return '';
    const limpio = String(numeroRaw).replace(/\D/g, '');
    if (pos === 1) {
      return limpio.padStart(4, '0').slice(-4);
    }
    return limpio.padStart(3, '0').slice(-3);
  };

  const renderSorteo = (sorteoData, nombreSorteo, textoCompleto = '') => {
    if (!sorteoData || !sorteoData.numeros || sorteoData.numeros.length === 0) {
      return null;
    }

    const suenoDescripcion =
      sorteoData.descripcion || extractSuenoDescripcion(textoCompleto);

    // Filtrar solo del puesto 1 al 10 y ordenar
    const primerosDiez = sorteoData.numeros
      .filter(item => item.sorteo >= 1 && item.sorteo <= 10)
      .sort((a, b) => a.sorteo - b.sorteo);

    const cabezaNumero = formatearNumero(
      1,
      sorteoData.cabeza || primerosDiez.find(i => i.sorteo === 1)?.numero
    );

    return (
      <div className="sorteo-section" key={nombreSorteo}>
        <div className="sorteo-header">
          <h3 className="sorteo-title">{nombreSorteo.toUpperCase()}</h3>
          {cabezaNumero && (
            <div className="cabeza-banner">
              <span className="cabeza-label">CABEZA (1°):</span>
              <span className="cabeza-numero">{cabezaNumero}</span>
              {suenoDescripcion && (
                <span className="cabeza-descripcion">- {suenoDescripcion}</span>
              )}
            </div>
          )}
        </div>

        <div className="numeros-grid">
          {primerosDiez.map((item, index) => {
            const esCabeza = item.sorteo === 1;
            const numMostrar = formatearNumero(item.sorteo, item.numero);
            return (
              <div
                key={`${nombreSorteo}-${item.sorteo}-${index}`}
                className={`numero-item ${esCabeza ? 'cabeza' : ''}`}
              >
                <span className="numero-sorteo">{item.sorteo}°</span>
                <span className="numero-ganador">{numMostrar}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const sorteosDisponibles = [
    { key: 'previa', nombre: 'La Previa', textoCompleto: data.sorteos?.previa?.textoCompleto },
    { key: 'primera', nombre: 'La Primera', textoCompleto: data.sorteos?.primera?.textoCompleto },
    { key: 'matutina', nombre: 'Matutina', textoCompleto: data.sorteos?.matutina?.textoCompleto },
    { key: 'vespertina', nombre: 'Vespertina', textoCompleto: data.sorteos?.vespertina?.textoCompleto },
    { key: 'nocturna', nombre: 'Nocturna', textoCompleto: data.sorteos?.nocturna?.textoCompleto }
  ];

  const sorteosConDatos = sorteosDisponibles.filter(
    sorteo =>
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
