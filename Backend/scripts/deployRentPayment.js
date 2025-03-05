const hre = require("hardhat");

async function main() {
    const propertyNFTAddress = process.env.PROPERTY_NFT_CONTRACT; // Load from .env
    if (!propertyNFTAddress) {
        throw new Error("❌ PROPERTY_NFT_CONTRACT is not set in .env");
    }

    const RentPayment = await hre.ethers.getContractFactory("RentPayment");
    const rentPayment = await RentPayment.deploy(propertyNFTAddress);

    await rentPayment.deployed();

    console.log(`✅ RentPayment deployed at: ${rentPayment.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
