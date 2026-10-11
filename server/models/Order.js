const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  total: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    receiptNo: { type: String, unique: true },
    items: { type: [itemSchema], validate: (v) => v.length > 0 },
    grandTotal: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
