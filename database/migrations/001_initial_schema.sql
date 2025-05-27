-- Migration 001: Initial database schema
-- Created: 2025-05-27
-- Purpose: Establish core tables for Coach Artie system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Queue table for managing message tasks and background jobs
CREATE TABLE IF NOT EXISTS queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  task_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMP WITH TIME ZONE,
  responded BOOLEAN DEFAULT false,
  error_message TEXT
);

-- Index for queue processing efficiency
CREATE INDEX IF NOT EXISTS idx_queue_status_created ON queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_queue_task_type ON queue(task_type);

-- Messages table for storing conversation history
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  value TEXT NOT NULL,
  user_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  response_id INTEGER REFERENCES messages(id),
  embedding FLOAT[],
  had_capabilities BOOLEAN,
  message_type TEXT
);

-- Indexes for message queries
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_guild_id ON messages(guild_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_response_id ON messages(response_id);

-- Memory table for storing conversation context and AI insights
CREATE TABLE IF NOT EXISTS memory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  guild_id TEXT,
  context TEXT,
  insight TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Index for memory cleanup and retrieval
CREATE INDEX IF NOT EXISTS idx_memory_user_id ON memory(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_guild_id ON memory(guild_id);
CREATE INDEX IF NOT EXISTS idx_memory_expires_at ON memory(expires_at);

-- Config table for storing system configuration
CREATE TABLE IF NOT EXISTS config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for config lookup
CREATE INDEX IF NOT EXISTS idx_config_key ON config(key);

-- Capability stats table for monitoring and analytics
CREATE TABLE IF NOT EXISTS capability_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  capability TEXT UNIQUE NOT NULL,
  usage_count INTEGER DEFAULT 0,
  avg_latency FLOAT,
  error_rate FLOAT,
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for capability stats
CREATE INDEX IF NOT EXISTS idx_capability_stats_capability ON capability_stats(capability);
CREATE INDEX IF NOT EXISTS idx_capability_stats_last_used ON capability_stats(last_used);

-- Prompts table for AI prompt templates
CREATE TABLE IF NOT EXISTS prompts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  variables TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for prompt lookup
CREATE INDEX IF NOT EXISTS idx_prompts_name ON prompts(name);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at fields
CREATE TRIGGER update_config_updated_at BEFORE UPDATE ON config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_capability_stats_updated_at BEFORE UPDATE ON capability_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prompts_updated_at BEFORE UPDATE ON prompts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE queue IS 'Background task processing queue for capabilities and jobs';
COMMENT ON TABLE messages IS 'Chat conversation history for Discord bot and AI memory';
COMMENT ON TABLE memory IS 'AI-generated insights and conversation context';
COMMENT ON TABLE config IS 'System configuration and capability settings';
COMMENT ON TABLE capability_stats IS 'Usage analytics and performance metrics for capabilities';
COMMENT ON TABLE prompts IS 'AI prompt templates for various system functions';

COMMENT ON COLUMN queue.status IS 'Task status: pending, processing, completed, failed, skipped';
COMMENT ON COLUMN queue.task_type IS 'Capability name or job type identifier';
COMMENT ON COLUMN queue.payload IS 'JSON parameters and data for task execution';
COMMENT ON COLUMN messages.response_id IS 'Links to the response message for request/response pairs';
COMMENT ON COLUMN messages.had_capabilities IS 'Whether the response involved capability execution';
COMMENT ON COLUMN memory.expires_at IS 'Automatic cleanup time for temporary memories';
COMMENT ON COLUMN config.value IS 'JSON configuration value - can be object, string, number, etc';
COMMENT ON COLUMN capability_stats.avg_latency IS 'Average response time in milliseconds';
COMMENT ON COLUMN capability_stats.error_rate IS 'Percentage of failed requests (0.0 to 1.0)';
COMMENT ON COLUMN prompts.variables IS 'Array of variable names used in the prompt template';