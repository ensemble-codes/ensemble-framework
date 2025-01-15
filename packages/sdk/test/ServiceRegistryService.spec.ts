import { ethers } from "ethers";
import { Ensemble, ServiceRegistryService, Service } from "../src";
import { setupSdk } from "./utils";
// import {  } from "../src/ensemble";

describe("ServiceRegistryService", () => {
  let serviceRegistryMock: any;
  let serviceRegistryService: ServiceRegistryService;
  let sdk: Ensemble;

  beforeEach(async () => {
    sdk = setupSdk();
    console.log(sdk);
    // serviceRegistryMock = sdk.serviceRegistry;
    // serviceRegistryService = new ServiceRegistryService(serviceRegistryMock);
  });

  it("should successfully register a service", async () => {
    // Mock transaction and receipt
    // const mockTx = { hash: "0x123", wait: jest.fn().mockResolvedValue({ transactionHash: "0x123" }) };
    // serviceRegistryMock.registerService.mockResolvedValue(mockTx);

    const service: Service = {
      name: "Test Service",
      category: "Utility",
      description: "This is a test service.",
    };

    await sdk.registerService(service);
    expect(sdk.registerService).toHaveBeenCalledWith(service);
    // Call registerService
    // await serviceRegistryService.registerService(service);

    // // Assertions
    // expect(serviceRegistryMock.registerService).toHaveBeenCalledWith(
    //   service.name,
    //   service.category,
    //   service.description
    // );
    // expect(mockTx.wait).toHaveBeenCalled();
  });

  // it("should handle errors during service registration", async () => {
  //   // Mock error
  //   const error = new Error("Transaction failed");
  //   serviceRegistryMock.registerService.mockRejectedValue(error);

  //   const service: Service = {
  //     name: "Fail Service",
  //     category: "Failure",
  //     description: "This service will fail.",
  //   };

  //   // Spy on console.error
  //   const consoleSpy = jest.spyOn(console, "error").mockImplementation();

  //   // Call registerService and expect error
  //   await expect(serviceRegistryService.registerService(service)).rejects.toThrow();

  //   // Assertions
  //   expect(consoleSpy).toHaveBeenCalledWith(
  //     `Error registering service ${service.name}:`,
  //     error
  //   );

  //   // Cleanup mock
  //   consoleSpy.mockRestore();
  // });
});
