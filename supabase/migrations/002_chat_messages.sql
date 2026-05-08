-- Migration 002: chat_messages — historial de chat por usuario (no por caso)
-- Distinto de "messages" que es por caso asignado

CREATE TABLE chat_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own chat messages"
  ON chat_messages FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own chat messages"
  ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "No updates to chat messages"
  ON chat_messages FOR UPDATE USING (false);

CREATE POLICY "Admin full chat messages"
  ON chat_messages FOR ALL USING (get_my_role() = 'admin');
