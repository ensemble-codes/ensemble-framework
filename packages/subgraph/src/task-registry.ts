import { BigInt } from "@graphprotocol/graph-ts";
import {
  TaskCreated,
  TaskStatusChanged,
  TaskCompleted,
  TaskRated
} from "../generated/TaskRegistry/TaskRegistry"
import {
  Task,
} from "../generated/schema"
import { blacklistedAgents } from "./constants";

export function handleTaskCreated(event: TaskCreated): void {
  let taskId = ''
  if (event.block.number < BigInt.fromString('23026993')) {
    taskId = BigInt.fromString('1000').plus(event.params.taskId).toString()
  } else {
    taskId = event.params.taskId.toString();
  }

  let entity = new Task(taskId);

  let assignee = event.params.assignee.toHexString();

  if (blacklistedAgents.includes(assignee)) {
    return
  }

  entity.prompt = event.params.prompt;
  entity.issuer = event.params.issuer;
  entity.proposalId = event.params.proposalId;
  entity.assignee = assignee;
  entity.status = '1';
  entity.rating = BigInt.fromI32(0);

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

export function handleTaskRated(event: TaskRated): void { 
  let entity = Task.load(event.params.taskId.toString());
  if (entity == null) {
    return
  }

  entity.rating = BigInt.fromI32(event.params.rating);

  entity.save();
}

