// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/SommiaNFTMarketplace.sol";

contract DeployMarketplace is Script {
    function run() external {
        // Get deployer's private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy marketplace with deployer as fee recipient
        SommiaNFTMarketplace marketplace = new SommiaNFTMarketplace(msg.sender);
        
        // Configure marketplace
        marketplace.setPlatformFeeBps(250); // 2.5% platform fee
        
        // Log the deployment
        console.log("Marketplace deployed at:", address(marketplace));
        console.log("Platform fee: 2.5%");
        console.log("Listing fee: 0 (free)");
        console.log("Cancel refund: 0%");
        
        // Stop broadcasting
        vm.stopBroadcast();
    }
}