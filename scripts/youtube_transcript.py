"""
YouTube transcript extractor using yt-dlp.

yt-dlp works around YouTube's block on cloud IPs by emulating a real browser
client and supporting cookies / proxy configuration. It downloads subtitle
files instead of hitting the transcript API endpoint that YouTube restricts
from cloud servers.
"""

import json
import os
import re
import sys
from html import unescape
from urllib.parse import urlparse, parse_qs


def extract_video_id(raw_value: str) -> str | None:
    value = raw_value.strip()

    if re.fullmatch(r"[A-Za-z0-9_-]{11}", value):
        return value

    try:
        parsed = urlparse(value)
        hostname = parsed.netloc.lower().replace("www.", "").replace("m.", "")

        if hostname == "youtu.be":
            candidate = parsed.path.strip("/").split("/")[0]
            if re.fullmatch(r"[A-Za-z0-9_-]{11}", candidate):
                return candidate

        if hostname in {"youtube.com", "music.youtube.com", "youtube-nocookie.com"}:
            video_id = parse_qs(parsed.query).get("v", [None])[0]
            if video_id and re.fullmatch(r"[A-Za-z0-9_-]{11}", video_id):
                return video_id

            segments = [segment for segment in parsed.path.split("/") if segment]
            for index, segment in enumerate(segments):
                if segment in {"embed", "shorts", "live", "v"} and index + 1 < len(segments):
                    candidate = segments[index + 1]
                    if re.fullmatch(r"[A-Za-z0-9_-]{11}", candidate):
                        return candidate
    except Exception:
        pass

    match = re.search(
        r"(?:youtube\.com/watch\?.*v=|youtu\.be/|youtube\.com/embed/|youtube\.com/shorts/|youtube\.com/live/)([A-Za-z0-9_-]{11})",
        value,
        re.IGNORECASE,
    )
    return match.group(1) if match else None


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", unescape(text).replace("\xa0", " ")).strip()


def parse_vtt(vtt_text: str) -> str:
    """Extract plain text from a WebVTT subtitle file, deduplicating lines."""
    lines = vtt_text.splitlines()
    text_lines: list[str] = []
    seen: set[str] = set()

    for line in lines:
        # Skip WebVTT header, timestamps, cue identifiers, metadata, and blank lines
        if (
            line.startswith("WEBVTT")
            or "-->" in line
            or re.match(r"^\d+$", line.strip())
            or line.strip() == ""
            or line.startswith("NOTE")
            or line.startswith("STYLE")
            or line.startswith("REGION")
            or re.match(r"^(Kind|Language)\s*:", line)
        ):
            continue

        # Strip VTT inline tags like <c>, <i>, <b>, timestamps <00:00:00.000>
        cleaned = re.sub(r"<[^>]+>", "", line).strip()
        if cleaned and cleaned not in seen:
            seen.add(cleaned)
            text_lines.append(cleaned)

    return " ".join(text_lines)


def fetch_with_ytdlp(video_id: str, lang: str) -> dict:
    """
    Use yt-dlp to extract subtitle info then download just the VTT file.

    Strategy:
      1. Use extract_info() (no video download) to get subtitle URLs.
         Passes browser cookies to bypass YouTube bot-detection on cloud IPs.
         Tries YTDLP_BROWSER env var → Chrome → Edge → Firefox → Brave → cookieless.
      2. Pick the best subtitle URL (manual first, then auto-generated).
      3. Download the VTT content and parse it to plain text.
    """
    try:
        import yt_dlp  # noqa: PLC0415
        import urllib.request
    except ImportError:
        return {"success": False, "error": "yt-dlp is not installed. Run: pip install yt-dlp", "text": ""}

    video_url = f"https://www.youtube.com/watch?v={video_id}"
    base_lang = lang.split("-")[0]
    lang_prefs = list(dict.fromkeys([lang, base_lang, "en"]))

    def _make_ydl_opts(extra: dict) -> dict:
        return {
            "quiet": True,
            "no_warnings": True,
            "socket_timeout": 15,
            "retries": 2,
            "extractor_retries": 2,
            **extra,
        }

    def _extract_info(opts: dict) -> dict | None:
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                # process=False skips format selection entirely — we only need metadata/subs
                info = ydl.extract_info(video_url, download=False, process=False)
                if isinstance(info, dict):
                    # process=False gives raw info; run only the subtitle data through processing
                    # by calling sanitize_info which fills in subtitle URL fields
                    return ydl.sanitize_info(info)
        except Exception:
            pass
        return None

    def _pick_best_subtitle(info: dict) -> tuple[str, str, bool] | None:
        """
        Returns (url, language_code, is_auto_generated) for the best subtitle,
        or None if no subtitles are available.
        """
        manual = info.get("subtitles") or {}
        auto = info.get("automatic_captions") or {}

        def _find_in(source: dict, is_auto: bool) -> tuple[str, str, bool] | None:
            for lc in lang_prefs:
                tracks = source.get(lc) or []
                # Prefer VTT format
                vtt = next((t for t in tracks if t.get("ext") == "vtt"), None)
                chosen = vtt or (tracks[0] if tracks else None)
                if chosen and chosen.get("url"):
                    return chosen["url"], lc, is_auto
            # Fallback: any available language
            for lc, tracks in source.items():
                if not tracks:
                    continue
                vtt = next((t for t in tracks if t.get("ext") == "vtt"), None)
                chosen = vtt or tracks[0]
                if chosen and chosen.get("url"):
                    return chosen["url"], lc, is_auto
            return None

        return _find_in(manual, False) or _find_in(auto, True)

    def _download_vtt(url: str) -> str | None:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                return resp.read().decode("utf-8", errors="replace")
        except Exception:
            return None

    # Determine cookie sources to try
    browser_override = os.environ.get("YTDLP_BROWSER", "").strip().lower()
    browsers_to_try = [browser_override] if browser_override else [
        "chrome", "edge", "firefox", "brave", "chromium", "opera"
    ]

    info: dict | None = None

    # Try each browser's cookies
    for browser in browsers_to_try:
        candidate = _extract_info(_make_ydl_opts({"cookiesfrombrowser": (browser,)}))
        if candidate and (candidate.get("subtitles") or candidate.get("automatic_captions")):
            info = candidate
            break

    # Cookieless fallback
    if not info:
        info = _extract_info(_make_ydl_opts({}))

    if not info:
        return {"success": False, "error": "Could not retrieve video info via yt-dlp", "text": ""}

    subtitle = _pick_best_subtitle(info)
    if not subtitle:
        return {"success": False, "error": "No subtitles available for this video", "text": ""}

    sub_url, sub_lang, is_auto = subtitle
    raw = _download_vtt(sub_url)
    if not raw:
        return {"success": False, "error": "Failed to download subtitle file", "text": ""}

    text = normalize_text(parse_vtt(raw))
    if not text:
        return {"success": False, "error": "Subtitle file was empty after parsing", "text": ""}

    return {
        "success": True,
        "text": text,
        "language": sub_lang,
        "is_generated": is_auto,
        "video_id": video_id,
        "method": "yt-dlp",
    }


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Missing YouTube URL or video ID", "text": ""}))
        return 1

    raw_url = sys.argv[1]
    requested_lang = sys.argv[2] if len(sys.argv) > 2 else "en"

    video_id = extract_video_id(raw_url)
    if not video_id:
        print(json.dumps({"success": False, "error": "Invalid YouTube URL", "text": ""}))
        return 1

    result = fetch_with_ytdlp(video_id, requested_lang)
    print(json.dumps(result))
    return 0 if result["success"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
