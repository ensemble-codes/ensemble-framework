export class ServiceNotRegisteredError extends Error {
  constructor(serviceName: string) {
    super(`Service "${serviceName}" is not registered.`);
    this.name = "ServiceNotRegisteredError";
  }
}

export class AgentAlreadyRegisteredError extends Error {
  constructor(agentAddress: string) {
    super(`Agent "${agentAddress}" is already registered.`);
    this.name = "AgentAlreadyRegisteredError";
  }
}

export class AgentNotRegisteredError extends Error {
  constructor(agentAddress: string) {
    super(`Agent "${agentAddress}" is not registered.`);
    this.name = "AgentNotRegisteredError";
  }
}

export class ServiceAlreadyRegisteredError extends Error {
  constructor(serviceName: string) {
    super(`Service "${serviceName}" is already registered.`);
    this.name = "ServiceAlreadyRegisteredError";
  }
}

export class ProposalNotFoundError extends Error {
  constructor(proposalId: number) {
    super(`Proposal "${proposalId}" not found.`);
    this.name = "ProposalNotFoundError";
  }
}

// Service V2 Error Types
export class ServiceNotFoundError extends Error {
  constructor(serviceId: string) {
    super(`Service "${serviceId}" not found.`);
    this.name = "ServiceNotFoundError";
  }
}

export class ServiceOwnershipError extends Error {
  constructor(serviceId: string, currentOwner: string, attemptedBy: string) {
    super(`Access denied: Service "${serviceId}" is owned by "${currentOwner}", but operation was attempted by "${attemptedBy}".`);
    this.name = "ServiceOwnershipError";
  }
}

export class ServiceStatusError extends Error {
  constructor(serviceId: string, currentStatus: string, requiredStatus: string) {
    super(`Invalid service status: Service "${serviceId}" is "${currentStatus}" but operation requires "${requiredStatus}".`);
    this.name = "ServiceStatusError";
  }
}

export class ServiceValidationError extends Error {
  constructor(message: string, public readonly validationErrors?: any) {
    super(`Service validation failed: ${message}`);
    this.name = "ServiceValidationError";
  }
}

export class ServiceAgentAssignmentError extends Error {
  constructor(serviceId: string, agentAddress: string, reason: string) {
    super(`Cannot assign agent "${agentAddress}" to service "${serviceId}": ${reason}`);
    this.name = "ServiceAgentAssignmentError";
  }
}