#!/usr/bin/env node

/**
 * Lightweight E2E Integration Tests for CoachArtie Docker Stack
 * 
 * Tests the actual deployed services to ensure they're communicating properly.
 * Run with: node test-e2e.js
 */

import fetch from 'node-fetch';

const SERVICES = {
  capabilities: 'http://localhost:9991',
  brain: 'http://localhost:9992', 
  sms: 'http://localhost:9993',
  email: 'http://localhost:9994'
};

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = (color, symbol, message) => {
  console.log(`${color}${symbol}${COLORS.reset} ${message}`);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testHealth(name, url) {
  try {
    const response = await fetch(`${url}/health`, { timeout: 5000 });
    if (response.ok) {
      log(COLORS.green, '✓', `${name} health check passed`);
      return true;
    } else {
      log(COLORS.red, '✗', `${name} health check failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    log(COLORS.red, '✗', `${name} health check failed: ${error.message}`);
    return false;
  }
}

async function testCapabilitiesList() {
  try {
    const response = await fetch(`${SERVICES.capabilities}/api/task/capabilities`);
    if (response.ok) {
      const data = await response.json();
      const count = data.capabilities?.length || 0;
      log(COLORS.green, '✓', `Capabilities service lists ${count} capabilities`);
      return true;
    } else {
      log(COLORS.red, '✗', `Capabilities list failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    log(COLORS.red, '✗', `Capabilities list failed: ${error.message}`);
    return false;
  }
}

async function testCalculateCapability() {
  try {
    const response = await fetch(`${SERVICES.capabilities}/api/task/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        capability: 'calculate',
        action: 'compute', 
        params: { expression: '2 + 2' },
        respondTo: { 
          channel: 'test',
          details: { type: 'test', channelId: 'test-e2e' }
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      log(COLORS.green, '✓', `Calculate capability executed: ${data.message || 'queued'}`);
      return true;
    } else {
      log(COLORS.red, '✗', `Calculate capability failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    log(COLORS.red, '✗', `Calculate capability failed: ${error.message}`);
    return false;
  }
}

async function testChatEndpoint() {
  try {
    const response = await fetch(`${SERVICES.capabilities}/api/chat`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test'
      },
      body: JSON.stringify({
        message: 'Hello from e2e test',
        userId: 'test-e2e-user'
      })
    });

    if (response.ok) {
      const data = await response.json();
      log(COLORS.green, '✓', `Chat endpoint responded: ${data.content?.substring(0, 50) || 'success'}...`);
      return true;
    } else {
      log(COLORS.red, '✗', `Chat endpoint failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    log(COLORS.red, '✗', `Chat endpoint failed: ${error.message}`);
    return false;
  }
}

async function runTests() {
  log(COLORS.blue, '🧪', 'Starting CoachArtie E2E Integration Tests...\n');

  let passed = 0;
  let total = 0;

  // Health checks for all services
  log(COLORS.yellow, '📊', 'Testing service health checks...');
  for (const [name, url] of Object.entries(SERVICES)) {
    total++;
    if (await testHealth(name, url)) passed++;
  }

  console.log();

  // Core functionality tests
  log(COLORS.yellow, '⚙️', 'Testing core functionality...');
  
  total++;
  if (await testCapabilitiesList()) passed++;
  
  total++;
  if (await testCalculateCapability()) passed++;
  
  total++;
  if (await testChatEndpoint()) passed++;

  // Summary
  console.log();
  if (passed === total) {
    log(COLORS.green, '🎉', `All tests passed! (${passed}/${total})`);
    process.exit(0);
  } else {
    log(COLORS.red, '💥', `Some tests failed: ${passed}/${total} passed`);
    process.exit(1);
  }
}

// Handle SIGINT gracefully
process.on('SIGINT', () => {
  log(COLORS.yellow, '⚡', 'Tests interrupted');
  process.exit(130);
});

runTests().catch(error => {
  log(COLORS.red, '💥', `Test runner failed: ${error.message}`);
  process.exit(1);
});