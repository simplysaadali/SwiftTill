const express = require("express");
const Item = require("../models/Item");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const items = await Item.find({ owner: req.user._id }).sort({ name: 1 });
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
      { owner: req.user._id, normalizedName: name.toLocaleLowerCase() },
      { $set: { name, price }, $setOnInsert: { owner: req.user._id, normalizedName: name.toLocaleLowerCase() } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.status(200).json(item);
  } catch (err) {
    res.status(400).json({ message: err.message || "Could not save the inventory item." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const item = await Item.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!item) return res.status(404).json({ message: "Inventory item not found." });
    res.status(204).end();
  } catch (_err) {
    res.status(400).json({ message: "Invalid inventory item." });
  }
});

module.exports = router;