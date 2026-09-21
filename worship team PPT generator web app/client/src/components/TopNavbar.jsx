import React from 'react';
import {
  Sparkles,
  Sun,
  Moon,
  Presentation
} from 'lucide-react';

export default function TopNavbar({
  isDark,
  onToggleTheme,
  onGeneratePpt,
  isGenerating
}) {
  return (
    <header className="h-16 px-4 lg:px-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-cream-200/80 dark:border-slate-800/80 flex items-center justify-between shrink-0 z-20">
      {/* 1. 로고 및 브랜드 ("LOGOS 작업실") */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
          <Presentation className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-sm sm:text-base font-black text-slate-800 dark:text-white tracking-tight whitespace-nowrap">
              LOGOS 작업실
            </h1>
            <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/40">
              v2.0
            </span>
          </div>
          <p className="hidden sm:block text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            교회 표준 16:9 와이드 찬양 PPT 자동화
          </p>
        </div>
      </div>

      {/* 2. 우측 컨트롤 (화이트/블랙 테마 토글, PPT 생성 다운로드 버튼) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* 화이트/블랙 테마 토글 */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-2xl bg-cream-100/80 dark:bg-slate-800 border border-cream-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-sky-500 transition-colors shadow-2xs"
          title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* 대형 PPT 자동 생성 버튼 */}
        <button
          onClick={onGeneratePpt}
          disabled={isGenerating}
          className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-sky-500/25 active:scale-98 transition-all shrink-0"
        >
          <Sparkles className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isGenerating ? 'PPT 렌더링 중...' : 'PPT 생성 (16:9 와이드)'}</span>
          <span className="sm:hidden font-extrabold">{isGenerating ? '생성 중' : 'PPT 생성'}</span>
        </button>
      </div>
    </header>
  );
}
