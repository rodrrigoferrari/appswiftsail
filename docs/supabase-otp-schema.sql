-- ==============================================================================
-- SWIFTSAIL OS - AUTENTICAÇÃO PASSWORDLESS VIA WHATSAPP (OTP)
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Códigos OTP
CREATE TABLE IF NOT EXISTS public.otp_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    attempts INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para busca rápida pelo número
CREATE INDEX IF NOT EXISTS idx_otp_phone ON public.otp_codes(phone);

-- Ativar RLS (Row Level Security)
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
-- Somente o backend (usando SUPABASE_SERVICE_ROLE_KEY) acessará esta tabela.

-- 2. Tabela de Perfis (Profiles) associada ao auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    phone TEXT UNIQUE,
    name TEXT,
    role TEXT DEFAULT 'customer',
    cliente_id TEXT,
    cliente_ids TEXT[],
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile'
    ) THEN
        CREATE POLICY "Users can view own profile" ON public.profiles
            FOR SELECT USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile" ON public.profiles
            FOR UPDATE USING (auth.uid() = id);
    END IF;
END
$$;
