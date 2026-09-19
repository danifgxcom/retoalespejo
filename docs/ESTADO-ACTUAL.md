# Punto de continuación — 19 de septiembre de 2026

## Producto

Nombre visible: **Desafía al reflejo**. Identidad: Gabinete de simetría.
Producción: https://desafiaalreflejo.danifgx.org
Desarrollo de esta sesión: http://localhost:5188 (otros puertos pertenecen a otras aplicaciones).
Rama de trabajo: `dev`. Despliegue y recuperación: `DEPLOY.md`.

## Terminado

- Rebranding de pantallas, componentes, logo vectorial y sonido sintetizado con control del usuario.
- Accesibilidad: campo neutro en tarjetas de alto contraste, navegación por teclado, foco y modales; interfaz adaptable a móvil.
- Campaña original de 16 retos con progresión, empezando por el corazón.
- Juego libre con campaña desbloqueada y seis aperitivos originales; progreso separado.
- Multijugador organizado en entrada/creación de sala, espera y tablero. Comprobación de salas existentes, desconexiones y transferencia del anfitrión.
- Nombre corregido también en la cuenta atrás.
- Ampliación de 24 tarjetas: cuatro colecciones de seis, con fichas A/B, ambas caras y dificultad de 2–4 piezas. Total: 46 figuras.
- Biblioteca con filtros, paginación, previsualizaciones y requisitos de desbloqueo. Dos entradas abiertas por colección; completar el prefijo abre la siguiente. Detalles: `COLECCIONES.md`.

## Preservar al continuar

- No cambiar IDs de tarjetas ni claves de almacenamiento existentes: los avances del usuario dependen de ellos.
- La campaña usa `shared/challenges.json`; los seis aperitivos, `shared/free-challenges.json`; las nuevas colecciones, `shared/collections.json`.
- Las nuevas colecciones son de juego libre y se incluyen en el bundle del frontend. No se ha cambiado el mazo multijugador del servidor.
- Los objetivos usan contacto geométrico exacto, no redondear posiciones a la retícula. `Winnable.test.ts` comprueba que el encaje del juego permite resolverlos.
- `AGENTS.md` apareció como archivo local no versionado antes de este cierre: conservarlo sin incluirlo incidentalmente en el commit de producto.

## Pendiente / siguiente sesión

1. Recoger impresiones jugando las nuevas colecciones y ajustar nombres, dificultad o progresión si hace falta. No hay un rediseño adicional acordado.
2. Modo **contra el reloj**: sugerido por el usuario, deliberadamente aplazado. Todavía no diseñado ni implementado; decidir reglas antes de desarrollarlo.
3. Llevar las nuevas colecciones al multijugador sería una ampliación independiente, no realizada ni comprometida.
4. Comprobación técnica futura: se observó una posible diferencia entre altura de geometría del backend (500) y tablero actual (600). No se ha diagnosticado como fallo ni modificado; revisar antes de ampliar el mazo multijugador.

## Verificación y publicación de este cierre

- `npm run build` y `npm run lint`: correctos.
- `npm test`: 659 pruebas frontend y 10 backend, todas correctas (669).
- Biblioteca revisada en escritorio 1366 × 768 y móvil 390 × 844; auditoría automática de accesibilidad sin incidencias en ambos tamaños.
- Publicado con `./scripts/deploy.sh --skip-build`; backend activo y resolución de geometría compartida correcta.
- Bundle público: `assets/index-BVhOyAmv.js`, idéntico byte a byte al local y con las nuevas colecciones.
- SHA-256: `9f6f9d91cccd68c7583e90a7302da3361365ba8ec4d6ef120cc3694743c31ef3`.
- Prueba de navegador en producción con dos jugadores: crear/unirse, sala inexistente, espera, inicio, nombre de cuenta atrás, móvil, accesibilidad y transferencia del anfitrión: correcta.
- Copia anterior al despliegue: `/root/backup-20260919-203648.tar.gz` dentro de LXC 110. Restauración según `DEPLOY.md`.
- Aviso no bloqueante conocido: configuración antigua de `ts-jest` bajo `globals`; no impide las pruebas.
