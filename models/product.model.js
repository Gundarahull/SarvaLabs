const mongoose = require("mongoose");

//creating Collections....
const discountSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["fixed", "percentage"],
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
  stackable: {
    type: Boolean,
    default: true,
  },
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  taxCategory: {
    type: String,
    enum: ["basic", "luxury", "zero-tax"],
    required: true,
  },
  discountRules: [discountSchema],
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
