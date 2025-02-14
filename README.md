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
