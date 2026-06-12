-- Polla Mundialista Aragón Aluminio - Schema

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  city VARCHAR(255) NOT NULL,
  cargo VARCHAR(255) NOT NULL,
  nequi VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  p1pts INTEGER DEFAULT 0,
  p2pts INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  active_phase INTEGER DEFAULT 1 CHECK (active_phase IN (1, 2)),
  phase1_bolsa NUMERIC(12,2) DEFAULT 0,
  phase2_bolsa NUMERIC(12,2) DEFAULT 0,
  unlocked_rounds TEXT[] DEFAULT ARRAY['group']
);

CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  phase INTEGER NOT NULL CHECK (phase IN (1, 2)),
  stage VARCHAR(50) NOT NULL,
  round VARCHAR(50) NOT NULL,
  home_team VARCHAR(100) NOT NULL,
  away_team VARCHAR(100) NOT NULL,
  match_date TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'played', 'locked')),
  home_score INTEGER,
  away_score INTEGER,
  match_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS predictions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  home_pred INTEGER NOT NULL,
  away_pred INTEGER NOT NULL,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

CREATE TABLE IF NOT EXISTS chat (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_matches_phase_status ON matches(phase, status);
CREATE INDEX IF NOT EXISTS idx_notifs_user ON notifs(user_id, read);
CREATE INDEX IF NOT EXISTS idx_chat_created ON chat(created_at);
