# Despliegue

Producción: **https://desafiaalreflejo.danifgx.org**

```bash
./scripts/deploy.sh                # construye y despliega
./scripts/deploy.sh --skip-build   # despliega el frontend/dist que ya haya
```

El script hace copia de seguridad, despliega de forma atómica, reinicia el
backend y comprueba que el sitio responde. Al terminar imprime el comando
exacto para volver atrás.

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
- **`shared/challenges.json` → `shared/challenges.json` y
  `shared/dist/challenges.json`.** Las dos, porque `@reto/geometry` resuelve la
  segunda y el repo edita la primera.

Los retos **no son sólo datos del cliente**: el backend valida contra su propia
copia (`require('@reto/geometry/challenges.json')`). Desplegar la web sin ellos
deja a cliente y servidor juzgando la misma partida con objetivos distintos, y
el fallo no da error: simplemente la validación empieza a discrepar. Por eso van
en el mismo despliegue y el servicio se reinicia después (los carga al arrancar).

## Comprobar después

```bash
curl -s https://desafiaalreflejo.danifgx.org/ | grep -oE 'assets/index-[A-Za-z0-9_-]+\.js'
ls frontend/dist/assets                      # el hash tiene que coincidir
curl -s https://desafiaalreflejo.danifgx.org/challenges.json | head -20
ssh root@192.168.8.10 "pct exec 110 -- systemctl status desafia-al-reflejo --no-pager"
```

Un HTTP 200 no basta: nginx sirve el `index.html` viejo igual de bien. Lo que
dice si el despliegue entró es **el hash del bundle**.
