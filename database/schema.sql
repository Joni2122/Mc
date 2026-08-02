-- Minecraft Skin Platform - Database Schema
-- Führe diese SQL-Befehle in Supabase SQL Editor aus

-- 1. TABELLE: profiles (Benutzerprofile)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELLE: skins (Minecraft Skins)
CREATE TABLE skins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  skin_url TEXT NOT NULL,
  preview_url TEXT,
  model TEXT DEFAULT 'classic' CHECK (model IN ('classic', 'slim')),
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  tags TEXT[],
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELLE: downloads (Download-Tracking)
CREATE TABLE downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skin_id UUID NOT NULL REFERENCES skins(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT
);

-- 4. TABELLE: favorites (Lieblingsskins)
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skin_id UUID NOT NULL REFERENCES skins(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, skin_id)
);

-- 5. TABELLE: admin_logs (Admin-Aktivitäten)
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_id UUID,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===== ROW LEVEL SECURITY (RLS) =====

-- Enable RLS für alle Tabellen
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skins ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- === PROFILES RLS ===
-- Jeder kann öffentliche Profile sehen
CREATE POLICY "Öffentliche Profile sichtbar" ON profiles
  FOR SELECT USING (true);

-- Nur der Benutzer selbst kann sein Profil aktualisieren
CREATE POLICY "Profil selbst aktualisieren" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- === SKINS RLS ===
-- Öffentliche Skins sichtbar für alle
CREATE POLICY "Öffentliche Skins sichtbar" ON skins
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

-- Nur Ersteller kann seinen Skin aktualisieren
CREATE POLICY "Nur Ersteller kann aktualisieren" ON skins
  FOR UPDATE USING (auth.uid() = user_id);

-- Nur Ersteller kann seinen Skin löschen
CREATE POLICY "Nur Ersteller kann löschen" ON skins
  FOR DELETE USING (auth.uid() = user_id);

-- Benutzer können neue Skins hochladen
CREATE POLICY "Neue Skins hochladen" ON skins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- === DOWNLOADS RLS ===
-- Nur Admins und der Uploader können Downloads sehen
CREATE POLICY "Downloads sichtbar" ON downloads
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE is_admin = true
    )
    OR auth.uid() = user_id
  );

-- === FAVORITES RLS ===
-- Nur der Benutzer kann seine Favorites sehen/bearbeiten
CREATE POLICY "Eigene Favorites sehen" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Favorites hinzufügen" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Favorites löschen" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

-- === ADMIN_LOGS RLS ===
-- Nur Admins können Logs sehen
CREATE POLICY "Nur Admins sehen Logs" ON admin_logs
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
  );

CREATE POLICY "Admins können Logs erstellen" ON admin_logs
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
  );

-- ===== INDIZES für Performance =====
CREATE INDEX idx_skins_user_id ON skins(user_id);
CREATE INDEX idx_skins_created_at ON skins(created_at DESC);
CREATE INDEX idx_skins_view_count ON skins(view_count DESC);
CREATE INDEX idx_skins_download_count ON skins(download_count DESC);
CREATE INDEX idx_downloads_skin_id ON downloads(skin_id);
CREATE INDEX idx_downloads_user_id ON downloads(user_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);

-- ===== TRIGGER für updated_at =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skins_updated_at BEFORE UPDATE ON skins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
