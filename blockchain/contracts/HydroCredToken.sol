// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title HydroCredToken
 * @dev ERC721 token representing green hydrogen credits
 * Each token represents 1 verified unit of green hydrogen production
 */
contract HydroCredToken is ERC721, ERC721Enumerable, AccessControl, Pausable {
    bytes32 public constant CERTIFIER_ROLE = keccak256("CERTIFIER_ROLE");
    
    uint256 private _nextTokenId = 1;
    
    // Mapping to track retired tokens
    mapping(uint256 => bool) public isRetired;
    mapping(uint256 => address) public retiredBy;
    mapping(uint256 => uint256) public retiredAt;
    
    // Events
    event CreditsIssued(address indexed to, uint256 amount, uint256 fromId, uint256 toId);
    event CreditRetired(address indexed owner, uint256 indexed tokenId, uint256 timestamp);
    event CertifierUpdated(address indexed newCertifier, address indexed updatedBy);

    constructor(address defaultAdmin) ERC721("HydroCred Token", "HCT") {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(CERTIFIER_ROLE, defaultAdmin);
    }

    /**
     * @dev Batch issue credits to a producer
     * @param to Address to receive the credits
     * @param amount Number of credits to issue
     */
    function batchIssue(address to, uint256 amount) 
        public 
        onlyRole(CERTIFIER_ROLE) 
        whenNotPaused 
    {
        require(to != address(0), "Cannot issue to zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= 1000, "Cannot issue more than 1000 credits at once");
        
        uint256 fromId = _nextTokenId;
        uint256 toId = _nextTokenId + amount - 1;
        
        for (uint256 i = 0; i < amount; i++) {
            _safeMint(to, _nextTokenId);
            _nextTokenId++;
        }
        
        emit CreditsIssued(to, amount, fromId, toId);
    }

    /**
     * @dev Retire a credit (makes it non-transferable)
     * @param tokenId The token ID to retire
     */
    function retire(uint256 tokenId) public {
        require(_ownerOf(tokenId) == msg.sender, "Only owner can retire credit");
        require(!isRetired[tokenId], "Credit already retired");
        
        isRetired[tokenId] = true;
        retiredBy[tokenId] = msg.sender;
        retiredAt[tokenId] = block.timestamp;
        
        emit CreditRetired(msg.sender, tokenId, block.timestamp);
    }

    /**
     * @dev Set a new certifier (admin only)
     * @param newCertifier Address of the new certifier
     */
    function setCertifier(address newCertifier) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newCertifier != address(0), "Cannot set zero address as certifier");
        _grantRole(CERTIFIER_ROLE, newCertifier);
        emit CertifierUpdated(newCertifier, msg.sender);
    }

    /**
     * @dev Remove certifier role
     * @param certifier Address to remove certifier role from
     */
    function removeCertifier(address certifier) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(CERTIFIER_ROLE, certifier);
    }

    /**
     * @dev Get all token IDs owned by an address
     * @param owner Address to query
     * @return Array of token IDs
     */
    function tokensOfOwner(address owner) public view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        
        for (uint256 i = 0; i < tokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        
        return tokenIds;
    }

    /**
     * @dev Override update function to prevent transfer of retired tokens
     */
    function _update(address to, uint256 tokenId, address auth) 
        internal 
        override(ERC721, ERC721Enumerable) 
        whenNotPaused 
        returns (address) 
    {
        address from = _ownerOf(tokenId);
        if (from != address(0)) { // Skip check for minting
            require(!isRetired[tokenId], "Cannot transfer retired credit");
        }
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Override _increaseBalance function
     */
    function _increaseBalance(address account, uint128 value) 
        internal 
        override(ERC721, ERC721Enumerable) 
    {
        super._increaseBalance(account, value);
    }

    /**
     * @dev Pause contract (admin only)
     */
    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract (admin only)
     */
    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // Required overrides
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}