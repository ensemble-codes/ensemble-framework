#!/usr/bin/env npx tsx

/**
 * Test script for API endpoints using a running server
 * Run with: npx tsx scripts/test-api-server.ts
 */

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

async function testEndpoints() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🚀 Testing API endpoints...\n');

  // Test 1: List agents
  console.log('1️⃣ Testing GET /agents');
  try {
    const response = await fetch(`${baseUrl}/agents?limit=5`);
    const data = await response.json();
    console.log(`✅ Status: ${response.status}`);
    console.log(`   Found ${data.data?.length || 0} agents`);
    console.log(`   Pagination:`, data.pagination);
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Test 2: Get categories
  console.log('\n2️⃣ Testing GET /agents/categories');
  try {
    const response = await fetch(`${baseUrl}/agents/categories`);
    const data = await response.json();
    console.log(`✅ Status: ${response.status}`);
    console.log(`   Found ${data.data?.length || 0} categories`);
    data.data?.forEach((cat: any) => {
      console.log(`   - ${cat.displayName}: ${cat.agentCount} agents`);
    });
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Test 3: Get skills
  console.log('\n3️⃣ Testing GET /agents/skills');
  try {
    const response = await fetch(`${baseUrl}/agents/skills?limit=5`);
    const data = await response.json();
    console.log(`✅ Status: ${response.status}`);
    console.log(`   Found ${data.data?.length || 0} skills`);
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Test 4: Discovery endpoint
  console.log('\n4️⃣ Testing POST /agents/discovery');
  try {
    const response = await fetch(`${baseUrl}/agents/discovery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: { text: 'AI assistant' },
        pagination: { limit: 3 }
      })
    });
    const data = await response.json();
    console.log(`✅ Status: ${response.status}`);
    console.log(`   Found ${data.data?.length || 0} agents matching query`);
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Test 5: Invalid endpoint
  console.log('\n5️⃣ Testing invalid endpoint');
  try {
    const response = await fetch(`${baseUrl}/invalid-endpoint`);
    console.log(`✅ Status: ${response.status} (Expected 404)`);
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('\n✨ API testing complete!');
}

async function runTests() {
  console.log('📦 Starting API server...');
  
  // Start the server
  const server = spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PORT: '3000',
      NETWORK_RPC_URL: process.env.RPC_URL || 'https://sepolia.base.org',
      AGENT_REGISTRY_ADDRESS: process.env.AGENT_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000000',
      SERVICE_REGISTRY_ADDRESS: process.env.SERVICE_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000000',
      TASK_REGISTRY_ADDRESS: process.env.TASK_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000000',
    }
  });

  // Wait for server to start
  let serverReady = false;
  server.stdout?.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Server listening') || output.includes('started')) {
      serverReady = true;
    }
    if (process.env.DEBUG) {
      console.log('[SERVER]', output);
    }
  });

  server.stderr?.on('data', (data) => {
    if (process.env.DEBUG) {
      console.error('[SERVER ERROR]', data.toString());
    }
  });

  // Wait for server to be ready
  console.log('⏳ Waiting for server to start...');
  const maxWait = 30000; // 30 seconds
  const start = Date.now();
  
  while (!serverReady && Date.now() - start < maxWait) {
    await setTimeout(500);
  }

  if (!serverReady) {
    console.error('❌ Server failed to start within 30 seconds');
    server.kill();
    process.exit(1);
  }

  console.log('✅ Server is ready!\n');

  // Run tests
  try {
    await testEndpoints();
  } catch (error) {
    console.error('💥 Test error:', error);
  } finally {
    // Clean up
    console.log('\n🛑 Stopping server...');
    server.kill();
  }
}

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { testEndpoints };