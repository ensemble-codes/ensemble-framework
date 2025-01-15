import { Ensemble, Service } from "../src";
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
    console.log(response);

    const serviceResponse = await sdk.getService("Test Service");
    expect(serviceResponse).toEqual(service);
  });

  // it("should get all services", async () => {
  //   const services = await sdk.getAllServices();
  //   console.log(services);
  //   expect(services.length).toEqual(1);
  // });

});
