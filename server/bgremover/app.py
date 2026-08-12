"""Background removal API.

Runs the ISNet segmentation model server-side because browser (wasm) inference
takes 20-30s on phones, versus ~2s here. Images are held in memory only and are
never written to disk.
"""

import asyncio
import io
import logging

import pillow_heif
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import Response
from PIL import Image, ImageOps
from rembg import new_session, remove

# iPhone photos are HEIC; without this Pillow cannot open them at all.
pillow_heif.register_heif_opener()

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("bgremover")

MAX_BYTES = 40 * 1024 * 1024
# Guards RAM: the RGBA result alone is 4 bytes/px, plus intermediates.
MAX_PIXELS = 60_000_000

app = FastAPI(title="Background Remover")

# Loading the model takes ~4s, so do it once at import rather than per request.
session = new_session("isnet-general-use")

# 3 cores: more than two concurrent inferences just makes every request slower.
inference_slot = asyncio.Semaphore(2)


def _process(raw: bytes) -> bytes:
    with Image.open(io.BytesIO(raw)) as im:
        # Phone cameras store rotation in EXIF; without this the cutout comes
        # back sideways.
        im = ImageOps.exif_transpose(im)
        width, height = im.size
        if width * height > MAX_PIXELS:
            raise HTTPException(
                status_code=413,
                detail=f"Image is too large ({width}x{height}). Max is 60 megapixels.",
            )
        im = im.convert("RGB")
        buf = io.BytesIO()
        im.save(buf, format="PNG")

    # Returns the mask upscaled to the source dimensions, so a 4K input keeps
    # its full resolution.
    out = remove(buf.getvalue(), session=session)
    return out


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/remove-bg")
async def remove_bg(file: UploadFile = File(...)) -> Response:
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(raw) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="File is larger than 40 MB")

    async with inference_slot:
        try:
            png = await asyncio.to_thread(_process, raw)
        except HTTPException:
            raise
        except Exception as exc:
            log.exception("Failed to process upload")
            raise HTTPException(
                status_code=422, detail=f"Could not read this image: {exc}"
            ) from exc

    return Response(
        content=png,
        media_type="image/png",
        headers={"Cache-Control": "no-store"},
    )
