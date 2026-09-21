import React, { useEffect, useRef } from 'react';
import { FileText } from 'lucide-react';
import { parseLiveCards } from '../api/client';

export default function ContiEditor({
  contiText,
  setContiText,
  setLiveCards,
  onLiveCardsChange
}) {
  const debounceTimerRef = useRef(null);
  const isFirstMountRef = useRef(true);
  const updateCards = onLiveCardsChange || setLiveCards;

  const runSync = async (text) => {
    try {
      const cardsData = await parseLiveCards(text);
      if (cardsData && cardsData.cards && cardsData.cards.length > 0) {
        if (updateCards) updateCards(cardsData);
      }
    } catch (e) {
      console.error('Failed to parse cards', e);
    }
  };

  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      runSync(contiText);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      runSync(contiText);
    }, 250);

    return () => clearTimeout(debounceTimerRef.current);
  }, [contiText]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-3xl p-4 lg:p-5 border border-cream-200/90 dark:border-slate-800 shadow-soft-card">
      {/* 에디터 상단 타이틀 바 (불필요한 설명 및 스니펫/알림 완전 제거) */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-cream-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-white shadow-sm shadow-amber-500/20">
            <FileText className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            찬양 콘티 에디터
          </h3>
        </div>
      </div>

      {/* 에디터 텍스트 본문 (화면을 넓고 깔끔하게 채움) */}
      <div className="relative flex-1 min-h-[300px] flex flex-col">
        <textarea
          value={contiText}
          onChange={(e) => setContiText(e.target.value)}
          placeholder="찬양 콘티를 입력하세요..."
          className="w-full flex-1 p-4 rounded-2xl bg-cream-50/60 dark:bg-slate-950/60 border border-cream-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 text-sm font-sans leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
          spellCheck="false"
        />

        {/* 하단 글자수/줄수 */}
        <div className="absolute bottom-3 right-4 px-2.5 py-0.5 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs border border-cream-200 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400 font-mono pointer-events-none">
          {contiText.split('\n').length} lines · {contiText.length} chars
        </div>
      </div>
    </div>
  );
}
