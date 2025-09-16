// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SommiaNFT
 * @dev Basic NFT collection contract compatible with SommiaNFTMarketplace
 * - Stores IPFS CID as tokenURI
 * - Mintable by anyone (for demo purposes)
 * - Compatible with marketplace escrow pattern
 */
contract SommiaNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    
    // Collection metadata
    string public collectionCID; // IPFS CID for collection metadata
    uint256 public maxSupply;
    uint256 public mintPrice;
    
    // Track minted tokens
    mapping(address => uint256[]) public ownerTokens;
    
    // Events
    event NFTMinted(address indexed to, uint256 indexed tokenId, string cid);
    event CollectionMetadataUpdated(string newCID);
    
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _collectionCID,
        uint256 _maxSupply,
        uint256 _mintPrice
    ) ERC721(_name, _symbol) Ownable(msg.sender) {
        collectionCID = _collectionCID;
        maxSupply = _maxSupply;
        mintPrice = _mintPrice;
        
        // Start token IDs at 1
        _tokenIdCounter = 1;
    }
    
    /**
     * @dev Mint a new NFT with IPFS CID
     * @param to Address to mint to
     * @param cid IPFS CID for the NFT metadata/image
     */
    function mint(address to, string memory cid) public payable returns (uint256) {
        require(_tokenIdCounter <= maxSupply, "Max supply reached");
        require(msg.value >= mintPrice, "Insufficient payment");
        require(bytes(cid).length > 0, "CID required");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, cid);
        
        ownerTokens[to].push(tokenId);
        
        // Refund excess payment
        if (msg.value > mintPrice) {
            payable(msg.sender).transfer(msg.value - mintPrice);
        }
        
        emit NFTMinted(to, tokenId, cid);
        return tokenId;
    }
    
    /**
     * @dev Batch mint multiple NFTs
     */
    function batchMint(address to, string[] memory cids) public payable returns (uint256[] memory) {
        require(cids.length > 0, "No CIDs provided");
        require(msg.value >= mintPrice * cids.length, "Insufficient payment");
        
        uint256[] memory tokenIds = new uint256[](cids.length);
        
        for (uint256 i = 0; i < cids.length; i++) {
            tokenIds[i] = mint(to, cids[i]);
        }
        
        return tokenIds;
    }
    
    /**
     * @dev Get all tokens owned by an address
     */
    function getOwnerTokens(address owner) public view returns (uint256[] memory) {
        return ownerTokens[owner];
    }
    
    /**
     * @dev Get token CID (for marketplace compatibility)
     */
    function getTokenCID(uint256 tokenId) public view returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return tokenURI(tokenId);
    }
    
    /**
     * @dev Total supply of minted tokens
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter - 1;
    }
    
    /**
     * @dev Update collection metadata CID
     */
    function updateCollectionCID(string memory _newCID) public onlyOwner {
        collectionCID = _newCID;
        emit CollectionMetadataUpdated(_newCID);
    }
    
    /**
     * @dev Update mint price
     */
    function updateMintPrice(uint256 _newPrice) public onlyOwner {
        mintPrice = _newPrice;
    }
    
    /**
     * @dev Withdraw contract balance
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(owner()).transfer(balance);
    }
    
    // Required overrides
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}