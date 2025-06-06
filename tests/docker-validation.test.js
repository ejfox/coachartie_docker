/**
 * Docker Deployment Validation Tests
 * 
 * Catch all the submodule + build bullshit we keep hitting in production
 */

const { execSync } = require('child_process');
const { readFileSync, existsSync } = require('fs');
const { describe, it, expect } = require('@jest/globals');

describe('Docker Deployment - Stop The Production Bullshit', () => {
  
  it('should have all required submodules', () => {
    const requiredSubmodules = [
      'coachartie_capabilities',
      'coachartie_discord',
      'coachartie_sms',
      'coachartie_email'
    ];
    
    requiredSubmodules.forEach(submodule => {
      expect(existsSync(submodule), `Missing submodule: ${submodule}`).toBe(true);
      expect(existsSync(`${submodule}/.git`), `Submodule not initialized: ${submodule}`).toBe(true);
    });
  });

  it('should have submodules pointing to latest commits', () => {
    const submodules = ['coachartie_capabilities', 'coachartie_discord', 'coachartie_sms', 'coachartie_email'];
    
    submodules.forEach(submodule => {
      try {
        // Get current submodule commit
        const submoduleCommit = execSync(`git rev-parse HEAD`, { 
          cwd: submodule, 
          encoding: 'utf-8' 
        }).trim();
        
        // Get latest remote commit
        execSync(`git fetch origin`, { cwd: submodule, stdio: 'pipe' });
        const remoteCommit = execSync(`git rev-parse origin/main`, { 
          cwd: submodule, 
          encoding: 'utf-8' 
        }).trim();
        
        expect(submoduleCommit, `Submodule ${submodule} is behind remote`).toBe(remoteCommit);
      } catch (error) {
        throw new Error(`Failed to check submodule ${submodule}: ${error.message}`);
      }
    });
  });

  it('should have valid Dockerfiles for all services', () => {
    const services = [
      { name: 'capabilities', path: 'coachartie_capabilities/dockerfile' },
      { name: 'discord', path: 'coachartie_discord/Dockerfile' },
      { name: 'sms', path: 'coachartie_sms/Dockerfile' },
      { name: 'email', path: 'coachartie_email/Dockerfile' }
    ];
    
    services.forEach(service => {
      expect(existsSync(service.path), `Missing Dockerfile: ${service.path}`).toBe(true);
      
      const dockerfile = readFileSync(service.path, 'utf-8');
      
      // TypeScript services should build properly
      if (['sms', 'email'].includes(service.name)) {
        expect(dockerfile).toContain('npm install');
        expect(dockerfile).toContain('npm run build');
        expect(dockerfile).toContain('npm prune --omit=dev');
        
        // Should NOT install prod-only first
        expect(dockerfile).not.toContain('npm install --omit=dev');
      }
    });
  });

  it('should have all services defined in docker-compose', () => {
    const dockerCompose = readFileSync('docker-compose.yml', 'utf-8');
    
    const requiredServices = ['capabilities', 'discord', 'sms', 'email'];
    
    requiredServices.forEach(service => {
      expect(dockerCompose).toContain(`${service}:`);
      expect(dockerCompose).toContain(`context: ./coachartie_${service}`);
    });
  });

  it('should build all services without errors', () => {
    // This is the ultimate test - actually try to build
    expect(() => {
      execSync('docker-compose build --no-cache', { 
        stdio: 'pipe',
        timeout: 300000 // 5 minutes
      });
    }).not.toThrow();
  }, 310000);

  it('should have services start and pass health checks', (done) => {
    const { spawn } = require('child_process');
    
    // Start services
    const compose = spawn('docker-compose', ['up', '-d'], { 
      stdio: 'pipe'
    });
    
    compose.on('close', (code) => {
      if (code !== 0) {
        done(new Error(`docker-compose up failed with code ${code}`));
        return;
      }
      
      // Wait for health checks
      setTimeout(() => {
        try {
          const ps = execSync('docker-compose ps', { encoding: 'utf-8' });
          
          // Check no services are in unhealthy state
          expect(ps).not.toContain('unhealthy');
          
          // Cleanup
          execSync('docker-compose down', { stdio: 'pipe' });
          done();
        } catch (error) {
          execSync('docker-compose down', { stdio: 'pipe' });
          done(error);
        }
      }, 30000); // Wait 30 seconds for health checks
    });
  }, 60000);

  it('should have environment variables properly configured', () => {
    expect(existsSync('.env'), 'Missing .env file').toBe(true);
    
    const env = readFileSync('.env', 'utf-8');
    
    const requiredVars = [
      'SUPABASE_URL',
      'SUPABASE_API_KEY',
      'DISCORD_BOT_TOKEN',
      'WEBHOOK_PASSPHRASE'
    ];
    
    requiredVars.forEach(envVar => {
      expect(env, `Missing environment variable: ${envVar}`).toContain(envVar);
    });
  });

  it('should have all submodules with proper package.json files', () => {
    const services = ['coachartie_capabilities', 'coachartie_sms', 'coachartie_email'];
    
    services.forEach(service => {
      const packagePath = `${service}/package.json`;
      expect(existsSync(packagePath), `Missing package.json: ${packagePath}`).toBe(true);
      
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
      
      // Should have build script for TypeScript services
      if (['coachartie_sms', 'coachartie_email'].includes(service)) {
        expect(packageJson.scripts, `Missing build script in ${service}`).toHaveProperty('build');
        expect(packageJson.devDependencies, `Missing typescript in ${service}`).toHaveProperty('typescript');
      }
    });
  });
});