import { subgraphClient } from '../subgraph/client';
import { Agent, Proposal, Service } from '../subgraph/generated';
import { config } from '../config';

interface AgentMatch {
  id: string;
  name: string;
  description: string;
  reputation: string;
}

interface SearchOptions {
  limit?: number;
  minReputationScore?: number;
}

/**
 * Service to match agents based on user requests
 */
export class AgentMatcher {
  /**
   * Find agents matching a user request, prioritizing service descriptions first
   * @param query User's request or search query
   * @param options Search configuration options
   */
  async findMatchingAgents(query: string, options: SearchOptions = {}): Promise<AgentMatch[]> {
    const { limit = 5, minReputationScore = 0 } = options;

    const proposalResults = await this.findMatchingProposals(query);

    const matchedAgentIds = new Set<string>()
    const matches: AgentMatch[] = []

    for (const proposal of proposalResults) {
      if (matchedAgentIds.has(proposal.issuer.id)) {
        continue;
      }
      
      matchedAgentIds.add(proposal.issuer.id)

      matches.push({
        id: proposal.issuer.id,
        name: proposal.issuer.metadata?.name || proposal.issuer.name,
        description: proposal.issuer.metadata?.description || 'No description available',
        reputation: proposal.issuer.reputation
      })
    }
  
    // If we still need more matches, search for agents by name/description
    if (matches.length < limit) {
      const additionalAgents = await this.findAgentsByDescription(
        query, 
        limit - matches.length,
        matchedAgentIds,
        minReputationScore
      );
      
      matches.push(...additionalAgents);
    }
    
    // Sort by score (highest first)
    return matches;
  }

  private async findMatchingProposals(query: string): Promise<Proposal[]> {
    const words = query.toLowerCase().split(/\s+/)
      .filter(word => {
        if (/agent+s*/i.test(word)) return false;
        
        return true;
      });

    
    const result = await subgraphClient.GetProposals({
      searchTerm: words[0] ?? '',
    });

    return result.proposals.filter(p => p.issuer !== null) as Proposal[];
  }
  
  /**
   * Find services matching the query string
   */
  private async findMatchingServices(query: string, limit: number): Promise<Service[]> {
    const words = query.toLowerCase().split(/\s+/);
    
    // Get all services from the subgraph
    // Always include a searchTerm to avoid null filter errors
    const result = await subgraphClient.GetServices({ 
      limit: 100,
      searchTerm: ''  // Using empty string instead of null
    });
    const services = result.services;
    
    // Score each service based on how well it matches the query
    const scoredServices = services.map(service => {
      const name = service.name.toLowerCase();
      const description = service.description.toLowerCase();
      
      // Calculate match score based on words found in name and description
      let score = 0;
      for (const word of words) {
        if (word.length < 3) continue; // Skip very short words
        
        // Higher score for words in the name
        if (name.includes(word)) {
          score += 5;
        }
        
        // Lower score for words in the description
        if (description.includes(word)) {
          score += 3;
        }
      }
      
      return { service, score };
    });
    
    // Filter out services with no match and sort by score (highest first)
    return scoredServices
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.service);
  }
  
  /**
   * Find agents by their metadata description or name
   */
  private async findAgentsByDescription(
    query: string,
    limit: number,
    excludedIds: Set<string>,
    minReputationScore: number
  ): Promise<AgentMatch[]> {
    const words = query.toLowerCase().split(/\s+/)
      .filter(word => {
        if (/agent+s*/i.test(word)) return false;
        
        return true;
      });

    
    // Get all agents from the subgraph
    // Always include a searchTerm to avoid null filter errors
    const result = await subgraphClient.GetAgents({ 
      limit,
      searchTerm: words[0] ?? ''  // Using empty string instead of null
    });
    
    const agents = result.agents;
    
    // Score each agent based on how well it matches the query
    const matchedAgents: AgentMatch[] = [];
    
    for (const agent of agents) {
      // Skip if already matched or reputation is below threshold
      if (excludedIds.has(agent.id) || 
          parseInt(agent.reputation) < minReputationScore) {
        continue;
      }
      
      const name = (agent.metadata?.name || agent.name).toLowerCase();
      const description = (agent.metadata?.description || '').toLowerCase();
      
        matchedAgents.push({
          id: agent.id,
          name: name,
          description: description,
          reputation: agent.reputation
        });
    }
    
    // Sort by score and limit results
    return matchedAgents
  }
  
  /**
   * Get details for a specific agent
   */
  async getAgentDetails(agentId: string): Promise<Agent | null> {
    try {
      const result = await subgraphClient.GetAgent({ id: agentId });
      return result.agent as Agent || null;
    } catch (error) {
      console.error(`Error fetching agent details: ${error}`);
      return null;
    }
  }
}