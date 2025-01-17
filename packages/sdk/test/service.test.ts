import { Ensemble, Service } from "../src";
import { ServiceAlreadyRegisteredError } from "../src/errors";
import { setupSdk } from "./utils";


describe("ServiceRegistryService", () => {
  let sdk: Ensemble;

  beforeEach(async () => {
    sdk = setupSdk();
  });

  it("should successfully register a service", async () => {
    const service: Service = {
      name: "Test Service",
      category: "Utility",
      description: "This is a test service.",
    };

    const response = await sdk.registerService(service);
    console.log({ response });

    const serviceResponse = await sdk.getService("Test Service");

    expect(serviceResponse.name).toEqual(service.name);
    expect(serviceResponse.category).toEqual(service.category);
    expect(serviceResponse.description).toEqual(service.description);
  });

  it("should fail to register the same service twice", async () => {
    const service: Service = {
      name: "Test Service Failed",
      category: "Utility",
      description: "This is a test service.",
    };

    await sdk.registerService(service);
    await expect(sdk.registerService(service)).rejects.toThrow(ServiceAlreadyRegisteredError);
  });

  // it("should get all services", async () => {
  //   const services = await sdk.getAllServices();
  //   console.log(services);
  //   expect(services.length).toEqual(1);
  // });

});
