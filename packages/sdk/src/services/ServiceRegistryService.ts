import { ethers } from "ethers";
import { Service } from "../types";

export class ServiceRegistryService {
	 private serviceRegistry: ethers.Contract;
	  
	  constructor(serviceRegistry: ethers.Contract) {
		this.serviceRegistry = serviceRegistry;
	}


	/**
	 * @param service The service to register
	 * @returns A promise that resolves when the service is registered
	 */
	async registerService(service: Service): Promise<boolean> {
		try {
			console.log(`Registering service: ${service.name}`);

			const tx = await this.serviceRegistry.registerService(service.name, service.category, service.description);
			console.log(`Transaction sent for service ${service.name}: ${tx.hash}`);

			const receipt = await tx.wait();
			console.log(`Transaction confirmed for service ${service.name}: ${receipt.transactionHash}`);

			return true;
	  
		} catch(error) {
			console.error(`Error registering service ${service.name}:`, error);

			throw error;
		}
	}
	
	async getService(name: string): Promise<Service> {
		const service = await this.serviceRegistry.getService(name);
		return service;
	}

	// async getAllServices(): Promise<Service[]> {
	// 	const services = await this.serviceRegistry.getAllServices();
	// 	return services.map((service: any) => ({
	// 		name: service.name,
	// 		category: service.category,
	// 		description: service.description
	// 	}));
	// }

}