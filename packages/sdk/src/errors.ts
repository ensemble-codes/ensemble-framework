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