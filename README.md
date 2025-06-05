# 🤖 CoachArtie: Your AI Assistant Stack

**Ready-to-deploy Docker stack for CoachArtie** - a powerful AI assistant with memory, capabilities, and multi-platform communication.

## 🚀 What is CoachArtie?

CoachArtie is more than just another chatbot. It's a **memory-enabled AI assistant** that can:

- 🧠 **Remember conversations** across platforms (Discord, SMS, Email)
- 🔧 **Execute capabilities** like calculations, web research, and GitHub operations  
- 💬 **Communicate naturally** using advanced context engineering
- 🔄 **Process tasks asynchronously** with a robust queue system
- 📊 **Track everything** with comprehensive logging and metrics

## ⚡ Quick Install (< 5 minutes)

**Prerequisites:** Docker & Docker Compose installed

```bash
# 1. Clone with all services
git clone --recursive https://github.com/ejfox/coachartie_docker.git
cd coachartie_docker

# 2. Set up environment (add your API keys)
cp .env.example .env
# Edit .env with your OpenAI, Discord, and Supabase credentials

# 3. Deploy everything
docker-compose up -d

# 4. Verify it's working (should show 5/5 tests passing)
node test-e2e.js
```

**That's it!** CoachArtie is now running with:
- 🎯 **Capabilities Service** on port 9991 (AI brain)
- 📧 **Email Interface** on port 9994 (email processing)
- 💾 **Database** connection (Supabase)
- 🔍 **Health monitoring** and E2E validation

## 🎯 For Developers

CoachArtie is built with modern practices:
- **Microservices architecture** with Docker orchestration
- **TypeScript throughout** with strict type safety
- **Comprehensive testing** (100% E2E test pass rate)
- **npm standardized** across all services
- **Production-ready** logging and error handling

## 🎮 Try It Out

```bash
# Chat with CoachArtie
curl -X POST http://localhost:9991/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test" \
  -d '{"message":"What can you do?","userId":"demo"}'

# Run a calculation
curl -X POST http://localhost:9991/api/task/execute \
  -H "Content-Type: application/json" \
  -d '{
    "capability": "calculate",
    "action": "compute", 
    "params": {"expression": "2 + 2"},
    "respondTo": {"channel": "api", "details": {"type": "test"}}
  }'
```

## 📋 Essential Documentation

- **[🗄️ Database Schema](./database/README.md)** - Complete database documentation
- **[🔧 API Documentation](http://localhost:9991/openapi.yaml)** - OpenAPI spec (when running)
- **[🧪 Testing Guide](#testing)** - E2E tests and validation

## Services

### Capabilities Service
- AI/ML processing engine
- Natural language processing
- Conversation memory management
- Port: 9991

### Discord Bot
- User interface via Discord
- Command processing
- Voice channel integration
- Depends on Capabilities Service

## Testing

### E2E Integration Tests
Lightweight tests that verify service communication:

```bash
# Install test dependencies
npm install

# Quick health check (bash script)
./test-quick.sh

# Full E2E tests (requires services running)
npm test

# Start services and test in one command
npm run docker:test
```

### Test Coverage
- ✅ Health checks for all services
- ✅ Capabilities service API endpoints  
- ✅ Calculate capability execution
- ✅ Chat endpoint with memory
- ✅ Service interdependency validation

**Latest Status:** 🎉 **5/5 tests passing (100% success rate)**

## Development

The services can be managed individually or together using docker-compose commands. Logs can be viewed for all services or filtered by service name.

### Updating Submodules

Use the provided script to update submodules to latest versions:
```bash
./update_submodules.sh
```

## API Testing

### Health Check
```bash
curl http://localhost:9991/api/health
```

### List Available Capabilities
```bash
curl http://localhost:9991/api/task/capabilities
```

### Add Task to Queue
```bash
curl -X POST http://localhost:9991/api/task/execute \
  -H "Content-Type: application/json" \
  -d '{
    "capability": "calculate", 
    "action": "compute",
    "params": {"expression": "123 + 456"}, 
    "respondTo": {"channelId": "test-channel"}
  }'

# Test Wolfram Alpha (external API - should queue)
curl -X POST http://localhost:9991/api/task/execute \
  -H "Content-Type: application/json" \
  -d '{
    "capability": "wolfram_alpha", 
    "action": "compute",
    "params": {"query": "integrate x^2 sin(x) dx"}, 
    "respondTo": {"channelId": "test-wolfram"}
  }'
```

### Monitor Queue Processing
Watch the logs to see tasks being processed:
```bash
docker-compose logs -f capabilities | grep -E "(queue|processing|task)"
```

### Queue Processor Features
- **Fixed Bug**: Removed time filter that prevented processing old tasks
- **Batch Processing**: Handles up to 15 concurrent tasks
- **Auto-Retry**: Up to 3 retries for failed tasks  
- **Real-time Polling**: Checks for new tasks every 1000ms

## Environment Variables

Core service variables needed:
- Database connection (Supabase)
- OpenAI API access
- Discord bot credentials
- Webhook authentication
- Internal service communication

See .env.example for full configuration options.

## License

MIT © EJ Fox
