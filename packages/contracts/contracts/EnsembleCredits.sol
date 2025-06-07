// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title EnsembleCredits
 * @dev Non-transferable ERC20 token for the Ensemble ecosystem
 * 
 * Features:
 * - Non-transferable: tokens cannot be transferred between addresses
 * - Mintable: tokens can be minted by addresses with MINTER_ROLE
 * - Burnable: tokens can be burned by holders or minters
 * - 6 decimals precision for micro-transactions
 * - Role-based access control where minters can manage other minters
 */
contract EnsembleCredits is ERC20, ERC20Burnable, AccessControl {
    /// @dev Role identifier for addresses allowed to mint tokens
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    /// @dev Custom error for when transfers are attempted (non-transferable token)
    error TransferNotAllowed();
    
    /// @dev Custom error for when approvals are attempted (not needed for non-transferable token)
    error ApprovalNotAllowed();

    /**
     * @dev Emitted when tokens are minted
     * @param to Address receiving the tokens
     * @param amount Amount of tokens minted
     */
    event Mint(address indexed to, uint256 amount);

    /**
     * @dev Emitted when tokens are burned
     * @param from Address from which tokens are burned
     * @param amount Amount of tokens burned
     */
    event Burn(address indexed from, uint256 amount);

    /**
     * @dev Emitted when a new minter is added
     * @param minter Address granted minter role
     */
    event MinterAdded(address indexed minter);

    /**
     * @dev Emitted when a minter is removed
     * @param minter Address removed from minter role
     */
    event MinterRemoved(address indexed minter);

    /**
     * @dev Constructor that sets up the token with initial admin
     * @param name Token name
     * @param symbol Token symbol
     * @param initialAdmin Address that will have admin and initial minter roles
     * @param initialSupply Optional initial supply to mint to admin (0 for no initial supply)
     */
    constructor(
        string memory name,
        string memory symbol,
        address initialAdmin,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        require(initialAdmin != address(0), "EnsembleCredits: admin cannot be zero address");
        
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(MINTER_ROLE, initialAdmin);
        
        // Set MINTER_ROLE as its own admin so minters can manage other minters
        _setRoleAdmin(MINTER_ROLE, MINTER_ROLE);
        
        if (initialSupply > 0) {
            _mint(initialAdmin, initialSupply);
            emit Mint(initialAdmin, initialSupply);
        }
    }

    /**
     * @dev Returns the number of decimals used to get its user representation
     * @return Number of decimals (6 for micro-transactions)
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /**
     * @dev Mint tokens to a specified address
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     * 
     * Requirements:
     * - Caller must have minter role
     * - `to` cannot be zero address
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(to != address(0), "EnsembleCredits: cannot mint to zero address");
        
        _mint(to, amount);
        emit Mint(to, amount);
    }

    /**
     * @dev Burn tokens from caller's balance
     * @param amount Amount of tokens to burn
     * 
     * Requirements:
     * - Caller must have sufficient balance
     */
    function burn(uint256 amount) public override {
        address account = _msgSender();
        _burn(account, amount);
        emit Burn(account, amount);
    }

    /**
     * @dev Burn tokens from a specified address (minter only)
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     * 
     * Requirements:
     * - Caller must have minter role
     * - `from` must have sufficient balance
     */
    function burnFrom(address from, uint256 amount) public override {
        // Only minters can burn from other addresses
        require(hasRole(MINTER_ROLE, _msgSender()), "EnsembleCredits: caller must have minter role to burn from others");
        require(from != address(0), "EnsembleCredits: cannot burn from zero address");
        
        _burn(from, amount);
        emit Burn(from, amount);
    }

    /**
     * @dev Add a new minter
     * @param minter Address to grant minter role
     * 
     * Requirements:
     * - Caller must have minter role (minters can add other minters)
     */
    function addMinter(address minter) external onlyRole(MINTER_ROLE) {
        require(minter != address(0), "EnsembleCredits: cannot add zero address as minter");
        
        _grantRole(MINTER_ROLE, minter);
        emit MinterAdded(minter);
    }

    /**
     * @dev Remove a minter
     * @param minter Address to remove minter role from
     * 
     * Requirements:
     * - Caller must have minter role (minters can remove other minters)
     */
    function removeMinter(address minter) external onlyRole(MINTER_ROLE) {
        require(minter != address(0), "EnsembleCredits: cannot remove zero address as minter");
        require(hasRole(MINTER_ROLE, minter), "EnsembleCredits: address is not a minter");
        
        _revokeRole(MINTER_ROLE, minter);
        emit MinterRemoved(minter);
    }

    /**
     * @dev Check if an address has minter role
     * @param account Address to check
     * @return true if account has minter role
     */
    function isMinter(address account) external view returns (bool) {
        return hasRole(MINTER_ROLE, account);
    }

    /**
     * @dev Override transfer to make token non-transferable
     * @dev This function always reverts as the token is non-transferable
     */
    function transfer(address, uint256) public pure override returns (bool) {
        revert TransferNotAllowed();
    }

    /**
     * @dev Override transferFrom to make token non-transferable
     * @dev This function always reverts as the token is non-transferable
     */
    function transferFrom(address, address, uint256) public pure override returns (bool) {
        revert TransferNotAllowed();
    }

    /**
     * @dev Override approve to prevent approvals (not needed for non-transferable token)
     * @dev This function always reverts as approvals are not needed for non-transferable tokens
     */
    function approve(address, uint256) public pure override returns (bool) {
        revert ApprovalNotAllowed();
    }

    /**
     * @dev Override allowance to prevent allowance queries (not needed for non-transferable token)
     * @dev This function always reverts as allowances are not needed for non-transferable tokens
     */
    function allowance(address, address) public pure override returns (uint256) {
        revert ApprovalNotAllowed();
    }

    /**
     * @dev Override increaseAllowance to prevent allowance increases (not needed for non-transferable token)
     * @dev This function always reverts as allowances are not needed for non-transferable tokens
     */
    function increaseAllowance(address, uint256) public pure returns (bool) {
        revert ApprovalNotAllowed();
    }

    /**
     * @dev Override decreaseAllowance to prevent allowance decreases (not needed for non-transferable token)
     * @dev This function always reverts as allowances are not needed for non-transferable tokens
     */
    function decreaseAllowance(address, uint256) public pure returns (bool) {
        revert ApprovalNotAllowed();
    }
} 