"""
core/pptx_builder.py
LOGOS 찬양팀 PPT 생성기 - [대안 1] 정적 마스터 템플릿 고정 클론 PPTX 빌더
- assets/master_template.pptx(Pretendard 내장 16:9)를 단일 기준으로 활용
- 16:9 와이드 비율, Pretendard 폰트 임베딩 및 2줄 가사 규격 완벽 보존
- 표지 이미지 및 콘티 파일과 1:1 결합하여 단 1초 만에 완성본 PPTX 생성
"""

import io
import os
import copy
import glob
import pptx
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

from core.cloud_config import (
    DIR_PPTX,
    DIR_COVERS,
    DIR_ASSETS,
    MASTER_TEMPLATE_PATH,
    ensure_data_directories,
    format_standard_filename
)

ensure_data_directories()


def get_master_template_path() -> str:
    """
    [대안 1] 시스템 마스터 템플릿 파일 경로를 반환합니다.
    """
    if os.path.exists(MASTER_TEMPLATE_PATH):
        return MASTER_TEMPLATE_PATH
    # assets 폴더 내의 다른 pptx 탐색 (폴백)
    candidates = glob.glob(os.path.join(DIR_ASSETS, "*.pptx"))
    if candidates:
        return candidates[0]
    return MASTER_TEMPLATE_PATH


def get_active_cover_path():
    """
    현재 활성화된 16:9 표지 이미지 파일 경로를 반환합니다. 없으면 None을 반환합니다.
    """
    if not os.path.exists(DIR_COVERS):
        return None
    files = [
        os.path.join(DIR_COVERS, f) for f in os.listdir(DIR_COVERS)
        if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')) and not f.startswith('~$')
    ]
    if not files:
        return None
    # 최신 수정일 순
    files.sort(key=lambda x: os.path.getmtime(x), reverse=True)
    return files[0]


def save_active_cover(file_bytes: bytes, filename: str) -> str:
    """
    업로드된 표지 이미지를 저장하고 경로를 반환합니다.
    """
    ensure_data_directories()
    # 기존 표지 정리
    for f in os.listdir(DIR_COVERS):
        try:
            os.remove(os.path.join(DIR_COVERS, f))
        except Exception:
            pass

    ext = os.path.splitext(filename)[1].lower()
    if not ext or ext not in ['.png', '.jpg', '.jpeg', '.webp']:
        ext = '.jpg'
    save_path = os.path.join(DIR_COVERS, f"active_cover{ext}")
    with open(save_path, "wb") as f:
        f.write(file_bytes)
    return save_path


def delete_active_cover() -> bool:
    """
    등록된 표지 이미지를 삭제합니다.
    """
    deleted = False
    if os.path.exists(DIR_COVERS):
        for f in os.listdir(DIR_COVERS):
            try:
                os.remove(os.path.join(DIR_COVERS, f))
                deleted = True
            except Exception:
                pass
    return deleted


def clean_proto_shape(grp_element):
    """
    그룹 셰이프 내부의 불필요한 투명 더미 이미지(Freeform/blip r:embed)를 제거하여
    파워포인트 오픈 시 깨짐이나 빨간색 x 표시를 원천 차단합니다.
    """
    ns = {'p': 'http://schemas.openxmlformats.org/presentationml/2006/main'}
    for sp in list(grp_element.findall('p:sp', ns)):
        cNvPr = sp.find('p:nvSpPr/p:cNvPr', ns)
        if cNvPr is not None and 'Freeform' in cNvPr.get('name', ''):
            grp_element.remove(sp)
    return grp_element


def extract_prototypes_from_prs(prs):
    """
    마스터 템플릿 프레젠테이션의 슬라이드를 순회하며 [제목], [1줄 가사], [2줄 가사]
    원본 그룹 셰이프 및 텍스트 박스 좌표/서식을 프로토타입으로 추출합니다.
    """
    proto_title = None
    proto_1line = None
    proto_2line = None

    ns = {
        'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
        'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'
    }

    for slide in prs.slides:
        if len(slide.shapes) == 0:
            continue
        shp = slide.shapes[0]
        text = ""
        for sp in shp._element.iter('{http://schemas.openxmlformats.org/presentationml/2006/main}sp'):
            txBody = sp.find('p:txBody', ns)
            if txBody is not None:
                p_nodes = txBody.findall('a:p', ns)
                text = '\n'.join([
                    ''.join([r.find('a:t', ns).text for r in p.findall('a:r', ns) if r.find('a:t', ns) is not None])
                    for p in p_nodes
                ])
                break
        lines = [l.strip() for l in text.split('\n') if l.strip()]

        if len(lines) == 1:
            if any(k in lines[0] for k in ['LOGOS', '청년', '모임', '기도', '[']):
                if proto_title is None:
                    proto_title = clean_proto_shape(copy.deepcopy(shp._element))
            else:
                if proto_1line is None:
                    proto_1line = clean_proto_shape(copy.deepcopy(shp._element))
        elif len(lines) >= 2:
            if proto_2line is None:
                proto_2line = clean_proto_shape(copy.deepcopy(shp._element))

        if (proto_title is not None) and (proto_1line is not None) and (proto_2line is not None):
            break

    return proto_title, proto_1line, proto_2line


def build_praise_pptx(slides_data, font_name=None, font_size_pt=None, template_source=None, cover_image=None):
    """
    [대안 1] 정적 마스터 템플릿(master_template.pptx)의
    좌표, 여백, Pretendard 폰트 임베딩을 100% 온전히 딥클론하여
    가사 줄 수에 맞게 슬라이드를 생성하는 고품질 PPTX 빌더입니다.
    """
    tpl_path = template_source or get_master_template_path()
    if os.path.exists(tpl_path):
        prs = Presentation(tpl_path)
    else:
        # 비상용 폴백: 순수 16:9 와이드 프레젠테이션
        prs = Presentation()
        prs.slide_width = Inches(13.333)
        prs.slide_height = Inches(7.5)

    proto_title, proto_1line, proto_2line = extract_prototypes_from_prs(prs)

    # 템플릿 슬라이드 초기화 (내용만 비움)
    sldIdLst = prs.slides._sldIdLst
    for i in range(len(sldIdLst) - 1, -1, -1):
        prs.part.drop_rel(sldIdLst[i].rId)
        del sldIdLst[i]

    blank_layout = prs.slide_layouts[6]
    ns = {
        'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
        'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'
    }

    # 활성 표지 경로 폴백
    if cover_image is None:
        active_cov = get_active_cover_path()
        if active_cov and os.path.exists(active_cov):
            cover_image = active_cov

    for slide_idx, slide_info in enumerate(slides_data):
        slide = prs.slides.add_slide(blank_layout)
        slide.background.fill.solid()
        slide.background.fill.fore_color.rgb = RGBColor(0, 0, 0)

        # 1번째 슬라이드(표지): 표지 이미지가 있는 경우 16:9 전체 화면으로 꽉 채움
        if slide_idx == 0 and cover_image is not None and slide_info.get("type") in ["title", "cover"]:
            try:
                if hasattr(cover_image, 'seek'):
                    cover_image.seek(0)
                slide.shapes.add_picture(cover_image, Inches(0), Inches(0), width=prs.slide_width, height=prs.slide_height)
                continue
            except Exception as ce:
                print(f"[Warning] 표지 이미지 삽입 실패: {ce}")

        text_content = slide_info.get("text", "").strip()
        # 암전 슬라이드인 경우 빈 슬라이드로 유지 (Pure Black)
        if slide_info.get("type") == "blank" or not text_content:
            continue

        lines = [l.strip() for l in text_content.split('\n') if l.strip()]

        # 프로토타입 매칭
        if slide_info.get("type") in ["title", "cover"] or (len(lines) == 1 and any(k in text_content for k in ['LOGOS', '모임', '기도', '['])):
            proto = proto_title if proto_title is not None else (proto_1line if proto_1line is not None else proto_2line)
        elif len(lines) == 1:
            proto = proto_1line if proto_1line is not None else (proto_title if proto_title is not None else proto_2line)
        else:
            proto = proto_2line if proto_2line is not None else (proto_1line if proto_1line is not None else proto_title)

        if proto is not None:
            cloned_elem = copy.deepcopy(proto)
            slide.shapes._spTree.append(cloned_elem)

            for sp in cloned_elem.iter('{http://schemas.openxmlformats.org/presentationml/2006/main}sp'):
                cNvSpPr = sp.find('p:nvSpPr/p:cNvSpPr', ns)
                if cNvSpPr is not None and cNvSpPr.get('txBox') == 'true':
                    txBody = sp.find('p:txBody', ns)
                    if txBody is not None:
                        p_nodes = txBody.findall('a:p', ns)
                        for idx, line_str in enumerate(lines):
                            if idx < len(p_nodes):
                                p_curr = p_nodes[idx]
                            else:
                                p_curr = copy.deepcopy(p_nodes[-1])
                                txBody.append(p_curr)

                            runs = p_curr.findall('a:r', ns)
                            if runs:
                                t = runs[0].find('a:t', ns)
                                if t is not None:
                                    t.text = line_str
                                for extra in runs[1:]:
                                    p_curr.remove(extra)

                        # 여분의 문단 제거
                        if len(p_nodes) > len(lines):
                            for extra_p in p_nodes[len(lines):]:
                                txBody.remove(extra_p)
                    break
        else:
            # 폴백: 순수 텍스트 박스
            txBox = slide.shapes.add_textbox(Inches(0.0), Inches(1.5), prs.slide_width, Inches(4.0))
            tf = txBox.text_frame
            tf.word_wrap = True
            tf.vertical_anchor = MSO_ANCHOR.MIDDLE
            for idx, line_str in enumerate(lines):
                p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
                p.alignment = PP_ALIGN.CENTER
                run = p.add_run()
                run.text = line_str
                run.font.name = "Pretendard"
                run.font.size = Pt(60.0)
                run.font.bold = True
                run.font.color.rgb = RGBColor(255, 255, 255)

    return prs


def get_pptx_bytes(prs):
    """
    Presentation 객체를 메모리 바이트 스트림으로 반환합니다.
    """
    output = io.BytesIO()
    prs.save(output)
    output.seek(0)
    return output


def save_pptx_to_archive(prs, prefix="LOGOS", title="찬양 가사", date_str="20260920"):
    """
    완성된 Presentation 객체를 data/pptx/ 에 표준 파일명으로 자동 저장하고
    (saved_filepath, filename, pptx_bytes) 튜플을 반환합니다.
    """
    ensure_data_directories()
    filename = format_standard_filename(prefix, "PPT", title, date_str, "pptx")
    save_path = os.path.join(DIR_PPTX, filename)
    prs.save(save_path)
    pptx_bytes = get_pptx_bytes(prs).getvalue()
    return save_path, filename, pptx_bytes
