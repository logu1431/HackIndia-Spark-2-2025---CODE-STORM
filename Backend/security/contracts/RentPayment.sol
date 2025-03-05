// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";  // ✅ Added owner access control

contract RentPayment is ReentrancyGuard, Ownable {
    IERC721 public immutable propertyNFT;

    struct RentDetails {
        uint256 amount;
        address tenant;
        uint256 dueDate;
        bool paid;
    }

    mapping(uint256 => RentDetails) public rentInfo;

    event RentSet(uint256 indexed tokenId, uint256 amount, address indexed tenant, uint256 dueDate);
    event RentPaid(uint256 indexed tokenId, address indexed tenant, uint256 amount);

    /// @notice Contract constructor, initializes the NFT contract
    constructor(address _propertyNFT) payable {
        require(_propertyNFT != address(0), "❌ Invalid NFT contract address");
        propertyNFT = IERC721(_propertyNFT);
    }

    /// @notice Set rent details for a specific property NFT
    /// @param tokenId The unique ID of the property NFT
    /// @param amount The required rent amount
    /// @param _tenant The tenant's wallet address
    /// @param _dueDate The due date for the rent payment
    function setRentDetails(uint256 tokenId, uint256 amount, address _tenant, uint256 _dueDate) external {
        require(propertyNFT.ownerOf(tokenId) == msg.sender, "❌ Not property owner");
        require(_tenant != address(0), "❌ Invalid tenant address");
        require(amount > 0, "❌ Rent amount must be greater than zero");
        require(_dueDate > block.timestamp, "❌ Due date must be in the future");

        rentInfo[tokenId] = RentDetails({
            amount: amount,
            tenant: _tenant,
            dueDate: _dueDate,
            paid: false
        });

        emit RentSet(tokenId, amount, _tenant, _dueDate);
    }

    /// @notice Pay rent for a specific property NFT
    /// @param tokenId The unique ID of the property NFT
    function payRent(uint256 tokenId) external payable nonReentrant {
        RentDetails storage rent = rentInfo[tokenId];

        require(msg.sender == rent.tenant, "❌ Not authorized tenant");
        require(msg.value == rent.amount, "❌ Incorrect rent amount");
        require(block.timestamp <= rent.dueDate, "❌ Rent payment overdue");
        require(!rent.paid, "❌ Rent already paid");

        rent.paid = true;  // ✅ Update state before sending funds

        address owner = propertyNFT.ownerOf(tokenId);
        (bool success, ) = payable(owner).call{value: msg.value}();
        require(success, "❌ Payment transfer failed");

        emit RentPaid(tokenId, msg.sender, msg.value);
    }

    /// @notice Withdraw contract balance (only owner)
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "❌ No balance to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}();
        require(success, "❌ Withdrawal failed");
    }
}
