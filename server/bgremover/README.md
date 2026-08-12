# Background Remover API

Server-side background removal for `/remove-background`.

The in-browser (wasm) model takes 20-30s per photo on a phone and costs an ~80 MB
download. The same model runs in ~2s here, so the frontend calls this service by
default and only falls back to the browser engine when it is unreachable.

Images are processed in memory and never written to disk.

## Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/health` | Frontend uses this to pick its engine |
| `POST` | `/remove-bg` | multipart `file`; returns a transparent PNG |

Nginx exposes these as `/api/bg-health` and `/api/remove-bg` on the site origin.

## Deploy

Requires Python 3.12 — the ML wheels have no 3.14 build, which is what Ubuntu
26.04 ships.

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
uv python install 3.12

mkdir -p /opt/bgremover && cd /opt/bgremover
uv venv --python 3.12 .venv
uv pip install --python .venv/bin/python \
  "rembg[cpu]" fastapi "uvicorn[standard]" pillow python-multipart pillow-heif

cp app.py /opt/bgremover/app.py
cp bgremover.service /etc/systemd/system/
systemctl daemon-reload && systemctl enable --now bgremover
curl localhost:8091/health   # {"status":"ok"}
```

The model (~179 MB) downloads to `~/.u2net` on first start, which is why the
unit sets `HOME=/root`.

## Nginx

Inside the site's `server {}` block:

```nginx
client_max_body_size 45m;

location /api/remove-bg {
    proxy_pass http://127.0.0.1:8091/remove-bg;
    proxy_http_version 1.1;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
    proxy_request_buffering off;
}

location /api/bg-health {
    proxy_pass http://127.0.0.1:8091/health;
}
```

## Limits

`MAX_BYTES` 40 MB and `MAX_PIXELS` 60 MP guard RAM; a semaphore caps concurrent
inferences at 2 because the box has 3 cores.
