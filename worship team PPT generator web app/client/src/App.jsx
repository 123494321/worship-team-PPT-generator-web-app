import React, { useState, useEffect } from 'react';
import TopNavbar from './components/TopNavbar';
import Sidebar from './components/Sidebar';
import ContiEditor from './components/ContiEditor';
import CanvaCardsPreview from './components/CanvaCardsPreview';
import ImageModal from './components/ImageModal';
import {
  getCoverInfo,
  parseLiveCards,
  generatePpt,
  downloadPptFile
} from './api/client';
import { CheckCircle2, AlertCircle, Download, PenTool, Presentation, Settings2 } from 'lucide-react';

export default function App() {
  // 테마 (라이트 / 다크)
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('theme=dark')) return true;
    return localStorage.getItem('theme') === 'dark';
  });

  // 16:9 예배 표지 이미지 URL
  const [coverUrl, setCoverUrl] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);

  // 콘티 기본 템플릿 양식
  const DEFAULT_CONTI_TEMPLATE = `# 2026.09.20 LOGOS 청년 찬양 모임
기도: ㅇㅇㅇ 청년

## 1. 
루틴: 

[V]

[P]

[C]


## 2. 
루틴: 

[V]

[P]

[C]`;

  const [contiText, setContiText] = useState(DEFAULT_CONTI_TEMPLATE);

  // 실시간 16:9 슬라이드 카드 상태
  const [liveCards, setLiveCards] = useState({ cards: [], total_slides: 0, songs_found: 0 });

  // 모바일/태블릿(< xl) 전용 3대 뷰 전환 상태: 'editor' | 'preview' | 'sidebar'
  const [mobileStudioTab, setMobileStudioTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (['editor', 'preview', 'sidebar'].includes(tab)) return tab;
      if (window.location.search.includes('slide')) return 'preview';
    }
    return 'editor';
  });

  // PPT 생성 진행 및 결과 모달
  const [isGenerating, setIsGenerating] = useState(false);
  const [genResult, setGenResult] = useState(null);

  // 테마 동기화
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // 마운트 시 표지 정보 로드 & 초기 콘티 16:9 카드 파싱
  useEffect(() => {
    const initApp = async () => {
      try {
        const cInfo = await getCoverInfo();
        if (cInfo.has_cover && cInfo.cover_url) {
          setCoverUrl(cInfo.cover_url);
        }
      } catch (e) {
        console.error('Failed to load cover info', e);
      }

      try {
        const cardsData = await parseLiveCards(contiText);
        if (cardsData && cardsData.cards && cardsData.cards.length > 0) {
          setLiveCards(cardsData);
        }
      } catch (e) {
        console.error('Failed to parse initial cards', e);
      }
    };

    initApp();
  }, []);

  // PPT 생성 처리 (단 1번의 클릭으로 직접 다운로드)
  const handleGeneratePpt = async () => {
    if (!contiText.trim()) {
      alert('찬양 콘티 내용을 입력해 주세요.');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await generatePpt(contiText);

      if (res.success || res.status === 'success') {
        setGenResult({
          success: true,
          filename: res.filename,
          slideCount: res.slide_count,
          downloadUrl: res.download_url
        });
        // 브라우저 직접 다운로드 트리거
        downloadPptFile(res.filename);
      } else {
        setGenResult({
          success: false,
          error: res.error || 'PPT 생성 중 오류가 발생했습니다.'
        });
      }
    } catch (e) {
      setGenResult({
        success: false,
        error: e.response?.data?.detail || e.message || '서버 통신 오류가 발생했습니다.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-cream-100 dark:bg-slate-950 font-sans transition-colors duration-200">
      {/* 1. 상단 바 (LOGOS 로고, 테마 토글, 1초 PPT 생성 버튼) */}
      <TopNavbar
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onGeneratePpt={handleGeneratePpt}
        isGenerating={isGenerating}
      />

      {/* 2. 메인 작업실 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden p-3 lg:p-4">
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* 모바일/태블릿(< xl) 전용 3대 뷰 세그먼트 컨트롤 */}
          <div className="flex xl:hidden items-center justify-between gap-1 p-1 bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-cream-200 dark:border-slate-800 shadow-2xs mb-2 shrink-0">
            <button
              onClick={() => setMobileStudioTab('editor')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mobileStudioTab === 'editor'
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-cream-100 dark:hover:bg-slate-800'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>콘티 에디터</span>
            </button>
            <button
              onClick={() => setMobileStudioTab('preview')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mobileStudioTab === 'preview'
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-cream-100 dark:hover:bg-slate-800'
              }`}
            >
              <Presentation className="w-3.5 h-3.5" />
              <span>슬라이드 미리보기 ({liveCards?.total_slides || 0})</span>
            </button>
            <button
              onClick={() => setMobileStudioTab('sidebar')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mobileStudioTab === 'sidebar'
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-cream-100 dark:hover:bg-slate-800'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>파일 & 표지</span>
            </button>
          </div>

          {/* 메인 3열 스튜디오 (xl 이상에서 풀 배치) */}
          <div className="flex-1 flex overflow-hidden gap-3 lg:gap-4 h-full">
            {/* 좌측 사이드바: [표지 이미지], [콘티 파일] 2대 버튼 */}
            <aside
              className={`w-72 lg:w-80 shrink-0 h-full overflow-hidden ${
                mobileStudioTab === 'sidebar' ? 'block w-full' : 'hidden'
              } xl:block`}
            >
              <Sidebar
                coverUrl={coverUrl}
                onZoomCover={(url) => setZoomedImage(url)}
                onLoadContiText={(text) => setContiText(text)}
                onCoverChange={(newUrl) => setCoverUrl(newUrl)}
              />
            </aside>

            {/* 중앙 콘티 에디터 영역 */}
            <main
              className={`flex-1 h-full min-w-0 ${
                mobileStudioTab === 'editor' ? 'block' : 'hidden'
              } xl:block`}
            >
              <ContiEditor
                contiText={contiText}
                setContiText={setContiText}
                onLiveCardsChange={(cardsData) => setLiveCards(cardsData)}
              />
            </main>

            {/* 우측 16:9 슬라이드 카드 실시간 갤러리 */}
            <aside
              className={`shrink-0 h-full overflow-hidden ${
                mobileStudioTab === 'preview' ? 'block flex-1 w-full' : 'hidden'
              } xl:block xl:w-[440px] 2xl:w-[520px]`}
            >
              <CanvaCardsPreview
                liveCards={liveCards}
                coverImage={coverUrl}
              />
            </aside>
          </div>
        </div>
      </div>

      {/* 16:9 표지 확대 모달 */}
      <ImageModal
        isOpen={Boolean(zoomedImage)}
        onClose={() => setZoomedImage(null)}
        imageUrl={zoomedImage}
      />

      {/* PPT 완료 알림 모달 */}
      {genResult && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setGenResult(null)}
        >
          <div
            className="relative max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-cream-200 dark:border-slate-800 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {genResult.success ? (
              <>
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
                  16:9 와이드 PPT 생성 완료!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-mono break-all px-2">
                  {genResult.filename}
                </p>
                <div className="p-3 rounded-2xl bg-cream-50 dark:bg-slate-800/60 mb-5 text-xs text-slate-600 dark:text-slate-300">
                  총 <strong className="text-sky-500">{genResult.slideCount}</strong>장의 고대비 2줄 자막 슬라이드가 완성되었습니다. 브라우저 다운로드가 자동으로 시작됩니다.
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadPptFile(genResult.filename)}
                    className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/25 transition-all"
                  >
                    <Download className="w-4 h-4" /> 다시 다운로드
                  </button>
                  <button
                    onClick={() => setGenResult(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    닫기
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
                  생성 실패
                </h3>
                <p className="text-xs text-rose-500 mb-4 px-2">
                  {genResult.error}
                </p>
                <button
                  onClick={() => setGenResult(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition-colors"
                >
                  확인
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
