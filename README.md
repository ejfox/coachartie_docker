# CoachArtie Docker

Docker configuration for running CoachArtie's microservices architecture. This setup includes:
- Capabilities Service (AI/ML processing)
- Discord Bot Service (user interface)

## Quick Start

1. Clone the repository with submodules
2. Configure environment by copying .env.example to .env and editing credentials
3. Run `docker-compose up --build`

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
