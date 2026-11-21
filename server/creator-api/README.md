# Creator Tools API

Backend for the YouTube / AI tools under `/creator-tools/*`. Audio, image and
calculator tools run fully in the browser and do not call this service.

| Path (nginx `/api/creator/...`) | Purpose |
| --- | --- |
| `/health` | status + whether YouTube / AI keys are configured |
| `/yt/video`, `/yt/videos`, `/yt/channel`, `/yt/channel-videos`, `/yt/playlist`, `/yt/comments`, `/yt/search-channels`, `/yt/search-videos`, `/yt/top100` | YouTube Data API v3 (cached, key rotation on quota errors) |
| `/yt/suggest`, `/yt/keywords` | YouTube autocomplete (free, no quota) |
| `POST /ai/generate` | Gemini text generation (ideas, tags, titles, names, podcast titles) |
| `/dl/info`, `POST /dl/start`, `/dl/status/{job}`, `/dl/file/{job}` | YouTube video (MP4 up to 2160p) / audio (MP3, M4A) downloader via yt-dlp; files in `/var/cache/ytdl`, served by nginx `/_ytdl/` (X-Accel-Redirect), removed after 3 h |
| `/img` | proxy for i.ytimg.com / yt3.ggpht.com so thumbnails and banners can be downloaded |

## Deploy (162.35.107.192)

```bash
mkdir -p /opt/creator-api && cd /opt/creator-api   # copy app.py, top_channels.txt, requirements.txt
uv venv --python 3.12 .venv && uv pip install --python .venv/bin/python -r requirements.txt
install -m 600 creator-api.env.example /etc/creator-api.env   # then fill in the keys
cp creator-api.service /etc/systemd/system/ && systemctl daemon-reload && systemctl enable --now creator-api
```

Nginx (already in `server/nginx/tools-bainslamusic.conf`):

```nginx
location /api/creator/ {
    proxy_pass http://127.0.0.1:8092/;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_read_timeout 120s;
}
```

## Video downloader (yt-dlp)

YouTube blocks most stream URLs from server IPs without a PO token, so the
downloader uses its own yt-dlp venv with the bgutil PO-token plugin and the
bgutil server (Deno, 127.0.0.1:4416):

```bash
python3 -m venv /opt/ytdl/venv && /opt/ytdl/venv/bin/pip install -U "yt-dlp[default]" bgutil-ytdlp-pot-provider==2.0.2
git clone --depth 1 --branch 2.0.2 https://github.com/Brainicism/bgutil-ytdlp-pot-provider.git /opt/bgutil-pot
cd /opt/bgutil-pot/server && deno install --allow-scripts=npm:canvas@3.2.3,npm:@swc/core@1.16.0
cp bgutil-pot.service /etc/systemd/system/ && systemctl enable --now bgutil-pot
cp ytdl-update.cron /etc/cron.d/ytdl-update   # daily yt-dlp update, YouTube changes often
```
