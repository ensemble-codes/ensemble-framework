import {
  TaskCreated,
  TaskStatusChanged,
  TaskCompleted
} from "../generated/TaskRegistry/TaskRegistry"
import {
  Agent,
  Task,
} from "../generated/schema"

export function handleTaskCreated(event: TaskCreated): void {
  let entity = new Task(event.params.taskId.toString());

  entity.prompt = event.params.prompt;
  entity.issuer = event.params.issuer;
  entity.proposalId = event.params.proposalId;
  entity.assignee = event.params.assignee.toHexString();
  entity.status = '1';

  entity.save();
}

export function handleTaskStatusChanged(event: TaskStatusChanged): void { 
  let entity = Task.load(event.params.taskId.toString());
  if (entity == null) {
    return
  }

  entity.status = event.params.status.toString();

  entity.save();
}

export function handleTaskStatusCompleted(event: TaskCompleted): void { 
  let entity = Task.load(event.params.taskId.toString());
  if (entity == null) {
    return
  }

  entity.result = event.params.result;

  entity.save();
}

