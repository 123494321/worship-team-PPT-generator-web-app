"""
server/main.py
LOGOS Worship Team PPT Generator - 표준 경량화 FastAPI 백엔드 API 서버
- [대안 1] 정적 마스터 템플릿(master_template.pptx) 기반 순수 고속 PPTX 빌더
- 표지 이미지 관리 (조회 / 업로드 / 삭제)
- 실시간 16:9 슬라이드 카드 파싱 엔진 ([곡 제목] 대괄호 유지)
- 브라우저 직접 다운로드 스트리밍
- React SPA 완벽 정적 서빙
"""

import os
import sys
import io
import re
import time
import urllib.parse
from typing import Optional, List, Dict, Any

SERVER_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SERVER_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Query, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, Response, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from core.cloud_config import (
    DIR_CONTI,
    DIR_PPTX,
    DIR_COVERS,
    DIR_ASSETS,
    MASTER_TEMPLATE_PATH,
    ensure_data_directories,
    format_standard_filename
)
from core.pptx_builder import (
    build_praise_pptx,
    save_pptx_to_archive,
    get_active_cover_path,
    save_active_cover,
    delete_active_cover
)
from core.text_engine import (
    parse_user_conti,
    generate_plan_text_from_conti,
    parse_plan_text_to_slides,
    validate_conti_text
)

ensure_data_directories()

app = FastAPI(
    title="LOGOS Worship Team PPT Generator API",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. 시스템 정보
@app.get("/api/system/status")
def get_system_status():
    has_master = os.path.exists(MASTER_TEMPLATE_PATH)
    return {
        "status": "ok",
        "app": "LOGOS Worship PPT Studio",
        "version": "2.0.0",
        "has_master_template": has_master
    }

@app.get("/api/user-manual")
def get_user_manual():
    manual_path = os.path.join(PROJECT_ROOT, "USER_MANUAL.md")
    if os.path.exists(manual_path):
        with open(manual_path, "r", encoding="utf-8") as f:
            return {"content": f.read()}
    return {"content": "# 공식 설명서를 불러올 수 없습니다."}

# 2. 16:9 표지 이미지 API (조회, 업로드, 삭제)
@app.get("/api/cover/info")
def get_cover_info():
    cov_path = get_active_cover_path()
    has_cov = bool(cov_path and os.path.exists(cov_path))
    mtime = int(os.path.getmtime(cov_path)) if has_cov else 0
    return {
        "has_cover": has_cov,
        "cover_url": f"/api/cover?t={mtime}" if has_cov else None
    }

@app.get("/api/cover")
def get_active_cover_file():
    cov_path = get_active_cover_path()
    if not cov_path or not os.path.exists(cov_path):
        raise HTTPException(status_code=404, detail="등록된 표지 이미지가 없습니다.")
    ext = os.path.splitext(cov_path)[1].lower()
    media_type = "image/png" if ext == ".png" else "image/jpeg"
    return FileResponse(cov_path, media_type=media_type)

@app.post("/api/cover/upload")
async def upload_cover(file: UploadFile = File(...)):
    lower_name = file.filename.lower()
    if not (lower_name.endswith(".png") or lower_name.endswith(".jpg") or lower_name.endswith(".jpeg") or lower_name.endswith(".webp")):
        raise HTTPException(status_code=400, detail="이미지 파일 (.png, .jpg, .jpeg, .webp)만 업로드할 수 있습니다.")

    contents = await file.read()
    save_path = save_active_cover(contents, file.filename)
    now_ts = int(time.time())
    return {
        "success": True,
        "filename": file.filename,
        "size": len(contents),
        "cover_url": f"/api/cover?t={now_ts}",
        "message": "예배 표지 이미지가 성공적으로 변경되었습니다."
    }

@app.delete("/api/cover")
def delete_cover():
    deleted = delete_active_cover()
    return {
        "success": True,
        "deleted": deleted,
        "message": "표지 이미지가 초기화되었습니다."
    }

# 하위 호환용 표지 엔드포인트
@app.get("/api/presets/{preset_name}/cover")
def get_preset_cover_legacy(preset_name: str):
    return get_active_cover_file()

@app.get("/api/presets")
def get_presets_legacy():
    cov_info = get_cover_info()
    return {
        "presets": [{
            "name": "LOGOS 표준",
            "has_template": True,
            "has_cover": cov_info["has_cover"],
            "cover_name": "active_cover.jpg" if cov_info["has_cover"] else None,
            "is_default": True
        }],
        "default_preset": "LOGOS 표준"
    }

@app.get("/api/standards")
def get_standards_legacy():
    return get_presets_legacy()

# 3. 콘티 파싱 및 실시간 16:9 슬라이드 카드 API
class ContiRequest(BaseModel):
    conti_text: str

@app.post("/api/conti/validate")
def validate_conti_endpoint(req: ContiRequest):
    parsed = parse_user_conti(req.conti_text)
    lint_res = validate_conti_text(parsed)
    return {
        "warnings": lint_res.get("warnings", []),
        "is_valid": len(lint_res.get("warnings", [])) == 0,
        "song_count": len(parsed.get("songs", [])),
        "songs": [{"title": s.get("title"), "routine": s.get("routine_raw")} for s in parsed.get("songs", [])],
        "date_str": parsed.get("date_str", "미입력"),
        "title": parsed.get("title", "미입력"),
        "prayer_person": parsed.get("prayer_person", "미입력")
    }

@app.post("/api/conti/parse-live-cards")
def parse_live_cards(req: ContiRequest):
    """
    콘티를 파싱하여 실시간 16:9 슬라이드 카드 목록을 생성합니다.
    """
    if not req.conti_text or not req.conti_text.strip():
        return {"cards": [], "slide_count": 0, "plan_text": ""}

    parsed = parse_user_conti(req.conti_text)
    plan_text = generate_plan_text_from_conti(parsed)
    raw_slides = parse_plan_text_to_slides(plan_text)

    cards = []
    for idx, slide_item in enumerate(raw_slides):
        slide_idx = idx + 1
        if isinstance(slide_item, dict):
            raw_text = slide_item.get("text", "")
            raw_type = slide_item.get("type", "lyric")
        else:
            raw_text = str(slide_item)
            raw_type = "lyric"

        stripped = raw_text.strip()
        lines = [line.strip() for line in stripped.split("\n") if line.strip()]

        # 카드 유형 판별 및 곡 제목 [곡 제목] 형태 철저 보존
        if slide_idx == 1:
            card_type = "cover"
            card_title = parsed.get("title") or "찬양 모임"
            note = parsed.get("date_str") or "예배 표지"
        elif raw_type == "blank" or stripped in ["[BLANK]", "BLANK"] or not stripped:
            card_type = "blank"
            card_title = "BLANK"
            note = "예배 전환 암전"
        elif raw_type == "song_title" or (stripped.startswith("[") and stripped.endswith("]")):
            card_type = "title"
            clean_name = re.sub(r'[\[\]]', '', stripped).strip()
            card_title = f"[{clean_name}]" if clean_name else "[곡 제목]"
            note = "곡 제목"
        elif raw_type == "prayer" or "기도:" in stripped or "기도 :" in stripped or (slide_idx == len(raw_slides) and "기도" in stripped):
            card_type = "prayer"
            card_title = "대표기도"
            note = parsed.get("prayer_person") or "대표기도"
        else:
            card_type = "lyrics"
            card_title = lines[0] if lines else "가사"
            note = f"{len(lines)}줄 자막"

        cards.append({
            "id": slide_idx,
            "index": slide_idx,
            "type": card_type,
            "title": card_title,
            "note": note,
            "text": stripped,
            "lines": lines
        })

    return {
        "plan_text": plan_text,
        "slide_count": len(cards),
        "total_slides": len(cards),
        "songs_found": len(parsed.get("songs", [])),
        "cards": cards,
        "date_str": parsed.get("date_str", ""),
        "title": parsed.get("title", ""),
        "prayer_person": parsed.get("prayer_person", "")
    }

# 4. [대안 1] PPT 생성 및 브라우저 다운로드 스트리밍
@app.post("/api/ppt/generate")
async def generate_ppt(
    plan_text: str = Form(...),
    conti_text: str = Form(...),
    preset_name: Optional[str] = Form("LOGOS")
):
    slides = parse_plan_text_to_slides(plan_text)
    if not slides:
        raise HTTPException(status_code=400, detail="슬라이드 내용이 비어 있습니다.")

    try:
        prs = build_praise_pptx(slides)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PPTX 렌더링 실패: {str(e)}")

    parsed_conti = parse_user_conti(conti_text)
    raw_date = parsed_conti.get("date_str", "2026.09.20")
    clean_date = raw_date.replace(".", "").replace(" ", "").replace("-", "") if raw_date != "미입력" else "20260101"

    saved_path, standard_filename, pptx_bytes = save_pptx_to_archive(
        prs,
        prefix="LOGOS",
        title=f"{raw_date} 찬양 가사",
        date_str=clean_date
    )

    return {
        "success": True,
        "filename": standard_filename,
        "slide_count": len(slides),
        "download_url": f"/api/ppt/download/{urllib.parse.quote(standard_filename)}"
    }

@app.get("/api/ppt/download/{filename}")
def download_ppt(filename: str):
    safe_name = os.path.basename(filename)
    file_path = os.path.join(DIR_PPTX, safe_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
    return FileResponse(
        file_path,
        filename=safe_name,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
    )

# 5. 정적 프론트엔드 호스팅 (SPA 서빙)
CLIENT_DIST_DIR = os.path.join(SERVER_DIR, "static")
if os.path.exists(CLIENT_DIST_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(CLIENT_DIST_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        target_file = os.path.join(CLIENT_DIST_DIR, full_path)
        if os.path.exists(target_file) and os.path.isfile(target_file):
            return FileResponse(target_file)
        index_file = os.path.join(CLIENT_DIST_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return JSONResponse({"message": "Frontend build not found."})
else:
    @app.get("/")
    def index_placeholder():
        return JSONResponse({"message": "LOGOS Studio API Server Running", "docs": "/docs"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
