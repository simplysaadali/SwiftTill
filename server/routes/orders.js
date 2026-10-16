const express = require("express");
const Order = require("../models/Order");
const router = express.Router();

const round = (n) => Math.round(n * 100) / 100;

// Create order — totals are always recalculated on the server
router.post("/", async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: "Add at least one item." });

    const cleaned = items.map((i) => {
      const price = Number(i.price);
      const quantity = Number(i.quantity);
      if (!i.name || !(price >= 0) || !(quantity >= 1))
        throw new Error("Each item needs a name, price and quantity.");
      return { name: i.name.trim(), price, quantity, total: round(price * quantity) };
    });

    const grandTotal = round(cleaned.reduce((s, i) => s + i.total, 0));
    const count = await Order.countDocuments({ owner: req.user._id });
    const receiptNo = `R-${String(count + 1).padStart(5, "0")}`;

    const order = await Order.create({ owner: req.user._id, receiptNo, items: cleaned, grandTotal });
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// List recent orders
router.get("/", async (req, res) => {
  const orders = await Order.find({ owner: req.user._id }).sort({ createdAt: -1 }).limit(20);
  res.json(orders);
});

// Single order (receipt)
router.get("/:id", async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, owner: req.user._id });
  if (!order) return res.status(404).json({ message: "Order not found." });
  res.json(order);
});

router.delete("/:id", async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!order) return res.status(404).json({ message: "Receipt not found." });
    res.status(204).end();
  } catch (_err) {
    res.status(400).json({ message: "Invalid receipt." });
  }
});

module.exports = router;
