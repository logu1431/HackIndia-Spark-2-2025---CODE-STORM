const { ethers } = require("hardhat");

async function main() {
    const PropertyNFT = await ethers.getContractFactory("PropertyNFT"); // ✅ Replace with your contract name
    const propertyNFT = await PropertyNFT.deploy();

    await propertyNFT.deployed();

    console.log(`✅ PropertyNFT deployed to: ${propertyNFT.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
