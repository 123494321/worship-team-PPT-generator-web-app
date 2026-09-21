"""
core/cloud_config.py
LOGOS 찬양팀 PPT 생성기 - 시스템 핵심 경로 및 파일명 규격 설정
- 텔레그램/클라우드 의존성을 완전히 제거한 순수 로컬/웹 아키텍처
- 16:9 와이드 마스터 템플릿(master_template.pptx) 및 데이터 디렉토리 관리
"""

import os
import re

# 프로젝트 루트 및 데이터 경로
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_ROOT = os.path.join(BASE_DIR, "data")

DIR_PPTX = os.path.join(DATA_ROOT, "pptx")
DIR_CONTI = os.path.join(DATA_ROOT, "conti")
DIR_COVERS = os.path.join(DATA_ROOT, "covers")
DIR_ASSETS = os.path.join(BASE_DIR, "assets")

# [대안 1] 정적 마스터 템플릿 고정 경로 (Pretendard 폰트 내장 16:9 와이드)
MASTER_TEMPLATE_PATH = os.path.join(DIR_ASSETS, "master_template.pptx")

# 현재 활성 표지 이미지 파일 경로
CURRENT_COVER_PATH = os.path.join(DIR_COVERS, "current_cover.jpg")


def ensure_data_directories():
    """
    필수 데이터 디렉토리들을 안전하게 생성합니다.
    """
    for d in [DATA_ROOT, DIR_PPTX, DIR_CONTI, DIR_COVERS, DIR_ASSETS]:
        os.makedirs(d, exist_ok=True)


def sanitize_filename_part(text: str) -> str:
    r"""
    윈도우 파일명에 부적합한 문자(\ / : * ? " < > |)를 안전하게 정제합니다.
    대괄호 [ ] 는 윈도우에서 안전하게 허용되므로 보존합니다.
    """
    if not text:
        return "미지정"
    cleaned = re.sub(r'[\\/:*?"<>|]', '', str(text)).strip()
    return cleaned if cleaned else "미지정"


def format_standard_filename(prefix: str, file_type: str, title: str, date_str: str, ext: str) -> str:
    """
    교회 표준 아카이브 파일명을 생성합니다.
    형식: [부서/팀][구분][제목][날짜].확장자
    예: [LOGOS][PPT][2026.09.20 찬양 가사][20260920].pptx
    """
    c_prefix = sanitize_filename_part(prefix or "LOGOS")
    c_type = sanitize_filename_part(file_type)
    c_title = sanitize_filename_part(title)
    c_date = sanitize_filename_part(date_str)
    c_ext = ext.lstrip(".")
    return f"[{c_prefix}][{c_type}][{c_title}][{c_date}].{c_ext}"


def parse_standard_filename(filename: str):
    """
    표준 아카이브 파일명에서 메타데이터를 추출합니다.
    """
    pattern = r"^\[(.*?)\]\[(.*?)\]\[(.*?)\]\[(.*?)\]\.(.*?)$"
    match = re.match(pattern, filename)
    if match:
        return {
            "prefix": match.group(1),
            "type": match.group(2),
            "title": match.group(3),
            "date": match.group(4),
            "ext": match.group(5)
        }
    return None
