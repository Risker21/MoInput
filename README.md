# Mo记输入法 · 产品推广下载页

暗色科技风单页落地站，纯静态 HTML/CSS/JS（零构建、零框架），nginx 容器托管，
镜像内自带 APK，部署即可访问与下载。

## 目录结构

```
下载页面/
├── Dockerfile            # nginx:alpine 镜像
├── docker-compose.yml    # 一条命令部署
├── nginx.conf            # gzip / 缓存 / APK 断点续传
└── public/               # 站点根目录
    ├── index.html
    ├── css/style.css
    ├── js/
    │   ├── main.js
    │   └── qrcode.js        # qrcode-generator 1.4.4（本地化，出下载二维码）
    ├── img/              # 实机截图（轮播 / 学外语区实拍 / 语音区展示）
    ├── releases.json      # App 内「检查更新」读的版本索引（no-cache）
    └── downloads/
        └── MoJi-latest.apk       # 91.8 MB，固定链接名（旧码永不过期），随镜像分发
```

## 本地跑起来

```bash
cd 下载页面
docker compose up -d
# 打开 http://localhost:2082（或映射的任一端口）
```

不用 compose 也行：

```bash
docker build -t moji-landing .
docker run -d --name moji-landing -p 2082:80 moji-landing
```

## 安全说明（2026-10-13 加固）

容器与站点已做如下加固，`docker compose up -d --build` 即生效，无需额外配置：

- **响应头**：CSP / X-Frame-Options / nosniff / Referrer-Policy / Permissions-Policy /
  COOP / CORP / X-Permitted-Cross-Domain-Policies（`security-headers.conf`，
  每个 location 单独 include——nginx 的 `add_header` 不跨层继承）。
- **方法与路径**：仅允许 GET/HEAD；`.git`/`.env` 等隐藏文件与 `.bak`/`.conf`/`.log`
  等敏感后缀一律 403；`server_tokens off` 不暴露版本。
- **抗滥用**：每 IP 限速 20r/s（突发 60）、并发连接上限 30、请求头/请求体大小与
  超时收紧，防慢速攻击与扫描器。
- **容器**：根文件系统只读 + 必要 tmpfs、`no-new-privileges`、能力仅保留
  CHOWN/SETGID/SETUID/NET_BIND_SERVICE、pids/mem/cpu 上限、日志轮转 10m×3。
- **APK 完整性**：`downloads/MoJi-latest.apk.sha256` 与 `releases.json` 的 `sha256`
  字段随包发布（页面不展示，需要核对时直接取这两个地址）；发版改 APK 后须重新
  生成校验文件（`certutil -hashfile MoJi-latest.apk SHA256`）并同步这两处。
- **compose**：显式 `name: moji-landing`（目录名为中文时 compose 推导不出项目名）。

### 已知剩余风险（部署时注意）

1. **明文 HTTP 是最大风险**：域名 `riskermo.com` 已就位，强烈建议为其启用 HTTPS
   （certbot 签发，`.well-known` 已放行；届时取消 `nginx.conf` 中 HSTS 注释，
   并把 App 内 `WEBSITE_URL`/`DEFAULT_UPDATE_SOURCE` 改为 `https://`）。
   上 HTTPS 前可用校验和做人工核对。
2. App 内「检查更新」为明文 GET，服务器被劫持时可指向恶意包；`releases.json`
   的 `sha256` 字段已就位，App 端校验是后续改进项。
3. 服务器本体的防火墙/安全组、系统更新、Docker 版本不在本仓库范围，需另行维护。

## 部署到服务器

1. 把整个 `下载页面/` 目录上传到服务器（`scp -r` / git 均可）
2. 服务器上执行：

```bash
cd 下载页面
docker compose up -d --build
```

3. 浏览器访问 `http://服务器IP:2082`（服务器代理对外端口，2026-10 起由 8080 改为 2082）。

要走 80/443 端口，改 `docker-compose.yml` 的 `ports` 为 `"80:80"`，
或在前面加一层 Caddy/Nginx 反代并配域名与 HTTPS（二维码与下载链接会自动跟随域名）。

## 更新 APK

1. 用新包覆盖 `public/downloads/MoJi-latest.apk`（固定名：页面按钮、二维码、
   App 检查更新都指向它，旧链接与扫过的码永不过期）
2. 全文替换版本号：`index.html` 中的显示文案（`v0.1`、`91.8 MB`、`下载 MoJi-…apk`），
   以及 `nginx.conf` 里的 `Content-Disposition` 保存文件名（下载到本地的文件名仍带版本号）
3. 更新 `public/releases.json`：新版本的 `version` / `notes`（`url` 保持 `downloads/MoJi-latest.apk`）
4. `docker compose up -d --build`

## App 内检查更新

设置 → 关于 → **更新源地址**：填 `http://<服务器>[:端口]/releases.json`（部署后填一次），
再点 **检查更新**；有新版弹窗显示更新说明，点「下载」用浏览器直接取 `MoJi-latest.apk`。

- `releases.json` 结构与桌面版索引同构：`releases[]` 里 `version` / `channel` / `notes` / `url`；
  `url` 允许相对路径，以 releases.json 自身地址为基准拼成绝对地址。
- Android 壳暂不验 ed25519 签名（自用部署在自己服务器；只提示不安装，安装交给系统）。
- 页面/二维码不需要配合发版改动——它们永远指向最新的 `MoJi-latest.apk`。

## 页面说明

- **动效**：canvas 粒子点线网络（跟随鼠标连线）、打字机 slogan、滚动入场、
  手机模型浮动 + 实机截图轮播、英/日译词候选演示自动轮换 + 候选/设置实拍图、声波动画、按钮扫光
- **降级**：`prefers-reduced-motion` 下自动关闭全部动画，仅渲染静态帧
- **二维码**：qrcode-generator 1.4.4 已本地化（`js/qrcode.js`，随镜像分发），
  按当前访问域名动态生成「当前页面 + APK」的下载链接，内网/断网环境同样出码
- **零外部字体**：中文用系统字体栈，标签用等宽字体，断网环境视觉完整
