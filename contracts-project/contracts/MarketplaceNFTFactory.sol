// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MarketplaceNFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MarketplaceNFTFactory
 * @dev Factory to deploy individual NFT contracts
 * - Each NFT is its own contract
 * - Tracks all deployed NFTs
 * - Compatible with marketplace
 */
contract MarketplaceNFTFactory is Ownable {
    // Track deployed NFTs
    address[] public nfts;
    mapping(address => address[]) public creatorNFTs;
    mapping(address => bool) public isNFT;
    
    // NFT info
    struct NFTInfo {
        string name;
        string symbol;
        string cid;
        string description;
        address creator;
        address nftContract;
        uint256 createdAt;
    }
    
    mapping(address => NFTInfo) public nftInfo;
    
    // Deployment fee (optional)
    uint256 public deploymentFee = 0;
    
    // Events
    event NFTDeployed(
        address indexed nftContract,
        address indexed creator,
        string name,
        string symbol,
        string cid
    );
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Deploy a new NFT contract
     * @param _name NFT name
     * @param _symbol NFT symbol
     * @param _cid IPFS CID for the NFT
     * @param _description NFT description
     */
    function deployNFT(
        string memory _name,
        string memory _symbol,
        string memory _cid,
        string memory _description
    ) public payable returns (address) {
        require(msg.value >= deploymentFee, "Insufficient deployment fee");
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_symbol).length > 0, "Symbol required");
        require(bytes(_cid).length > 0, "CID required");
        
        // Deploy new NFT contract
        MarketplaceNFT newNFT = new MarketplaceNFT(
            _name,
            _symbol,
            _cid,
            _description,
            msg.sender
        );
        
        address nftAddress = address(newNFT);
        
        // Track NFT
        nfts.push(nftAddress);
        creatorNFTs[msg.sender].push(nftAddress);
        isNFT[nftAddress] = true;
        
        // Store NFT info
        nftInfo[nftAddress] = NFTInfo({
            name: _name,
            symbol: _symbol,
            cid: _cid,
            description: _description,
            creator: msg.sender,
            nftContract: nftAddress,
            createdAt: block.timestamp
        });
        
        // Refund excess payment
        if (msg.value > deploymentFee) {
            payable(msg.sender).transfer(msg.value - deploymentFee);
        }
        
        emit NFTDeployed(
            nftAddress,
            msg.sender,
            _name,
            _symbol,
            _cid
        );
        
        return nftAddress;
    }
    
    /**
     * @dev Deploy multiple NFTs at once
     */
    function batchDeployNFTs(
        string[] memory _names,
        string[] memory _symbols,
        string[] memory _cids,
        string[] memory _descriptions
    ) external payable returns (address[] memory) {
        require(_names.length == _symbols.length, "Array length mismatch");
        require(_names.length == _cids.length, "Array length mismatch");
        require(_names.length == _descriptions.length, "Array length mismatch");
        require(msg.value >= deploymentFee * _names.length, "Insufficient deployment fee");
        
        address[] memory deployedNFTs = new address[](_names.length);
        
        for (uint256 i = 0; i < _names.length; i++) {
            deployedNFTs[i] = deployNFT(
                _names[i],
                _symbols[i],
                _cids[i],
                _descriptions[i]
            );
        }
        
        return deployedNFTs;
    }
    
    /**
     * @dev Get all NFTs
     */
    function getAllNFTs() external view returns (address[] memory) {
        return nfts;
    }
    
    /**
     * @dev Get NFTs created by a specific address
     */
    function getCreatorNFTs(address creator) external view returns (address[] memory) {
        return creatorNFTs[creator];
    }
    
    /**
     * @dev Get total number of NFTs
     */
    function getTotalNFTs() external view returns (uint256) {
        return nfts.length;
    }
    
    /**
     * @dev Get paginated NFTs
     */
    function getNFTsPaginated(
        uint256 offset,
        uint256 limit
    ) external view returns (
        address[] memory nftAddresses,
        NFTInfo[] memory infos,
        bool hasMore
    ) {
        uint256 total = nfts.length;
        
        if (offset >= total) {
            return (new address[](0), new NFTInfo[](0), false);
        }
        
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        
        uint256 actualSize = end - offset;
        nftAddresses = new address[](actualSize);
        infos = new NFTInfo[](actualSize);
        
        for (uint256 i = 0; i < actualSize; i++) {
            address nft = nfts[offset + i];
            nftAddresses[i] = nft;
            infos[i] = nftInfo[nft];
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
     * @dev Check if an address is a deployed NFT
     */
    function verifyNFT(address _nft) external view returns (bool) {
        return isNFT[_nft];
    }
    
    /**
     * @dev Get detailed NFT info including current owner
     */
    function getNFTDetails(address _nft) external view returns (
        string memory name,
        string memory symbol,
        string memory cid,
        string memory description,
        address creator,
        address currentOwner,
        uint256 nftTokenId
    ) {
        require(isNFT[_nft], "Not a valid NFT");
        NFTInfo memory info = nftInfo[_nft];
        MarketplaceNFT nft = MarketplaceNFT(_nft);
        uint256 _tokenId = nft.tokenId();
        
        return (
            info.name,
            info.symbol,
            info.cid,
            info.description,
            info.creator,
            nft.ownerOf(_tokenId),
            _tokenId
        );
    }
}