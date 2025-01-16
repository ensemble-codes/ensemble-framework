import { BigNumberish, ethers } from "ethers";
import { TaskCreationParams, TaskData, TaskStatus } from "../types";
import { ProposalNotFoundError } from "../errors";

export class TaskService {
  private taskRegistry: ethers.Contract;
  protected onNewTask: (task: TaskData) => void = () => {};
  
  constructor(taskRegistry: ethers.Contract) {
    this.taskRegistry = taskRegistry;
  }

  /**
   * Creates a new task.
   * @param {TaskCreationParams} params - The parameters for task creation.
   * @returns {Promise<TaskData>} A promise that resolves to the task ID.
   */
  async createTask(params: TaskCreationParams): Promise<TaskData> {
    try {
      const tx = await this.taskRegistry.createTask(params.prompt, params.proposalId);
      console.log("sending txhash:", tx.hash);
      const receipt = await tx.wait();
      
      const event = this.findEventInReceipt(receipt, "TaskCreated");
      // if (!event?.args?.[1]) {
      //   throw new Error("Task creation failed: No task address in event");
      // }
      // const taskId = event.args[1];
      const owner = event.args[0];
      const taskId = event.args[1];
      const prompt = event.args[2];
      const taskType = event.args[3];
      return {
        id: taskId,
        prompt,
        taskType,
        status: TaskStatus.CREATED,
        owner
      };
    } catch (error: any) {
      console.error("Task creation failed:", error);
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
    const [id, prompt, taskType, owner, status, assignee] = await this.taskRegistry.tasks(taskId);

    return {
      id,
      prompt,
      taskType,
      assignee: assignee || undefined,
      status,
      owner
    };
  }

  /**
   * Gets tasks by owner.
   * @param {string} owner - The owner of the tasks.
   * @returns {Promise<string[]>} A promise that resolves to the task IDs.
   */
  async getTasksByOwner(owner: string): Promise<TaskData[]> {
    return this.taskRegistry.getTasksByOwner(owner);
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
  public async subscribe() {
    console.log("taskRegistry.filters:", this.taskRegistry.filters);
    const filter = this.taskRegistry.filters.TaskCreated();
    console.log("filter:", filter);
    // console.log("filter:", filter);
    console.log("taskRegistry.target:", this.taskRegistry.target);
    this.taskRegistry.on(filter, ({ args: [ owner, taskId, prompt, taskType ] }) => {
      console.log(`Owner: ${owner}
        Task ID: ${taskId}
        Prompt: ${prompt}
        Task Type: ${taskType}`);
      this.onNewTask({ owner, id: taskId, prompt, taskType, status: TaskStatus.CREATED });
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