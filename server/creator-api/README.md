# Creator Tools API

Backend for the YouTube / AI tools under `/creator-tools/*`. Audio, image and
calculator tools run fully in the browser and do not call this service.

| Path (nginx `/api/creator/...`) | Purpose |
| --- | --- |
| `/health` | status + whether YouTube / AI keys are configured |
| `/yt/video`, `/yt/videos`, `/yt/channel`, `/yt/channel-videos`, `/yt/playlist`, `/yt/comments`, `/yt/search-channels`, `/yt/search-videos`, `/yt/top100` | YouTube Data API v3 (cached, key rotation on quota errors) |
| `/yt/suggest`, `/yt/keywords` | YouTube autocomplete (free, no quota) |
| `POST /ai/generate` | Gemini text generation (ideas, tags, titles, names, podcast titles) |
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
