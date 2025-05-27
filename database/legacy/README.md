# Legacy Database Files

⚠️ **These files are deprecated and should not be used for new development.**

## Files in this directory:

- `discord_schema.sql` - Original schema from Discord service
  - **Location**: Previously at `coachartie_discord/config/schema.sql`
  - **Status**: Superseded by `/database/schema.prisma`
  - **Purpose**: Backup/reference only

## Migration path:

1. **Old way**: Raw SQL files scattered across services
2. **New way**: Centralized Prisma schema at `/database/schema.prisma`

## If you're looking for current database schema:

👉 **Use `/database/README.md` and `/database/schema.prisma`**

These legacy files are kept for:
- Historical reference
- Migration debugging
- Rollback scenarios (if needed)

Do not modify files in this directory.