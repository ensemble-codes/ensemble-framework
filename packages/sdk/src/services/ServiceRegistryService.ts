import { Service } from "../types";
import { ServiceAlreadyRegisteredError } from "../errors";
import { ServiceRegistry } from "../../typechain";

export class ServiceRegistryService {
  constructor(private readonly serviceRegistry: ServiceRegistry) {}

  /**
   * @param service The service to register
   * @returns A promise that resolves when the service is registered
   */
  async registerService(service: Service): Promise<boolean> {
    try {
      console.log(`Registering service: ${service.name}`);

      const tx = await this.serviceRegistry.registerService(
        service.name,
        service.category,
        service.description
      );
      console.log(`Transaction sent for service ${service.name}: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(
        `Transaction confirmed for service ${service.name}: ${receipt?.hash}`
      );

      return true;
    } catch (error: any) {
      console.error(`Error registering service ${service.name}:`, error);
      if (error.reason === "Service already registered") {
        throw new ServiceAlreadyRegisteredError(service.name);
      }
      throw error;
    }
  }
  /**
   * Gets a service by name.
   * @param {string} name - The name of the service.
   * @returns {Promise<Service>} A promise that resolves to the service.
   */
  async getService(name: string): Promise<Service> {
    const service = await this.serviceRegistry.getService(name);
    return service;
  }
}
