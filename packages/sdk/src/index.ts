import Ensemble from "./ensemble"
import { AgentService } from "./services/AgentService"
import { TaskService } from "./services/TaskService"
import { ContractService } from "./services/ContractService"
import { ServiceRegistryService } from "./services/ServiceRegistryService"

// Export all types and interfaces
export * from "./types"

// Export validation functions
export {
    validateAgentRecord,
    validateRegisterParams,
    validateUpdateParams,
    validateCommunicationParams,
    parseAgentRecord,
    parseRegisterParams,
    parseUpdateParams
} from "./schemas/agent.schemas"

export { 
    Ensemble, 
    AgentService, 
    TaskService, 
    ContractService, 
    ServiceRegistryService
}

export default Ensemble
