// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MarketplaceNFT
 * @dev Simple NFT contract for marketplace
 * - Single NFT per contract
 * - Stores IPFS CID
 * - Compatible with marketplace
 */
contract MarketplaceNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    string public cid;          // IPFS CID for this NFT
    string public description;  // NFT description
    address public creator;     // Original creator
    uint256 public tokenId;     // The token ID of this NFT
    
    event NFTCreated(address indexed creator, uint256 indexed tokenId, string cid, string name, string description);
    
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _cid,
        string memory _description,
        address _creator
    ) ERC721(_name, _symbol) Ownable(_creator) {
        require(bytes(_cid).length > 0, "CID required");
        
        cid = _cid;
        description = _description;
        creator = _creator;
        
        // Start token IDs at 1
        _tokenIdCounter = 1;
        tokenId = _tokenIdCounter;
        
        // Mint the single NFT to creator
        _mint(_creator, tokenId);
        _tokenIdCounter++;
        
        emit NFTCreated(_creator, tokenId, _cid, _name, _description);
    }
    
    /**
     * @dev Get token URI (returns IPFS URL)
     */
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        require(_tokenId == tokenId, "Invalid token ID");
        require(_ownerOf(_tokenId) != address(0), "Token does not exist");
        
        // Return full IPFS URI
        return string(abi.encodePacked("ipfs://", cid));
    }
    
    /**
     * @dev Get CID directly
     */
    function getCID() public view returns (string memory) {
        return cid;
    }
    
    /**
     * @dev Check if NFT exists
     */
    function exists() public view returns (bool) {
        return _tokenIdCounter > 1;
    }
    
    /**
     * @dev Get NFT metadata
     */
    function getMetadata() public view returns (
        string memory _name,
        string memory _symbol,
        string memory _cid,
        string memory _description,
        address _creator,
        address _owner
    ) {
        return (
            name(),
            symbol(),
            cid,
            description,
            creator,
            ownerOf(tokenId)
        );
    }
}