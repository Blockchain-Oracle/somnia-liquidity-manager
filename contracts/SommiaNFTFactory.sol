// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SommiaNFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SommiaNFTFactory
 * @dev Factory contract to deploy new NFT collections
 * - Tracks all deployed collections
 * - Allows anyone to create collections (can be restricted)
 * - Collections are compatible with SommiaNFTMarketplace
 */
contract SommiaNFTFactory is Ownable {
    // Track deployed collections
    address[] public collections;
    mapping(address => address[]) public creatorCollections;
    mapping(address => bool) public isCollection;
    
    // Collection info
    struct CollectionInfo {
        string name;
        string symbol;
        address creator;
        uint256 maxSupply;
        uint256 mintPrice;
        uint256 createdAt;
    }
    
    mapping(address => CollectionInfo) public collectionInfo;
    
    // Deployment fee (optional)
    uint256 public deploymentFee = 0;
    
    // Events
    event CollectionDeployed(
        address indexed collection,
        address indexed creator,
        string name,
        string symbol,
        uint256 maxSupply,
        uint256 mintPrice
    );
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Deploy a new NFT collection
     * @param _name Collection name
     * @param _symbol Collection symbol
     * @param _collectionCID IPFS CID for collection metadata
     * @param _maxSupply Maximum supply of NFTs
     * @param _mintPrice Price to mint each NFT (in wei)
     */
    function deployCollection(
        string memory _name,
        string memory _symbol,
        string memory _collectionCID,
        uint256 _maxSupply,
        uint256 _mintPrice
    ) external payable returns (address) {
        require(msg.value >= deploymentFee, "Insufficient deployment fee");
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_symbol).length > 0, "Symbol required");
        require(_maxSupply > 0, "Max supply must be greater than 0");
        
        // Deploy new collection
        SommiaNFT newCollection = new SommiaNFT(
            _name,
            _symbol,
            _collectionCID,
            _maxSupply,
            _mintPrice
        );
        
        // Transfer ownership to creator
        newCollection.transferOwnership(msg.sender);
        
        address collectionAddress = address(newCollection);
        
        // Track collection
        collections.push(collectionAddress);
        creatorCollections[msg.sender].push(collectionAddress);
        isCollection[collectionAddress] = true;
        
        // Store collection info
        collectionInfo[collectionAddress] = CollectionInfo({
            name: _name,
            symbol: _symbol,
            creator: msg.sender,
            maxSupply: _maxSupply,
            mintPrice: _mintPrice,
            createdAt: block.timestamp
        });
        
        // Refund excess payment
        if (msg.value > deploymentFee) {
            payable(msg.sender).transfer(msg.value - deploymentFee);
        }
        
        emit CollectionDeployed(
            collectionAddress,
            msg.sender,
            _name,
            _symbol,
            _maxSupply,
            _mintPrice
        );
        
        return collectionAddress;
    }
    
    /**
     * @dev Get all collections
     */
    function getAllCollections() external view returns (address[] memory) {
        return collections;
    }
    
    /**
     * @dev Get collections created by a specific address
     */
    function getCreatorCollections(address creator) external view returns (address[] memory) {
        return creatorCollections[creator];
    }
    
    /**
     * @dev Get total number of collections
     */
    function getTotalCollections() external view returns (uint256) {
        return collections.length;
    }
    
    /**
     * @dev Get paginated collections
     */
    function getCollectionsPaginated(
        uint256 offset,
        uint256 limit
    ) external view returns (
        address[] memory collectionAddresses,
        CollectionInfo[] memory infos,
        bool hasMore
    ) {
        uint256 total = collections.length;
        
        if (offset >= total) {
            return (new address[](0), new CollectionInfo[](0), false);
        }
        
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        
        uint256 actualSize = end - offset;
        collectionAddresses = new address[](actualSize);
        infos = new CollectionInfo[](actualSize);
        
        for (uint256 i = 0; i < actualSize; i++) {
            address collection = collections[offset + i];
            collectionAddresses[i] = collection;
            infos[i] = collectionInfo[collection];
        }
        
        hasMore = end < total;
    }
    
    /**
     * @dev Update deployment fee (owner only)
     */
    function setDeploymentFee(uint256 _fee) external onlyOwner {
        deploymentFee = _fee;
    }
    
    /**
     * @dev Withdraw accumulated fees (owner only)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev Check if an address is a deployed collection
     */
    function verifyCollection(address _collection) external view returns (bool) {
        return isCollection[_collection];
    }
}