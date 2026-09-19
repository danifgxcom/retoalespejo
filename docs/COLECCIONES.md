# Nuevas colecciones de juego libre

24 tarjetas originales en `shared/collections.json`, con identificadores estables 301–324. Se suman a las 16 tarjetas de campaña y los 6 aperitivos existentes: 46 figuras en total.

Cada colección contiene dos figuras de 2 piezas, dos de 3 y dos de 4. Las dos primeras están disponibles desde el inicio. Resolver el prefijo de la colección abre el siguiente estudio; los aciertos se guardan en el progreso de juego libre, sin modificar la campaña. Las tarjetas ya resueltas siguen disponibles aunque cambie el orden del catálogo.

| Colección | Recorrido |
| --- | --- |
| Bestiario de papel | Lince, golondrina, cisnes, polilla, dragón y ciervo |
| Pequeñas máquinas | Pinza, balanza, motor, grúa, autómata y pórtico |
| Arquitecturas imposibles | Pasadizo, viaducto, puerta, escalinata, templo y claustro |
| Objetos con historia | Antifaz, broche, máscara, farol, guardián y medallón |

Los contornos se seleccionaron visualmente entre construcciones válidas con contacto entre piezas. Los estudios avanzados alternan caras y combinan giros, huecos y apoyos. Se conserva la geometría y la paleta funcional del juego; las miniaturas se dibujan desde la solución, sin assets raster ni descargas nuevas.

## Comprobación

- `npm test`: geometría, encaje real de todas las tarjetas, progresión independiente y sesión que desbloquea la tercera tarjeta tras ganar las dos primeras.
- `npm run build` y `npm run lint`.
- Inicio → Juego libre → filtro de colección. Verificar dos tarjetas disponibles, pendientes visibles y paginación. Ganar las dos entradas y volver a elegir tarjeta abre la tercera.
- Revisar a 1366 × 768 y 390 × 844; en móvil el contenido de la biblioteca se desplaza dentro del diálogo.

La campaña original, sus IDs y las claves de almacenamiento permanecen intactos. No se añade todavía modo contrarreloj.
