const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  total: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiptNo: { type: String, required: true },
    items: { type: [itemSchema], validate: (v) => v.length > 0 },
    grandTotal: { type: Number, required: true },
  },
  { timestamps: true }
);

orderSchema.index({ owner: 1, receiptNo: 1 }, { unique: true });

module.exports = mongoose.model("Order", orderSchema);
