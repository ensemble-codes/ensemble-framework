import { BigNumberish, ethers } from "ethers";
import { AgentData, Proposal } from "../types";

export class AgentService {
  private agentRegistry: ethers.Contract;
  private signer: ethers.Signer;
  
  constructor(agentRegistry: ethers.Contract, signer: ethers.Signer) {
    this.agentRegistry = agentRegistry;
    this.signer = signer;
  }

  /**
   * Gets the address of the agent.
   * @returns {Promise<string>} A promise that resolves to the agent address.
   */
  async getAddress(): Promise<string> {
    return this.signer.getAddress();
  }

  /**
   * Registers a new agent.
   * @param {string} model - The model of the agent.
   * @param {string} prompt - The prompt for the agent.
   * @param {string[]} skills - The skills of the agent.
   * @returns {Promise<string>} A promise that resolves to the agent address.
   */
  async registerAgent(name: string, uri: string, owner: string, address: string, proposals: Proposal[]): Promise<string> {
    const tx = await this.agentRegistry.registerAgent(name, uri, owner, address, proposals);
    const receipt = await tx.wait();
    
    const event = this.findEventInReceipt(receipt, "AgentRegistered");
    if (!event?.args) {
      throw new Error("Agent registration failed");
    }
    const agentAddress = event.args[0];
    return agentAddress;
  }

  findEventInReceipt(receipt: any, eventName: string): ethers.EventLog {
    const events = receipt.logs.map((log: any) => {
      try {
        const event = this.agentRegistry.interface.parseLog(log);
        return event;
      } catch (e) {
        console.error('error:', e);
        return null;
      }
    }).filter((event: any) => event !== null);
    const event = events?.find((e: { name: string }) => e.name === eventName);
    return event;
  }

  /**
   * Gets data for a specific agent.
   * @param {string} agentAddress - The address of the agent.
   * @returns {Promise<AgentData>} A promise that resolves to the agent data.
   */
  async getAgentData(agentAddress: string): Promise<AgentData> {
    const [model, prompt, skills, reputation] = await this.agentRegistry.getAgentData(agentAddress);
    const isRegistered = await this.agentRegistry.isRegistered(agentAddress);

    return {
      address: agentAddress,
      model,
      prompt,
      skills,
      reputation,
      isRegistered
    };
  }

  /**
   * Checks if an agent is registered.
   * @param {string} agentAddress - The address of the agent.
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating if the agent is registered.
   */
  async isAgentRegistered(agentAddress: string): Promise<boolean> {
    return await this.agentRegistry.isRegistered(agentAddress);
  }

  /**
   * Adds a skill to an agent.
   * @param {string} name - The name of the skill.
   * @param {number} level - The level of the skill.
   * @returns {Promise<void>} A promise that resolves when the skill is added.
   */
  async addAgentSkill(name: string, level: number): Promise<void> {
    const tx = await this.agentRegistry.addSkill(name, level);
    await tx.wait();
  }


    /**
   * Updates the reputation of an agent.
   * @param {BigNumberish} reputation - The new reputation value.
   * @returns {Promise<void>} A promise that resolves when the reputation is updated.
   */
  async updateAgentReputation(reputation: BigNumberish): Promise<void> {
    const tx = await this.agentRegistry.updateReputation(reputation);
    await tx.wait();
  }

    /**
   * Gets all the agents for a specific service.
   * @param {string} serviceName - The name of the service.
   * @returns {Promise<AgentData>} A promise that resolves to a list of agent data.
   */
    async getAgentsByServiceId(serviceId: string): Promise<AgentData[]> {
      const agentAddresses: string[] = await this.agentRegistry.getAgentsByServiceId(serviceId);
  
      const agents: AgentData[] = [];
      for (const address of agentAddresses) {
        const agent = await this.agentRegistry.getAgentData(address);
        agents.push({
          address,
          model: agent[0],
          prompt: agent[1],
          skills: agent[2],
          reputation: agent[3],
          isRegistered: true,
        });
      }
      return agents;
    }
} 