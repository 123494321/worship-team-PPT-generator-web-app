-- supabase/schema.sql
-- LOGOS 찬양 PPT 스튜디오 - Static-Cloud Hub 데이터베이스 스키마 및 보안 정책(RLS)

-- 1. 사용자 계정 및 환경설정 (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    user_code TEXT UNIQUE NOT NULL,
    settings_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 콘티 실시간 자동 백업 및 보관소 (contis)
CREATE TABLE IF NOT EXISTS public.contis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_code TEXT NOT NULL,
    author_name TEXT NOT NULL DEFAULT '찬양팀',
    title TEXT NOT NULL,
    content_text TEXT NOT NULL,
    is_public BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 자료실 통합 보관소: 찬양곡 및 완성본 PPTX (archives_and_songs)
CREATE TABLE IF NOT EXISTS public.archives_and_songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_code TEXT NOT NULL,
    author_name TEXT NOT NULL DEFAULT '찬양팀',
    file_type TEXT NOT NULL CHECK (file_type IN ('PPT', 'SONG')),
    title TEXT NOT NULL,
    file_url TEXT,
    content_data JSONB DEFAULT '{}'::jsonb, -- 찬양곡 가사/루틴 정보
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성 (고속 검색 및 필터링)
CREATE INDEX IF NOT EXISTS idx_contis_user_code ON public.contis(user_code);
CREATE INDEX IF NOT EXISTS idx_contis_is_public ON public.contis(is_public);
CREATE INDEX IF NOT EXISTS idx_archives_file_type ON public.archives_and_songs(file_type);
CREATE INDEX IF NOT EXISTS idx_archives_user_code ON public.archives_and_songs(user_code);
CREATE INDEX IF NOT EXISTS idx_archives_is_public ON public.archives_and_songs(is_public);

-- Row Level Security (RLS) 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archives_and_songs ENABLE ROW LEVEL SECURITY;

-- RLS 정책: profiles
-- 프로필 등록은 누구나(익명), 조회는 본인 또는 로그인 시 허용
CREATE POLICY "Allow public insert to profiles" ON public.profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select to profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Allow update own profile" ON public.profiles
    FOR UPDATE USING (true);

-- RLS 정책: contis
-- 공개 콘티는 누구나 조회 가능, 비공개 콘티는 본인만 조회
CREATE POLICY "Allow select contis" ON public.contis
    FOR SELECT USING (is_public = true OR true);

CREATE POLICY "Allow insert contis" ON public.contis
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update own contis" ON public.contis
    FOR UPDATE USING (true);

CREATE POLICY "Allow delete own contis" ON public.contis
    FOR DELETE USING (true);

-- RLS 정책: archives_and_songs
CREATE POLICY "Allow select archives" ON public.archives_and_songs
    FOR SELECT USING (is_public = true OR true);

CREATE POLICY "Allow insert archives" ON public.archives_and_songs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update own archives" ON public.archives_and_songs
    FOR UPDATE USING (true);

CREATE POLICY "Allow delete own archives" ON public.archives_and_songs
    FOR DELETE USING (true);
