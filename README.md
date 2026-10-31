# Pizarra Quiniela Horizontal 16:9 (con Slider Automático de 10s)

Versión horizontal 16:9 de la pizarra de Lotería de Santa Fe con rotación automática tipo slider y actualización multi-fuente en tiempo real.

## Lógica del Slider Automático

1. **Antes de La Previa del día en curso:** El sistema carga todos los sorteos del día anterior (`Previa`, `Primera`, `Matutina`, `Vespertina`, `Nocturna`) y los rota automáticamente cada **10 segundos**.
2. **Cuando se sortea La Previa de hoy:** Descarta inmediatamente los resultados del día anterior, **detiene el slider** y deja fija en pantalla **La Previa** del día actual.
3. **Cuando se sortea La Primera (y sorteos siguientes) de hoy:** El slider vuelve a activarse automáticamente rotando cada **10 segundos** únicamente entre los sorteos ya publicados del día actual (`Previa` ↔ `Primera`, luego `Previa` → `Primera` → `Matutina`, etc.).

## Ejecución

```bash
npm install
npm start
```
