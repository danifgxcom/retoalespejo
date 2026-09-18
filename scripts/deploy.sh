#!/usr/bin/env bash
#
# Despliegue a producción (https://desafiaalreflejo.danifgx.org).
# La infraestructura está explicada en DEPLOY.md; esto es la ejecución.
#
#   ./scripts/deploy.sh              construye y despliega
#   ./scripts/deploy.sh --skip-build usa el frontend/dist que ya haya
#
set -euo pipefail

HOST=root@192.168.8.10
CT=110
BASE=/opt/desafia-al-reflejo
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

if [[ "${1:-}" != "--skip-build" ]]; then
  echo "==> build (shared + frontend + backend)"
  (cd "$REPO" && npm run build >/dev/null)
fi

test -f "$REPO/frontend/dist/index.html" || { echo "no hay build en frontend/dist"; exit 1; }

echo "==> empaquetando"
tar -czf "$TMP/web.tar.gz" -C "$REPO/frontend/dist" .

echo "==> subiendo al anfitrión"
scp -q "$TMP/web.tar.gz" "$HOST:/tmp/desafia-web.tar.gz"
scp -q "$REPO/shared/challenges.json" "$HOST:/tmp/challenges.json"

echo "==> desplegando en el contenedor $CT"
ssh "$HOST" "LC_ALL=C bash -s" <<REMOTE
set -euo pipefail
pct push $CT /tmp/desafia-web.tar.gz /tmp/desafia-web.tar.gz
pct push $CT /tmp/challenges.json /tmp/challenges.json
pct exec $CT -- bash -lc '
  set -euo pipefail
  test -d "$BASE/web" || { echo "no existe $BASE/web"; exit 1; }

  # Copia de seguridad antes de tocar nada
  tar -czf "/root/backup-$STAMP.tar.gz" -C "$BASE" web shared
  echo "copia de seguridad: /root/backup-$STAMP.tar.gz"

  # Web: despliegue atómico. Se monta al lado y se cambia de sitio al final,
  # para que nginx nunca sirva un directorio a medio extraer.
  rm -rf "$BASE/web.new"
  mkdir -p "$BASE/web.new"
  tar -xzf /tmp/desafia-web.tar.gz -C "$BASE/web.new"
  chown -R reflejo:reflejo "$BASE/web.new"
  rm -rf "$BASE/web.old"
  mv "$BASE/web" "$BASE/web.old"
  mv "$BASE/web.new" "$BASE/web"

  # Los retos también los lee el SERVIDOR para validar la solución: si sólo se
  # actualizara la web, cliente y servidor juzgarían la partida con objetivos
  # distintos. Son las dos copias que resuelve @reto/geometry.
  install -o reflejo -g reflejo -m 644 /tmp/challenges.json "$BASE/shared/challenges.json"
  install -o reflejo -g reflejo -m 644 /tmp/challenges.json "$BASE/shared/dist/challenges.json"

  rm -f /tmp/desafia-web.tar.gz /tmp/challenges.json
  systemctl restart desafia-al-reflejo.service
  sleep 2
  systemctl is-active desafia-al-reflejo.service | sed "s/^/backend: /"
'
rm -f /tmp/desafia-web.tar.gz /tmp/challenges.json
REMOTE

echo -n "==> sitio público: "
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://desafiaalreflejo.danifgx.org/

echo -n "==> bundle servido: "
curl -s https://desafiaalreflejo.danifgx.org/ | grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' | head -1

cat <<FIN

Volver atrás:
  ssh $HOST "pct exec $CT -- bash -lc 'rm -rf $BASE/web && mv $BASE/web.old $BASE/web \\
    && tar -xzf /root/backup-$STAMP.tar.gz -C $BASE shared \\
    && systemctl restart desafia-al-reflejo'"
FIN
