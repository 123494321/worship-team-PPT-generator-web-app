import React, { useState } from 'react';
import {
  Presentation,
  Maximize2,
  Columns,
  Grid,
  Sparkles,
  Moon,
  Music,
  Layers,
  Info,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// 대괄호 [ ] 기호 완전 제거 헬퍼
function cleanText(text) {
  if (!text) return '';
  return String(text).replace(/[\[\]]/g, '').trim();
}

export default function CanvaCardsPreview({
  liveCards,
  coverImage,
  selectedPreset
}) {
  const [columns, setColumns] = useState(1); 
  const [selectedCard, setSelectedCard] = useState(null);

  const cards = liveCards?.cards || [];
  const totalSlides = liveCards?.total_slides || cards.length || 0;
  const songsFound = liveCards?.songs_found || 0;

  // 현재 선택된 슬라이드 인덱스 및 이전/다음 네비게이션
  const currentIndex = selectedCard
    ? cards.findIndex((c) => (c.id || c.index) === (selectedCard.id || selectedCard.index))
    : -1;

  const handlePrevSlide = () => {
    if (currentIndex > 0) {
      setSelectedCard(cards[currentIndex - 1]);
    }
  };

  const handleNextSlide = () => {
    if (currentIndex >= 0 && currentIndex < cards.length - 1) {
      setSelectedCard(cards[currentIndex + 1]);
    }
  };

  // 키보드 방향키(좌/우, 상/하, 스페이스) 및 ESC 네비게이션
  React.useEffect(() => {
    if (!selectedCard) return;

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key === 'Escape') {
        setSelectedCard(null);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        handleNextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCard, cards, currentIndex]);

  // URL ?slide=N 파라미터 존재 시 스크롤 & ?zoom=N 파라미터 존재 시 해당 슬라이드 자동 모달 확대
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetSlide = parseInt(params.get('slide'), 10);
    const zoomSlide = parseInt(params.get('zoom'), 10);

    if (cards.length > 0) {
      if (targetSlide) {
        setTimeout(() => {
          const el = document.getElementById(`slide-card-${targetSlide}`);
          if (el) {
            el.scrollIntoView({ behavior: 'auto', block: 'start' });
          }
        }, 300);
      }
      if (zoomSlide) {
        const found = cards.find((c) => (c.id || c.index) === zoomSlide);
        if (found) {
          setSelectedCard(found);
        }
      }
    }
  }, [cards]);

  return (
    <div className="flex flex-col h-full bg-cream-50/60 dark:bg-slate-900/60 rounded-3xl p-4 lg:p-5 border border-cream-200/90 dark:border-slate-800 shadow-soft-card">
      {/* 상단 컨트롤 바 (불필요한 긴 텍스트/설명 제거하여 총 장수/곡수 카운터가 절대 찌그러지지 않도록 정돈) */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-cream-200/60 dark:border-slate-800/60 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-sky-400 flex items-center justify-center text-white shadow-sm shadow-sky-500/20 shrink-0">
            <Presentation className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
            슬라이드 미리보기
          </h3>
        </div>

        {/* 메타 뱃지(총 N장 | N곡) 및 열 전환 버튼 */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-cream-200 dark:border-slate-700 text-xs shadow-2xs whitespace-nowrap">
            <div className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-bold">
              <Layers className="w-3.5 h-3.5" />
              <span>총 {totalSlides}장</span>
            </div>
            <span className="text-slate-300 dark:text-slate-600 font-normal">|</span>
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
              <Music className="w-3.5 h-3.5" />
              <span>{songsFound}곡</span>
            </div>
          </div>

          <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl p-0.5 border border-cream-200 dark:border-slate-700 shadow-2xs">
            <button
              onClick={() => setColumns(1)}
              title="1열 보기 (기본 크게 보기)"
              className={`p-1.5 rounded-lg transition-all ${
                columns === 1
                  ? 'bg-sky-500 text-white shadow-2xs font-bold'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5 rotate-90" />
            </button>
            <button
              onClick={() => setColumns(2)}
              title="2열 보기 (표준)"
              className={`p-1.5 rounded-lg transition-all ${
                columns === 2
                  ? 'bg-sky-500 text-white shadow-2xs font-bold'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setColumns(3)}
              title="3열 보기 (컴팩트)"
              className={`hidden md:block p-1.5 rounded-lg transition-all ${
                columns === 3
                  ? 'bg-sky-500 text-white shadow-2xs font-bold'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 카드 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto pr-1">
        {cards.length === 0 ? (
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-8 rounded-2xl border-2 border-dashed border-cream-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mb-3 shadow-inner">
              <Sparkles className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
              슬라이드 카드를 실시간 생성하는 중입니다...
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              좌측 찬양 콘티 에디터에 가사를 입력하면 즉시 16:9 비율의 슬라이드 카드가 나타납니다.
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-4 ${
              columns === 1
                ? 'grid-cols-1'
                : columns === 2
                ? 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {cards.map((card, idx) => (
              <SlideCardItem
                key={card.id || card.index || idx}
                card={card}
                coverImage={coverImage}
                onSelect={() => setSelectedCard(card)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 슬라이드 상세 확대 모달 (넉넉하게 화면을 채우는 대형 와이드 뷰 & 키보드/UI 네비게이션) */}
      {selectedCard && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 md:p-6 lg:p-8 animate-in fade-in duration-200"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="relative w-full max-w-[1360px] max-h-[96vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 md:p-6 shadow-2xl border border-cream-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 상단 컨트롤 바 */}
            <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="px-3 py-1 rounded-xl text-xs font-mono font-black bg-sky-500 text-white shadow-sm shadow-sky-500/30 shrink-0">
                  Slide #{selectedCard.id || selectedCard.index}
                </span>
                <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                  {currentIndex + 1} / {cards.length}
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                  {cleanText(selectedCard.title) || selectedCard.type.toUpperCase()}
                </span>
                {selectedCard.note && (
                  <span className="hidden md:inline-flex text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200/50 dark:border-emerald-800/40">
                    {cleanText(selectedCard.note)}
                  </span>
                )}
              </div>

              {/* 슬라이드 이전/다음 헤더 네비게이션 버튼 & 닫기 */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handlePrevSlide}
                  disabled={currentIndex <= 0}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                    currentIndex > 0
                      ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs cursor-pointer'
                      : 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-50 dark:bg-slate-850'
                  }`}
                  title="이전 슬라이드 (←)"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">이전</span>
                </button>
                <button
                  onClick={handleNextSlide}
                  disabled={currentIndex >= cards.length - 1}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                    currentIndex < cards.length - 1
                      ? 'bg-sky-500 hover:bg-sky-600 text-white shadow-sm shadow-sky-500/25 cursor-pointer'
                      : 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-50 dark:bg-slate-850'
                  }`}
                  title="다음 슬라이드 (→)"
                >
                  <span className="hidden sm:inline">다음</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
                <button
                  onClick={() => setSelectedCard(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                  title="닫기 (ESC)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 확대된 16:9 슬라이드 & 좌우 플로팅 네비게이션 버튼 */}
            <div
              className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl bg-black select-none flex-1 min-h-0 group"
              style={{ containerType: 'inline-size' }}
            >
              <SlideCardContent card={selectedCard} coverImage={coverImage} isLarge />

              {/* 좌측 플로팅 네비게이션 버튼 */}
              {currentIndex > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevSlide();
                  }}
                  className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/60 hover:bg-black/85 text-white/90 hover:text-white border border-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer z-20"
                  title="이전 슬라이드 (← 방향키)"
                >
                  <ChevronLeft className="w-7 h-7 sm:w-8 sm:h-8 -translate-x-0.5" />
                </button>
              )}

              {/* 우측 플로팅 네비게이션 버튼 */}
              {currentIndex < cards.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextSlide();
                  }}
                  className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/60 hover:bg-black/85 text-white/90 hover:text-white border border-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer z-20"
                  title="다음 슬라이드 (→ 방향키 또는 스페이스)"
                >
                  <ChevronRight className="w-7 h-7 sm:w-8 sm:h-8 translate-x-0.5" />
                </button>
              )}
            </div>

            {/* 하단 안내 바 */}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
              <span className="flex items-center gap-1.5 font-medium">
                <Info className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                키보드 방향키(←, →, 스페이스) 또는 좌우 버튼으로 슬라이드를 넘길 수 있습니다.
              </span>
              <span className="font-semibold text-slate-400 dark:text-slate-500 hidden sm:inline">
                ESC 키로 닫기
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 개별 슬라이드 카드 아이템 (16:9 와이드)
function SlideCardItem({ card, coverImage, onSelect }) {
  const displayTitle = card.type === 'title'
    ? (card.title?.startsWith('[') ? card.title : `[${cleanText(card.title) || '곡 제목'}]`)
    : (cleanText(card.title) || (card.lines?.[0] ? card.lines[0] : '슬라이드'));
  const displayNote = cleanText(card.note) || `${card.lines?.length || 0}줄 자막`;

  return (
    <div
      id={`slide-card-${card.id || card.index}`}
      onClick={onSelect}
      className="group relative cursor-pointer flex flex-col bg-white dark:bg-slate-800/90 rounded-2xl border border-cream-200/90 dark:border-slate-700/80 shadow-soft-card hover:shadow-soft-hover hover:border-sky-300 dark:hover:border-sky-500 transition-all duration-200 overflow-hidden"
    >
      {/* 16:9 와이드 캔버스 비율 & Container Queries 적용으로 화면 크기에 비례하여 텍스트 크기 자동 고정 */}
      <div
        className="relative w-full aspect-video overflow-hidden bg-black select-none"
        style={{ containerType: 'inline-size' }}
      >
        <SlideCardContent card={card} coverImage={coverImage} />

        {/* 호버 오버레이 */}
        <div className="absolute inset-0 bg-sky-950/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="px-3 py-1.5 rounded-xl bg-black/80 text-white text-xs font-bold backdrop-blur-xs flex items-center gap-1.5 shadow-lg border border-white/20">
            <Maximize2 className="w-3.5 h-3.5 text-sky-400" /> 전체화면 확대
          </span>
        </div>

        {/* 슬라이드 넘버링 뱃지 (좌상단) */}
        <div className="absolute top-2 left-2 z-10">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-black bg-black/75 text-white backdrop-blur-xs shadow-md border border-white/10">
            #{String(card.id || card.index).padStart(2, '0')}
          </span>
        </div>

        {/* 슬라이드 타입 뱃지 (우상단) */}
        <div className="absolute top-2 right-2 z-10">
          {card.type === 'cover' && (
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-sky-500 text-white shadow-md">
              표지
            </span>
          )}
          {card.type === 'blank' && (
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500 text-slate-950 shadow-md">
              암전
            </span>
          )}
          {card.type === 'prayer' && (
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-500 text-white shadow-md">
              기도
            </span>
          )}
          {card.type === 'title' && (
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-600 text-white shadow-md">
              곡제목
            </span>
          )}
          {card.type === 'lyrics' && (
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-sky-950/90 text-sky-300 border border-sky-500/40 backdrop-blur-xs shadow-md">
              가사
            </span>
          )}
        </div>
      </div>

      {/* 하단 카드 정보 바: 회색을 제거하고 선명한 텍스트 및 컬러 뱃지 적용 */}
      <div className="px-4 py-2.5 bg-cream-50/80 dark:bg-slate-850 border-t border-cream-200/60 dark:border-slate-750 flex items-center justify-between text-xs">
        <span className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-[70%]">
          {displayTitle}
        </span>
        <span className="px-2.5 py-0.5 rounded-lg font-bold text-[11px] bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/40 shrink-0">
          {displayNote}
        </span>
      </div>
    </div>
  );
}

// 16:9 슬라이드 내부 렌더러 (실제 청년부 기준 PPTX 파일 1:1 완벽 일치 WYSIWYG)
// Container Query 단위(cqw)를 활용하여 작은 화면에서도 텍스트와 슬라이드의 비율이 100% 동일하게 유지됨
function SlideCardContent({ card, coverImage, isLarge = false }) {
  // 1. 표지 슬라이드: 실제 PPT처럼 표지 이미지 원본을 16:9 슬라이드 전체에 100% 그대로 표시
  if (card.type === 'cover') {
    return (
      <div className="w-full h-full relative flex items-center justify-center overflow-hidden bg-black select-none">
        {coverImage ? (
          <img
            src={coverImage}
            alt="예배 표지 원본"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-black flex flex-col items-center justify-center p-6 text-center text-white">
            <span
              className="font-black text-sky-400 uppercase tracking-widest mb-[1cqw]"
              style={{ fontSize: 'clamp(11px, 2.2cqw, 18px)' }}
            >
              WORSHIP PPT COVER
            </span>
            <h2
              className="font-black text-white tracking-tight"
              style={{ fontSize: 'clamp(18px, 4.2cqw, 42px)' }}
            >
              {cleanText(card.title) || '주일 청년 찬양 모임'}
            </h2>
            <span
              className="font-bold text-amber-300 mt-[1cqw]"
              style={{ fontSize: 'clamp(11px, 2.0cqw, 16px)' }}
            >
              {cleanText(card.note) || '공식 16:9 예배 표준 양식'}
            </span>
          </div>
        )}
      </div>
    );
  }

  // 2. 암전 슬라이드: 빔프로젝터 전환용 완전 암전 (Pure Black #000000)
  // 대괄호 []를 완전히 제거한 BLANK 표시 및 선명한 앰버/골드 컬러 적용
  if (card.type === 'blank') {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center p-4 text-center select-none">
        <div className="w-[5cqw] h-[5cqw] min-w-8 min-h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-400 mb-[1cqw] shadow-inner">
          <Moon className="w-[2.5cqw] h-[2.5cqw] min-w-4 min-h-4" />
        </div>
        <p
          className="font-mono font-black text-amber-400 tracking-widest"
          style={{ fontSize: 'clamp(14px, 3.6cqw, 34px)' }}
        >
          BLANK
        </p>
        <p
          className="font-bold text-amber-300 tracking-wide mt-[0.8cqw]"
          style={{ fontSize: 'clamp(11px, 2.2cqw, 18px)' }}
        >
          예배 전환 완전 암전
        </p>
      </div>
    );
  }

  // 3. 대표기도 슬라이드: Pure Black 바탕 상단 20% 배치
  if (card.type === 'prayer') {
    const prayerTitle = cleanText(card.title) || '대표기도';
    return (
      <div className="w-full h-full bg-black select-none relative">
        <div
          style={{
            position: 'absolute',
            top: '20.0%',
            left: '5.0%',
            width: '90.0%',
            height: '35.0%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}
        >
          {/* 보조 텍스트: 크기 확대 및 굵은 인디고 컬러 적용 */}
          <span
            className="font-black text-indigo-400 tracking-widest uppercase mb-[0.6cqw]"
            style={{ fontSize: 'clamp(11px, 2.2cqw, 18px)' }}
          >
            REPRESENTATIVE PRAYER
          </span>
          <h3
            className="font-black text-white tracking-tight"
            style={{ fontSize: 'clamp(16px, 4.2cqw, 42px)' }}
          >
            {prayerTitle}
          </h3>
          {card.lines?.slice(1).map((line, lIdx) => (
            <p
              key={lIdx}
              className="font-bold text-sky-200 mt-[0.8cqw]"
              style={{ fontSize: 'clamp(12px, 2.6cqw, 24px)' }}
            >
              {cleanText(line)}
            </p>
          ))}
        </div>
      </div>
    );
  }

  // 4. 곡 제목 슬라이드: 실제 PPT 위치 (상단 top: 22.36%, height: 24.65%, left: 6.88%, width: 86.25%)
  // 교회 표준 규격에 맞추어 [곡 제목] 형태로 대괄호 복원
  if (card.type === 'title') {
    const rawName = cleanText(card.title);
    const songTitle = rawName ? `[${rawName}]` : '[곡 제목]';
    const songNote = cleanText(card.note);
    return (
      <div className="w-full h-full bg-black select-none relative">
        <div
          style={{
            position: 'absolute',
            top: '22.36%',
            left: '6.88%',
            width: '86.25%',
            height: '24.65%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}
        >
          {/* 파란색 보조 텍스트: 크기를 키우고 더 선명한 스카이블루 볼드로 강조 */}
          <span
            className="font-black text-sky-400 tracking-widest uppercase mb-[0.6cqw]"
            style={{ fontSize: 'clamp(11px, 2.4cqw, 20px)' }}
          >
            PRAISE & WORSHIP
          </span>
          {/* 곡 제목: [곡 제목] 형태의 중앙 볼드 화이트 (PPT 81pt와 1:1 비율) */}
          <h3
            className="font-black text-white tracking-tight"
            style={{
              fontSize: 'clamp(16px, 4.2cqw, 44px)',
              fontFamily: "'Pretendard', 'Malgun Gothic', sans-serif"
            }}
          >
            {songTitle}
          </h3>
          {/* 곡 번호/루틴 보조 텍스트: 산뜻한 에메랄드 컬러로 확대 */}
          {songNote && (
            <span
              className="font-bold text-emerald-400 mt-[0.8cqw] tracking-wide"
              style={{ fontSize: 'clamp(11px, 2.2cqw, 18px)' }}
            >
              {songNote}
            </span>
          )}
        </div>
      </div>
    );
  }

  // 5. 실제 PPT 고대비 2줄 가사 자막 슬라이드:
  // 중요: 실제 PPT 표준 양식 규격인 상단 top: 20.89%, height: 34.22%, width: 100% 위치에 정확히 배치!
  // cqw 단위로 슬라이드 가로폭 대비 4.15% (실제 PPT 81pt / 1920px = 4.21%) 폰트 크기 유지
  return (
    <div className="w-full h-full bg-black select-none relative">
      <div
        style={{
          position: 'absolute',
          top: '20.89%',
          left: '0.0%',
          width: '100.0%',
          height: '34.22%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          paddingLeft: '4cqw',
          paddingRight: '4cqw'
        }}
      >
        <div className="w-full flex flex-col items-center justify-center space-y-[0.8cqw]">
          {card.lines && card.lines.length > 0 ? (
            card.lines.map((line, lIdx) => (
              <p
                key={lIdx}
                className="font-bold text-white tracking-tight leading-snug"
                style={{
                  fontSize: 'clamp(13px, 4.15cqw, 40px)',
                  fontFamily: "'Pretendard', 'Malgun Gothic', sans-serif"
                }}
              >
                {cleanText(line)}
              </p>
            ))
          ) : (
            <p
              className="font-bold text-sky-400/80"
              style={{ fontSize: 'clamp(11px, 2.2cqw, 18px)' }}
            >
              가사 내용 없음
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
