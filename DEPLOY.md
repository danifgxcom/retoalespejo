# Despliegue

Producción: **https://desafiaalreflejo.danifgx.org**

```bash
./scripts/deploy.sh                # construye y despliega
./scripts/deploy.sh --skip-build   # despliega el frontend/dist que ya haya
```

El script hace copia de seguridad, despliega de forma atómica, reinicia el
backend y comprueba que el sitio responde. Al terminar imprime el comando
exacto para volver atrás.

La copia incluye `web`, `shared`, `app/src` y `app/package.json`. El comando de
vuelta atrás restaura también el backend: una actualización de salas puede cambiar
el protocolo y no basta con recuperar solo la web y la geometría. Las copias
anteriores a esta ampliación pueden no contener `app/`.

## Dónde vive

| Qué | Dónde |
|---|---|
| Anfitrión (Proxmox) | `root@192.168.8.10` |
| Contenedor | LXC **110**, `desafia-al-reflejo` |
| Usuario de la aplicación | `reflejo:reflejo` |
| Raíz web (nginx) | `/opt/desafia-al-reflejo/web` |
| Backend (Socket.io) | `/opt/desafia-al-reflejo/app`, escucha en `127.0.0.1:3000` |
| Paquete de geometría | `/opt/desafia-al-reflejo/shared` |
| Servicio del backend | `desafia-al-reflejo.service` (systemd) |
| Salida a internet | `cloudflared.service` (túnel de Cloudflare) |
| Configuración de nginx | `/etc/nginx/sites-enabled/desafia-al-reflejo` |
| Copias de seguridad | `/root/backup-<fecha>.tar.gz` dentro del contenedor |

No hay SSH directo al contenedor: se entra por el anfitrión con
`pct exec 110 -- ...` y se copian ficheros con `pct push 110 origen destino`.

## Qué se despliega, y por qué eso

- **`frontend/dist/` → `web/`.** Vite emite los assets con hash de contenido,
  así que nginx los cachea para siempre y sólo `index.html` va sin caché.
- **`shared/dist/` + `shared/package.json` → `shared/`.** Es `@reto/geometry`,
  la geometría y la validación que comparten cliente y servidor.
- **`backend/src/` → `app/src/`.** El servidor Socket.io.
- **`shared/challenges.json` → `shared/challenges.json` y
  `shared/dist/challenges.json`.** Las dos, porque `@reto/geometry` resuelve la
  segunda y el repo edita la primera.

Los retos y las reglas **no son sólo cosa del cliente**: el backend es
autoritativo y valida con su propio `@reto/geometry`. Desplegar la web sola deja
a cliente y servidor juzgando la misma partida con objetivos y reglas distintos,
y el fallo no da error: simplemente empiezan a discrepar. Por eso van en el
mismo despliegue y el servicio se reinicia después (lo carga al arrancar).

### Una sola copia de la geometría

`npm install` resolvió `"@reto/geometry": "file:../shared"` **copiando** el
paquete dentro de `app/node_modules/@reto/geometry`. Había pues dos copias, y
durante un tiempo el despliegue actualizaba la que nadie lee: el backend se
quedó validando con la geometría y los retos del día que alguien copió el
paquete a mano, sin que nada avisara.

Ahora `app/node_modules/@reto/geometry` es un **enlace** a `shared/`, y el
script lo rehace en cada despliegue. Por eso termina preguntándole al propio
backend de dónde resuelve la geometría: que el servicio arranque no prueba que
esté leyendo la nueva.

## Comprobar después

```bash
curl -s https://desafiaalreflejo.danifgx.org/ | grep -oE 'assets/index-[A-Za-z0-9_-]+\.js'
ls frontend/dist/assets                      # el hash tiene que coincidir
curl -s https://desafiaalreflejo.danifgx.org/challenges.json | head -20
ssh root@192.168.8.10 "pct exec 110 -- systemctl status desafia-al-reflejo --no-pager"

# Qué geometría y qué retos ve el BACKEND (no basta con mirar la web)
ssh root@192.168.8.10 "pct exec 110 -- bash -lc 'cd /opt/desafia-al-reflejo/app && node -e \"
  console.log(require.resolve(\\\"@reto/geometry\\\"));
  console.log(require(\\\"@reto/geometry/challenges.json\\\").length + \\\" retos\\\");
\"'"
```

Un HTTP 200 no basta: nginx sirve el `index.html` viejo igual de bien. Lo que
dice si el despliegue entró es **el hash del bundle**.
