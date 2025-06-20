const { expect } = require("chai");
const { ethers } = require("hardhat");
const AgentRegistryV1Artifact = require('./artifacts/AgentsRegistryV1.json')

describe.only("TaskRegistry", function () {
    let TaskRegistry, taskRegistry, AgentsRegistry, agentsRegistry;
    let agentOwner, agentAddress, taskIssuer, eveAddress;
    let taskPrice = ethers.parseEther("0.01");
    let proposalId = 1;
    let prompt = "Test prompt";

    async function setupWithEthProposal() {
        await serviceRegistry.registerService("Service1", "Category1", "Description1");
        await agentsRegistry.connect(agentOwner).registerAgentWithProposal(
            agentAddress,
            "Service Agent",
            "https://uri",
            "Service1",
            taskPrice,
            ethers.ZeroAddress
        );

        await agentsRegistry.setTaskRegistry(taskRegistry);
    }

    async function setupWithErc20Proposal() {
        // Deploy mock ERC20 token
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        mockToken = await MockERC20.deploy("MockToken", "MTK", ethers.parseEther("1000"), 18);
        
        // Transfer tokens to task issuer
        await mockToken.transfer(taskIssuer.address, ethers.parseEther("10"));
        
        // Register service
        await serviceRegistry.registerService("Service1", "Category1", "Description1");
        
        // Register agent with ERC20 proposal
        await agentsRegistry.connect(agentOwner).registerAgentWithProposal(
            agentAddress,
            "Service Agent",
            "https://uri",
            "Service1",
            taskPrice,
            mockToken.target
        );

        await agentsRegistry.setTaskRegistry(taskRegistry);
        
        // Approve task registry to spend tokens
        await mockToken.connect(taskIssuer).approve(taskRegistry.target, taskPrice);
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
        taskRegistry = await TaskRegistry.deploy(1, agentsRegistry.target);
    });

    describe("createTask", function () {

        describe("ETH proposal", function () {
            beforeEach(async function () {
                await setupWithEthProposal();
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
        })

        describe("ERC20 proposal", function () {

            beforeEach(async function () {
                await setupWithErc20Proposal();
            })

            it("should create a new task with ERC20 payment", async function () {
                // Approve the task registry to spend tokens
                await mockToken.connect(taskIssuer).approve(taskRegistry.target, taskPrice);

                await expect(taskRegistry.createTask(prompt, proposalId))
                    .to.emit(taskRegistry, "TaskCreated")
                    .withArgs(taskIssuer, agentAddress, 1, proposalId, prompt);

                const task = await taskRegistry.getTask(1);
                expect(task.prompt).to.equal(prompt);
                expect(task.issuer).to.equal(taskIssuer);
                expect(task.status).to.equal(1); // TaskStatus.ASSIGNED
                expect(task.proposalId).to.equal(proposalId);
            });

            it("should fail if insufficient token allowance", async function () {
                // Don't approve tokens or approve insufficient amount
                await mockToken.connect(taskIssuer).approve(taskRegistry.target, ethers.parseEther("0.005"));

                await expect(taskRegistry.createTask(prompt, proposalId))
                    .to.be.reverted;
            });

            it("should fail if insufficient token balance", async function () {
                // Transfer away tokens so balance is insufficient
                const balance = await mockToken.balanceOf(taskIssuer.address);
                await mockToken.connect(taskIssuer).transfer(eveAddress.address, balance);

                await mockToken.connect(taskIssuer).approve(taskRegistry.target, taskPrice);

                await expect(taskRegistry.createTask(prompt, proposalId))
                    .to.be.reverted;
            });

            it("should transfer tokens from issuer to contract", async function () {
                const initialIssuerBalance = await mockToken.balanceOf(taskIssuer.address);
                const initialContractBalance = await mockToken.balanceOf(taskRegistry.target);

                await mockToken.connect(taskIssuer).approve(taskRegistry.target, taskPrice);
                await taskRegistry.createTask(prompt, proposalId);

                const finalIssuerBalance = await mockToken.balanceOf(taskIssuer.address);
                const finalContractBalance = await mockToken.balanceOf(taskRegistry.target);

                expect(finalIssuerBalance).to.equal(initialIssuerBalance - taskPrice);
                expect(finalContractBalance).to.equal(initialContractBalance + taskPrice);
            });
        })
    });

    describe("completeTask", function () {
        describe("ETH tasks", function () {
            beforeEach(async function () {
                await setupWithEthProposal();
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

            it("should transfer ETH back to issuer on completion", async function () {
                const initialIssuerBalance = await ethers.provider.getBalance(taskIssuer.address);
                
                await taskRegistry.createTask(prompt, proposalId, { value: taskPrice });
                
                const balanceAfterCreate = await ethers.provider.getBalance(taskIssuer.address);
                expect(balanceAfterCreate).to.be.lessThan(initialIssuerBalance);

                await taskRegistry.connect(agentAddress).completeTask(1, "Test result");

                const finalIssuerBalance = await ethers.provider.getBalance(taskIssuer.address);
                expect(finalIssuerBalance).to.equal(balanceAfterCreate + taskPrice);
            });
        });

        describe("ERC20 tasks", function () {
            beforeEach(async function () {
                await setupWithErc20Proposal();
            })

            it("should complete an ERC20 task", async function () {
                await mockToken.connect(taskIssuer).approve(taskRegistry.target, taskPrice);
                
                await expect(taskRegistry.createTask(prompt, proposalId))
                    .to.emit(taskRegistry, "TaskCreated")
                    .withArgs(taskIssuer, agentAddress, 1, proposalId, prompt);

                await expect(taskRegistry.connect(agentAddress).completeTask(1, "Test result"))
                    .to.emit(taskRegistry, "TaskStatusChanged")
                    .withArgs(1, 2) // TaskStatus.COMPLETED
                    .and.to.emit(taskRegistry, "TaskCompleted")
                    .withArgs(1, "Test result");

                const updatedTask = await taskRegistry.getTask(1);
                expect(updatedTask.status).to.equal(2); // TaskStatus.COMPLETED
                expect(updatedTask.result).to.equal("Test result");
            });

            it("should fail if not authorized for ERC20 task", async function () {
                await mockToken.connect(taskIssuer).approve(taskRegistry.target, taskPrice);
                
                await taskRegistry.createTask(prompt, proposalId);

                await expect(taskRegistry.connect(eveAddress).completeTask(1, "Test result"))
                    .to.be.revertedWith("Not authorized");
            });

            it("Cannot complete ERC20 task multiple times", async function () {
                await mockToken.connect(taskIssuer).approve(taskRegistry.target, taskPrice);
                
                await taskRegistry.createTask(prompt, proposalId);

                await taskRegistry.connect(agentAddress).completeTask(1, "Test result");

                await expect(taskRegistry.connect(agentAddress).completeTask(1, "Test result"))
                    .to.be.revertedWith("Invalid task status");
            });

            it("should transfer tokens back to issuer on completion", async function () {
                const initialIssuerBalance = await mockToken.balanceOf(taskIssuer.address);
                const initialContractBalance = await mockToken.balanceOf(taskRegistry.target);

                await mockToken.connect(taskIssuer).approve(taskRegistry.target, taskPrice);
                await taskRegistry.createTask(prompt, proposalId);

                const balanceAfterCreate = await mockToken.balanceOf(taskIssuer.address);
                const contractBalanceAfterCreate = await mockToken.balanceOf(taskRegistry.target);
                
                expect(balanceAfterCreate).to.equal(initialIssuerBalance - taskPrice);
                expect(contractBalanceAfterCreate).to.equal(initialContractBalance + taskPrice);

                await taskRegistry.connect(agentAddress).completeTask(1, "Test result");

                const finalIssuerBalance = await mockToken.balanceOf(taskIssuer.address);
                const finalContractBalance = await mockToken.balanceOf(taskRegistry.target);

                expect(finalIssuerBalance).to.equal(initialIssuerBalance);
                expect(finalContractBalance).to.equal(initialContractBalance);
            });

            it("should handle completion with empty result", async function () {
                await mockToken.connect(taskIssuer).approve(taskRegistry.target, taskPrice);
                
                await taskRegistry.createTask(prompt, proposalId);

                await expect(taskRegistry.connect(agentAddress).completeTask(1, ""))
                    .to.emit(taskRegistry, "TaskCompleted")
                    .withArgs(1, "");

                const updatedTask = await taskRegistry.getTask(1);
                expect(updatedTask.result).to.equal("");
                expect(updatedTask.status).to.equal(2); // TaskStatus.COMPLETED
            });

            it("should handle completion with long result", async function () {
                await mockToken.connect(taskIssuer).approve(taskRegistry.target, taskPrice);
                
                await taskRegistry.createTask(prompt, proposalId);

                const longResult = "This is a very long result that contains multiple sentences and detailed information about the task completion. ".repeat(10);

                await expect(taskRegistry.connect(agentAddress).completeTask(1, longResult))
                    .to.emit(taskRegistry, "TaskCompleted")
                    .withArgs(1, longResult);

                const updatedTask = await taskRegistry.getTask(1);
                expect(updatedTask.result).to.equal(longResult);
            });
        });
    });

    describe("rateTask", function () {
        beforeEach(async function () {
            await setupWithEthProposal();

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

        describe('ETH tasks', function () {
            beforeEach(async function () {
                await setupWithEthProposal();
    
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

        describe('ERC20 tasks', function () {
            beforeEach(async function () {
                await setupWithErc20Proposal();
                
                await mockToken.connect(taskIssuer).approve(taskRegistry.target, taskPrice);
                await expect(taskRegistry.createTask(prompt, proposalId)).not.to.be.reverted;
            });

            it("should cancel an ERC20 task", async function () {
                await expect(taskRegistry.connect(taskIssuer).cancelTask(1))
                    .to.emit(taskRegistry, "TaskCanceled")
                    .withArgs(1);

                const updatedTask = await taskRegistry.getTask(1);
                expect(updatedTask.status).to.equal(3); // TaskStatus.CANCELED
            });

            it("should not cancel an ERC20 task twice", async function () {
                await expect(taskRegistry.connect(taskIssuer).cancelTask(1))
                    .to.emit(taskRegistry, "TaskCanceled")
                    .withArgs(1);

                await expect(taskRegistry.connect(taskIssuer).cancelTask(1))
                    .to.be.revertedWith("Task cannot be canceled");
            });

            it("should fail if not the issuer for ERC20 task", async function () {
                await expect(taskRegistry.connect(eveAddress).cancelTask(1))
                    .to.be.revertedWith("Not the issuer of the task");
            });

            it("should refund tokens to issuer when ERC20 task is canceled", async function () {
                // Get balances before the task was created (need to account for the task already created in beforeEach)
                const currentIssuerBalance = await mockToken.balanceOf(taskIssuer.address);
                const currentContractBalance = await mockToken.balanceOf(taskRegistry.target);
                
                // The task was already created in beforeEach, so issuer should have paid taskPrice
                // and contract should have received taskPrice
                const expectedInitialIssuerBalance = currentIssuerBalance + taskPrice;
                const expectedInitialContractBalance = currentContractBalance - taskPrice;

                // Verify the current state matches expectations
                expect(currentIssuerBalance).to.equal(expectedInitialIssuerBalance - taskPrice);
                expect(currentContractBalance).to.equal(expectedInitialContractBalance + taskPrice);

                // Cancel the task
                await taskRegistry.connect(taskIssuer).cancelTask(1);

                // After cancellation, tokens should be refunded to original state
                const finalIssuerBalance = await mockToken.balanceOf(taskIssuer.address);
                const finalContractBalance = await mockToken.balanceOf(taskRegistry.target);

                expect(finalIssuerBalance).to.equal(expectedInitialIssuerBalance);
                expect(finalContractBalance).to.equal(expectedInitialContractBalance);
            });

            it("should not allow canceling completed ERC20 task", async function () {
                // Complete the task first
                await taskRegistry.connect(agentAddress).completeTask(1, "Test result");

                // Try to cancel the completed task
                await expect(taskRegistry.connect(taskIssuer).cancelTask(1))
                    .to.be.revertedWith("Task cannot be canceled");
            });
        });
        
    });
});
