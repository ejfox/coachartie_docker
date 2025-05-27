# 🗄️ Database Schema Documentation

This directory contains the complete database schema for the Coach Artie system.

## 📋 Quick Reference

| Table | Purpose | Used By |
|-------|---------|---------|
| `queue` | Background task processing | Queue processor, capabilities service |
| `messages` | Chat conversation history | Discord bot, capabilities service, memory |
| `memory` | AI-generated insights and context | Enhanced memory service |
| `config` | System configuration and capability settings | Task manifest, capability management |
| `capability_stats` | Usage analytics and performance metrics | Capabilities API, monitoring |
| `prompts` | AI prompt templates | Prompt loader, AI services |

## 🔧 Schema Management

### Primary Schema File
- **`schema.prisma`** - Single source of truth for all database tables
- Use this file to understand table structure, relationships, and constraints
- Auto-generates TypeScript types when using Prisma client

### Legacy Schema Files
- `coachartie_discord/config/schema.sql` - Raw SQL (will be deprecated)
- Use Prisma schema above for new development

## 📊 Table Details

### Queue Table
```sql
-- Background task processing queue
id           UUID PRIMARY KEY
status       TEXT NOT NULL     -- pending, processing, completed, failed, skipped  
task_type    TEXT NOT NULL     -- capability name (calculate, wolfram, etc)
payload      JSONB             -- task parameters: {"expression": "2+2"}
created_at   TIMESTAMPTZ DEFAULT NOW()
completed_at TIMESTAMPTZ
responded    BOOLEAN DEFAULT FALSE
error_message TEXT
```

**Queue Lifecycle:**
1. `pending` - Task created, waiting for processor
2. `processing` - Being executed by queue processor  
3. `completed` - Successfully finished
4. `failed` - Failed after max retries
5. `skipped` - Intentionally skipped (old tasks)

### Messages Table
```sql
-- Chat conversation storage
id                SERIAL PRIMARY KEY
value             TEXT NOT NULL        -- message content
user_id           TEXT NOT NULL        -- Discord user ID
channel_id        TEXT NOT NULL        -- Discord channel ID
guild_id          TEXT NOT NULL        -- Discord server ID
created_at        TIMESTAMPTZ DEFAULT NOW()
response_id       INT                  -- links to response message
embedding         FLOAT[]              -- vector for similarity search
had_capabilities  BOOLEAN              -- whether response used capabilities
message_type      TEXT                 -- user, system, capability_error
```

### Memory Table
```sql
-- AI-generated conversation context
id         UUID PRIMARY KEY
user_id    TEXT NOT NULL     -- Discord user ID
guild_id   TEXT              -- Discord server ID (null for DMs)
context    TEXT              -- conversation summary
insight    TEXT              -- AI-generated insights
created_at TIMESTAMPTZ DEFAULT NOW()
expires_at TIMESTAMPTZ       -- automatic cleanup time
```

## 🚀 Getting Started

### For Developers
1. **Check table structure**: Look at `schema.prisma` first
2. **Understand relationships**: See the `@relation` mappings
3. **Find usage examples**: Check service files that import database

### For Database Operations
```bash
# View live schema
cd /Users/ejfox/code/coachartie-docker
docker-compose exec postgres psql -U postgres -d coachartie -c "\d queue"

# Check table contents  
docker-compose exec postgres psql -U postgres -d coachartie -c "SELECT * FROM queue LIMIT 5;"
```

## 🔄 Schema Evolution

### Making Changes
1. Update `schema.prisma` first
2. Test changes locally
3. Create migration file in `migrations/`
4. Update any affected service code
5. Deploy schema changes before code changes

### Version Control
- All schema changes go through `schema.prisma`
- Never edit raw SQL files directly
- Document breaking changes in migration comments

## 🎯 Common Patterns

### Adding a Task to Queue
```typescript
const { error } = await supabase
  .from("queue")
  .insert({
    status: "pending",
    task_type: "calculate", 
    payload: { expression: "2+2" }
  });
```

### Querying Messages with Context
```typescript
const { data } = await supabase
  .from("messages")
  .select("*")
  .eq("user_id", userId)
  .order("created_at", { ascending: false })
  .limit(10);
```

### Storing Memory
```typescript
const { error } = await supabase
  .from("memory")
  .insert({
    user_id: userId,
    guild_id: guildId,
    context: "User asked about workout routines",
    insight: "User prefers bodyweight exercises"
  });
```

## 🚨 Important Notes

### Queue vs Messages Confusion
- **Queue table**: For background task processing (capabilities, jobs)
- **Messages table**: For chat conversation history
- These are completely separate concerns!

### Environment Variables
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://... # if using Prisma directly
```

### Service Boundaries
- **Discord service**: Primarily uses `queue`, `messages`, `memory`
- **Capabilities service**: Uses `queue`, `messages`, `config`, `capability_stats`, `prompts`
- **Shared tables**: Both services can access all tables through Supabase

## 🔍 Troubleshooting

### "Table doesn't exist" errors
1. Check if you're using the right table name from this schema
2. Verify Supabase connection and credentials
3. Confirm table exists: `SELECT tablename FROM pg_tables WHERE schemaname='public';`

### Queue tasks not processing
1. Check `queue` table has `status='pending'` tasks
2. Verify queue processor is running and polling
3. Check for stuck tasks: `SELECT * FROM queue WHERE status='processing' AND created_at < NOW() - INTERVAL '5 minutes';`

### Memory/context issues
1. Check `messages` table for conversation history
2. Verify `memory` table for AI insights
3. Ensure `user_id` and `guild_id` are consistent

---

**📖 This is the authoritative database documentation. When in doubt, check here first!**