import React from 'react';
import './Quini6Card.css';

const Quini6Card = ({ data, title, color }) => {
  if (!data || data.error) {
    return (
      <div className={`quini6-card ${color}`}>
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

  return (
    <div className={`quini6-card ${color}`}>
      <div className="card-header">
        <h2>{title}</h2>
        <span className="card-date">{data.fecha}</span>
      </div>
      
      <div className="card-content">
        {data.sorteos && data.sorteos.length > 0 ? (
          <div className="sorteos-container">
            {data.sorteos.map((sorteo, index) => (
              <div key={index} className="sorteo-item">
                <div className="sorteo-header">
                  <h3>{sorteo.sorteo}</h3>
                </div>
                
                <div className="numeros-container">
                  {sorteo.numeros && sorteo.numeros.map((numero, numIndex) => (
                    <div key={numIndex} className="numero-bola">
                      {numero}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No hay sorteos disponibles</p>
        )}
      </div>
    </div>
  );
};

export default Quini6Card;
