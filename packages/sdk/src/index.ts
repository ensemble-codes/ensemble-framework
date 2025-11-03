import Ensemble from "./ensemble"
import { AgentService } from "./services/AgentService"
import { TaskService } from "./services/TaskService"
import { ContractService } from "./services/ContractService"
import { ServiceRegistryService } from "./services/ServiceRegistryService"

// Export all types and interfaces
export * from "./types";

// Export base schemas
export * from "./schemas/base.schemas";

// Export validation functions
export {
    validateAgentRecord,
    validateRegisterParams,
    validateUpdateParams,
    validateCommunicationParams,
    parseAgentRecord,
    parseRegisterParams,
    parseUpdateParams
} from "./schemas/agent.schemas";

// Export service validation functions
export {
    validateServiceRecord,
    validateService, // deprecated alias
    validateRegisterServiceParams,
    validateUpdateServiceParams,
    validateServiceOnChain,
    validateServiceMetadata,
    parseServiceRecord,
    parseService, // deprecated alias
    parseRegisterServiceParams,
    parseUpdateServiceParams,
    isServiceRecord,
    isService, // deprecated alias
    isRegisterServiceParams,
    isUpdateServiceParams,
    isServiceOnChain,
    isServiceMetadata,
    formatServiceValidationError
} from "./schemas/service.schemas"

export { 
    Ensemble, 
    AgentService, 
    TaskService, 
    ContractService, 
    ServiceRegistryService
}

export default Ensemble
