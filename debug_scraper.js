const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

class DebugScraper {
  constructor() {
    this.baseUrl = 'https://quinieleando.com.ar';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    };
  }

  async obtenerPagina(url) {
    try {
      const response = await axios.get(url, { 
        headers: this.headers,
        timeout: 15000
      });
      return { html: response.data, $: cheerio.load(response.data) };
    } catch (error) {
      console.error(`Error al obtener ${url}:`, error.message);
      throw error;
    }
  }

  async debugMendoza() {
    try {
      console.log('=== DEBUG MENDOZA ===');
      const { html, $ } = await this.obtenerPagina(`${this.baseUrl}/quinielas/mendoza`);
      
      // Buscar todos los números de 4 dígitos
      console.log('\n=== NÚMEROS DE 4 DÍGITOS ENCONTRADOS ===');
      const numerosEncontrados = html.match(/\b\d{4}\b/g);
      if (numerosEncontrados) {
        console.log('Números:', numerosEncontrados);
      }

      // Buscar tablas
      console.log('\n=== TABLAS ENCONTRADAS ===');
      $('table').each((index, table) => {
        const $table = $(table);
        console.log(`\nTabla ${index + 1}:`);
        
        $table.find('tr').each((rowIndex, row) => {
          const $row = $(row);
          const texto = $row.text().trim();
          if (texto) {
            console.log(`  Fila ${rowIndex + 1}: ${texto}`);
          }
        });
      });

      return { mensaje: 'Debug completado' };
    } catch (error) {
      console.error('Error en debug:', error);
      return { error: error.message };
    }
  }
}

const debugScraper = new DebugScraper();

if (require.main === module) {
  debugScraper.debugMendoza().then(console.log);
}

module.exports = debugScraper;
