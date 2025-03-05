require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { ethers } = require("ethers");

// ✅ Debugging: Check Environment Variables
console.log("🔍 ENV CHECK:");
console.log("ETH_NODE_URL:", process.env.ETH_NODE_URL || "❌ MISSING");
console.log("PRIVATE_KEY:", process.env.PRIVATE_KEY ? "✅ Loaded" : "❌ MISSING");
console.log("PROPERTY_NFT_CONTRACT:", process.env.PROPERTY_NFT_CONTRACT || "❌ MISSING");
console.log("RENT_PAYMENT_CONTRACT:", process.env.RENT_PAYMENT_CONTRACT || "❌ MISSING");
console.log("MONGO_URI:", process.env.MONGO_URI ? "✅ Loaded" : "❌ MISSING");

// ✅ Validate Required ENV Variables
if (!process.env.ETH_NODE_URL || !process.env.PRIVATE_KEY || !process.env.PROPERTY_NFT_CONTRACT || !process.env.RENT_PAYMENT_CONTRACT || !process.env.MONGO_URI) {
    throw new Error("❌ Missing required environment variables! Check your .env file.");
}

const app = express();
app.use(express.json());
app.use(cors()); // ✅ Added CORS to allow frontend requests

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, )
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => {
        console.error("❌ MongoDB Connection Failed:", err.message);
        process.exit(1);
    });

// ✅ Ethereum Setup
const provider = new ethers.JsonRpcProvider(process.env.ETH_NODE_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const propertyNFT = new ethers.Contract(process.env.PROPERTY_NFT_CONTRACT, require("./abis/PropertyNFTABI.json").abi, wallet);
const rentPayment = new ethers.Contract(process.env.RENT_PAYMENT_CONTRACT, require("./abis/RentPaymentABI.json").abi, wallet);

// ✅ MongoDB Models
const Property = mongoose.model("Property", new mongoose.Schema({
    owner: String,
    tokenId: Number,
    details: String,
    txHash: String,
    createdAt: { type: Date, default: Date.now }
}));

const RentTransaction = mongoose.model("RentTransaction", new mongoose.Schema({
    tenant: String,
    landlord: String,
    amount: String,
    rentDueDate: Date,
    txHash: String,
    paid: Boolean,
    createdAt: { type: Date, default: Date.now }
}));


//✅ API Route to Create Property
app.post("/api/properties/create", async (req, res) => {
  try {
    const newProperty = new Property(req.body);
    await newProperty.save();
    res.json({ message: "✅ Property created successfully", newProperty });
  } catch (error) {
    res.status(500).json({ error: "❌ Failed to create property" });
  }
});

// ✅ API: Get Property Details
app.get("/api/properties/:tokenId", async (req, res) => {
    try {
        const tokenId = parseInt(req.params.tokenId, 10); // Convert to number
        if (isNaN(tokenId)) {
            return res.status(400).json({ error: "Invalid tokenId format. Must be a number." });
        }

        const property = await Property.findOne({ tokenId: tokenId });
        if (!property) return res.status(404).json({ error: "Property not found" });

        res.json(property);
    } catch (error) {
        console.error("❌ Fetching Property Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ API: Get All Properties
app.get("/properties", async (req, res) => {
    try {
        res.json(await Property.find());
    } catch (error) {
        console.error("❌ Fetching All Properties Error:", error);
        res.status(500).json({ error: error.message });
    }
});



// ✅ API: Pay Rent
app.post("/rent/pay", async (req, res) => {
    try {
        const { tenant, amount, rentDueDate } = req.body;
        if (!tenant || !amount || !rentDueDate) return res.status(400).json({ error: "Missing required fields" });

        console.log(`💰 Processing Rent Payment: ${amount} ETH from ${tenant}`);
        const tx = await rentPayment.payRent({ value: ethers.parseEther(amount.toString()) });
        await tx.wait();

        await new RentTransaction({
            tenant,
            landlord: wallet.address,
            amount,
            rentDueDate,
            txHash: tx.hash,
            paid: true
        }).save();

        res.json({ success: true, message: "Rent Paid Successfully", txHash: tx.hash });
    } catch (error) {
        console.error("❌ Rent Payment Error:", error);
        res.status(500).json({ error: error.reason || error.message });
    }
});

// ✅ API: Get Rent Payments
app.get("/rent/:tenant", async (req, res) => {
    try {
        const transactions = await RentTransaction.find({ tenant: req.params.tenant });
        if (transactions.length === 0) return res.status(404).json({ error: "No rent transactions found for this tenant" });
        res.json(transactions);
    } catch (error) {
        console.error("❌ Fetching Rent Transactions Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ API: Get All Properties
app.get("/properties", async (req, res) => {
    try {
        res.json(await Property.find());
    } catch (error) {
        console.error("❌ Fetching All Properties Error:", error);
        res.status(500).json({ error: error.message });
    }
});


// ✅ Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("❌ Internal Server Error:", err.stack);
    res.status(500).json({ error: "Something went wrong!" });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
