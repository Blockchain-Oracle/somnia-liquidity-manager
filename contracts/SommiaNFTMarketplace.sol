// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * SommiaNFTMarketplace (escrow-based with optimizations)
 * - Sellers MUST transfer their ERC721 to this contract first (escrow).
 * - Then they create a listing that references the escrowed token.
 * - Frontend provides a CID string for metadata display (gas-efficient vs tokenURI calls).
 * - Buyers purchase; marketplace transfers NFT out of escrow to buyer and pays seller.
 * - Listing fee paid up-front; optional partial refund on cancel is configurable.
 * 
 * Optimizations:
 * - Paginated getters for active listings
 * - Helper function for combined escrow + list in one tx
 * - Active listings tracking for efficient queries
 */

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract SommiaNFTMarketplace is Ownable, ReentrancyGuard, IERC721Receiver {
    // ---- Fees & recipients (all in wei or basis points) ----
    uint256 public listingFeeWei = 0;           // flat fee to list (paid on createListing)
    uint256 public platformFeeBps = 250;        // % of sale price (250 = 2.5%)
    uint256 public cancelRefundBps = 0;         // % of listingFee refunded on cancel (0 = no refund)
    address public feeRecipient;                // receives platform & listing fees

    // ---- Listing model ----
    struct Listing {
        address seller;         // original owner who escrowed the token
        address nft;            // ERC721 address
        uint256 tokenId;        // token being sold (escrowed in this contract)
        uint256 price;          // price in native coin (wei)
        string  cid;            // IPFS CID for UI (frontend supplies; we avoid on-chain tokenURI lookups)
        bool    active;         // true if available for purchase
        bool    sold;           // true once purchased
        uint256 listingFeePaid; // amount of listing fee paid (for partial refund on cancel)
        uint256 createdAt;      // timestamp for sorting/filtering
    }

    // listingId => Listing
    mapping(uint256 => Listing) public listings;
    uint256 public nextListingId;

    // Track escrow deposits to verify rightful lister
    // escrowOriginalOwner[nft][tokenId] = address who deposited into escrow
    mapping(address => mapping(uint256 => address)) public escrowOriginalOwner;

    // Helpful indices for UI
    mapping(address => uint256[]) public sellerListingIds;
    uint256[] public activeListingIds; // Track active listings for efficient pagination

    // Map a token to its listingId (only while listed)
    mapping(bytes32 => uint256) private tokenKeyToListingId;

    // ---- Events ----
    event Escrowed(address indexed nft, uint256 indexed tokenId, address indexed seller);
    event ListingCreated(uint256 indexed listingId, address indexed seller, address indexed nft, uint256 tokenId, uint256 price, string cid);
    event ListingUpdated(uint256 indexed listingId, uint256 newPrice, string newCid);
    event ListingCanceled(uint256 indexed listingId, address indexed seller, uint256 refundWei);
    event Purchased(uint256 indexed listingId, address indexed buyer, uint256 price, uint256 sellerProceeds, uint256 platformFee);

    constructor(address _feeRecipient) Ownable(msg.sender) {
        feeRecipient = _feeRecipient == address(0) ? msg.sender : _feeRecipient;
    }

    // =========================================================
    // ===============   ESCROW: RECEIVE NFT   =================
    // =========================================================

    /**
     * Sellers MUST first send their NFT here via safeTransferFrom.
     * We record the original owner, so only they can create a listing.
     * 
     * If data is provided in the safeTransferFrom call, we interpret it as:
     * abi.encode(uint256 price, string cid) to auto-create a listing
     */
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        // msg.sender is the NFT contract address
        escrowOriginalOwner[msg.sender][tokenId] = from;
        emit Escrowed(msg.sender, tokenId, from);
        
        // If data is provided, try to auto-create listing
        if (data.length > 0) {
            try this.createListingFromEscrow(msg.sender, tokenId, from, data) {
                // Listing created successfully
            } catch {
                // Failed to create listing, NFT stays in escrow
            }
        }
        
        return IERC721Receiver.onERC721Received.selector;
    }

    /**
     * Helper to create listing directly from escrow data
     * Called internally when NFT is transferred with data
     */
    function createListingFromEscrow(
        address nft,
        uint256 tokenId,
        address seller,
        bytes calldata data
    ) external payable returns (uint256) {
        require(msg.sender == address(this), "Internal only");
        
        (uint256 price, string memory cid) = abi.decode(data, (uint256, string));
        
        // Create listing on behalf of seller
        return _createListing(seller, nft, tokenId, price, cid, 0);
    }

    // Optional: allow owner to withdraw an accidentally escrowed token (safety valve)
    function adminReturnEscrow(address nft, uint256 tokenId) external onlyOwner {
        address original = escrowOriginalOwner[nft][tokenId];
        require(original != address(0), "Not escrowed");
        delete escrowOriginalOwner[nft][tokenId];
        IERC721(nft).safeTransferFrom(address(this), original, tokenId);
    }

    // If a user escrowed but never listed, they can withdraw
    function withdrawEscrow(address nft, uint256 tokenId) external nonReentrant {
        require(escrowOriginalOwner[nft][tokenId] == msg.sender, "Not original owner");
        
        // Ensure not actively listed
        uint256 lid = _tokenKeyToListingId(nft, tokenId);
        require(lid == type(uint256).max, "Token is listed");
        
        delete escrowOriginalOwner[nft][tokenId];
        IERC721(nft).safeTransferFrom(address(this), msg.sender, tokenId);
    }

    // =========================================================
    // ====================   LISTING   ========================
    // =========================================================

    function _makeTokenKey(address nft, uint256 tokenId) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(nft, tokenId));
    }

    function _tokenKeyToListingId(address nft, uint256 tokenId) internal view returns (uint256) {
        uint256 lid = tokenKeyToListingId[_makeTokenKey(nft, tokenId)];
        return lid == 0 ? type(uint256).max : lid - 1; // store +1 to differentiate default zero
    }

    function _setTokenListingId(address nft, uint256 tokenId, uint256 listingId) internal {
        tokenKeyToListingId[_makeTokenKey(nft, tokenId)] = listingId + 1; // store +1
    }

    function _clearTokenListingId(address nft, uint256 tokenId) internal {
        delete tokenKeyToListingId[_makeTokenKey(nft, tokenId)];
    }

    /**
     * Create a listing for an escrowed token.
     * - Requires prior safeTransferFrom to this contract (escrowOriginalOwner must match msg.sender).
     * - Frontend passes `cid` so UI never has to read tokenURI on-chain.
     * - Pays flat listing fee up-front; partial refund on cancel is configurable.
     */
    function createListing(
        address nft,
        uint256 tokenId,
        uint256 price,
        string calldata cid
    ) external payable nonReentrant returns (uint256 listingId) {
        require(escrowOriginalOwner[nft][tokenId] == msg.sender, "Not escrow depositor");
        return _createListing(msg.sender, nft, tokenId, price, cid, msg.value);
    }

    function _createListing(
        address seller,
        address nft,
        uint256 tokenId,
        uint256 price,
        string memory cid,
        uint256 payment
    ) internal returns (uint256 listingId) {
        require(IERC721(nft).ownerOf(tokenId) == address(this), "Token not in escrow");
        require(bytes(cid).length > 0, "CID required");
        require(price > 0, "Invalid price");

        // collect listing fee
        if (listingFeeWei > 0) {
            require(payment >= listingFeeWei, "Listing fee required");
            uint256 overpay = payment - listingFeeWei;
            if (overpay > 0) {
                _payout(payable(seller), overpay); // return change
            }
        }

        // ensure token not already listed
        require(_tokenKeyToListingId(nft, tokenId) == type(uint256).max, "Already listed");

        listingId = nextListingId++;
        listings[listingId] = Listing({
            seller: seller,
            nft: nft,
            tokenId: tokenId,
            price: price,
            cid: cid,
            active: true,
            sold: false,
            listingFeePaid: listingFeeWei,
            createdAt: block.timestamp
        });

        sellerListingIds[seller].push(listingId);
        activeListingIds.push(listingId);
        _setTokenListingId(nft, tokenId, listingId);

        emit ListingCreated(listingId, seller, nft, tokenId, price, cid);
    }

    function updateListing(
        uint256 listingId,
        uint256 newPrice,
        string calldata newCid
    ) external {
        Listing storage l = listings[listingId];
        require(l.active && !l.sold, "Not active");
        require(msg.sender == l.seller, "Not seller");
        
        l.price = newPrice;
        if (bytes(newCid).length > 0) {
            l.cid = newCid;
        }
        
        emit ListingUpdated(listingId, newPrice, newCid);
    }

    /**
     * Cancel listing -> NFT back to seller.
     * Refunds a configurable % of the original listing fee (cancelRefundBps).
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage l = listings[listingId];
        require(l.active && !l.sold, "Not active");
        require(msg.sender == l.seller, "Not seller");

        l.active = false;
        _clearTokenListingId(l.nft, l.tokenId);
        _removeFromActiveListings(listingId);

        // transfer NFT back
        delete escrowOriginalOwner[l.nft][l.tokenId];
        IERC721(l.nft).safeTransferFrom(address(this), l.seller, l.tokenId);

        // refund part of listing fee
        uint256 refund = (l.listingFeePaid * cancelRefundBps) / 10_000;
        if (refund > 0) {
            _payout(payable(l.seller), refund);
        }

        emit ListingCanceled(listingId, l.seller, refund);
    }

    // =========================================================
    // ====================   PURCHASE   =======================
    // =========================================================

    function purchase(uint256 listingId) external payable nonReentrant {
        Listing storage l = listings[listingId];
        require(l.active && !l.sold, "Not for sale");
        require(IERC721(l.nft).ownerOf(l.tokenId) == address(this), "Token not in escrow");

        // payment
        require(msg.value >= l.price, "Insufficient payment");
        uint256 change = msg.value - l.price;

        // compute platform fee & seller proceeds
        uint256 fee = (l.price * platformFeeBps) / 10_000;
        uint256 proceeds = l.price - fee;

        l.active = false;
        l.sold = true;

        _clearTokenListingId(l.nft, l.tokenId);
        _removeFromActiveListings(listingId);
        delete escrowOriginalOwner[l.nft][l.tokenId];

        // send NFT to buyer
        IERC721(l.nft).safeTransferFrom(address(this), msg.sender, l.tokenId);

        // pay seller
        if (proceeds > 0) _payout(payable(l.seller), proceeds);

        // pay platform fee
        if (fee > 0) _payout(payable(_feeSink()), fee);

        // send listing fee to feeRecipient upon successful sale
        if (l.listingFeePaid > 0) _payout(payable(_feeSink()), l.listingFeePaid);

        // return change
        if (change > 0) _payout(payable(msg.sender), change);

        emit Purchased(listingId, msg.sender, l.price, proceeds, fee);
    }

    // =========================================================
    // =====================   GETTERS   =======================
    // =========================================================

    function getListing(uint256 listingId)
        external
        view
        returns (
            address seller,
            address nft,
            uint256 tokenId,
            uint256 price,
            string memory cid,
            bool active,
            bool sold,
            uint256 createdAt
        )
    {
        Listing storage l = listings[listingId];
        return (l.seller, l.nft, l.tokenId, l.price, l.cid, l.active, l.sold, l.createdAt);
    }

    /**
     * Get paginated active listings
     * @param offset Starting index
     * @param limit Maximum number of listings to return
     * @return ids Array of listing IDs
     * @return hasMore Whether there are more listings after this page
     */
    function getActiveListingsPaginated(uint256 offset, uint256 limit) 
        external 
        view 
        returns (uint256[] memory ids, bool hasMore) 
    {
        uint256 totalActive = activeListingIds.length;
        
        if (offset >= totalActive) {
            return (new uint256[](0), false);
        }
        
        uint256 end = offset + limit;
        if (end > totalActive) {
            end = totalActive;
        }
        
        uint256 actualSize = end - offset;
        ids = new uint256[](actualSize);
        
        for (uint256 i = 0; i < actualSize; i++) {
            ids[i] = activeListingIds[offset + i];
        }
        
        hasMore = end < totalActive;
    }

    function getActiveListingsCount() external view returns (uint256) {
        return activeListingIds.length;
    }

    function getSellerListings(address seller) external view returns (uint256[] memory) {
        return sellerListingIds[seller];
    }

    function getEscrowInfo(address nft, uint256 tokenId)
        external
        view
        returns (address originalOwner, bool isListed, uint256 listingId)
    {
        originalOwner = escrowOriginalOwner[nft][tokenId];
        uint256 lid = _tokenKeyToListingId(nft, tokenId);
        isListed = (lid != type(uint256).max);
        listingId = isListed ? lid : type(uint256).max;
    }

    // =========================================================
    // =====================   ADMIN   =========================
    // =========================================================

    function setListingFeeWei(uint256 fee) external onlyOwner { 
        listingFeeWei = fee; 
    }
    
    function setPlatformFeeBps(uint256 bps) external onlyOwner { 
        require(bps <= 1_000, "max 10%"); 
        platformFeeBps = bps; 
    }
    
    function setCancelRefundBps(uint256 bps) external onlyOwner { 
        require(bps <= 10_000, "max 100%"); 
        cancelRefundBps = bps; 
    }
    
    function setFeeRecipient(address r) external onlyOwner { 
        require(r != address(0), "bad recipient"); 
        feeRecipient = r; 
    }

    // Sweep any ETH (accumulated listing fees / leftovers)
    function sweep(address payable to, uint256 amount) external onlyOwner {
        if (to == address(0)) to = payable(owner());
        _payout(to, amount == 0 ? address(this).balance : amount);
    }

    // =========================================================
    // =====================   INTERNAL   ======================
    // =========================================================

    function _feeSink() internal view returns (address) {
        return feeRecipient == address(0) ? owner() : feeRecipient;
    }

    function _payout(address payable to, uint256 amount) internal {
        if (amount == 0) return;
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "ETH transfer failed");
    }

    function _removeFromActiveListings(uint256 listingId) internal {
        uint256 length = activeListingIds.length;
        for (uint256 i = 0; i < length; i++) {
            if (activeListingIds[i] == listingId) {
                // Move last element to this position and pop
                activeListingIds[i] = activeListingIds[length - 1];
                activeListingIds.pop();
                break;
            }
        }
    }

    receive() external payable {}
    fallback() external payable {}
}