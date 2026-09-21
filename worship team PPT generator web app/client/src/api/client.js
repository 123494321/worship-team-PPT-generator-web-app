// client/src/api/client.js
// LOGOS Worship Studio - 핵심 REST API 통신 모듈

const API_BASE = '/api';

/**
 * 16:9 표지 이미지 정보 조회
 */
export async function getCoverInfo() {
  const res = await fetch(`${API_BASE}/cover/info`);
  if (!res.ok) {
    return { has_cover: false, cover_url: null };
  }
  return await res.json();
}

/**
 * 16:9 표지 이미지 업로드
 */
export async function uploadCover(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/cover/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '업로드 실패' }));
    throw new Error(err.detail || '표지 이미지 업로드 중 오류가 발생했습니다.');
  }

  return await res.json();
}

/**
 * 16:9 표지 이미지 삭제/초기화
 */
export async function deleteCover() {
  const res = await fetch(`${API_BASE}/cover`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('표지 이미지 초기화에 실패했습니다.');
  }
  return await res.json();
}

/**
 * 실시간 16:9 슬라이드 카드 파싱
 */
export async function parseLiveCards(contiText) {
  if (!contiText || !contiText.trim()) {
    return { status: 'success', cards: [], total_slides: 0, songs_found: 0, plan_text: '' };
  }

  const res = await fetch(`${API_BASE}/conti/parse-live-cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conti_text: contiText }),
  });
  const data = await res.json();

  let songCount = 0;
  const cards = (data.cards || []).map((c) => {
    let note = '';
    if (c.type === 'cover') note = '예배 표지';
    else if (c.type === 'blank') note = '암전';
    else if (c.type === 'prayer') note = '대표기도';
    else if (c.type === 'title') {
      note = '곡 제목';
      songCount++;
    } else if (c.type === 'lyrics') {
      note = `${c.lines?.length || 0}줄 자막`;
    }

    return {
      id: c.index,
      type: c.type,
      title: c.title || c.lines?.[0] || c.text || '',
      lines: c.lines || [],
      note: note
    };
  });

  return {
    status: 'success',
    cards: cards,
    total_slides: data.slide_count || cards.length,
    songs_found: Math.max(songCount, 1),
    plan_text: data.plan_text || ''
  };
}

/**
 * 콘티 린트 점검
 */
export async function lintConti(contiText) {
  if (!contiText || !contiText.trim()) {
    return { status: 'success', warnings: [], song_count: 0 };
  }
  const res = await fetch(`${API_BASE}/conti/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conti_text: contiText }),
  });
  const data = await res.json();
  return {
    status: 'success',
    warnings: data.warnings || [],
    song_count: data.song_count || 0
  };
}

/**
 * [대안 1] PPT 생성 실행 (마스터 템플릿 기반)
 */
export async function generatePpt(arg1) {
  let contiText = arg1;
  if (typeof arg1 === 'object' && arg1 !== null) {
    contiText = arg1.conti_text || '';
  }

  const parseRes = await fetch(`${API_BASE}/conti/parse-live-cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conti_text: contiText }),
  });
  const parseData = await parseRes.json();
  const planText = parseData.plan_text || contiText;

  const formData = new FormData();
  formData.append('plan_text', planText);
  formData.append('conti_text', contiText);
  formData.append('preset_name', 'LOGOS');

  const res = await fetch(`${API_BASE}/ppt/generate`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '생성 실패' }));
    throw new Error(err.detail || 'PPT 생성 처리 중 오류가 발생했습니다.');
  }

  const data = await res.json();
  return {
    success: true,
    status: 'success',
    filename: data.filename,
    slide_count: data.slide_count,
    download_url: data.download_url
  };
}

/**
 * 브라우저 직접 파일 다운로드
 */
export function downloadPptFile(filename) {
  if (!filename) return;
  const downloadUrl = `${API_BASE}/ppt/download/${encodeURIComponent(filename)}`;
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 하위 호환성용 별칭
export const uploadStandardCover = (_, file) => uploadCover(file);
export const getCoverAnalysis = async () => {
  const info = await getCoverInfo();
  return {
    status: 'success',
    image_url: info.cover_url,
    has_cover: info.has_cover
  };
};
export const getPresets = async () => ({
  status: 'success',
  presets: [{ id: 'LOGOS', name: 'LOGOS 표준', has_template: true, has_cover: true, is_default: true }],
  default_preset: 'LOGOS'
});
