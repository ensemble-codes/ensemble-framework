#!/usr/bin/env npx tsx

/**
 * Integration test script for agent record methods
 * Run with: npm run test:integration or npx tsx scripts/test-agent-methods.ts
 */

import { ethers } from 'ethers';
import { Ensemble, AgentFilterParams } from '../src';

async function testAgentMethods() {
  console.log('🚀 Testing Agent Record Methods...\n');

  try {
    // Setup - you'll need to provide these values
    const config = {
      agentRegistryAddress: process.env.AGENT_REGISTRY_ADDRESS || "0x...", // Replace with actual address
      serviceRegistryAddress: process.env.SERVICE_REGISTRY_ADDRESS || "0x...", // Replace with actual address
      taskRegistryAddress: process.env.TASK_REGISTRY_ADDRESS || "0x...", // Replace with actual address
      network: {
        chainId: 84532, // Base Sepolia
        name: 'Base Sepolia',
        rpcUrl: process.env.RPC_URL || 'https://sepolia.base.org'
      },
      subgraphUrl: process.env.SUBGRAPH_URL || 'https://your-subgraph-url.com'
    };

    // Create read-only provider
    const provider = new ethers.JsonRpcProvider(config.network.rpcUrl);
    const signer = ethers.Wallet.createRandom().connect(provider);

    console.log('📡 Connecting to network:', config.network.name);
    console.log('📊 Subgraph URL:', config.subgraphUrl);
    
    const ensemble = Ensemble.create(config, signer);

    // Test 1: Get all agents with default parameters
    console.log('\n1️⃣ Testing getAgentRecords() - Get all agents');
    try {
      const allAgents = await ensemble.agents.getAgentRecords();
      console.log(`✅ Found ${allAgents.length} agents`);
      if (allAgents.length > 0) {
        console.log('📝 First agent:', {
          name: allAgents[0].name,
          address: allAgents[0].address,
          category: allAgents[0].category,
          reputation: allAgents[0].reputation.toString()
        });
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }

    // Test 2: Filter by category
    console.log('\n2️⃣ Testing getAgentRecords() - Filter by category');
    try {
      const filters: AgentFilterParams = {
        category: 'ai-assistant',
        first: 5
      };
      const categoryAgents = await ensemble.agents.getAgentRecords(filters);
      console.log(`✅ Found ${categoryAgents.length} agents in 'ai-assistant' category`);
    } catch (error) {
      console.error('❌ Error:', error);
    }

    // Test 3: getAgentsByCategory helper method
    console.log('\n3️⃣ Testing getAgentsByCategory()');
    try {
      const categoryAgents = await ensemble.agents.getAgentsByCategory('ai-assistant', 10, 0);
      console.log(`✅ Found ${categoryAgents.length} agents using getAgentsByCategory`);
    } catch (error) {
      console.error('❌ Error:', error);
    }

    // Test 4: Filter by owner (if you have a known owner address)
    console.log('\n4️⃣ Testing getAgentsByOwner()');
    if (process.env.TEST_OWNER_ADDRESS) {
      try {
        const ownerAgents = await ensemble.agents.getAgentsByOwner(process.env.TEST_OWNER_ADDRESS);
        console.log(`✅ Found ${ownerAgents.length} agents owned by ${process.env.TEST_OWNER_ADDRESS}`);
      } catch (error) {
        console.error('❌ Error:', error);
      }
    } else {
      console.log('⏭️ Skipping owner test (set TEST_OWNER_ADDRESS env var)');
    }

    // Test 5: Get specific agent record (if you have a known agent address)
    console.log('\n5️⃣ Testing getAgentRecord()');
    if (process.env.TEST_AGENT_ADDRESS) {
      try {
        const agentRecord = await ensemble.agents.getAgentRecord(process.env.TEST_AGENT_ADDRESS);
        console.log(`✅ Agent found:`, {
          name: agentRecord.name,
          description: agentRecord.description,
          category: agentRecord.category,
          attributes: agentRecord.attributes,
          socials: agentRecord.socials
        });
      } catch (error) {
        console.error('❌ Error:', error);
      }
    } else {
      console.log('⏭️ Skipping specific agent test (set TEST_AGENT_ADDRESS env var)');
    }

    // Test 6: Test pagination
    console.log('\n6️⃣ Testing pagination');
    try {
      const page1 = await ensemble.agents.getAgentRecords({ first: 3, skip: 0 });
      const page2 = await ensemble.agents.getAgentRecords({ first: 3, skip: 3 });
      console.log(`✅ Page 1: ${page1.length} agents, Page 2: ${page2.length} agents`);
    } catch (error) {
      console.error('❌ Error:', error);
    }

    // Test 7: Test reputation filtering
    console.log('\n7️⃣ Testing reputation filtering');
    try {
      const highRepAgents = await ensemble.agents.getAgentRecords({
        reputation_min: 3.0, // Minimum 3.0 reputation
        first: 5
      });
      console.log(`✅ Found ${highRepAgents.length} agents with reputation >= 3.0`);
    } catch (error) {
      console.error('❌ Error:', error);
    }

    // Test 8: Test new update methods (if you have write access)
    console.log('\n8️⃣ Testing Agent Update Methods (updateAgentRecord & updateAgentRecordProperty)');
    if (process.env.TEST_AGENT_ADDRESS && process.env.PRIVATE_KEY) {
      try {
        // Create a signer with write access
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const ensembleWithSigner = Ensemble.create(config, wallet);
        
        console.log('⚠️  WARNING: About to test update methods on real blockchain!');
        console.log('📝 Agent to update:', process.env.TEST_AGENT_ADDRESS);
        
        // Test updateAgentRecordProperty - update name
        console.log('\n🔄 Testing updateAgentRecordProperty - updating name...');
        const propertyResult = await ensembleWithSigner.agents.updateAgentRecordProperty(
          process.env.TEST_AGENT_ADDRESS,
          'name',
          'Test Agent (Updated via SDK)'
        );
        console.log('✅ Property update successful:', {
          transactionHash: propertyResult.transactionHash,
          blockNumber: propertyResult.blockNumber,
          gasUsed: propertyResult.gasUsed.toString(),
          success: propertyResult.success
        });

        // Wait a moment before next update
        console.log('⏳ Waiting 5 seconds before next update...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Test updateAgentRecord - update multiple properties
        console.log('\n🔄 Testing updateAgentRecord - updating multiple properties...');
        const recordResult = await ensembleWithSigner.agents.updateAgentRecord(
          process.env.TEST_AGENT_ADDRESS,
          {
            description: 'Updated via SDK integration test',
            attributes: ['sdk-tested', 'integration-test', 'updated']
          }
        );
        console.log('✅ Record update successful:', {
          transactionHash: recordResult.transactionHash,
          blockNumber: recordResult.blockNumber,
          gasUsed: recordResult.gasUsed.toString(),
          success: recordResult.success
        });

        console.log('\n🔍 Fetching updated agent to verify changes...');
        const updatedAgent = await ensemble.agents.getAgentRecord(process.env.TEST_AGENT_ADDRESS);
        console.log('📊 Updated agent data:', {
          name: updatedAgent.name,
          description: updatedAgent.description,
          attributes: updatedAgent.attributes
        });

      } catch (error) {
        console.error('❌ Update test error:', error);
        console.log('💡 To test update methods, set:');
        console.log('   - TEST_AGENT_ADDRESS: Address of agent you own');
        console.log('   - PRIVATE_KEY: Private key of agent owner');
      }
    } else {
      console.log('⏭️ Skipping update tests (set TEST_AGENT_ADDRESS and PRIVATE_KEY env vars)');
      console.log('💡 To test update methods:');
      console.log('   export TEST_AGENT_ADDRESS="0x..."  # Agent address you own');
      console.log('   export PRIVATE_KEY="0x..."         # Your private key');
      console.log('   ⚠️  Only use test networks and test private keys!');
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  testAgentMethods().catch(console.error);
}

export default testAgentMethods;