import React, { useState, useRef } from 'react';
import {
  Eye,
  ArrowLeft,
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { uploadCover, deleteCover } from '../api/client';

export default function Sidebar({
  coverUrl,
  onZoomCover,
  onLoadContiText,
  onCoverChange
}) {
  // 캔바 스타일 서브패널 뷰 상태: 'hub' | 'cover' | 'conti'
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('panel');
      if (['cover', 'conti'].includes(p)) return p;
    }
    return 'hub';
  });

  // 업로드 진행 상태 및 피드백 메시지
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // { type: 'success' | 'error', message: string }

  // 파일 input 참조
  const coverInputRef = useRef(null);
  const contiInputRef = useRef(null);

  // 드래그 앤 드롭 상태
  const [isDragOver, setIsDragOver] = useState(false);

  // 1. 표지 이미지 업로드 핸들러
  const handleCoverUpload = async (file) => {
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.png') && !lower.endsWith('.jpg') && !lower.endsWith('.jpeg') && !lower.endsWith('.webp')) {
      setUploadStatus({ type: 'error', message: '이미지 파일 (.png, .jpg, .jpeg, .webp)만 업로드할 수 있습니다.' });
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);
    try {
      const res = await uploadCover(file);
      setUploadStatus({ type: 'success', message: res.message || '표지 이미지가 성공적으로 등록되었습니다.' });
      if (onCoverChange) onCoverChange(res.cover_url);
    } catch (err) {
      setUploadStatus({ type: 'error', message: err.message || '표지 이미지 업로드에 실패했습니다.' });
    } finally {
      setIsUploading(false);
    }
  };

  // 2. 표지 이미지 삭제/초기화 핸들러
  const handleCoverDelete = async () => {
    setIsUploading(true);
    try {
      await deleteCover();
      setUploadStatus({ type: 'success', message: '표지 이미지가 기본값으로 초기화되었습니다.' });
      if (onCoverChange) onCoverChange(null);
    } catch (err) {
      setUploadStatus({ type: 'error', message: err.message || '표지 초기화에 실패했습니다.' });
    } finally {
      setIsUploading(false);
    }
  };

  // 3. 콘티 파일 로드 핸들러 (0초 만에 에디터 및 16:9 미리보기 갱신)
  const handleContiFileUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      if (onLoadContiText) {
        onLoadContiText(content);
      }
      setUploadStatus({
        type: 'success',
        message: '콘티 파일이 즉시 적용되었습니다.'
      });
    };
    reader.onerror = () => {
      setUploadStatus({ type: 'error', message: '콘티 파일을 읽는 도중 오류가 발생했습니다.' });
    };
    reader.readAsText(file, 'utf-8');
  };

  // 뷰 전환
  const switchView = (view) => {
    setCurrentView(view);
    setUploadStatus(null);
    setIsDragOver(false);
  };

  return (
    <aside className="w-full h-full flex flex-col bg-cream-200/80 dark:bg-slate-900 border border-cream-300 dark:border-slate-800 rounded-3xl p-4 overflow-hidden shadow-soft-card transition-colors duration-200">
      {/* ========================================================================= */}
      {/* 1. 메인 허브 뷰: [표지 이미지], [콘티 파일] 2대 버튼만 정돈 */}
      {/* ========================================================================= */}
      {currentView === 'hub' && (
        <div className="flex-1 flex flex-col gap-3 pt-1 pr-1">
          {/* 1) 표지 이미지 버튼 */}
          <button
            type="button"
            onClick={() => switchView('cover')}
            className="w-full p-4 rounded-2xl bg-white/95 dark:bg-slate-850 hover:bg-white dark:hover:bg-slate-800 border border-cream-300/80 dark:border-slate-750 hover:border-sky-400 dark:hover:border-sky-500 transition-all text-left flex items-center gap-3.5 group shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                표지 이미지
              </div>
            </div>
          </button>

          {/* 2) 콘티 파일 버튼 */}
          <button
            type="button"
            onClick={() => switchView('conti')}
            className="w-full p-4 rounded-2xl bg-white/95 dark:bg-slate-850 hover:bg-white dark:hover:bg-slate-800 border border-cream-300/80 dark:border-slate-750 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all text-left flex items-center gap-3.5 group shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                콘티 파일
              </div>
            </div>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. 표지 이미지 업로드 및 관리 전용 서브패널 */}
      {/* ========================================================================= */}
      {currentView === 'cover' && (
        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-200">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-cream-300/80 dark:border-slate-800 shrink-0">
            <button
              onClick={() => switchView('hub')}
              className="p-1.5 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="사이드바 메인으로 돌아가기"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              예배 표지 이미지
            </h4>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* 독립된 순수 파일 input (EPUB 프로젝트와 동일하게 display: none 스타일로 완전 격리) */}
            <input
              ref={coverInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleCoverUpload(e.target.files[0]);
                }
                e.target.value = '';
              }}
            />

            {/* 업로드 드롭존 영역 (클릭 이벤트 간섭 및 윈도우 OS DWM Z-Order 충돌 방지) */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleCoverUpload(e.dataTransfer.files[0]);
                }
              }}
              className={`p-5 rounded-2xl border-2 border-dashed text-center transition-all ${
                isDragOver
                  ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/30'
                  : 'border-cream-300 dark:border-slate-700 bg-white/80 dark:bg-slate-850'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                16:9 표지 이미지를 드래그하거나
              </p>
              <button
                type="button"
                onClick={() => {
                  if (coverInputRef.current) {
                    coverInputRef.current.value = '';
                    coverInputRef.current.click();
                  }
                }}
                className="mt-2.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-98 text-white text-xs font-bold transition-all shadow-sm shadow-sky-500/20 cursor-pointer inline-flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>파일 탐색기 열기</span>
              </button>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                PNG, JPG, WEBP 지원
              </p>
            </div>

            {/* 현재 등록된 표지 썸네일 미리보기 */}
            {coverUrl && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    현재 적용된 표지
                  </span>
                  <button
                    onClick={handleCoverDelete}
                    disabled={isUploading}
                    className="text-[11px] text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> 초기화
                  </button>
                </div>
                <div className="relative aspect-video rounded-xl overflow-hidden border border-cream-300 dark:border-slate-700 bg-black group shadow-sm">
                  <img
                    src={coverUrl}
                    alt="현재 표지"
                    className="w-full h-full object-cover"
                  />
                  <div
                    onClick={() => onZoomCover && onZoomCover(coverUrl)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    <span className="px-2.5 py-1 rounded-lg bg-black/75 text-white text-xs font-bold flex items-center gap-1 backdrop-blur-xs">
                      <Eye className="w-3.5 h-3.5" /> 크게 보기
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 피드백 메시지 */}
            {uploadStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  uploadStatus.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {uploadStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{uploadStatus.message}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. 콘티 파일 업로드 전용 서브패널 */}
      {/* ========================================================================= */}
      {currentView === 'conti' && (
        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-200">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-cream-300/80 dark:border-slate-800 shrink-0">
            <button
              onClick={() => switchView('hub')}
              className="p-1.5 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="사이드바 메인으로 돌아가기"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              찬양 콘티 파일 불러오기
            </h4>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* 독립된 순수 파일 input (EPUB 프로젝트와 동일하게 display: none 스타일로 완전 격리) */}
            <input
              ref={contiInputRef}
              type="file"
              accept=".txt,.md"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleContiFileUpload(e.target.files[0]);
                }
                e.target.value = '';
              }}
            />

            {/* 업로드 드롭존 영역 (클릭 이벤트 간섭 및 윈도우 OS DWM Z-Order 충돌 방지) */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleContiFileUpload(e.dataTransfer.files[0]);
                }
              }}
              className={`p-6 rounded-2xl border-2 border-dashed text-center transition-all ${
                isDragOver
                  ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30'
                  : 'border-cream-300 dark:border-slate-700 bg-white/80 dark:bg-slate-850'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                <FileText className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                찬양 콘티 파일을 드래그하거나
              </p>
              <button
                type="button"
                onClick={() => {
                  if (contiInputRef.current) {
                    contiInputRef.current.value = '';
                    contiInputRef.current.click();
                  }
                }}
                className="mt-2.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-500/20 cursor-pointer inline-flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>파일 탐색기 열기 (.txt, .md)</span>
              </button>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                파일을 올리면 에디터와 미리보기가 즉시 동기화됩니다.
              </p>
            </div>

            {/* 피드백 메시지 */}
            {uploadStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  uploadStatus.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {uploadStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{uploadStatus.message}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
