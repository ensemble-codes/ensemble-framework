import { BigNumberish, ethers } from "ethers";
import { AgentData,  } from "../types";
import { AgentAlreadyRegisteredError, ServiceNotRegisteredError } from "../errors";

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
   * @param {string} name - The name of the agent.
   * @param {string} uri - The uri of the agent.
   * @param {string} address - The address of the agent.
   * @param {string} serviceName - The name of the service.
   * @param {number} servicePrice - The price of the service.
   * @returns {Promise<string>} A promise that resolves to the agent address.
   */
  async registerAgent(name: string, uri: string, address: string, serviceName: string, servicePrice: number): Promise<boolean> {
    try {
      console.log({ name, uri, address, serviceName, servicePrice });
      const tx = await this.agentRegistry.registerAgent(name, uri, address, serviceName, servicePrice);
      const receipt = await tx.wait();
      
      if (receipt.status === 0) {
        throw new Error("Transaction reverted: Agent registration failed");
      }
      
      const event = this.findEventInReceipt(receipt, "AgentRegistered");
      if (!event?.args) {
        throw new Error("Agent registration failed: Event not emitted");
      }
      return true;
      
    } catch (error: any) {
      console.error({ error });
      if (error.reason === "Service not registered") {
        throw new ServiceNotRegisteredError(error.reason);
      } else if (error.reason === "Agent already registered") {
        throw new AgentAlreadyRegisteredError(error.reason);
      } else {
        throw error;
      }
    }
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
  async getAgent(agentAddress: string): Promise<AgentData> {
    const [name, uri, address, reputation, proposals] = await this.agentRegistry.getAgentData(agentAddress);
    const isRegistered = await this.agentRegistry.isRegistered(agentAddress);

    return {
      name,
      uri,
      address,
      reputation,
      proposals,
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
          name: agent[0],
          uri: agent[1],
          owner: agent[2],
          address: agent[3],
          reputation: agent[4],
          isRegistered: true,
          proposals: agent[5]
        });
      }
      return agents;
    }

} 