// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PropertyNFT is ERC721, Ownable {
    uint256 private _nextTokenId;

    constructor() ERC721("PropertyNFT", "PNFT") {}

    function mintNFT(address to) external onlyOwner {
        _safeMint(to, _nextTokenId);
        _nextTokenId++;
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://your-metadata-url.com/"; // Change this to your metadata URL
    }
}
