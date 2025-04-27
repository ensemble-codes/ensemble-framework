import { AgentMatcher } from '../src/services/agent-matcher';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('AgentMatcher', () => {
  let agentMatcher: AgentMatcher;
  
  beforeEach(() => {
    agentMatcher = new AgentMatcher();
  });
  
  describe('findMatchingAgents', () => {
    it('should find agents related to AI services', async () => {
      const results = await agentMatcher.findMatchingAgents('AI assistant', { limit: 5 });
      console.log('Results:', results);
      // Verify we got some results
      expect(results.length).toBeGreaterThan(0);
      
      // Check that each result has the expected properties
      results.forEach(result => {
        expect(result.id).toBeDefined();
        expect(result.name).toBeDefined();
        expect(result.description).toBeDefined();
        expect(result.score).toBeGreaterThan(0);
        expect(result.reputation).toBeDefined();
      });
    });
    
    it('should filter agents by minimum reputation score', async () => {
      const minScore = 1;
      const results = await agentMatcher.findMatchingAgents('assistant', { 
        limit: 5,
        minReputationScore: minScore
      });
      
      // Skip test if no results
      if (results.length === 0) {
        console.log('No results found for reputation score test');
        return;
      }
      
      // Verify all returned agents meet the minimum reputation requirement
      results.forEach(result => {
        expect(parseInt(result.reputation)).toBeGreaterThanOrEqual(minScore);
      });
    });
    
    it('should respect the limit parameter', async () => {
      const limit = 3;
      const results = await agentMatcher.findMatchingAgents('data', { limit });
      
      // The number of results should be less than or equal to the limit
      expect(results.length).toBeLessThanOrEqual(limit);
    });
    
    it('should return agents sorted by score', async () => {
      const results = await agentMatcher.findMatchingAgents('translation', { limit: 5 });
      
      // If we have at least 2 results, verify they're sorted by score (highest first)
      if (results.length >= 2) {
        for (let i = 0; i < results.length - 1; i++) {
          expect(results[i].score).toBeGreaterThanOrEqual(results[i+1].score);
        }
      }
    });
  });
  
  describe('getAgentDetails', () => {
    it('should return details for a valid agent ID', async () => {
      // To test this meaningfully, we first need to get a valid agent ID from the subgraph
      const agents = await agentMatcher.findMatchingAgents('agent', { limit: 1 });
      
      // Skip test if no agents found
      if (agents.length === 0) {
        console.log('No agents found to test getAgentDetails');
        return;
      }
      
      const agentId = agents[0].id;
      const agentDetails = await agentMatcher.getAgentDetails(agentId);
      
      // Verify the agent details
      expect(agentDetails).not.toBeNull();
      if (agentDetails) {
        expect(agentDetails.id).toBe(agentId);
        expect(agentDetails.name).toBeDefined();
        expect(agentDetails.agentUri).toBeDefined();
        expect(agentDetails.reputation).toBeDefined();
      }
    });
    
    it('should return null for a non-existent agent ID', async () => {
      const nonExistentId = 'non-existent-agent-id-123456789';
      const result = await agentMatcher.getAgentDetails(nonExistentId);
      expect(result).toBeNull();
    });
  });
}); 