"""Creator Tools API: YouTube Data API v3, YouTube autocomplete, Gemini text
generation and a thumbnail/banner image proxy for /creator-tools/*.

Keys are read from the environment only (see creator-api.env.example) and are
never sent to the browser.
"""

import asyncio
import json
import os
import random
import re
import time
from collections import defaultdict, deque
from pathlib import Path
from urllib.parse import parse_qs, quote, urlparse

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, Response

YT_KEYS = [k.strip() for k in os.environ.get("YOUTUBE_API_KEYS", os.environ.get("YOUTUBE_API_KEY", "")).split(",") if k.strip()]
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
GEMINI_MODELS = [m.strip() for m in os.environ.get("GEMINI_MODELS", "gemini-3.5-flash,gemini-3.8-flash").split(",") if m.strip()]
DATA_DIR = Path(os.environ.get("CREATOR_DATA_DIR", "/var/lib/creator-api"))
YT = "https://www.googleapis.com/youtube/v3"

IMG_HOSTS = ("i.ytimg.com", "i9.ytimg.com", "yt3.ggpht.com", "yt3.googleusercontent.com", "lh3.googleusercontent.com")

app = FastAPI(title="Creator Tools API")
client = httpx.AsyncClient(timeout=20, follow_redirects=True, headers={"User-Agent": "Mozilla/5.0 (compatible; BainslaTools/1.0)"})

# ---------------------------------------------------------------- helpers

_cache: dict[str, tuple[float, object]] = {}


def cache_get(key: str):
    hit = _cache.get(key)
    if hit and hit[0] > time.time():
        return hit[1]
    _cache.pop(key, None)
    return None


def cache_set(key: str, value, ttl: int):
    if len(_cache) > 5000:
        now = time.time()
        for k in [k for k, v in _cache.items() if v[0] < now][:2000]:
            _cache.pop(k, None)
        if len(_cache) > 5000:
            _cache.clear()
    _cache[key] = (time.time() + ttl, value)


_hits: dict[str, deque] = defaultdict(deque)


@app.middleware("http")
async def rate_limit(request: Request, call_next):
    ip = request.headers.get("x-real-ip") or (request.client.host if request.client else "?")
    path = request.url.path
    limit = 20 if path.startswith("/ai/") else 6 if (path == "/sign/requests" and request.method == "POST") else 90
    bucket = _hits[ip + request.url.path[:4]]
    now = time.time()
    while bucket and bucket[0] < now - 60:
        bucket.popleft()
    if len(bucket) >= limit:
        return JSONResponse({"error": "Too many requests, please wait a minute."}, status_code=429)
    bucket.append(now)
    return await call_next(request)


class YTError(Exception):
    pass


_key_index = 0


async def yt(endpoint: str, **params):
    global _key_index
    if not YT_KEYS:
        raise HTTPException(503, "YouTube data is not configured yet.")
    last = None
    start = _key_index
    for attempt in range(len(YT_KEYS)):
        idx = (start + attempt) % len(YT_KEYS)
        key = YT_KEYS[idx]
        r = await client.get(f"{YT}/{endpoint}", params={**params, "key": key})
        if r.status_code == 200:
            return r.json()
        try:
            err = r.json().get("error", {})
        except ValueError:
            err = {}
        reason = (err.get("errors") or [{}])[0].get("reason", "")
        last = err.get("message") or r.text[:200]
        if reason in ("quotaExceeded", "dailyLimitExceeded", "rateLimitExceeded"):
            _key_index = idx + 1
            continue
        if r.status_code == 404 or reason in ("videoNotFound", "playlistNotFound", "channelNotFound"):
            raise HTTPException(404, "Not found on YouTube. Check the link.")
        if reason == "commentsDisabled":
            raise HTTPException(400, "Comments are turned off for this video.")
        raise HTTPException(502, f"YouTube error: {re.sub(r'<[^>]+>', '', last or '')}")
    raise HTTPException(503, "Daily YouTube quota is used up. Please try again tomorrow.")


def video_id_of(raw: str) -> str:
    s = (raw or "").strip()
    if re.fullmatch(r"[\w-]{11}", s):
        return s
    try:
        u = urlparse(s if "://" in s else "https://" + s)
    except ValueError:
        u = None
    if u and u.netloc:
        q = parse_qs(u.query)
        if "v" in q and re.fullmatch(r"[\w-]{11}", q["v"][0]):
            return q["v"][0]
        m = re.search(r"(?:youtu\.be/|/shorts/|/embed/|/live/|/v/)([\w-]{11})", s)
        if m:
            return m.group(1)
    raise HTTPException(400, "Please paste a valid YouTube video link.")


def video_ids_of(raw: str) -> list[str]:
    out = []
    for part in re.split(r"[\s,]+", raw or ""):
        if not part:
            continue
        try:
            vid = video_id_of(part)
        except HTTPException:
            continue
        if vid not in out:
            out.append(vid)
    return out


def playlist_id_of(raw: str) -> str:
    s = (raw or "").strip()
    m = re.search(r"[?&]list=([\w-]+)", s)
    if m:
        return m.group(1)
    if re.fullmatch(r"(PL|UU|OL|FL|RD|LL)[\w-]{10,}", s):
        return s
    raise HTTPException(400, "Please paste a valid YouTube playlist link.")


def thumb(thumbs: dict | None) -> str:
    thumbs = thumbs or {}
    for k in ("maxres", "standard", "high", "medium", "default"):
        if thumbs.get(k, {}).get("url"):
            return thumbs[k]["url"]
    return ""


def iso_duration(d: str) -> int:
    m = re.fullmatch(r"P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", d or "")
    if not m:
        return 0
    days, h, mi, s = (int(x or 0) for x in m.groups())
    return days * 86400 + h * 3600 + mi * 60 + s


def parse_keywords(raw: str) -> list[str]:
    return [a or b for a, b in re.findall(r'"([^"]+)"|(\S+)', raw or "") if (a or b).strip()]


_categories: dict[str, str] = {}


async def category_names(region="IN") -> dict[str, str]:
    if not _categories:
        data = await yt("videoCategories", part="snippet", regionCode=region)
        for it in data.get("items", []):
            _categories[it["id"]] = it["snippet"]["title"]
        _categories.setdefault("29", "Nonprofits & Activism")
    return _categories


def map_video(it: dict, cats: dict[str, str]) -> dict:
    sn, st, cd = it.get("snippet", {}), it.get("statistics", {}), it.get("contentDetails", {})
    status = it.get("status", {})
    secs = iso_duration(cd.get("duration", ""))
    return {
        "id": it.get("id"),
        "url": f"https://www.youtube.com/watch?v={it.get('id')}",
        "title": sn.get("title", ""),
        "description": sn.get("description", ""),
        "channelId": sn.get("channelId", ""),
        "channelTitle": sn.get("channelTitle", ""),
        "publishedAt": sn.get("publishedAt", ""),
        "tags": sn.get("tags", []),
        "categoryId": sn.get("categoryId", ""),
        "category": cats.get(sn.get("categoryId", ""), sn.get("categoryId", "")),
        "defaultLanguage": sn.get("defaultLanguage") or sn.get("defaultAudioLanguage") or "",
        "liveBroadcastContent": sn.get("liveBroadcastContent", ""),
        "thumbnails": {k: v.get("url") for k, v in (sn.get("thumbnails") or {}).items()},
        "thumbnail": thumb(sn.get("thumbnails")),
        "duration": secs,
        "definition": cd.get("definition", ""),
        "caption": cd.get("caption") == "true",
        "licensedContent": cd.get("licensedContent", False),
        "dimension": cd.get("dimension", ""),
        "privacyStatus": status.get("privacyStatus", ""),
        "embeddable": status.get("embeddable", True),
        "madeForKids": status.get("madeForKids", False),
        "license": status.get("license", ""),
        "views": int(st.get("viewCount", 0) or 0),
        "likes": int(st.get("likeCount", 0) or 0),
        "comments": int(st.get("commentCount", 0) or 0),
        "topics": [t.rsplit("/", 1)[-1].replace("_", " ") for t in it.get("topicDetails", {}).get("topicCategories", [])],
    }


async def videos_by_ids(ids: list[str]) -> list[dict]:
    cats = await category_names()
    out: list[dict] = []
    chunks = [ids[i:i + 50] for i in range(0, len(ids), 50)]
    results = await asyncio.gather(*[
        yt("videos", part="snippet,statistics,contentDetails,status,topicDetails", id=",".join(c), maxResults=50)
        for c in chunks
    ])
    by_id = {}
    for data in results:
        for it in data.get("items", []):
            by_id[it["id"]] = map_video(it, cats)
    for i in ids:
        if i in by_id:
            out.append(by_id[i])
    return out


def map_channel(it: dict) -> dict:
    sn, st, br = it.get("snippet", {}), it.get("statistics", {}), it.get("brandingSettings", {})
    ch = br.get("channel", {})
    banner = br.get("image", {}).get("bannerExternalUrl", "")
    return {
        "id": it.get("id"),
        "url": f"https://www.youtube.com/channel/{it.get('id')}",
        "title": sn.get("title", ""),
        "handle": sn.get("customUrl", ""),
        "description": sn.get("description", ""),
        "publishedAt": sn.get("publishedAt", ""),
        "country": sn.get("country", "") or ch.get("country", ""),
        "thumbnail": thumb(sn.get("thumbnails")),
        "thumbnails": {k: v.get("url") for k, v in (sn.get("thumbnails") or {}).items()},
        "banner": banner,
        "keywords": parse_keywords(ch.get("keywords", "")),
        "keywordsRaw": ch.get("keywords", ""),
        "subscribers": int(st.get("subscriberCount", 0) or 0),
        "hiddenSubscribers": st.get("hiddenSubscriberCount", False),
        "views": int(st.get("viewCount", 0) or 0),
        "videos": int(st.get("videoCount", 0) or 0),
        "uploads": it.get("contentDetails", {}).get("relatedPlaylists", {}).get("uploads", ""),
        "madeForKids": it.get("status", {}).get("madeForKids", False),
        "topics": [t.rsplit("/", 1)[-1].replace("_", " ") for t in it.get("topicDetails", {}).get("topicCategories", [])],
    }


CH_PARTS = "snippet,statistics,brandingSettings,contentDetails,status,topicDetails"


async def resolve_channel(raw: str) -> dict:
    s = (raw or "").strip()
    if not s:
        raise HTTPException(400, "Please paste a YouTube channel link or @handle.")
    key = "ch:" + s.lower()
    hit = cache_get(key)
    if hit:
        return hit
    params = None
    m = re.search(r"(UC[\w-]{22})", s)
    if m:
        params = {"id": m.group(1)}
    else:
        m = re.search(r"youtube\.com/@([^/?&#\s]+)", s) or re.fullmatch(r"@([^/?&#\s]+)", s)
        if m:
            params = {"forHandle": "@" + m.group(1)}
        else:
            m = re.search(r"youtube\.com/user/([^/?&#\s]+)", s)
            if m:
                params = {"forUsername": m.group(1)}
    if params is None:
        try:
            vid = video_id_of(s) if ("youtu" in s or re.fullmatch(r"[\w-]{11}", s)) else None
        except HTTPException:
            vid = None
        if vid:
            v = await yt("videos", part="snippet", id=vid)
            if v.get("items"):
                params = {"id": v["items"][0]["snippet"]["channelId"]}
    data = await yt("channels", part=CH_PARTS, **params) if params else {"items": []}
    if not data.get("items"):
        term = re.sub(r"^https?://(www\.)?youtube\.com/(c/)?", "", s).strip("/@ ")
        if not term:
            raise HTTPException(404, "Channel not found.")
        found = await yt("search", part="snippet", type="channel", maxResults=1, q=term)
        cid = (found.get("items") or [{}])[0].get("id", {}).get("channelId")
        if not cid:
            raise HTTPException(404, "Channel not found. Try the full channel link.")
        data = await yt("channels", part=CH_PARTS, id=cid)
    if not data.get("items"):
        raise HTTPException(404, "Channel not found.")
    ch = map_channel(data["items"][0])
    cache_set(key, ch, 1800)
    return ch


async def playlist_videos(playlist_id: str, limit: int) -> list[str]:
    ids: list[str] = []
    token = None
    while len(ids) < limit:
        params = {"part": "contentDetails", "playlistId": playlist_id, "maxResults": 50}
        if token:
            params["pageToken"] = token
        data = await yt("playlistItems", **params)
        for it in data.get("items", []):
            vid = it.get("contentDetails", {}).get("videoId")
            if vid:
                ids.append(vid)
        token = data.get("nextPageToken")
        if not token:
            break
    return ids[:limit]


# ---------------------------------------------------------------- YouTube endpoints


@app.get("/health")
async def health():
    return {"status": "ok", "youtube": bool(YT_KEYS), "ai": bool(GEMINI_KEY)}


@app.get("/yt/video")
async def video(url: str):
    vid = video_id_of(url)
    key = "v:" + vid
    hit = cache_get(key)
    if hit:
        return hit
    items = await videos_by_ids([vid])
    if not items:
        raise HTTPException(404, "Video not found or private.")
    cache_set(key, items[0], 600)
    return items[0]


@app.get("/yt/videos")
async def videos(urls: str):
    ids = video_ids_of(urls)[:200]
    if not ids:
        raise HTTPException(400, "Please paste at least one YouTube video link.")
    return {"items": await videos_by_ids(ids)}


@app.get("/yt/channel")
async def channel(url: str):
    return await resolve_channel(url)


@app.get("/yt/channel-videos")
async def channel_videos(url: str, limit: int = 50):
    limit = max(1, min(limit, 2000))
    ch = await resolve_channel(url)
    key = f"cv:{ch['id']}:{limit}"
    hit = cache_get(key)
    if hit:
        return hit
    ids: list[str] = []
    if ch["uploads"] and ch["videos"] > 0:
        try:
            ids = await playlist_videos(ch["uploads"], limit)
        except HTTPException as e:
            if e.status_code != 404:
                raise
    items = await videos_by_ids(ids) if ids else []
    for v in items:
        v.pop("description", None) if limit > 200 else None
    res = {"channel": ch, "items": items}
    cache_set(key, res, 900)
    return res


@app.get("/yt/playlist")
async def playlist(url: str, limit: int = 500):
    pid = playlist_id_of(url)
    limit = max(1, min(limit, 2000))
    key = f"pl:{pid}:{limit}"
    hit = cache_get(key)
    if hit:
        return hit
    meta = await yt("playlists", part="snippet,contentDetails", id=pid)
    if not meta.get("items"):
        raise HTTPException(404, "Playlist not found or private.")
    m = meta["items"][0]
    ids = await playlist_videos(pid, limit)
    items = await videos_by_ids(ids)
    res = {
        "playlist": {
            "id": pid,
            "title": m["snippet"].get("title", ""),
            "channelTitle": m["snippet"].get("channelTitle", ""),
            "description": m["snippet"].get("description", ""),
            "thumbnail": thumb(m["snippet"].get("thumbnails")),
            "itemCount": m.get("contentDetails", {}).get("itemCount", len(ids)),
        },
        "items": items,
        "unavailable": len(ids) - len(items),
    }
    cache_set(key, res, 900)
    return res


def map_comment(c: dict, parent: str | None = None) -> dict:
    sn = c.get("snippet", {})
    return {
        "id": c.get("id"),
        "parentId": parent,
        "author": sn.get("authorDisplayName", ""),
        "authorChannelId": (sn.get("authorChannelId") or {}).get("value", ""),
        "authorImage": sn.get("authorProfileImageUrl", ""),
        "text": sn.get("textOriginal", sn.get("textDisplay", "")),
        "likes": sn.get("likeCount", 0),
        "publishedAt": sn.get("publishedAt", ""),
        "updatedAt": sn.get("updatedAt", ""),
    }


@app.get("/yt/comments")
async def comments(url: str, limit: int = 1000, replies: bool = True, order: str = "time"):
    vid = video_id_of(url)
    limit = max(1, min(limit, 10000))
    order = order if order in ("time", "relevance") else "time"
    key = f"cm:{vid}:{limit}:{replies}:{order}"
    hit = cache_get(key)
    if hit:
        return hit
    out: list[dict] = []
    token = None
    need_more_replies: list[tuple[str, int]] = []
    threads = 0
    partial = False
    deadline = time.time() + 75
    while threads < limit:
        params = {"part": "snippet,replies" if replies else "snippet", "videoId": vid, "maxResults": 100, "order": order, "textFormat": "plainText"}
        if token:
            params["pageToken"] = token
        try:
            data = await yt("commentThreads", **params)
        except HTTPException:
            if not out:
                raise
            partial = True
            break
        for t in data.get("items", []):
            threads += 1
            top = t["snippet"]["topLevelComment"]
            row = map_comment(top)
            row["replyCount"] = t["snippet"].get("totalReplyCount", 0)
            out.append(row)
            got = t.get("replies", {}).get("comments", [])
            if replies:
                out.extend(map_comment(r, top["id"]) for r in reversed(got))
                if row["replyCount"] > len(got):
                    need_more_replies.append((top["id"], len(got)))
        token = data.get("nextPageToken")
        if not token:
            break
        if time.time() > deadline:
            partial = True
            break

    async def fetch_replies(parent: str, have: int):
        rows: list[dict] = []
        rtoken = None
        complete = False
        for _ in range(5):
            params = {"part": "snippet", "parentId": parent, "maxResults": 100, "textFormat": "plainText"}
            if rtoken:
                params["pageToken"] = rtoken
            try:
                data = await yt("comments", **params)
            except HTTPException:
                break
            rows.extend(map_comment(r, parent) for r in data.get("items", []))
            rtoken = data.get("nextPageToken")
            if not rtoken:
                complete = True
                break
        return parent, have, rows, complete

    extra = need_more_replies[:150]
    if len(need_more_replies) > len(extra):
        partial = True
    for i in range(0, len(extra), 10):
        if time.time() > deadline + 20:
            partial = True
            break
        for parent, have, rows, complete in await asyncio.gather(*[fetch_replies(p, h) for p, h in extra[i:i + 10]]):
            if not complete:
                partial = True
            if rows:
                out[:] = [c for c in out if c["parentId"] != parent]
                idx = next((k for k, c in enumerate(out) if c["id"] == parent), len(out) - 1)
                out[idx + 1:idx + 1] = rows
    try:
        v = await videos_by_ids([vid])
    except HTTPException:
        v = []
        partial = True
    res = {"video": v[0] if v else {"id": vid}, "items": out, "threads": threads, "partial": partial}
    cache_set(key, res, 300)
    return res


@app.get("/yt/search-channels")
async def search_channels(q: str, limit: int = 25):
    q = q.strip()
    if not q:
        raise HTTPException(400, "Type something to search.")
    limit = max(1, min(limit, 50))
    key = f"sc:{q.lower()}:{limit}"
    hit = cache_get(key)
    if hit:
        return hit
    found = await yt("search", part="snippet", type="channel", maxResults=limit, q=q)
    ids = [it["id"]["channelId"] for it in found.get("items", []) if it.get("id", {}).get("channelId")]
    items = []
    if ids:
        data = await yt("channels", part="snippet,statistics,brandingSettings,contentDetails", id=",".join(ids))
        by = {it["id"]: map_channel(it) for it in data.get("items", [])}
        items = [by[i] for i in ids if i in by]
    res = {"items": items}
    cache_set(key, res, 6 * 3600)
    return res


@app.get("/yt/search-videos")
async def search_videos(q: str, limit: int = 20, order: str = "relevance"):
    q = q.strip()
    if not q:
        raise HTTPException(400, "Type something to search.")
    order = order if order in ("relevance", "viewCount", "date", "rating") else "relevance"
    key = f"sv:{q.lower()}:{limit}:{order}"
    hit = cache_get(key)
    if hit:
        return hit
    found = await yt("search", part="snippet", type="video", maxResults=max(1, min(limit, 50)), q=q, order=order)
    ids = [it["id"]["videoId"] for it in found.get("items", []) if it.get("id", {}).get("videoId")]
    res = {"items": await videos_by_ids(ids)}
    cache_set(key, res, 6 * 3600)
    return res


TOP_HANDLES = Path(__file__).with_name("top_channels.txt")


@app.get("/yt/top100")
async def top100():
    hit = cache_get("top100")
    if hit:
        return hit
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    store = DATA_DIR / "top100.json"
    saved = json.loads(store.read_text()) if store.exists() else {}
    ids_file = DATA_DIR / "top100-ids.json"
    ids: dict[str, str] = json.loads(ids_file.read_text()) if ids_file.exists() else {}
    handles = [h.strip() for h in TOP_HANDLES.read_text().splitlines() if h.strip() and not h.startswith("#")]
    missing = [h for h in handles if h not in ids]

    async def lookup(h: str):
        try:
            d = await yt("channels", part="id", forHandle=h)
            if d.get("items"):
                ids[h] = d["items"][0]["id"]
        except HTTPException:
            pass

    for i in range(0, len(missing), 10):
        await asyncio.gather(*[lookup(h) for h in missing[i:i + 10]])
    ids_file.write_text(json.dumps(ids))
    uniq = list(dict.fromkeys(ids.values()))
    chans = []
    for i in range(0, len(uniq), 50):
        d = await yt("channels", part="snippet,statistics,brandingSettings,contentDetails", id=",".join(uniq[i:i + 50]))
        chans.extend(map_channel(it) for it in d.get("items", []))
    chans.sort(key=lambda c: c["subscribers"], reverse=True)
    chans = chans[:100]
    today = time.strftime("%Y-%m-%d")
    snaps = saved.get("snapshots", {})
    prev_day = max((d for d in snaps if d < today), default=None)
    prev = snaps.get(prev_day, {}) if prev_day else {}
    for rank, c in enumerate(chans, 1):
        c.pop("description", None)
        c.pop("keywords", None)
        c.pop("keywordsRaw", None)
        c["rank"] = rank
        p = prev.get(c["id"])
        c["prev"] = p
    snaps[today] = {c["id"]: {"rank": c["rank"], "subscribers": c["subscribers"], "views": c["views"], "videos": c["videos"]} for c in chans}
    for d in sorted(snaps)[:-45]:
        snaps.pop(d)
    store.write_text(json.dumps({"snapshots": snaps}))
    res = {"updated": int(time.time()), "comparedTo": prev_day, "items": chans}
    cache_set("top100", res, 6 * 3600)
    return res


@app.get("/yt/categories")
async def categories():
    return await category_names()


# ---------------------------------------------------------------- autocomplete


async def suggest(q: str, hl="en", gl="IN") -> list[str]:
    key = f"sg:{hl}:{gl}:{q.lower()}"
    hit = cache_get(key)
    if hit is not None:
        return hit
    try:
        r = await client.get(
            "https://suggestqueries.google.com/complete/search",
            params={"client": "firefox", "ds": "yt", "hl": hl, "gl": gl, "q": q},
        )
        res = r.json()[1] if r.status_code == 200 else []
    except Exception:
        res = []
    cache_set(key, res, 6 * 3600)
    return res


@app.get("/yt/suggest")
async def suggest_ep(q: str, hl: str = "en", gl: str = "IN"):
    return {"items": await suggest(q.strip(), hl, gl)}


QUESTION_WORDS = ["how", "what", "why", "when", "where", "which", "who", "can", "is", "best"]


@app.get("/yt/keywords")
async def keywords(q: str, hl: str = "en", gl: str = "IN", depth: str = "full"):
    seed = q.strip()
    if not seed:
        raise HTTPException(400, "Type a keyword.")
    probes = [seed] + [f"{seed} {c}" for c in "abcdefghijklmnopqrstuvwxyz0123456789"[: 36 if depth == "full" else 10]]
    questions = [f"{w} {seed}" for w in QUESTION_WORDS]
    prepos = [f"{seed} {p}" for p in ("for", "with", "without", "vs", "near", "in", "to", "and")]
    groups = {"suggestions": probes, "questions": questions, "prepositions": prepos}
    out = {}
    seen = set()
    for name, ps in groups.items():
        results = await asyncio.gather(*[suggest(p, hl, gl) for p in ps])
        items = []
        for lst in results:
            for s in lst:
                k = s.lower().strip()
                if k and k not in seen:
                    seen.add(k)
                    items.append(s)
        out[name] = items
    return out


# ---------------------------------------------------------------- AI


AI_TASKS = {
    "video_ideas": ("Generate {n} fresh, specific YouTube video ideas for a channel about: {input}. {extra} "
                    "Each idea: a catchy working title and one-sentence angle. Mix evergreen and trending formats (shorts, lists, how-to, challenges, reactions)."
                    ' Return JSON: {{"items":[{{"title":"...","angle":"..."}}]}}'),
    "tags": ("Generate {n} YouTube tags for a video about: {input}. {extra} Start with the most specific exact-match phrases, then broader ones, "
             "include common misspellings or Hinglish variants only if natural. No hashtags, no numbering, each tag under 30 characters."
             ' Return JSON: {{"items":["tag1","tag2"]}}'),
    "hashtags": ("Generate {n} relevant hashtags for a YouTube video/short about: {input}. {extra} Mix broad and niche, no spaces inside a hashtag."
                 ' Return JSON: {{"items":["#tag1","#tag2"]}}'),
    "titles": ("Write {n} high click-through YouTube video titles about: {input}. {extra} Each under 70 characters, put the main keyword near the start, "
               "vary styles (how-to, list, curiosity, emotional, question). No clickbait lies. "
               ' Return JSON: {{"items":["title 1","title 2"]}}'),
    "description": ("Write an SEO-friendly YouTube video description for: {input}. {extra} Include a 2-line hook, a short summary, 3-5 chapter timestamps placeholders, "
                    "a call to subscribe and 3 hashtags at the end. Return JSON: {{\"items\":[\"full description\"]}}"),
    "channel_names": ("Suggest {n} unique, brandable YouTube channel names for: {input}. {extra} Short (1-3 words), easy to spell, memorable, mixed styles."
                      ' Return JSON: {{"items":[{{"name":"...","why":"short reason"}}]}}'),
    "podcast_titles": ("Write {n} compelling podcast episode titles for an episode about: {input}. {extra} Under 70 characters, specific, curiosity driven, "
                       'varied formats (guest name, number, question, bold claim). Return JSON: {{"items":["title 1"]}}'),
    "podcast_title_check": ("Evaluate this podcast episode title: \"{input}\". {extra} Score it 0-100 for clarity, curiosity, SEO/searchability, and length. "
                            "Give 3 short strengths/weaknesses and {n} improved alternative titles. "
                            ' Return JSON: {{"score":0,"clarity":0,"curiosity":0,"seo":0,"length":0,"notes":["..."],"items":["better title"]}}'),
}


@app.post("/ai/generate")
async def ai_generate(request: Request):
    if not GEMINI_KEY:
        raise HTTPException(503, "AI is not configured yet.")
    body = await request.json()
    task = body.get("task")
    text = str(body.get("input", "")).strip()[:500]
    if task not in AI_TASKS or not text:
        raise HTTPException(400, "Please type a topic first.")
    n = max(1, min(int(body.get("n", 15) or 15), 40))
    lang = str(body.get("language", "")).strip()[:40]
    tone = str(body.get("tone", "")).strip()[:40]
    extra = " ".join(x for x in [f"The current year is {time.strftime('%Y')}.", f"Write in {lang}." if lang else "", f"Tone: {tone}." if tone else "", str(body.get("extra", ""))[:300]] if x)
    prompt = AI_TASKS[task].format(n=n, input=text, extra=extra)
    key = "ai:" + prompt
    hit = cache_get(key)
    if hit:
        return hit
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0.9},
    }
    last = "AI is busy, please try again."
    for model in GEMINI_MODELS:
        try:
            r = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                headers={"x-goog-api-key": GEMINI_KEY}, json=payload, timeout=45,
            )
        except httpx.HTTPError:
            continue
        if r.status_code != 200:
            last = f"AI error ({r.status_code}), please try again."
            continue
        try:
            parts = r.json()["candidates"][0]["content"]["parts"]
            raw = "".join(p.get("text", "") for p in parts if not p.get("thought"))
            raw = re.sub(r"^```(?:json)?|```$", "", raw.strip()).strip()
            data = json.loads(raw)
        except (KeyError, IndexError, ValueError):
            continue
        if isinstance(data, list):
            data = {"items": data}
        cache_set(key, data, 3600)
        return data
    raise HTTPException(502, last)


# ---------------------------------------------------------------- image proxy


@app.get("/img")
async def img(url: str, name: str = ""):
    host = urlparse(url).hostname or ""
    if not any(host == h or host.endswith("." + h) for h in IMG_HOSTS) and not host.endswith(".ggpht.com"):
        raise HTTPException(400, "Only YouTube images are allowed.")
    r = await client.get(url)
    if r.status_code != 200:
        raise HTTPException(404, "Image not available in this size.")
    ctype = r.headers.get("content-type", "image/jpeg")
    if not ctype.startswith("image/"):
        raise HTTPException(400, "Not an image.")
    headers = {"Cache-Control": "public, max-age=86400"}
    if name:
        safe = re.sub(r"[^\w.-]+", "_", name)[:100]
        headers["Content-Disposition"] = f'attachment; filename="{safe}"'
    return Response(r.content, media_type=ctype, headers=headers)


# ---------------------------------------------------------------- signature requests
# Documents are kept on disk (never auto-deleted) under DATA_DIR/sign/<id>/.

import base64
import html as html_lib
import secrets

from fastapi import File, Form, UploadFile

BREVO_KEY = os.environ.get("BREVO_API_KEY", "").strip()
BREVO_FROM = os.environ.get("BREVO_FROM", "").strip()
SITE_URL = os.environ.get("SITE_URL", "https://tools.bainslamusic.com").rstrip("/")
SIGN_DIR = DATA_DIR / "sign"
MAX_PDF = 20 * 1024 * 1024
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def sign_path(rid: str) -> Path:
    if not re.fullmatch(r"[\w-]{16,40}", rid or ""):
        raise HTTPException(404, "Signing request not found.")
    p = SIGN_DIR / rid
    if not (p / "meta.json").exists():
        raise HTTPException(404, "Signing request not found or link is wrong.")
    return p


def load_meta(p: Path) -> dict:
    return json.loads((p / "meta.json").read_text())


def save_meta(p: Path, meta: dict):
    tmp = p / "meta.json.tmp"
    tmp.write_text(json.dumps(meta, indent=1))
    tmp.replace(p / "meta.json")


async def send_mail(to: list[dict], subject: str, body: str, reply_to: dict | None = None, attachments: list[dict] | None = None):
    if not BREVO_KEY or not BREVO_FROM:
        raise HTTPException(503, "Email is not configured on the server.")
    payload = {"sender": {"name": "Bainsla Tools e-Sign", "email": BREVO_FROM}, "to": to, "subject": subject, "htmlContent": body}
    if reply_to:
        payload["replyTo"] = reply_to
    if attachments:
        payload["attachment"] = attachments
    try:
        r = await client.post("https://api.brevo.com/v3/smtp/email", headers={"api-key": BREVO_KEY, "accept": "application/json"}, json=payload, timeout=60)
    except httpx.HTTPError:
        raise HTTPException(502, "Could not send the email right now. Please try again.")
    if r.status_code >= 300:
        raise HTTPException(502, "Could not send the email right now. Please try again.")
    return r.json().get("messageId", "")


def mail_html(title: str, lines: list[str], button: tuple[str, str] | None = None) -> str:
    btn = (f'<p style="text-align:center;margin:28px 0"><a href="{button[1]}" style="background:#dc2626;color:#fff;padding:14px 30px;'
           f'border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">{button[0]}</a></p>') if button else ""
    body = "".join(f'<p style="color:#374151;font-size:15px;line-height:1.6">{l}</p>' for l in lines)
    return (f'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">'
            f'<h2 style="color:#111827">{title}</h2>{body}{btn}'
            f'<hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0"/>'
            f'<p style="color:#9ca3af;font-size:12px;text-align:center">Sent via tools.bainslamusic.com e-Sign</p></div>')


def clean(s: str, n=120) -> str:
    return re.sub(r"\s+", " ", (s or "")).strip()[:n]


@app.post("/sign/requests")
async def create_sign_request(
    request: Request,
    pdf: UploadFile = File(...),
    senderName: str = Form(...),
    senderEmail: str = Form(...),
    recipientName: str = Form(...),
    recipientEmail: str = Form(...),
    docTitle: str = Form(""),
    message: str = Form(""),
    areas: str = Form("[]"),
):
    senderName, recipientName, docTitle = clean(senderName), clean(recipientName), clean(docTitle) or "Document"
    senderEmail, recipientEmail = clean(senderEmail).lower(), clean(recipientEmail).lower()
    if not senderName or not recipientName or not EMAIL_RE.match(senderEmail) or not EMAIL_RE.match(recipientEmail):
        raise HTTPException(400, "Please enter valid names and email addresses.")
    data = await pdf.read(MAX_PDF + 1)
    if len(data) > MAX_PDF:
        raise HTTPException(413, "PDF is too large (max 20 MB).")
    if not data.startswith(b"%PDF"):
        raise HTTPException(400, "Please upload a PDF file.")
    try:
        parsed = json.loads(areas)
        if len(parsed) > 50:
            raise HTTPException(400, "You can mark at most 50 signature areas.")
        area_list = [
            {k: float(a[k]) for k in ("x", "y", "width", "height")} | {"page": int(a["page"])}
            for a in parsed
        ]
    except (ValueError, KeyError, TypeError):
        raise HTTPException(400, "Invalid signature areas.")
    if not area_list:
        raise HTTPException(400, "Mark at least one signature area.")
    rid = secrets.token_urlsafe(18)
    p = SIGN_DIR / rid
    p.mkdir(parents=True, exist_ok=False)
    (p / "original.pdf").write_bytes(data)
    meta = {
        "id": rid, "status": "sent", "createdAt": int(time.time()),
        "senderName": senderName, "senderEmail": senderEmail,
        "recipientName": recipientName, "recipientEmail": recipientEmail,
        "docTitle": docTitle, "message": clean(message, 1000), "areas": area_list,
        "senderIp": request.headers.get("x-real-ip", ""),
    }
    save_meta(p, meta)
    link = f"{SITE_URL}/sign-request?id={rid}"
    e = html_lib.escape
    lines = [f"Hi {e(recipientName)},", f"<b>{e(senderName)}</b> ({e(senderEmail)}) has requested your signature on <b>{e(docTitle)}</b>."]
    if meta["message"]:
        lines.append(f"Message: <i>{e(meta['message'])}</i>")
    lines.append("Open the document, add your signature and submit. The signed PDF is emailed back automatically.")
    try:
        await send_mail([{"email": recipientEmail, "name": recipientName}], f'{senderName} requested your signature on "{docTitle}"',
                        mail_html("Signature request", lines, ("Review & Sign", link)), reply_to={"email": senderEmail, "name": senderName})
    except HTTPException:
        meta["status"] = "email_failed"
        save_meta(p, meta)
        return {"id": rid, "link": link, "emailed": False}
    try:
        await send_mail([{"email": senderEmail, "name": senderName}], f'Signature request sent: "{docTitle}"',
                        mail_html("Your request was sent", [f"We emailed <b>{e(recipientName)}</b> ({e(recipientEmail)}) a link to sign <b>{e(docTitle)}</b>.",
                                  "You will get the signed PDF by email as soon as they sign."], ("Open signing link", link)))
    except HTTPException:
        pass
    return {"id": rid, "link": link, "emailed": True}


def public_meta(meta: dict) -> dict:
    return {k: meta.get(k) for k in ("id", "status", "senderName", "recipientName", "docTitle", "message", "areas", "createdAt", "signedAt", "signerName")}


@app.get("/sign/requests/{rid}")
async def get_sign_request(rid: str):
    return public_meta(load_meta(sign_path(rid)))


@app.get("/sign/requests/{rid}/pdf")
async def get_sign_pdf(rid: str, signed: bool = False):
    p = sign_path(rid)
    f = p / ("signed.pdf" if signed else "original.pdf")
    if not f.exists():
        raise HTTPException(404, "Signed document is not ready yet.")
    meta = load_meta(p)
    name = re.sub(r"[^\w.-]+", "_", ("signed-" if signed else "") + meta["docTitle"])[:80] + ".pdf"
    ascii_name = re.sub(r"[^A-Za-z0-9._-]+", "_", name) or "document.pdf"
    disp = f"inline; filename=\"{ascii_name}\"; filename*=UTF-8''{quote(name)}"
    return Response(f.read_bytes(), media_type="application/pdf", headers={"Content-Disposition": disp, "Cache-Control": "no-store"})


@app.post("/sign/requests/{rid}/complete")
async def complete_sign_request(request: Request, rid: str, pdf: UploadFile = File(...), signerName: str = Form(...), signerEmail: str = Form(...)):
    p = sign_path(rid)
    meta = load_meta(p)
    if meta["status"] == "signed":
        raise HTTPException(409, "This document has already been signed.")
    signerName, signerEmail = clean(signerName), clean(signerEmail).lower()
    if not signerName or not EMAIL_RE.match(signerEmail):
        raise HTTPException(400, "Please enter your name and a valid email.")
    data = await pdf.read(MAX_PDF * 2 + 1)
    if len(data) > MAX_PDF * 2 or not data.startswith(b"%PDF"):
        raise HTTPException(400, "Signed file is not a valid PDF.")
    (p / "signed.pdf").write_bytes(data)
    meta.update({"status": "signed", "signedAt": int(time.time()), "signerName": signerName, "signerEmail": signerEmail,
                 "signerIp": request.headers.get("x-real-ip", "")})
    save_meta(p, meta)
    e = html_lib.escape
    fname = re.sub(r"[^\w.-]+", "_", "signed-" + meta["docTitle"])[:80] + ".pdf"
    dl = f"{SITE_URL}/api/creator/sign/requests/{rid}/pdf?signed=true"
    att = [{"content": base64.b64encode(data).decode(), "name": fname}] if len(data) <= 10 * 1024 * 1024 else None
    when = time.strftime("%d %b %Y, %H:%M", time.localtime(meta["signedAt"]))
    sent = {"sender": False, "signer": False}
    try:
        await send_mail([{"email": meta["senderEmail"], "name": meta["senderName"]}], f'Signed: "{meta["docTitle"]}" by {signerName}',
                        mail_html("Your document has been signed ✅", [f"<b>{e(signerName)}</b> ({e(signerEmail)}) signed <b>{e(meta['docTitle'])}</b> on {when}.",
                                  "The signed PDF is attached." if att else "Download the signed PDF with the button below."], ("Download signed PDF", dl)),
                        reply_to={"email": signerEmail, "name": signerName}, attachments=att)
        sent["sender"] = True
    except HTTPException:
        pass
    try:
        await send_mail([{"email": signerEmail, "name": signerName}], f'Your signed copy: "{meta["docTitle"]}"',
                        mail_html("Thanks for signing", [f"Here is your copy of <b>{e(meta['docTitle'])}</b>, signed on {when}. A copy was sent to {e(meta['senderName'])}."], ("Download signed PDF", dl)),
                        attachments=att)
        sent["signer"] = True
    except HTTPException:
        pass
    meta["emailed"] = sent
    save_meta(p, meta)
    return {"ok": True, "emailed": sent, "download": dl}
