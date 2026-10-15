#!/bin/sh
# 40-enable-ssl.sh —— 配置引导
# 每次容器启动：从只读镜像区 (/usr/share/nginx-base) 播种配置到可写 conf.d；
# 若 /etc/nginx/certs 中挂载了证书，则自动启用 HTTPS（443 站点 + 80 强跳 + HSTS）；
# 无证书则保持纯 HTTP（现状不变，服务不断）。
set -e

BASE=/usr/share/nginx-base
CONF_DIR=/etc/nginx/conf.d
CERT=/etc/nginx/certs/fullchain.pem
KEY=/etc/nginx/certs/privkey.pem

rm -f "$CONF_DIR"/*.conf
cp "$BASE/security-headers.conf" "$CONF_DIR/security-headers.conf"

if [ -f "$CERT" ] && [ -f "$KEY" ]; then
    cp "$BASE/default.conf" "$CONF_DIR/zzz-site-ssl.conf"
    sed -i "s|listen 80;|listen 443 ssl;\n    http2 on;\n    ssl_certificate $CERT;\n    ssl_certificate_key $KEY;\n    ssl_protocols TLSv1.2 TLSv1.3;|" "$CONF_DIR/zzz-site-ssl.conf"
    sed -i 's|^# add_header Strict-Transport-Security|add_header Strict-Transport-Security|' "$CONF_DIR/security-headers.conf"
    cat > "$CONF_DIR/default.conf" <<'EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    location = /healthz { return 200 'ok'; }
    location ^~ /.well-known/ { try_files $uri =404; }
    location / { return 301 https://$host$request_uri; }
}
EOF
    echo "[moji-landing] HTTPS enabled: :443 + :80 -> 301"
else
    cp "$BASE/default.conf" "$CONF_DIR/default.conf"
    echo "[moji-landing] no certs in /etc/nginx/certs — HTTP only"
fi
