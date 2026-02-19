import { Injectable } from '@nestjs/common';

@Injectable()
export class ContractsService {
    getSampleContracts() {
        return {
            samples: [
                {
                    name: 'Reentrancy Vulnerable',
                    filename: 'Vulnerable.sol',
                    content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VulnerableBank {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    // VULNERABLE: State update after external call
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        balances[msg.sender] -= amount; // State update after call!
    }
}`,
                    description: 'A contract with a classic reentrancy vulnerability',
                },
                {
                    name: 'Missing Access Control',
                    filename: 'NoAccessControl.sol',
                    content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract UnsafeToken {
    mapping(address => uint256) public balances;
    uint256 public totalSupply;

    // VULNERABLE: No access control on mint!
    function mint(address to, uint256 amount) external {
        balances[to] += amount;
        totalSupply += amount;
    }

    // VULNERABLE: No access control on burn!
    function burn(address from, uint256 amount) external {
        require(balances[from] >= amount, "Insufficient balance");
        balances[from] -= amount;
        totalSupply -= amount;
    }
}`,
                    description: 'A token contract missing access control on critical functions',
                },
                {
                    name: 'Unoptimized Contract',
                    filename: 'Unoptimized.sol',
                    content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GasInefficient {
    // Suboptimal: Small types not packed together
    uint256 public value1;
    bool public flag;
    uint256 public value2;
    uint8 public smallValue;
    
    // Should be constant
    uint256 public fee = 100;
    
    // Inefficient loop
    function sum(uint256[] memory arr) external pure returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < arr.length; i++) { // arr.length read each iteration
            total += arr[i];
        }
        return total;
    }
    
    // Using memory instead of calldata
    function process(string memory data) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(data));
    }
}`,
                    description: 'A contract with multiple gas optimization opportunities',
                },
                {
                    name: 'Well-Written Contract',
                    filename: 'WellWritten.sol',
                    content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title SafeVault
/// @author Example Developer
/// @notice A secure vault contract demonstrating best practices
/// @dev Implements CEI pattern and uses OpenZeppelin security modules
contract SafeVault is Ownable, ReentrancyGuard {
    /// @notice Mapping of user balances
    mapping(address => uint256) public balances;
    
    /// @notice Fee percentage (in basis points)
    uint256 public constant FEE_BPS = 100; // 1%
    
    /// @notice Emitted when a deposit is made
    event Deposited(address indexed user, uint256 amount);
    
    /// @notice Emitted when a withdrawal is made
    event Withdrawn(address indexed user, uint256 amount);
    
    constructor() Ownable(msg.sender) {}
    
    /// @notice Deposit ETH into the vault
    function deposit() external payable {
        require(msg.value > 0, "Must deposit > 0");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }
    
    /// @notice Withdraw ETH from the vault
    /// @param amount The amount to withdraw
    function withdraw(uint256 amount) external nonReentrant {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // Checks-Effects-Interactions pattern
        balances[msg.sender] -= amount; // Effects first
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit Withdrawn(msg.sender, amount);
    }
}`,
                    description: 'A secure vault contract following best practices',
                },
            ],
        };
    }
}
