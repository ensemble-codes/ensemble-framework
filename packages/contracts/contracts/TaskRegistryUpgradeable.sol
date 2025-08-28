// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./AgentsRegistryUpgradeable.sol";
import "./lib/TransferHelper.sol";

/**
 * @title TaskRegistryUpgradeable
 * @author leonprou
 * @notice A smart contract that manages task creation and completion between users and agents.
 * @dev Upgradeable version using UUPS proxy pattern for Task Management V2
 */
contract TaskRegistryUpgradeable is Initializable, OwnableUpgradeable, UUPSUpgradeable {

    enum TaskStatus { CREATED, ASSIGNED, COMPLETED, CANCELED }

    struct TaskData {
        uint256 id;
        string prompt;
        address issuer;
        TaskStatus status;
        address assignee;
        uint256 price;
        address tokenAddress;
        string result;
        uint8 rating;
    }
    
    mapping(uint256 => TaskData) public tasks;
    mapping(address => uint256[]) public issuerTasks;
    uint256 private nextTaskId;
    AgentsRegistryUpgradeable public agentRegistry;

    modifier onlyTaskIssuer(uint256 taskId) {
        require(msg.sender == tasks[taskId].issuer, "Not the issuer of the task");
        _;
    }

    modifier onlyTaskAssignee(uint256 taskId) {
        require(msg.sender == tasks[taskId].assignee, "Not the assignee of the task");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract
     * @param _initialTaskId The starting task ID
     * @param _agentRegistry The address of the agent registry
     */
    function initialize(uint256 _initialTaskId, AgentsRegistryUpgradeable _agentRegistry) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        nextTaskId = _initialTaskId;
        agentRegistry = _agentRegistry;
    }

    event TaskCreated(
        address indexed issuer, 
        address indexed assignee, 
        uint256 taskId, 
        string prompt,
        uint256 price,
        address tokenAddress
    );
    event TaskCompleted(uint256 indexed taskId, string result);
    event TaskRated(uint256 indexed taskId, uint8 rating);
    event TaskCanceled(uint256 indexed taskId);

    /**
     * @dev Creates a new task and assigns it to an agent.
     * @param assignee The address of the agent to assign the task to.
     * @param prompt The task description/prompt.
     * @param price The payment amount for the task.
     * @param tokenAddress The token address for payment (address(0) for ETH).
     */
    function createTask(
        address assignee,
        string memory prompt,
        uint256 price,
        address tokenAddress
    ) external payable {
        require(assignee != address(0), "Invalid assignee address");
        require(bytes(prompt).length > 0, "Prompt cannot be empty");

        // Handle payment
        if (tokenAddress == address(0)) {
            require(msg.value == price, "Invalid ETH amount");
        } else {
            require(msg.value == 0, "ETH not accepted for token payments");
            TransferHelper.safeTransferFrom(tokenAddress, msg.sender, address(this), price);
        }

        nextTaskId++;
        TaskData storage task = tasks[nextTaskId];
        task.id = nextTaskId;
        task.prompt = prompt;
        task.issuer = msg.sender;
        task.status = TaskStatus.ASSIGNED;
        task.assignee = assignee;
        task.price = price;
        task.tokenAddress = tokenAddress;

        issuerTasks[msg.sender].push(nextTaskId);

        emit TaskCreated(msg.sender, assignee, nextTaskId, prompt, price, tokenAddress);
    }

    /**
     * @dev Completes a task and releases payment to the assignee.
     * @param taskId The ID of the task to complete.
     * @param result The task completion result/output.
     */
    function completeTask(uint256 taskId, string memory result) external onlyTaskAssignee(taskId) {
        TaskData storage task = tasks[taskId];
        require(task.status == TaskStatus.ASSIGNED, "Task is not in assigned state");

        task.result = result;
        task.status = TaskStatus.COMPLETED;

        // Release payment
        if (task.tokenAddress == address(0)) {
            TransferHelper.safeTransferETH(task.assignee, task.price);
        } else {
            TransferHelper.safeTransfer(task.tokenAddress, task.assignee, task.price);
        }

        emit TaskCompleted(taskId, result);
    }

    /**
     * @dev Rates a completed task.
     * @param taskId The ID of the task to rate.
     * @param rating The rating value (0-100).
     */
    function rateTask(uint256 taskId, uint8 rating) external onlyTaskIssuer(taskId) {
        TaskData storage task = tasks[taskId];
        require(task.status == TaskStatus.COMPLETED, "Task is not completed");
        require(rating <= 100, "Rating must be between 0 and 100");

        task.rating = rating;

        // Add rating to agent's reputation
        agentRegistry.addRating(task.assignee, rating);

        emit TaskRated(taskId, rating);
    }

    /**
     * @dev Cancels a task and refunds payment to the issuer.
     * @param taskId The ID of the task to cancel.
     */
    function cancelTask(uint256 taskId) external onlyTaskIssuer(taskId) {
        TaskData storage task = tasks[taskId];
        require(task.status == TaskStatus.ASSIGNED, "Task cannot be canceled");

        task.status = TaskStatus.CANCELED;

        // Refund payment
        if (task.tokenAddress == address(0)) {
            TransferHelper.safeTransferETH(task.issuer, task.price);
        } else {
            TransferHelper.safeTransfer(task.tokenAddress, task.issuer, task.price);
        }

        emit TaskCanceled(taskId);
    }

    /**
     * @dev Gets task data by ID.
     * @param taskId The ID of the task.
     * @return TaskData The task data.
     */
    function getTask(uint256 taskId) external view returns (TaskData memory) {
        return tasks[taskId];
    }

    /**
     * @dev Gets tasks created by a specific issuer.
     * @param issuer The address of the task issuer.
     * @return Array of task IDs.
     */
    function getTasksByIssuer(address issuer) external view returns (uint256[] memory) {
        return issuerTasks[issuer];
    }

    /**
     * @dev Gets the next task ID.
     * @return The next task ID.
     */
    function getNextTaskId() external view returns (uint256) {
        return nextTaskId + 1;
    }

    /**
     * @dev Function that should revert when `msg.sender` is not authorized to upgrade the contract.
     * @param newImplementation Address of the new implementation
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @dev Storage gap for future upgrades
     */
    uint256[50] private __gap;
}