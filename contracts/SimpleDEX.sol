// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * Simplified DEX for Somnia Hackathon Demo
 * Based on Somnia's official DEX tutorial
 * This allows us to have a REAL WORKING DEX for the demo!
 */

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract SimpleLiquidityPool {
    IERC20 public token0;
    IERC20 public token1;
    
    uint256 public reserve0;
    uint256 public reserve1;
    
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    
    uint256 public constant MINIMUM_LIQUIDITY = 1000;
    
    event LiquidityAdded(address indexed provider, uint256 amount0, uint256 amount1, uint256 liquidity);
    event LiquidityRemoved(address indexed provider, uint256 amount0, uint256 amount1, uint256 liquidity);
    event Swap(address indexed user, uint256 amountIn, uint256 amountOut, bool zeroForOne);
    
    constructor(address _token0, address _token1) {
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
    }
    
    function addLiquidity(uint256 amount0, uint256 amount1) external returns (uint256 liquidity) {
        // Transfer tokens to pool
        token0.transferFrom(msg.sender, address(this), amount0);
        token1.transferFrom(msg.sender, address(this), amount1);
        
        if (totalSupply == 0) {
            // First liquidity provider
            liquidity = sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
            totalSupply = liquidity + MINIMUM_LIQUIDITY;
            balanceOf[address(0)] = MINIMUM_LIQUIDITY; // Lock minimum
        } else {
            // Subsequent providers
            liquidity = min(
                (amount0 * totalSupply) / reserve0,
                (amount1 * totalSupply) / reserve1
            );
            totalSupply += liquidity;
        }
        
        balanceOf[msg.sender] += liquidity;
        reserve0 += amount0;
        reserve1 += amount1;
        
        emit LiquidityAdded(msg.sender, amount0, amount1, liquidity);
    }
    
    function removeLiquidity(uint256 liquidity) external returns (uint256 amount0, uint256 amount1) {
        require(balanceOf[msg.sender] >= liquidity, "Insufficient liquidity");
        
        amount0 = (liquidity * reserve0) / totalSupply;
        amount1 = (liquidity * reserve1) / totalSupply;
        
        balanceOf[msg.sender] -= liquidity;
        totalSupply -= liquidity;
        reserve0 -= amount0;
        reserve1 -= amount1;
        
        token0.transfer(msg.sender, amount0);
        token1.transfer(msg.sender, amount1);
        
        emit LiquidityRemoved(msg.sender, amount0, amount1, liquidity);
    }
    
    function swap(uint256 amountIn, bool zeroForOne) external returns (uint256 amountOut) {
        require(amountIn > 0, "Invalid amount");
        
        uint256 amountInWithFee = amountIn * 997; // 0.3% fee
        
        if (zeroForOne) {
            // Swap token0 for token1
            token0.transferFrom(msg.sender, address(this), amountIn);
            amountOut = (amountInWithFee * reserve1) / (reserve0 * 1000 + amountInWithFee);
            token1.transfer(msg.sender, amountOut);
            reserve0 += amountIn;
            reserve1 -= amountOut;
        } else {
            // Swap token1 for token0
            token1.transferFrom(msg.sender, address(this), amountIn);
            amountOut = (amountInWithFee * reserve0) / (reserve1 * 1000 + amountInWithFee);
            token0.transfer(msg.sender, amountOut);
            reserve1 += amountIn;
            reserve0 -= amountOut;
        }
        
        emit Swap(msg.sender, amountIn, amountOut, zeroForOne);
    }
    
    function getAmountOut(uint256 amountIn, bool zeroForOne) external view returns (uint256) {
        uint256 amountInWithFee = amountIn * 997;
        if (zeroForOne) {
            return (amountInWithFee * reserve1) / (reserve0 * 1000 + amountInWithFee);
        } else {
            return (amountInWithFee * reserve0) / (reserve1 * 1000 + amountInWithFee);
        }
    }
    
    // Helper functions
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
    
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}