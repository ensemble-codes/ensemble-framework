#!/usr/bin/env npx tsx

/**
 * Test script for API agent endpoints
 * Run with: npx tsx scripts/test-agent-endpoints.ts
 */

import AgentService from '../src/services/agentService';

async function testAgentEndpoints() {
  console.log('🚀 Testing API Agent Service...\n');

  try {
    // Setup - you'll need to provide these values
    const rpcUrl = process.env.RPC_URL || 'https://sepolia.base.org';
    const agentRegistryAddress = process.env.AGENT_REGISTRY_ADDRESS || '0x...';
    const serviceRegistryAddress = process.env.SERVICE_REGISTRY_ADDRESS || '0x...';
    const taskRegistryAddress = process.env.TASK_REGISTRY_ADDRESS || '0x...';
    const subgraphUrl = process.env.SUBGRAPH_URL || 'https://your-subgraph-url.com';

    console.log('📡 RPC URL:', rpcUrl);
    console.log('📊 Subgraph URL:', subgraphUrl);

    const agentService = new AgentService(
      rpcUrl,
      agentRegistryAddress,
      serviceRegistryAddress,
      taskRegistryAddress,
      subgraphUrl
    );

    // Wait a bit for SDK initialization
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 1: Get agents with pagination
    console.log('\n1️⃣ Testing getAgents() - Basic pagination');
    try {
      const result = await agentService.getAgents({
        page: 1,
        limit: 5
      });
      console.log(`✅ Found ${result.data.length} agents`);
      console.log('📄 Pagination:', result.pagination);
      if (result.data.length > 0) {
        console.log('📝 First agent:', {
          id: result.data[0].id,
          name: result.data[0].name,
          category: result.data[0].agentCategory,
          reputationScore: result.data[0].reputationScore
        });
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }

    // Test 2: Filter by category
    console.log('\n2️⃣ Testing getAgents() - Filter by category');
    try {
      const result = await agentService.getAgents({
        category: 'ai-assistant',
        limit: 3
      });
      console.log(`✅ Found ${result.data.length} agents in 'ai-assistant' category`);
    } catch (error) {
      console.error('❌ Error:', error);
    }

    // Test 3: Sort by reputation
    console.log('\n3️⃣ Testing getAgents() - Sort by reputation');
    try {
      const result = await agentService.getAgents({
        sort_by: 'reputation',
        sort_order: 'desc',
        limit: 3
      });
      console.log(`✅ Top ${result.data.length} agents by reputation:`);
      result.data.forEach((agent, i) => {
        console.log(`   ${i + 1}. ${agent.name}: ${agent.reputationScore}`);
      });
    } catch (error) {
      console.error('❌ Error:', error);
    }

    // Test 4: Get agent by ID
    console.log('\n4️⃣ Testing getAgentById()');
    if (process.env.TEST_AGENT_ADDRESS) {
      try {
        const agent = await agentService.getAgentById(process.env.TEST_AGENT_ADDRESS);
        if (agent) {
          console.log(`✅ Agent found:`, {
            id: agent.id,
            name: agent.name,
            description: agent.description.substring(0, 100) + '...',
            category: agent.agentCategory,
            attributes: agent.attributes.slice(0, 3)
          });
        } else {
          console.log('❌ Agent not found');
        }
      } catch (error) {
        console.error('❌ Error:', error);
      }
    } else {
      console.log('⏭️ Skipping agent by ID test (set TEST_AGENT_ADDRESS env var)');
    }

    // Test 5: Get agents by owner
    console.log('\n5️⃣ Testing getAgentsByOwner()');
    if (process.env.TEST_OWNER_ADDRESS) {
      try {
        const agents = await agentService.getAgentsByOwner(process.env.TEST_OWNER_ADDRESS);
        console.log(`✅ Found ${agents.length} agents owned by ${process.env.TEST_OWNER_ADDRESS}`);
      } catch (error) {
        console.error('❌ Error:', error);
      }
    } else {
      console.log('⏭️ Skipping owner test (set TEST_OWNER_ADDRESS env var)');
    }

    // Test 6: Get categories
    console.log('\n6️⃣ Testing getAgentCategories()');
    try {
      const categories = await agentService.getAgentCategories();
      console.log(`✅ Found ${categories.length} categories:`);
      categories.forEach(cat => {
        console.log(`   - ${cat.displayName} (${cat.agentCount} agents)`);
      });
    } catch (error) {
      console.error('❌ Error:', error);
    }

    // Test 7: Get skills
    console.log('\n7️⃣ Testing getAgentSkills()');
    try {
      const skills = await agentService.getAgentSkills();
      console.log(`✅ Found ${skills.length} skills:`);
      skills.slice(0, 3).forEach(skill => {
        console.log(`   - ${skill.displayName} (${skill.agentCount} agents)`);
      });
    } catch (error) {
      console.error('❌ Error:', error);
    }

    // Test 8: Discovery search
    console.log('\n8️⃣ Testing discoverAgents()');
    try {
      const result = await agentService.discoverAgents({
        query: { text: 'AI' },
        pagination: { limit: 3 }
      });
      console.log(`✅ Discovery found ${result.data.length} agents matching 'AI'`);
    } catch (error) {
      console.error('❌ Error:', error);
    }

    console.log('\n🎉 All API tests completed!');

  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  testAgentEndpoints().catch(console.error);
}

export default testAgentEndpoints;