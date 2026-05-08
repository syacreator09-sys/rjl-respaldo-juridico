-- ============================================================
-- RJL — Respaldo Jurídico Laboral
-- Migration 001: Initial schema with RLS
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_crypto";

-- ============================================================
-- TYPES
-- ============================================================
CREATE TYPE user_role AS ENUM ('cliente', 'asesor', 'admin');
CREATE TYPE case_status AS ENUM ('active', 'closed', 'archived');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE sub_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role         user_role NOT NULL DEFAULT 'cliente',
  full_name    TEXT,
  phone        TEXT,
  avatar_url   TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, role, full_name)
  VALUES (NEW.id, 'cliente', NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SYSTEM CONFIG (admin-managed)
-- ============================================================
CREATE TABLE system_config (
  key          TEXT PRIMARY KEY,
  value        TEXT NOT NULL,
  description  TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by   UUID REFERENCES profiles(id)
);

INSERT INTO system_config (key, value, description) VALUES
  ('salario_minimo_diario', '248.93', 'Salario mínimo vigente en MXN/día'),
  ('precio_suscripcion_mensual', '200', 'Precio suscripción mensual en MXN'),
  ('limite_preguntas_gratis', '3', 'Preguntas gratuitas sin sesión por día/IP'),
  ('iva_porcentaje', '16', 'IVA aplicable en México (%)');

-- ============================================================
-- CASES
-- ============================================================
CREATE TABLE cases (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  asesor_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status       case_status NOT NULL DEFAULT 'active',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cases_client_id ON cases(client_id);
CREATE INDEX idx_cases_asesor_id ON cases(asesor_id);

-- ============================================================
-- CASE DATA (detailed labor info)
-- ============================================================
CREATE TABLE case_data (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id             UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE UNIQUE,
  start_date          DATE,
  salary_daily        DECIMAL(10,2),
  work_days           TEXT,           -- e.g. 'Mon-Sat'
  work_hours_paper    TEXT,           -- e.g. '9am-6pm'
  work_hours_real     TEXT,           -- e.g. '9am-8pm (evidencia)'
  has_imss            BOOLEAN DEFAULT false,
  has_contract        BOOLEAN DEFAULT false,
  position            TEXT,
  employer_name       TEXT,
  address             TEXT,
  notes               TEXT,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EVIDENCE VAULT (GPS + timestamp)
-- ============================================================
CREATE TABLE evidence (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id      UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  category     TEXT NOT NULL CHECK (category IN (
    'entrada_trabajo', 'salida_trabajo', 'contrato', 'recibo_pago',
    'gastos_medicos', 'cambio_domicilio', 'otro'
  )),
  file_path    TEXT NOT NULL,  -- Supabase Storage path
  file_name    TEXT NOT NULL,
  file_size    BIGINT,
  mime_type    TEXT,
  gps_lat      DECIMAL(10,8),
  gps_lng      DECIMAL(11,8),
  gps_accuracy DECIMAL(6,2),  -- meters
  device_time  TIMESTAMPTZ,   -- client device timestamp
  server_time  TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- authoritative timestamp
  metadata     JSONB DEFAULT '{}'
);

CREATE INDEX idx_evidence_case_id ON evidence(case_id);
CREATE INDEX idx_evidence_category ON evidence(category);

-- ============================================================
-- TICKETS (client ↔ asesor)
-- ============================================================
CREATE TABLE tickets (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id      UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  client_id    UUID NOT NULL REFERENCES profiles(id),
  asesor_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  question     TEXT NOT NULL,
  response     TEXT,
  status       ticket_status NOT NULL DEFAULT 'open',
  priority     ticket_priority NOT NULL DEFAULT 'medium',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at    TIMESTAMPTZ
);

CREATE INDEX idx_tickets_case_id ON tickets(case_id);
CREATE INDEX idx_tickets_asesor_id ON tickets(asesor_id);
CREATE INDEX idx_tickets_status ON tickets(status);

-- ============================================================
-- MESSAGES (chat history)
-- ============================================================
CREATE TABLE messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id      UUID REFERENCES cases(id) ON DELETE CASCADE,
  session_id   TEXT,           -- anonymous session ID for public chat
  role         TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content      TEXT NOT NULL,
  is_public    BOOLEAN NOT NULL DEFAULT false,
  tokens_used  INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_case_id ON messages(case_id);
CREATE INDEX idx_messages_session_id ON messages(session_id);

-- ============================================================
-- SUBSCRIPTIONS (Stripe)
-- ============================================================
CREATE TABLE subscriptions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id    TEXT NOT NULL UNIQUE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  status               sub_status NOT NULL DEFAULT 'trialing',
  price_id             TEXT,
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  cancel_at_period_end  BOOLEAN DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOG (immutable)
-- ============================================================
CREATE TABLE audit_log (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action       TEXT NOT NULL,
  table_name   TEXT,
  record_id    UUID,
  old_data     JSONB,
  new_data     JSONB,
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HELPER: updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cases_updated BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_case_data_updated BEFORE UPDATE ON case_data FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases          ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_data      ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config  ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log      ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- ── profiles ──
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (role = (SELECT role FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Asesores read assigned clients"
  ON profiles FOR SELECT
  USING (get_my_role() IN ('asesor','admin'));
CREATE POLICY "Admin full access profiles"
  ON profiles FOR ALL USING (get_my_role() = 'admin');

-- ── cases ──
CREATE POLICY "Clients see own cases"
  ON cases FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Clients insert own case"
  ON cases FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY "Asesores see assigned cases"
  ON cases FOR SELECT USING (asesor_id = auth.uid() OR get_my_role() = 'admin');
CREATE POLICY "Asesores update assigned cases"
  ON cases FOR UPDATE USING (asesor_id = auth.uid() OR get_my_role() = 'admin');
CREATE POLICY "Admin full cases"
  ON cases FOR ALL USING (get_my_role() = 'admin');

-- ── case_data ──
CREATE POLICY "Client reads own case_data"
  ON case_data FOR SELECT
  USING (case_id IN (SELECT id FROM cases WHERE client_id = auth.uid()));
CREATE POLICY "Client upserts own case_data"
  ON case_data FOR INSERT
  WITH CHECK (case_id IN (SELECT id FROM cases WHERE client_id = auth.uid()));
CREATE POLICY "Client updates own case_data"
  ON case_data FOR UPDATE
  USING (case_id IN (SELECT id FROM cases WHERE client_id = auth.uid()));
CREATE POLICY "Asesor reads assigned case_data"
  ON case_data FOR SELECT
  USING (case_id IN (SELECT id FROM cases WHERE asesor_id = auth.uid()));
CREATE POLICY "Admin full case_data"
  ON case_data FOR ALL USING (get_my_role() = 'admin');

-- ── evidence ──
CREATE POLICY "Client inserts own evidence"
  ON evidence FOR INSERT
  WITH CHECK (case_id IN (SELECT id FROM cases WHERE client_id = auth.uid()));
CREATE POLICY "Client reads own evidence"
  ON evidence FOR SELECT
  USING (case_id IN (SELECT id FROM cases WHERE client_id = auth.uid()));
CREATE POLICY "Asesor reads assigned evidence"
  ON evidence FOR SELECT
  USING (case_id IN (SELECT id FROM cases WHERE asesor_id = auth.uid()));
CREATE POLICY "No one updates evidence"
  ON evidence FOR UPDATE USING (false);  -- Evidence is immutable
CREATE POLICY "Admin full evidence"
  ON evidence FOR ALL USING (get_my_role() = 'admin');

-- ── tickets ──
CREATE POLICY "Client reads own tickets"
  ON tickets FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Client creates ticket"
  ON tickets FOR INSERT
  WITH CHECK (client_id = auth.uid());
CREATE POLICY "Asesor reads assigned tickets"
  ON tickets FOR SELECT
  USING (asesor_id = auth.uid() OR get_my_role() = 'admin');
CREATE POLICY "Asesor updates assigned tickets"
  ON tickets FOR UPDATE
  USING (asesor_id = auth.uid() OR get_my_role() = 'admin');
CREATE POLICY "Admin full tickets"
  ON tickets FOR ALL USING (get_my_role() = 'admin');

-- ── messages ──
CREATE POLICY "Client reads own messages"
  ON messages FOR SELECT
  USING (
    (case_id IN (SELECT id FROM cases WHERE client_id = auth.uid()))
    OR (is_public = true AND session_id IS NOT NULL)
  );
CREATE POLICY "Insert own messages"
  ON messages FOR INSERT
  WITH CHECK (
    case_id IN (SELECT id FROM cases WHERE client_id = auth.uid())
    OR (is_public = true AND auth.uid() IS NULL)
  );
CREATE POLICY "Asesor reads assigned messages"
  ON messages FOR SELECT
  USING (case_id IN (SELECT id FROM cases WHERE asesor_id = auth.uid()));
CREATE POLICY "Admin full messages"
  ON messages FOR ALL USING (get_my_role() = 'admin');

-- ── subscriptions ──
CREATE POLICY "User reads own subscription"
  ON subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin full subscriptions"
  ON subscriptions FOR ALL USING (get_my_role() = 'admin');

-- ── system_config ──
CREATE POLICY "All authenticated can read config"
  ON system_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin updates config"
  ON system_config FOR ALL USING (get_my_role() = 'admin');

-- ── audit_log ──
CREATE POLICY "Admin reads audit log"
  ON audit_log FOR SELECT USING (get_my_role() = 'admin');
CREATE POLICY "No updates to audit log"
  ON audit_log FOR UPDATE USING (false);
CREATE POLICY "System inserts to audit log"
  ON audit_log FOR INSERT WITH CHECK (true);

-- ============================================================
-- STORAGE BUCKETS (run via Supabase Dashboard or CLI)
-- ============================================================
-- Run these after migration:
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES
--   ('evidence', 'evidence', false, 52428800, ARRAY['image/jpeg','image/png','image/webp','application/pdf','video/mp4']),
--   ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg','image/png','image/webp']);

-- Storage RLS (evidence bucket — private)
-- CREATE POLICY "Client uploads own evidence"
--   ON storage.objects FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'evidence' AND (storage.foldername(name))[1] = auth.uid()::text);
-- CREATE POLICY "Client reads own evidence files"
--   ON storage.objects FOR SELECT TO authenticated
--   USING (bucket_id = 'evidence' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- SEED DATA (dev only)
-- ============================================================
-- Admin user (create via Supabase Auth dashboard first, then update role):
-- UPDATE profiles SET role = 'admin' WHERE id = 'your-admin-user-uuid';
