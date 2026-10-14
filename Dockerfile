# Mo记输入法 · 推广下载页
# 静态站点镜像：nginx 提供页面 + APK 下载（支持 Range 断点续传）
# TLS 自适应：挂载证书到 /etc/nginx/certs 即自动启用 HTTPS（见 40-enable-ssl.sh）
FROM nginx:1.27-alpine

# 移除默认页；基础配置放只读区，启动时由 entrypoint 播种到可写 conf.d
RUN rm -rf /usr/share/nginx/html/*
COPY nginx.conf /usr/share/nginx-base/default.conf
COPY security-headers.conf /usr/share/nginx-base/security-headers.conf
COPY 40-enable-ssl.sh /docker-entrypoint.d/40-enable-ssl.sh
RUN chmod +x /docker-entrypoint.d/40-enable-ssl.sh
COPY public/ /usr/share/nginx/html/

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
