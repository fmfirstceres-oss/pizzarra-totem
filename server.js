const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

const scraper = require('./scraper/scraper');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// Almacenamiento en memoria para los resultados
let resultados = {
  quinielaNacional: null,
  quinielaMendoza: null,
  quini6: null,
  telekino: null,
  ultimaActualizacion: null
};

// Función para actualizar todos los resultados
async function actualizarResultados() {
  try {
    console.log('Actualizando resultados...');
    
    const [nacional, mendoza, quini6, telekino] = await Promise.all([
      scraper.obtenerQuinielaNacional(),
      scraper.obtenerQuinielaMendoza(),
      scraper.obtenerQuini6(),
      scraper.obtenerTelekino()
    ]);

    resultados = {
      quinielaNacional: nacional,
      quinielaMendoza: mendoza,
      quini6: quini6,
      telekino: telekino,
      ultimaActualizacion: new Date().toISOString()
    };

    console.log('Resultados actualizados correctamente');
  } catch (error) {
    console.error('Error al actualizar resultados:', error);
  }
}

// Actualizar resultados al iniciar el servidor
actualizarResultados();

// Programar actualización automática cada 30 minutos
cron.schedule('*/30 * * * *', () => {
  actualizarResultados();
});

// Rutas API
app.get('/api/resultados', (req, res) => {
  res.json(resultados);
});

app.post('/api/actualizar', async (req, res) => {
  try {
    await actualizarResultados();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/resultados', (req, res) => {
  res.json(resultados);
});

app.get('/api/quiniela-nacional', (req, res) => {
  res.json(resultados.quinielaNacional);
});

app.get('/api/quiniela-mendoza', (req, res) => {
  res.json(resultados.quinielaMendoza);
});

app.get('/api/quini6', (req, res) => {
  res.json(resultados.quini6);
});

app.get('/api/telekino', (req, res) => {
  res.json(resultados.telekino);
});

// Ruta para forzar actualización
app.post('/api/actualizar', async (req, res) => {
  try {
    await actualizarResultados();
    res.json({ mensaje: 'Resultados actualizados correctamente', timestamp: resultados.ultimaActualizacion });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar resultados' });
  }
});

// Servir la aplicación React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});
