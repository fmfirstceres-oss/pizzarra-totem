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

  _parseTablaPorPares($, $table) {
    const resultados = [];
    if (!$table || $table.length === 0) return resultados;

    $table.find('tbody tr').each((i, fila) => {
      const $cells = $(fila).find('td');
      for (let j = 0; j < $cells.length; j += 2) {
        const posText = $($cells[j]).text().trim();
        const numCell = $cells[j + 1] ? $cells[j + 1] : null;
        const pos = parseInt(posText, 10);

        let numero = null;
        if (numCell) {
          const boldText = $(numCell).find('b').text().trim();
          numero = boldText ? boldText : $(numCell).text().trim();
        }

        const match = numero ? numero.match(/\d{1,4}/) : null;
        const numeroCuatroCifras = match ? match[0].padStart(4, '0') : null;

        if (!isNaN(pos) && pos >= 1 && pos <= 10 && numeroCuatroCifras) {
          const numeroFormateado =
            pos === 1 ? numeroCuatroCifras : numeroCuatroCifras.slice(-3);
          resultados.push({ sorteo: pos, numero: numeroFormateado });
        }
      }
    });

    return resultados;
  }

  _extraerInfoCabeza($, $table) {
    const thead = $table.find('thead');
    const textoCompleto = thead.text().trim();
    const cabezaMatch = textoCompleto.match(/Cabeza:\s*(\d{4})\s*-\s*([^(]+)/i);

    if (cabezaMatch) {
      return {
        numero: cabezaMatch[1].padStart(4, '0'),
        descripcion: cabezaMatch[2].trim(),
        textoCompleto: textoCompleto
      };
    }

    return null;
  }

  async _extraerSorteosDeUrl(pathUrl, nombreDisplay, fechaTexto) {
    const $ = await this.obtenerPagina(`${this.baseUrl}${pathUrl}`);

    const resultados = {
      nombre: nombreDisplay,
      fecha: fechaTexto,
      sorteos: {
        previa: { cabeza: null, numeros: [], textoCompleto: '' },
        primera: { cabeza: null, numeros: [], textoCompleto: '' },
        matutina: { cabeza: null, numeros: [], textoCompleto: '' },
        vespertina: { cabeza: null, numeros: [], textoCompleto: '' },
        nocturna: { cabeza: null, numeros: [], textoCompleto: '' }
      }
    };

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
        const infoCabeza = this._extraerInfoCabeza($, $table);
        const pares = this._parseTablaPorPares($, $table);

        if (pares && pares.length > 0) {
          pares.sort((a, b) => a.sorteo - b.sorteo);
          resultados.sorteos[tipo].numeros = pares;

          const cabeza =
            infoCabeza?.numero || pares.find(p => p.sorteo === 1)?.numero;
          if (cabeza) {
            resultados.sorteos[tipo].cabeza = cabeza.padStart(4, '0');
          }

          if (infoCabeza) {
            resultados.sorteos[tipo].textoCompleto = infoCabeza.textoCompleto;
            resultados.sorteos[tipo].descripcion = infoCabeza.descripcion;
          }
        }
      }
    });

    const tipos = ['previa', 'primera', 'matutina', 'vespertina', 'nocturna'];
    for (const t of tipos) {
      if (
        !resultados.sorteos[t].numeros ||
        resultados.sorteos[t].numeros.length === 0
      ) {
        const selectorHeading = $(`*:contains("${t.toUpperCase()}")`)
          .filter((i, el) => {
            const txt = $(el).text().toLowerCase();
            return (
              txt.includes(t) &&
              (txt.includes('quiniela') || txt.includes('sorteo'))
            );
          })
          .first();

        if (selectorHeading && selectorHeading.length) {
          const tabla = selectorHeading.closest('table');
          if (tabla.length === 0) {
            const nextTable = selectorHeading.nextAll('table').first();
            if (nextTable && nextTable.length) {
              const infoCabeza = this._extraerInfoCabeza($, nextTable);
              const pares = this._parseTablaPorPares($, nextTable);

              if (pares.length) {
                pares.sort((a, b) => a.sorteo - b.sorteo);
                resultados.sorteos[t].numeros = pares;

                const cabeza =
                  infoCabeza?.numero ||
                  pares.find(p => p.sorteo === 1)?.numero;
                if (cabeza) {
                  resultados.sorteos[t].cabeza = cabeza.padStart(4, '0');
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
  }

  _tieneSorteosCargados(resultados) {
    if (!resultados || !resultados.sorteos) return false;
    return Object.values(resultados.sorteos).some(
      s => s && Array.isArray(s.numeros) && s.numeros.length > 0
    );
  }

  async _obtenerQuinielaConRespaldoAyer(slugProvincia, nombreDisplay) {
    // 1. Intentar obtener los sorteos de HOY
    const hoy = await this._extraerSorteosDeUrl(
      `/quinielas/${slugProvincia}/resultados-de-hoy`,
      nombreDisplay,
      this.obtenerFecha(0)
    );

    if (this._tieneSorteosCargados(hoy)) {
      return hoy;
    }

    // 2. Si todavía no salió La Previa de hoy, traer los de AYER (para mostrar la Nocturna)
    console.log(`Sin sorteos hoy para ${nombreDisplay}, usando Nocturna de ayer...`);
    const ayer = await this._extraerSorteosDeUrl(
      `/quinielas/${slugProvincia}/resultados-de-ayer`,
      nombreDisplay,
      this.obtenerFecha(-1)
    );

    return ayer;
  }

  async obtenerQuinielaSantaFe() {
    try {
      return await this._obtenerQuinielaConRespaldoAyer('santafe', 'Quiniela Santa Fe');
    } catch (error) {
      console.error('Error al obtener Quiniela Santa Fe:', error.message);
      return { error: 'No se pudieron obtener los resultados' };
    }
  }

  async obtenerQuinielaBuenosAires() {
    try {
      return await this._obtenerQuinielaConRespaldoAyer('buenosaires', 'Quiniela Provincia Bs. As.');
    } catch (error) {
      console.error('Error al obtener Quiniela Buenos Aires:', error.message);
      return { error: 'No se pudieron obtener los resultados' };
    }
  }

  async obtenerQuinielaNacional() {
    try {
      return await this._obtenerQuinielaConRespaldoAyer('nacional', 'Quiniela Nacional');
    } catch (error) {
      console.error('Error al obtener Quiniela Nacional:', error.message);
      return { error: 'No se pudieron obtener los resultados' };
    }
  }

  obtenerFecha(diasOffset = 0) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + diasOffset);
    return fecha.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

module.exports = new QuinielaScraper();
