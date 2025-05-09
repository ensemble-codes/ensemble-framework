// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IProposalStruct.sol";
import "./AgentsRegistry.sol";
import "./lib/TransferHelper.sol";

/**
 * @title TaskRegistry
 * @author leonprou
 * @notice A smart contract that stores information about the tasks issued for the agent service providers.
 */
contract TaskRegistry is Ownable, IProposalStruct {

    enum TaskStatus { CREATED, ASSIGNED, COMPLETED, CANCELED }

    struct TaskData {
        uint256 id;
        string prompt;
        address issuer;
        TaskStatus status;
        address assignee;
        uint256 proposalId;
        string result;
        uint8 rating;
    }
    
    mapping(uint256 => TaskData) public tasks;
    mapping(address => uint256[]) public issuerTasks;
    uint256 private nextTaskId;
    AgentsRegistry public agentRegistry;

    modifier onlyTaskIssuer(uint256 taskId) {
        require(msg.sender == tasks[taskId].issuer, "Not the issuer of the task");
        _;
    }
    constructor(
        uint256 _initalTaskId, 
        AgentsRegistry _agentRegistry
    ) Ownable(msg.sender) {
        nextTaskId = _initalTaskId;
        agentRegistry = _agentRegistry;
    }
    
    event TaskCreated(address indexed issuer, address indexed assignee, uint256 taskId, uint256 proposalId, string prompt);
    event TaskStatusChanged(uint256 indexed taskId, TaskStatus status);
    event TaskAssigned(uint256 indexed taskId, address indexed agent);
    event TaskCanceled(uint256 indexed taskId);
    event ProposalApproved(uint256 indexed taskId, ServiceProposal proposal);
    event TaskCompleted(uint256 indexed taskId, string result);
    event TaskRated(uint256 indexed taskId, uint8 rating);
    /**
    * @dev Creates a new task with the given prompt and task type.
    * @param prompt The description or prompt of the task.
    * @return taskId The ID of the newly created task.
    */
    function createTask(
        string memory prompt,
        uint256 proposalId
    ) external payable returns (TaskData memory) {
        ServiceProposal memory proposal = agentRegistry.getProposal(proposalId);
        require(proposal.issuer != address(0), "ServiceProposal not found");
        require(proposal.price == msg.value, "Invalid price");

        TaskData storage task = tasks[nextTaskId];
        task.id = nextTaskId;
        task.prompt = prompt;
        task.issuer = msg.sender;
        task.proposalId = proposalId;
        task.assignee = proposal.issuer;
        issuerTasks[msg.sender].push(nextTaskId);
        task.status = TaskStatus.ASSIGNED;
        emit TaskCreated(msg.sender, proposal.issuer, nextTaskId, proposal.proposalId, prompt);

        nextTaskId++;
        return task;
    }

    /**
    * @dev Completes a task with the given result.
    * @param taskId The ID of the task.
    * @param result The result or output of the completed task.
    */
    function completeTask(uint256 taskId, string memory result) external {
        TaskData storage task = tasks[taskId];
        require(msg.sender == task.assignee, "Not authorized");
        require(task.status == TaskStatus.ASSIGNED, "Invalid task status");

        task.status = TaskStatus.COMPLETED;
        task.result = result;
        ServiceProposal memory proposal = agentRegistry.getProposal(task.proposalId);
        
        TransferHelper.safeTransferETH(proposal.issuer, proposal.price);

        emit TaskStatusChanged(taskId, task.status);
        emit TaskCompleted(taskId, result);
    }

    /**
    * @dev Rated a completed task, called by the task issuer
    * @param taskId The ID of the task.
    * @param rating task rating from 0 to 100.
    */    
    function rateTask(uint256 taskId, uint8 rating) onlyTaskIssuer(taskId) external {
        TaskData storage task = tasks[taskId];

        require(task.status == TaskStatus.COMPLETED, "Task is not completed");
        require(task.rating == 0, "Task got rating already");
        require(rating >= 0 && rating <= 100, "Rating must be between 0 and 100");
        
        task.rating = rating;
        ServiceProposal memory proposal = agentRegistry.getProposal(task.proposalId);

        agentRegistry.addRating(proposal.issuer, rating);

        emit TaskRated(taskId, rating);
    }

    /**
    * @dev Cancels a task that is in ASSIGNED status and refunds the payment.
    * @param taskId The ID of the task to cancel.
    */
    function cancelTask(uint256 taskId) external onlyTaskIssuer(taskId) {
        TaskData storage task = tasks[taskId];
        require(task.status != TaskStatus.COMPLETED && task.status != TaskStatus.CANCELED, "Task cannot be canceled");
        
        task.status = TaskStatus.CANCELED;
        ServiceProposal memory proposal = agentRegistry.getProposal(task.proposalId);
        
        // Refund the payment to the issuer
        TransferHelper.safeTransferETH(task.issuer, proposal.price);
        
        emit TaskStatusChanged(taskId, task.status);
        emit TaskCanceled(taskId);
    }

    function getTasksByIssuer(address issuer) external view returns (uint256[] memory) {
        return issuerTasks[issuer];
    }

    function getTask(uint256 taskId) external view returns (TaskData memory) {
        return tasks[taskId];
    }

    function getStatus(uint256 taskId) external view returns (TaskStatus) {
        return tasks[taskId].status;
    }
    
    function getAssignee(uint256 taskId) external view returns (address) {
        return tasks[taskId].assignee;
    }
}
