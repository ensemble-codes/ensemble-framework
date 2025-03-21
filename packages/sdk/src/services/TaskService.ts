import { ethers } from "ethers";
import { TaskCreationParams, TaskData, TaskStatus } from "../types";
import { ProposalNotFoundError } from "../errors";
import { AgentService } from "./AgentService";
import { TaskRegistry } from "../../typechain";

export class TaskService {
  private onNewTask: (task: TaskData) => void = () => {};

  constructor(
    private readonly taskRegistry: TaskRegistry, 
    private readonly agentService: AgentService
  ) {}

  /**
   * Creates a new task.
   * @param {TaskCreationParams} params - The parameters for task creation.
   * @returns {Promise<TaskData>} A promise that resolves to the task ID.
   */
  async createTask(params: TaskCreationParams): Promise<TaskData> {
    try {
      const proposal = await this.agentService.getProposal(params.proposalId);

      const tx = await this.taskRegistry.createTask(
        params.prompt,
        params.proposalId,
        { value: proposal.price }
      );
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
        status: BigInt(TaskStatus.CREATED),
        issuer: event.args[0],
        proposalId: BigInt(params.proposalId),
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
    const { id, prompt, issuer, status, assignee, proposalId, rating } =
      await this.taskRegistry.tasks(taskId);

    return {
      id,
      prompt,
      assignee: assignee || undefined,
      status,
      issuer,
      rating,
      proposalId,
    };
  }

  /**
   * Gets tasks by issuer.
   * @param {string} issuer - The issuer of the tasks.
   * @returns {Promise<bigint[]>} A promise that resolves to the task IDs.
   */
  async getTasksByIssuer(issuer: string): Promise<bigint[]> {
    return this.taskRegistry.getTasksByIssuer(issuer);
  }

  /**
   * Completes a task.
   * @param {BigNumberish} taskId - The ID of the task.
   * @param {string} result - The result of the task.
   * @returns {Promise<void>} A promise that resolves when the task is completed.
   */
  async completeTask(taskId: string, result: string): Promise<void> {
    try {
      const tx = await this.taskRegistry.completeTask(taskId, result);
      await tx.wait();
    } catch (error) {
      console.error("Completing task failed:", error);
      throw error;
    }
  }

  /**
   * Assigns a rating to a task.
   * @param {string} taskId - The ID of the task.
   * @param {number} rating - The rating.
   * @returns {Promise<void>} A promise that resolves when the task is assigned.
   */
  async rateTask(taskId: string, rating: number): Promise<void> {
    try {
      const tx = await this.taskRegistry.rateTask(taskId, rating);
      await tx.wait();
    } catch (error) {
      console.error("Rating task failed:", error);
      throw error;
    }
  }

  /**
   * Cancels a task.
   * @param {string} taskId - The ID of the task.
   * @returns {Promise<void>} A promise that resolves when the task is canceled.
   */
  async cancelTask(taskId: string): Promise<void> {
    try {
      const tx = await this.taskRegistry.cancelTask(taskId);
      await tx.wait();
    } catch (error) {
      console.error("Canceling task failed:", error);
      throw error;
    }
  }

  /**
   * Subscribes to new task creation events.
   */
  public subscribe() {
    console.log("Subscribing to TaskCreated events");
    const filter = this.taskRegistry.filters.TaskCreated();
    
    this.taskRegistry.on(
      filter,
      (issuer, assignee, taskId, proposalId, prompt) => {
        console.log(
          `New Task Created Event => Issuer: ${issuer} - Assignee: ${assignee} - TaskId: ${taskId} - ProposalId: ${proposalId} - Prompt: ${prompt}`
        );

        this.onNewTask({
          issuer,
          id: taskId,
          prompt,
          status: BigInt(TaskStatus.CREATED),
          proposalId
        });
      }
    );
  }

  /**
   * Unsubscribes from new task creation events.
   */
  public unsubscribe() {
    const filter = this.taskRegistry.filters.TaskCreated();
    this.taskRegistry.removeListener(filter, this.onNewTask);
  }

  /**
   * Sets a listener for new task creation events.
   * @param {function} listener - The listener function.
   */
  setOnNewTaskListener(listener: (task: TaskData) => void) {
    this.onNewTask = listener;
  }

  findEventInReceipt(receipt: any, eventName: string): ethers.EventLog {
    const events = receipt.logs
      .map((log: any) => {
        try {
          const event = this.taskRegistry.interface.parseLog(log);
          return event;
        } catch (e) {
          console.error("error:", e);
          return null;
        }
      })
      .filter((event: any) => event !== null);
    const event = events?.find((e: { name: string }) => e.name === eventName);
    return event;
  }

  // ... other task-related methods
}
