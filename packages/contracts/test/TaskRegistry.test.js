const { expect } = require("chai");
const { ethers } = require("hardhat");
const AgentRegistryV1Artifact = require('./artifacts/AgentsRegistryV1.json')

describe("TaskRegistry", function () {
    let TaskRegistry, taskRegistry, AgentsRegistry, agentsRegistry;
    let agentOwner, agentAddress, taskIssuer, eveAddress;
    let taskPrice = ethers.parseEther("0.01");
    let proposalId = 1;
    let prompt = "Test prompt";

    async function setup() {
        await serviceRegistry.registerService("Service1", "Category1", "Description1");
        await agentsRegistry.connect(agentOwner).registerAgent(
            agentAddress,
            "Service Agent",
            "https://uri",
            "Service1",
            taskPrice
        );

        await agentsRegistry.setTaskRegistry(taskRegistry);
    }
    beforeEach(async function () {
        [taskIssuer, agentOwner, agentAddress, eveAddress] = await ethers.getSigners();
        
        ServiceRegistry = await ethers.getContractFactory("ServiceRegistry");
        serviceRegistry = await ServiceRegistry.deploy()
        
        const ServiceRegistryV1 = await ethers.getContractFactory("ServiceRegistry");
        const serviceRegistryV1 = await ServiceRegistryV1.deploy();

        const AgentRegistryV1 = await ethers.getContractFactoryFromArtifact(AgentRegistryV1Artifact);
        const agentRegistryV1 = await AgentRegistryV1.deploy(serviceRegistryV1.target);

        AgentsRegistry = await ethers.getContractFactory("AgentsRegistry");
        agentsRegistry = await AgentsRegistry.deploy(agentRegistryV1.target, serviceRegistry.target);

        TaskRegistry = await ethers.getContractFactory("TaskRegistry");
        taskRegistry = await TaskRegistry.deploy(agentsRegistry.target);
    });

    describe("createTask", function () {

        beforeEach(async function () {
            await setup();
        })

        it("should create a new task", async function () {
            await expect(taskRegistry.createTask(prompt, proposalId, { value: taskPrice }))
                .to.emit(taskRegistry, "TaskCreated")
                .withArgs(taskIssuer, agentAddress, 1, proposalId, prompt);

            const task = await taskRegistry.getTask(1);
            expect(task.prompt).to.equal(prompt);
            expect(task.issuer).to.equal(taskIssuer);
            expect(task.status).to.equal(1); // TaskStatus.ASSIGNED
            expect(task.proposalId).to.equal(proposalId);
        });

        it("should fail if the price is incorrect", async function () {

            const wrongTaskPrice = ethers.parseEther("0.02");

            await expect(taskRegistry.createTask(prompt, proposalId, { value: wrongTaskPrice }))
                .to.be.revertedWith("Invalid price");
        });
    });

    describe("completeTask", function () {

        beforeEach(async function () {
            await setup();
        })

        it("should complete a task", async function () {
            await expect(taskRegistry.createTask(prompt, proposalId, { value: taskPrice }))
                .to.emit(taskRegistry, "TaskCreated")
                .withArgs(taskIssuer, agentAddress, 1, proposalId, prompt);

            await expect(taskRegistry.connect(agentAddress).completeTask(1, "Test result"))
                .to.emit(taskRegistry, "TaskStatusChanged")
                .withArgs(1, 2) // TaskStatus.COMPLETED
                .and.to.emit(taskRegistry, "TaskCompleted")
                .withArgs(1, "Test result");

            const updatedTask = await taskRegistry.getTask(1);
            expect(updatedTask.status).to.equal(2); // TaskStatus.COMPLETED
        });

        it("should fail if not authorized", async function () {
            await expect(taskRegistry.createTask(prompt, proposalId, { value: taskPrice }))
            .to.emit(taskRegistry, "TaskCreated")
            .withArgs(taskIssuer, agentAddress, 1, proposalId, prompt);

            await expect(taskRegistry.connect(eveAddress).completeTask(1, "Test result"))
                .to.be.revertedWith("Not authorized");
        });

        it("Cannot complete task multiple times", async function () {
            await expect(taskRegistry.createTask(prompt, proposalId, { value: taskPrice }))
                .to.emit(taskRegistry, "TaskCreated")
                .withArgs(taskIssuer, agentAddress, 1, proposalId, prompt);

            await expect(taskRegistry.connect(agentAddress).completeTask(1, "Test result"))

            await expect(taskRegistry.connect(agentAddress).completeTask(1, "Test result"))
                .to.be.revertedWith("Invalid task status");
        });
    });

    describe("rateTask", function () {
        beforeEach(async function () {
            await setup();

            await expect(taskRegistry.createTask(prompt, proposalId, { value: taskPrice })).not.to.be.reverted
            await expect(taskRegistry.connect(agentAddress).completeTask(1, "Test result"))
                .and.to.emit(taskRegistry, "TaskCompleted")
                .withArgs(1, "Test result");
        });

        it("should rate a task", async function () {
            const rating = 80; // Example rating
            await expect(taskRegistry.connect(taskIssuer).rateTask(1, rating))
                .to.emit(taskRegistry, "TaskRated")
                .withArgs(1, rating);

            const updatedTask = await taskRegistry.getTask(1);
            expect(updatedTask.rating).to.equal(rating);
        });

        it("should fail if not the issuer", async function () {
            await expect(taskRegistry.connect(eveAddress).rateTask(1, 80))
                .to.be.revertedWith("Not the issuer of the task");
        });

        it("should fail if task is not completed", async function () {
            await expect(taskRegistry.createTask(prompt, proposalId, { value: taskPrice })).not.to.be.reverted

            await expect(taskRegistry.connect(taskIssuer).rateTask(2, 80))
                .to.be.revertedWith("Task is not completed");
        });

        it("should fail if rating is out of range", async function () {
            await expect(taskRegistry.connect(taskIssuer).rateTask(1, 101))
                .to.be.revertedWith("Rating must be between 0 and 100");
        });

        it("should only rate task ones", async function () {
            const rating = 80; // Example rating
            await expect(taskRegistry.connect(taskIssuer).rateTask(1, rating))
                .to.emit(taskRegistry, "TaskRated")
                .withArgs(1, rating);

            await expect(taskRegistry.connect(taskIssuer).rateTask(1, rating))
                .to.be.revertedWith("Task got rating already");
        });
    });

    describe("cancelTask", function () {
        beforeEach(async function () {
            await setup();

            await expect(taskRegistry.createTask(prompt, proposalId, { value: taskPrice })).not.to.be.reverted
        });

        it("should cancel a task", async function () {
            await expect(taskRegistry.connect(taskIssuer).cancelTask(1))
                .to.emit(taskRegistry, "TaskCanceled")
                .withArgs(1);

            const updatedTask = await taskRegistry.getTask(1);
            expect(updatedTask.status).to.equal(3);
        });

        it("should not cancel a task twice", async function () {
            await expect(taskRegistry.connect(taskIssuer).cancelTask(1))
                .to.emit(taskRegistry, "TaskCanceled")
                .withArgs(1);

            await expect(taskRegistry.connect(taskIssuer).cancelTask(1))
                .to.be.revertedWith("Task cannot be canceled");
        });

        it("should fail if not the issuer", async function () {
            await expect(taskRegistry.connect(eveAddress).cancelTask(1))
                .to.be.revertedWith("Not the issuer of the task");
        });
    });
});
