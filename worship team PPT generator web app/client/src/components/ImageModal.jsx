import React from 'react';
import { X, ZoomIn } from 'lucide-react';

export default function ImageModal({ isOpen, imageUrl, onClose }) {
  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 닫기 바 */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-900/80 border-b border-slate-800 text-white">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-400">
            <ZoomIn className="w-4 h-4" />
            <span>표지 이미지 고해상도 원본 뷰어 (1920x1080 와이드)</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 이미지 컨테이너 */}
        <div className="w-full aspect-video flex items-center justify-center bg-black">
          <img
            src={imageUrl}
            alt="고해상도 표지 원본"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}
