// scraper/scraper.js
const axios = require('axios');
const cheerio = require('cheerio');

class QuinielaScraper {
  constructor() {
    this.baseUrl = 'https://quinieleando.com.ar';
    this.headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };
  }

  async obtenerPagina(url) {
    try {
      const response = await axios.get(url, { headers: this.headers });
      return cheerio.load(response.data);
    } catch (error) {
      console.error(`Error al obtener la página ${url}:`, error.message);
      throw error;
    }
  }

  // Extrae pares (posición, número) leyendo td de a pares dentro de cada <tr>
  _parseTablaPorPares($, $table) {
    const resultados = [];
    if (!$table || $table.length === 0) return resultados;

    $table.find('tbody tr').each((i, fila) => {
      const $cells = $(fila).find('td');
      // Recorremos las celdas de 2 en 2: [pos, numero, pos, numero, ...]
      for (let j = 0; j < $cells.length; j += 2) {
        const posText = $($cells[j]).text().trim();
        const numCell = $cells[j + 1] ? $cells[j + 1] : null;
        const numText = numCell ? $(numCell).text().trim() : '';
        const pos = parseInt(posText, 10);
        
        // Buscar número, puede tener formato con <b> para la cabeza
        let numero = null;
        if (numCell) {
          // Primero intentar extraer de <b> (cabeza)
          const boldText = $(numCell).find('b').text().trim();
          if (boldText) {
            numero = boldText;
          } else {
            // Si no hay <b>, extraer el texto completo
            numero = $(numCell).text().trim();
          }
        }

        // Limpiar y formatear número
        const match = numero ? numero.match(/\d{1,4}/) : null;
        const numeroFormateado = match ? match[0].padStart(4, '0') : null;
        
        if (!isNaN(pos) && numeroFormateado) {
          resultados.push({ sorteo: pos, numero: numeroFormateado });
        }
      }
    });

    return resultados;
  }

  // Extrae información de cabeza incluyendo descripción del sueño
  _extraerInfoCabeza($, $table) {
    const thead = $table.find('thead');
    const textoCompleto = thead.text().trim();
    
    // Buscar patrón "Cabeza: XXXX - Descripción"
    const cabezaMatch = textoCompleto.match(/Cabeza:\s*(\d{4})\s*-\s*([^(]+)/i);
    
    if (cabezaMatch) {
      return {
        numero: cabezaMatch[1],
        descripcion: cabezaMatch[2].trim(),
        textoCompleto: textoCompleto
      };
    }
    
    return null;
  }

  async _obtenerQuinielaGenerica(pathUrl, nombreDisplay) {
    try {
      const $ = await this.obtenerPagina(`${this.baseUrl}${pathUrl}`);

      const resultados = {
        nombre: nombreDisplay,
        fecha: this.obtenerFecha(),
        sorteos: {
          previa: { cabeza: null, numeros: [], textoCompleto: '' },
          primera: { cabeza: null, numeros: [], textoCompleto: '' },
          matutina: { cabeza: null, numeros: [], textoCompleto: '' },
          vespertina: { cabeza: null, numeros: [], textoCompleto: '' },
          nocturna: { cabeza: null, numeros: [], textoCompleto: '' }
        }
      };

      // Recorremos cada tabla y vemos su heading (thead h3) para asignarla
      $('table').each((i, table) => {
        const $table = $(table);
        const heading = $table.find('thead h3').text().toLowerCase();
        
        let tipo = null;
        if (heading.includes('previa')) tipo = 'previa';
        else if (heading.includes('primera')) tipo = 'primera';
        else if (heading.includes('matutina')) tipo = 'matutina';
        else if (heading.includes('vespertina')) tipo = 'vespertina';
        else if (heading.includes('nocturna')) tipo = 'nocturna';

        if (tipo) {
          // Extraer información de cabeza
          const infoCabeza = this._extraerInfoCabeza($, $table);
          
          // Extraer números
          const pares = this._parseTablaPorPares($, $table);
          
          if (pares && pares.length > 0) {
            // Guardar de forma ordenada por posición
            pares.sort((a, b) => a.sorteo - b.sorteo);
            resultados.sorteos[tipo].numeros = pares;
            
            // Usar cabeza de infoCabeza si está disponible, sino buscar en pares
            const cabeza = infoCabeza?.numero || pares.find(p => p.sorteo === 1)?.numero;
            if (cabeza) {
              resultados.sorteos[tipo].cabeza = cabeza;
            }
            
            // Guardar texto completo para descripción de sueños
            if (infoCabeza) {
              resultados.sorteos[tipo].textoCompleto = infoCabeza.textoCompleto;
              resultados.sorteos[tipo].descripcion = infoCabeza.descripcion;
            }
          }
        }
      });

      // Fallback: buscar por encabezados alternativos
      const tipos = ['previa', 'primera', 'matutina', 'vespertina', 'nocturna'];
      for (const t of tipos) {
        if (!resultados.sorteos[t].numeros || resultados.sorteos[t].numeros.length === 0) {
          // Buscar heading alternativo
          const selectorHeading = $(`*:contains("${t.toUpperCase()}")`).filter((i, el) => {
            const txt = $(el).text().toLowerCase();
            return txt.includes(t) && (txt.includes('quiniela') || txt.includes('sorteo'));
          }).first();
          
          if (selectorHeading && selectorHeading.length) {
            const tabla = selectorHeading.closest('table');
            if (tabla.length === 0) {
              // Si no está en tabla, buscar la siguiente tabla
              const nextTable = selectorHeading.nextAll('table').first();
              if (nextTable && nextTable.length) {
                const infoCabeza = this._extraerInfoCabeza($, nextTable);
                const pares = this._parseTablaPorPares($, nextTable);
                
                if (pares.length) {
                  pares.sort((a, b) => a.sorteo - b.sorteo);
                  resultados.sorteos[t].numeros = pares;
                  
                  const cabeza = infoCabeza?.numero || pares.find(p => p.sorteo === 1)?.numero;
                  if (cabeza) {
                    resultados.sorteos[t].cabeza = cabeza;
                  }
                  
                  if (infoCabeza) {
                    resultados.sorteos[t].textoCompleto = infoCabeza.textoCompleto;
                    resultados.sorteos[t].descripcion = infoCabeza.descripcion;
                  }
                }
              }
            }
          }
        }
      }

      return resultados;
    } catch (err) {
      console.error('Error en _obtenerQuinielaGenerica:', err);
      throw err;
    }
  }

  async obtenerQuinielaMendoza() {
    try {
      const res = await this._obtenerQuinielaGenerica('/quinielas/mendoza/resultados-de-hoy', 'Quiniela Mendoza');
      
      // Log para debugging
      console.log('Resultados Quiniela Mendoza:');
      Object.keys(res.sorteos).forEach(tipo => {
        const sorteo = res.sorteos[tipo];
        if (sorteo.numeros.length > 0) {
          console.log(`${tipo.toUpperCase()}: ${sorteo.numeros.length} números, Cabeza: ${sorteo.cabeza}`);
          console.log(`Descripción: ${sorteo.descripcion || 'N/A'}`);
        }
      });
      
      return res;
    } catch (error) {
      console.error('Error al obtener quiniela Mendoza:', error);
      return { error: 'No se pudieron obtener los resultados' };
    }
  }

  async obtenerQuinielaNacional() {
    try {
      const res = await this._obtenerQuinielaGenerica('/quinielas/nacional/resultados-de-hoy', 'Quiniela Nacional');
      return res;
    } catch (error) {
      console.error('Error al obtener quiniela Nacional:', error);
      return { error: 'No se pudieron obtener los resultados' };
    }
  }

  // Mantener las otras funciones (quini6 / telekino) como estaban
  async obtenerQuini6() {
    try {
      const $ = await this.obtenerPagina(`${this.baseUrl}/quini6/resultados/ultimo-sorteo`);
      const resultados = {
        nombre: 'Quini 6',
        fecha: this.obtenerFecha(),
        sorteos: []
      };

      $('.resultado, .numeros, table').each((index, element) => {
        const $section = $(element);
        let texto = $section.text().trim().replace(/\s+/g, ' ');
        const numeros = texto.match(/\b\d{2}\b/g);
        if (numeros && numeros.length === 6) {
          let tipoSorteo = 'Tradicional';
          const contexto = texto.toLowerCase();
          if (contexto.includes('revancha')) tipoSorteo = 'Revancha';
          else if (contexto.includes('siempre sale') || contexto.includes('segunda')) tipoSorteo = 'Siempre Sale';

          resultados.sorteos.push({
            tipo: tipoSorteo,
            numeros: numeros.map(n => parseInt(n, 10)),
            fecha: this.obtenerFecha()
          });
        }
      });

      // fallback por texto si no se encontró
      if (resultados.sorteos.length === 0) {
        const pageText = $('body').text();
        const matches = pageText.match(/(?:tradicional|revancha|siempre sale|segunda vuelta)[^\d]*(\d{2}[\s,]*\d{2}[\s,]*\d{2}[\s,]*\d{2}[\s,]*\d{2}[\s,]*\d{2})/gi);
        if (matches) {
          matches.forEach(match => {
            const tipo = match.toLowerCase().includes('revancha') ? 'Revancha' :
                        match.toLowerCase().includes('siempre sale') || match.toLowerCase().includes('segunda') ? 'Siempre Sale' : 'Tradicional';
            const nums = match.match(/\d{2}/g);
            if (nums && nums.length === 6) {
              resultados.sorteos.push({
                tipo,
                numeros: nums.map(n => parseInt(n, 10)),
                fecha: this.obtenerFecha()
              });
            }
          });
        }
      }

      return resultados;
    } catch (error) {
      console.error('Error obtenerQuini6:', error);
      return { error: 'No disponible', nombre: 'Quini 6', fecha: this.obtenerFecha() };
    }
  }

  async obtenerTelekino() {
    try {
      const $ = await this.obtenerPagina(`${this.baseUrl}/telekino/resultados/ultimo-sorteo`);
      const resultados = { nombre: 'Telekino', fecha: this.obtenerFecha(), sorteos: [] };

      $('.telekino-results, .resultados-telekino, .ultimos-resultados').each((index, container) => {
        const $container = $(container);
        const texto = $container.text().trim().replace(/\s+/g, ' ');
        const numerosMatch = texto.match(/(?:\d{1,2}[\s,]*){15}/g);
        if (numerosMatch) {
          numerosMatch.forEach(match => {
            const numeros = match.match(/\d{1,2}/g);
            if (numeros && numeros.length === 15) {
              resultados.sorteos.push({
                tipo: 'Principal',
                numeros: numeros.map(n => parseInt(n, 10)),
                fecha: this.obtenerFecha()
              });
            }
          });
        }
      });

      if (resultados.sorteos.length === 0) {
        $('table').each((index, table) => {
          const $rows = $(table).find('tr');
          const numerosEnTabla = [];
          $rows.each((i, row) => {
            const $cells = $(row).find('td');
            $cells.each((j, cell) => {
              const numero = $(cell).text().trim().match(/\d{1,2}/);
              if (numero) numerosEnTabla.push(parseInt(numero[0], 10));
            });
          });
          if (numerosEnTabla.length === 15) {
            resultados.sorteos.push({ tipo: 'Principal', numeros: numerosEnTabla, fecha: this.obtenerFecha() });
          }
        });
      }

      if (resultados.sorteos.length === 0) {
        const pageText = $('body').text().replace(/\s+/g, ' ');
        const matches = pageText.match(/(?:\d{1,2}[\s,]*){15}/g);
        if (matches) {
          matches.forEach(match => {
            const numeros = match.match(/\d{1,2}/g);
            if (numeros && numeros.length === 15) {
              resultados.sorteos.push({ tipo: 'Principal', numeros: numeros.map(n => parseInt(n, 10)), fecha: this.obtenerFecha() });
            }
          });
        }
      }

      return resultados;
    } catch (error) {
      console.error('Error al obtener Telekino:', error);
      return { error: 'No se pudieron obtener los resultados' };
    }
  }

  obtenerFecha() {
    return new Date().toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

module.exports = new QuinielaScraper();