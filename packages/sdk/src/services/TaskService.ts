import { BigNumberish, ethers } from "ethers";
import { TaskCreationParams, TaskData, TaskStatus } from "../types";
import { ProposalNotFoundError } from "../errors";
import { AgentService } from "./AgentService";

export class TaskService {
  private taskRegistry: ethers.Contract;
  protected onNewTask: (task: TaskData) => void = () => {};
  agentService: AgentService;
  
  constructor(taskRegistry: ethers.Contract, agentService: any) {
    this.taskRegistry = taskRegistry;
    this.agentService = agentService;
  }

  /**
   * Creates a new task.
   * @param {TaskCreationParams} params - The parameters for task creation.
   * @returns {Promise<TaskData>} A promise that resolves to the task ID.
   */
  async createTask(params: TaskCreationParams): Promise<TaskData> {
    try {
      const proposal = await this.agentService.getProposal(params.proposalId);
      const tx = await this.taskRegistry.createTask(
        params.prompt, params.proposalId,
        { value: proposal.price });
      const receipt = await tx.wait();
      
      const event = this.findEventInReceipt(receipt, "TaskCreated");
      // if (!event?.args?.[1]) {
      //   throw new Error("Task creation failed: No task address in event");
      // }
      // const taskId = event.args[1];
      const taskId = event.args[2];
      const prompt = event.args[4];
      return {
        id: taskId,
        assignee: event.args[1],
        prompt: prompt,
        status: TaskStatus.CREATED,
        issuer: event.args[0],
        proposalId: params.proposalId
      };
    } catch (error: any) {
      // console.error("Task creation failed:", error);
      if (error.reason === "Proposal not found") {
        throw new ProposalNotFoundError(error.reason);
      }
      throw error;
    }
  }

  /**
   * Gets data for a specific task.
   * @param {string} taskId - The ID of the task.
   * @returns {Promise<TaskData>} A promise that resolves to the task data.
   */
  async getTaskData(taskId: string): Promise<TaskData> {
    const [id, prompt, issuer, status, assignee, proposalId] = await this.taskRegistry.tasks(taskId);

    return {
      id,
      prompt,
      assignee: assignee || undefined,
      status,
      issuer,
      proposalId: proposalId
    };
  }

  /**
   * Gets tasks by issuer.
   * @param {string} issuer - The issuer of the tasks.
   * @returns {Promise<string[]>} A promise that resolves to the task IDs.
   */
  async getTasksByIssuer(issuer: string): Promise<TaskData[]> {
    return this.taskRegistry.getTasksByIssuer(issuer);
  }

  /**
   * Completes a task.
   * @param {BigNumberish} taskId - The ID of the task.
   * @param {string} result - The result of the task.
   * @returns {Promise<void>} A promise that resolves when the task is completed.
   */
  async completeTask(taskId: BigNumberish, result: string): Promise<void> {
    try {
      const tx = await this.taskRegistry.completeTask(taskId, result);
      await tx.wait();
    } catch (error) {
      console.error("Completing task failed:", error);
      throw error;
    }
  }

  /**
   * Subscribes to new task creation events.
   */
  public subscribe() {
    console.log("Subscribing to TaskCreated events");
    const filter = this.taskRegistry.filters.TaskCreated();
    this.taskRegistry.on(filter, ({ args: [ issuer, assignee, taskId, proposalId, prompt ] }) => {
      console.log(`New Task Created Event => Issuer: ${issuer} - Assignee: ${assignee} - TaskId: ${taskId} - ProposalId: ${proposalId} - Prompt: ${prompt}`);
  
      this.onNewTask({ issuer, id: taskId, prompt, status: TaskStatus.CREATED, proposalId: issuer });
    });

    // let startBlock = await this.signer.provider?.getBlockNumber();
    // console.log("currentBlock:", startBlock);
    // setInterval(async () => {
    //   const currentBlock = await this.signer.provider?.getBlockNumber();
    //   console.log("startBlock", startBlock);
    //   console.log("currentBlock", currentBlock);
    //   const events = await this.taskRegistry.queryFilter('TaskCreated', startBlock);
    //   console.log("events:", events);
    //   // startBlock = currentBlock;

    // }, 3000); // 10 seconds timeout
  }

  public unsubscribe() {
    const filter = this.taskRegistry.filters.TaskCreated();
    this.taskRegistry.removeListener(filter, this.onNewTask);
  }

  setOnNewTaskListener(listener: (task: TaskData) => void) {
    this.onNewTask = listener;
  } 

  findEventInReceipt(receipt: any, eventName: string): ethers.EventLog {
    const events = receipt.logs.map((log: any) => {
      try {
        const event = this.taskRegistry.interface.parseLog(log);
        return event;
      } catch (e) {
        console.error('error:', e);
        return null;
      }
    }).filter((event: any) => event !== null);
    const event = events?.find((e: { name: string }) => e.name === eventName);
    return event
  }

  // ... other task-related methods
} 