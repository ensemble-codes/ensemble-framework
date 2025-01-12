const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TaskRegistry", function () {
    let TaskRegistry, taskRegistry, AgentsRegistry, agentsRegistry;
    let agentOwner, agentAddress, taskIssuer, addr4;
    let taskPrice = ethers.parseEther("0.01");
    let proposalId = 0;
    let prompt = "Test prompt";

    async function setup() {
        await serviceRegistry.registerService("Service1", "Category1", "Description1");
        await agentsRegistry.connect(agentOwner).registerAgent(
            "Service Agent",
            "https://uri",
            agentAddress,
            "Service1",
            taskPrice
        );
    }
    beforeEach(async function () {
        [taskIssuer, agentOwner, agentAddress, addr4] = await ethers.getSigners();
        
        ServiceRegistry = await ethers.getContractFactory("ServiceRegistry");
        serviceRegistry = await ServiceRegistry.deploy();


        AgentsRegistry = await ethers.getContractFactory("AgentsRegistry");
        agentsRegistry = await AgentsRegistry.deploy(serviceRegistry.target);

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
            const proposalId = 0;

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

            await expect(taskRegistry.connect(addr4).completeTask(1, "Test result"))
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

    // describe("getTasksByOwner", function () {
    //     it("should return tasks by owner", async function () {
    //         const proposalId = 1;
    //         const prompt = "Test prompt";
    //         const price = ethers.parseEther("1");

    //         await agentsRegistry.registerAgent("Agent1", "uri1", addr1.address, "Service1", price);
    //         await taskRegistry.createTask(prompt, proposalId, { value: price });

    //         const tasks = await taskRegistry.getTasksByOwner(owner.address);
    //         expect(tasks.length).to.equal(1);
    //         expect(tasks[0]).to.equal(1);
    //     });
    // });

    // describe("getTask", function () {
    //     it("should return task details", async function () {
    //         const proposalId = 1;
    //         const prompt = "Test prompt";
    //         const price = ethers.parseEther("1");

    //         await agentsRegistry.registerAgent("Agent1", "uri1", addr1.address, "Service1", price);
    //         await taskRegistry.createTask(prompt, proposalId, { value: price });

    //         const task = await taskRegistry.getTask(1);
    //         expect(task.prompt).to.equal(prompt);
    //         expect(task.owner).to.equal(owner.address);
    //         expect(task.status).to.equal(0); // TaskStatus.CREATED
    //         expect(task.proposalId).to.equal(proposalId);
    //     });
    // });

    // describe("getStatus", function () {
    //     it("should return task status", async function () {
    //         const proposalId = 1;
    //         const prompt = "Test prompt";
    //         const price = ethers.parseEther("1");

    //         await agentsRegistry.registerAgent("Agent1", "uri1", addr1.address, "Service1", price);
    //         await taskRegistry.createTask(prompt, proposalId, { value: price });

    //         const status = await taskRegistry.getStatus(1);
    //         expect(status).to.equal(0); // TaskStatus.CREATED
    //     });
    // });

    // describe("getAssignee", function () {
    //     it("should return task assignee", async function () {
    //         const proposalId = 1;
    //         const prompt = "Test prompt";
    //         const price = ethers.parseEther("1");

    //         await agentsRegistry.registerAgent("Agent1", "uri1", addr1.address, "Service1", price);
    //         await taskRegistry.createTask(prompt, proposalId, { value: price });

    //         const task = await taskRegistry.getTask(1);
    //         task.assignee = addr1.address;

    //         const assignee = await taskRegistry.getAssignee(1);
    //         expect(assignee).to.equal(addr1.address);
    //     });
    // });
});
