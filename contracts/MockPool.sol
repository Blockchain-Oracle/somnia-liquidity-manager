// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * Mock QuickSwap Pool for Testnet Demo
 * Simulates basic pool functionality for hackathon demonstration
 */
contract MockAlgebraPool {
    address public token0;
    address public token1;
    uint128 public liquidity;
    int24 public currentTick;
    uint160 public sqrtPriceX96;
    
    struct Position {
        uint128 liquidity;
        int24 tickLower;
        int24 tickUpper;
        uint256 tokensOwed0;
        uint256 tokensOwed1;
    }
    
    mapping(address => mapping(bytes32 => Position)) public positions;
    
    event Mint(
        address sender,
        address indexed owner,
        int24 indexed tickLower,
        int24 indexed tickUpper,
        uint128 amount,
        uint256 amount0,
        uint256 amount1
    );
    
    constructor(address _token0, address _token1) {
        token0 = _token0;
        token1 = _token1;
        currentTick = 0;
        sqrtPriceX96 = 79228162514264337593543950336; // price = 1
    }
    
    function mint(
        address recipient,
        int24 tickLower,
        int24 tickUpper,
        uint128 amount
    ) external returns (uint256 amount0, uint256 amount1) {
        bytes32 key = keccak256(abi.encodePacked(recipient, tickLower, tickUpper));
        positions[recipient][key].liquidity += amount;
        positions[recipient][key].tickLower = tickLower;
        positions[recipient][key].tickUpper = tickUpper;
        
        liquidity += amount;
        
        // Mock amounts
        amount0 = uint256(amount) * 1e18 / 2;
        amount1 = uint256(amount) * 1e18 / 2;
        
        emit Mint(msg.sender, recipient, tickLower, tickUpper, amount, amount0, amount1);
        
        return (amount0, amount1);
    }
    
    function burn(
        int24 tickLower,
        int24 tickUpper,
        uint128 amount
    ) external returns (uint256 amount0, uint256 amount1) {
        bytes32 key = keccak256(abi.encodePacked(msg.sender, tickLower, tickUpper));
        positions[msg.sender][key].liquidity -= amount;
        liquidity -= amount;
        
        amount0 = uint256(amount) * 1e18 / 2;
        amount1 = uint256(amount) * 1e18 / 2;
        
        return (amount0, amount1);
    }
    
    function collect(
        address recipient,
        int24 tickLower,
        int24 tickUpper,
        uint128 amount0Requested,
        uint128 amount1Requested
    ) external returns (uint128 amount0, uint128 amount1) {
        bytes32 key = keccak256(abi.encodePacked(msg.sender, tickLower, tickUpper));
        Position storage position = positions[msg.sender][key];
        
        amount0 = amount0Requested > position.tokensOwed0 ? uint128(position.tokensOwed0) : amount0Requested;
        amount1 = amount1Requested > position.tokensOwed1 ? uint128(position.tokensOwed1) : amount1Requested;
        
        position.tokensOwed0 -= amount0;
        position.tokensOwed1 -= amount1;
        
        return (amount0, amount1);
    }
    
    // Simulate fee accumulation
    function simulateFees(address owner, int24 tickLower, int24 tickUpper, uint256 fees0, uint256 fees1) external {
        bytes32 key = keccak256(abi.encodePacked(owner, tickLower, tickUpper));
        positions[owner][key].tokensOwed0 += fees0;
        positions[owner][key].tokensOwed1 += fees1;
    }
    
    function globalState() external view returns (
        uint160 price,
        int24 tick,
        uint16 fee,
        uint16 timepointIndex,
        uint16 communityFee0,
        uint16 communityFee1,
        bool unlocked
    ) {
        return (sqrtPriceX96, currentTick, 3000, 0, 0, 0, true);
    }
}