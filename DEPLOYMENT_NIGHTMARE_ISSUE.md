# 🔥 Docker Deployment Nightmare - TypeScript Build Failures

## Summary
Cannot deploy Coach Artie to production VPS due to cascading TypeScript build failures. Local development works fine, but Docker builds fail with various issues we've been debugging for 4+ hours.

## Environment
- **VPS**: Debian, Docker version [unknown]
- **Local**: macOS, everything works fine
- **Services**: coachartie_capabilities, coachartie_discord, coachartie_sms, coachartie_email
- **Docker Compose**: Using submodules for each service

## Issues Encountered (In Order)

### 1. ❌ TypeScript Not Found in Production Builds
**Services affected**: SMS, Email

**Error**:
```
sh: tsc: not found
The command '/bin/sh -c npm run build' returned a non-zero code: 127
```

**Cause**: Dockerfiles using `npm install --omit=dev` before trying to run `tsc`

**Fix Applied**: 
```dockerfile
# Install all dependencies (including dev for build)
RUN npm install
# Build the application
RUN npm run build
# Remove dev dependencies after build
RUN npm prune --omit=dev
```

### 2. ❌ TypeScript Interface Mismatch
**Service**: Email

**Error**:
```
error TS2353: Object literal may only specify known properties, and 'originalEmail' does not exist in type
```

**Fix Applied**: Added `originalEmail?` to CoachArtieRequest interface

### 3. ❌ Missing Module Import
**Service**: Capabilities

**Error**:
```
Cannot find module '../../capabilities/web.js'
Require stack:
- /app/dist/src/handlers/web-handler.js
```

**Multiple fix attempts**:
1. Changed path from `../../capabilities/web.js` to `../../../capabilities/web.js` ❌
2. Changed to `../../../../capabilities/web.js` ❌  
3. Changed back to `../../../capabilities/web.js` ❌

**Root cause discovered**: 
- Other capabilities (calculate, wolfram) have local `handler.ts` files
- Web capability was importing from separate `handlers/web-handler.ts` which imports legacy JS
- File structure mismatch between src/ and capabilities/ directories

**Final fix attempt**:
- Created `src/capabilities/web/handler.ts` 
- Updated `src/capabilities/web/register.ts` to use local handler
- DELETED `src/handlers/web-handler.ts`

### 4. ❌ Docker Cache Ghost Files
**CURRENT BLOCKER**: Even after deleting `src/handlers/web-handler.ts` and pushing to git, Docker build STILL tries to compile it!

```
Step 8/18 : RUN npm run build
 ---> Running in 63e31be3adee
> tsc
src/handlers/web-handler.ts(7,31): error TS2307: Cannot find module '../../../capabilities/web.js'
```

This file was deleted in commit 3ce9b63 but Docker is still trying to build it.

### 5. ⚠️ Disk Space Issues
**Error**: `E: You don't have enough free space in /var/cache/apt/archives/`

**Fix**: Cleaned up 7GB of failed Docker builds with `docker system prune -af`

### 6. ⚠️ Docker Network Issues  
**Error**: `network c21164282a43c030d7f56f620b20afa8611565e98dab59d997a2d3fa8ab92fa5 not found`

**Fix**: `docker-compose down && docker network prune -f`

## Current State

- ✅ All TypeScript/Dockerfile patterns fixed in git
- ✅ All services build locally
- ❌ Docker on VPS has cached ghost files
- ❌ Capabilities service won't start (health check fails)
- ❌ All other services depend on capabilities, so nothing works

## Suspected Issues

1. **Docker build cache**: Despite `--no-cache` flag, seems to cache file listings
2. **Submodule sync**: Possible mismatch between submodule commits
3. **Build context**: Docker might be including deleted files in build context

## Commands Tried

```bash
# Standard rebuild
docker-compose build --no-cache capabilities

# Force pull base image  
docker-compose build --no-cache --pull capabilities

# Update submodules
git submodule update --remote

# Clean and rebuild
docker-compose down
docker system prune -af  
docker-compose up -d
```

## Next Steps to Try

1. **Verify submodule state**:
```bash
cd coachartie_capabilities
git status
git log --oneline -5
find . -name "web-handler.ts"
```

2. **Nuclear Docker cleanup** (carefully):
```bash
docker-compose down
docker images | grep coachartie | awk '{print $3}' | xargs docker rmi -f
docker builder prune -af
```

3. **Fresh clone test**:
```bash
cd /tmp
git clone --recurse-submodules https://github.com/room302studio/coachartie-docker
cd coachartie-docker
docker-compose build
```

4. **Check if .dockerignore is missing** - might be including git/cache files

## Lessons Learned

1. **Always use standard TypeScript Docker pattern** - install all deps, build, then prune
2. **Test Docker builds in CI** before deploying 
3. **Capability structure should be consistent** - all use local handlers
4. **Docker cache can be evil** - deleted files can persist
5. **Submodules add complexity** - consider monorepo or proper package publishing

## Related Commits

- Fix TypeScript builds: room302studio/coachartie_sms@a8232b6
- Fix email interface: room302studio/coachartie_email@fdbc2b8  
- Multiple attempts at web import: room302studio/coachartie_capabilities@ee7f29a, @a97d6cb, @0291524
- Final web handler fix: room302studio/coachartie_capabilities@3ce9b63

---

Time spent debugging: 4+ hours
Current time: 2:47 AM
Sanity level: 📉