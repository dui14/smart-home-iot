-- PostgreSQL schema for chat history and AI command tracking
-- Usage:
--   psql "$DATABASE_URL" -f schema.sql

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS chat_sessions (
  chat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  user_id TEXT,
  title TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGSERIAL PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES chat_sessions(chat_id) ON DELETE CASCADE,
  request_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'tool')),
  content TEXT NOT NULL,
  parsed_command JSONB,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup by chat_id and message timeline.
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id_created_at
  ON chat_messages (chat_id, created_at DESC);

-- Fast lookup by external request ID when debugging duplicated calls.
CREATE INDEX IF NOT EXISTS idx_chat_messages_request_id
  ON chat_messages (request_id)
  WHERE request_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS command_executions (
  id BIGSERIAL PRIMARY KEY,
  chat_id UUID REFERENCES chat_sessions(chat_id) ON DELETE SET NULL,
  request_id TEXT,
  source TEXT NOT NULL,
  device TEXT NOT NULL,
  room TEXT,
  action TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_command_executions_chat_id_created_at
  ON command_executions (chat_id, created_at DESC);

COMMIT;
