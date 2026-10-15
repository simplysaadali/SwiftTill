const express = require("express");
const Item = require("../models/Item");
const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const items = await Item.find().sort({ name: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Could not load inventory." });
  }
});

router.post("/", async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const price = Number(req.body.price);
    if (!name || !(price >= 0) || !Number.isFinite(price)) {
      return res.status(400).json({ message: "Enter an item name and a valid price." });
    }

    const item = await Item.findOneAndUpdate(
      { normalizedName: name.toLocaleLowerCase() },
      { $set: { name, price } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.status(200).json(item);
  } catch (err) {
    res.status(400).json({ message: err.message || "Could not save the inventory item." });
  }
});

module.exports = router;