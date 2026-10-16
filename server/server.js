require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Item = require("./models/Item");
const { requireAuth } = require("./middleware/auth");
const Order = require("./models/Order");
const User = require("./models/User");

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET must be set before starting the server.");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", require("./routes/auth"));
app.use("/api/orders", requireAuth, require("./routes/orders"));
app.use("/api/items", requireAuth, require("./routes/items"));

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pos_system")
  .then(async () => {
    try {
      await Item.collection.dropIndex("normalizedName_1");
    } catch (err) {
      if (!["IndexNotFound", "NamespaceNotFound"].includes(err.codeName)) throw err;
    }
    try {
      await Order.collection.dropIndex("receiptNo_1");
    } catch (err) {
      if (!["IndexNotFound", "NamespaceNotFound"].includes(err.codeName)) throw err;
    }
    await Item.collection.createIndex({ owner: 1, normalizedName: 1 }, { unique: true });
    await Order.collection.createIndex({ owner: 1, receiptNo: 1 }, { unique: true });
    await User.collection.createIndex({ email: 1 }, { unique: true });
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
