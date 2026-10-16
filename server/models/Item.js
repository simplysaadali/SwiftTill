const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

itemSchema.index({ owner: 1, normalizedName: 1 }, { unique: true });

module.exports = mongoose.model("Item", itemSchema);