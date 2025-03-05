require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // ✅ Make sure this is at the top

module.exports = {
    solidity: "0.8.20",
    networks: {
        sepolia: {
            url: process.env.INFURA_API_URL || "", // ✅ Prevent undefined errors
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
        }
    }
};
