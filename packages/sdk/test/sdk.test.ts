import { ethers } from 'ethers';
import { expect } from './setup';
import { Ensemble } from '../src/ensemble';
import dotenv from 'dotenv';

dotenv.config({ path: '.env', override: true });

export const setupEnv = () => {
  const provider = new ethers.JsonRpcProvider(process.env.NETWORK_RPC_URL!);
  const pk = process.env.PRIVATE_KEY!;
  const wallet = new ethers.Wallet(pk, provider);

  return {
    provider,
    signer: wallet
  };
}


export const setupSdk = (type: string = 'user') => {
  const { signer } = setupEnv();
  const sdk = new Ensemble(config, signer);
  sdk.start();
  return sdk;
}



const config = {
  network: {
    rpcUrl: process.env.NETWORK_RPC_URL!,
    chainId: parseInt(process.env.NETWORK_CHAIN_ID!, 10),
    name: process.env.NETWORK_NAME!
  },
  taskRegistryAddress: process.env.TASK_REGISTRY_ADDRESS!,
  agentRegistryAddress: process.env.AGENT_REGISTRY_ADDRESS!,
  serviceRegistryAddress: process.env.SERVICE_REGISTRY_ADDRESS!,
}

describe('Ensemble SDK', () => {

  let sdk: Ensemble;

  beforeEach(async () => {
    const { signer } = await setupEnv();
    sdk = new Ensemble(config, signer);
    await sdk.start();
  });

  afterAll(() => {
    sdk.stop();
  });

  describe.only('Initialization', () => {
    it('should initialize with different configs', async () => {
      const { signer } = await setupEnv();
      const sdk1 = new Ensemble(config, signer);
      expect(sdk1).to.be.instanceOf(Ensemble);
    });
  });


  // describe('Agent Management', () => {
  //   let agentAddress: string;
  //   const agentData: AgentData = {
  //     name: 'Agent1',
  //     uri: 'https://agent1.com',
  //     address: process.env.AGENT1_ADDRESS!,
  //     reputation: 100,
  //     proposals: []

  //   };
  //   it('should register agent', async () => {      
  //     agentAddress = await sdk.registerAgent(agentData.name, agentData.uri, agentData.address, agentdata agentData.reputation, agentData.proposals);
  //     console.log('agentId:', agentAddress);
  //     expect(agentAddress).to.be.a('string');
  //   });

  //   it('should get agent data', async () => {
  //     const data = await sdk.getAgentData(agentAddress);
  //     expect(data).to.deep.include({...agentData, skills: agentData.skills.map((skill: string) => [skill, BigInt(0)])});
  //   });
  // });

  // describe('Proposal Management', () => {
  //   let agentSdk: Ensemble;
  //   beforeEach(async () => {
  //     agentSdk = setupSdk('agent');
  //     // await sdk.start();
  //   });

  //   it('should send a proposal', async () => {

  //     const handleNewProposal = (proposal: Proposal) => {
  //       console.log(`New proposal created: ${proposal}`);
  //     };

  //     const taskId = '1'; // Assuming a task with ID 1 exists
  //     const price = 100;
  //     console.log('Task ID:', taskId);
  //     console.log('Price:', price);
  //     await agentSdk.sendProposal(taskId, price);

      
  //     // Since sendProposal uses PubSub, we can't directly check the result here.
  //     // Instead, we should check the logs or the PubSub topic for the message.
  //     // For simplicity, we will just log a message indicating the proposal was sent.
  //     console.log(`Proposal for task ${taskId} with price ${price} sent successfully.`);
  //   });

  //   it('should approve proposal and emit event', async () => {

  //     const agentData = {
  //       model: "gpt-4",
  //       prompt: "You are a crypto analyzer agent",
  //       skills: ["analyzing stables", "analyzing memes"]
  //     };

  //     const agentAddress = await agentSdk.getWalletAddress()
  //     console.log('agentAddress:', agentAddress);
  //     if (!(await agentSdk.isAgentRegistered(agentAddress))) {
  //       console.log('registering agent');
  //       await agentSdk.registerAgent(agentData.model, agentData.prompt, agentData.skills);
  //     }


  //     const taskId = '1'; // Assuming a task with ID 1 exists
  //     const proposal = {
  //       id: '1',
  //       price: 100,
  //       taskId: taskId,
  //       agent: agentAddress
  //     };

  //     let taskData = await sdk.getTaskData(taskId.toString());
  //     console.log('taskData:', taskData);

  //     const tx = await sdk.approveProposal(taskId, proposal);
  //     // expect(tx).to.be.a('object');
  //     console.log('tx:', tx);

  //     // taskData = await sdk.getTaskData(taskId.toString());
  //     // console.log('taskData:', taskData);
  //     // expect(taskData.status).to.equal(BigInt(1));
  //     // expect(taskData.assignee).to.equal(agentAddress);
  //   });

  //   it.only('should complete task and emit event', async () => {
  //     const taskId = '1'; // Assuming a task with ID 1 exists
  //     const result = "Task completed successfully";

  //     const tx = await agentSdk.completeTask(taskId, result);
  //     // expect(tx).to.be.a('object');
  //     console.log('tx:', tx);

  //     const taskData = await sdk.getTaskData(taskId);
  //     console.log('taskData:', taskData);
  //     expect(taskData.status).to.equal(BigInt(2));
  //   });

  // });

});