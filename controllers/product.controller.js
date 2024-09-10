const calculateFinalPrice = require("../functions/finalPrice.function");
const Product = require("../models/product.model");

const createProduct = async (req, res) => {
  try {
    const { name, basePrice, taxCategory, discountRules } = req.body;

    // Validate product name
    if (!name) {
      return res.status(400).json({ message: "Name is required", status: false });
    }

    // Validate base price
    if (basePrice < 0) {
      return res.status(400).json({
        status: false,
        message: "Base price cannot be negative",
      });
    }

    // Validate tax category
    const validTaxCategories = ["basic", "luxury", "zero-tax"];
    if (!validTaxCategories.includes(taxCategory)) {
      return res.status(400).json({
        status: false,
        message: "Invalid tax category",
      });
    }

    // Validate discount rules
    if (discountRules && Array.isArray(discountRules)) {
      for (const rule of discountRules) {
        if (rule.type === "percentage" && rule.value > 50) {
          return res.status(400).json({
            status: false,
            message: "Percentage-based discounts cannot exceed 50%",
          });
        }
        if (rule.type === "fixed" && rule.value >= basePrice) {
          return res.status(400).json({
            status: false,
            message: "Fixed discount cannot exceed the base price",
          });
        }
        if (rule.type !== "percentage" && rule.type !== "fixed") {
          return res.status(400).json({
            status: false,
            message: "Invalid discount type.",
          });
        }
        if (rule.value < 0) {
          return res.status(400).json({
            status: false,
            message: "Discount value must be non-negative.",
          });
        }
      }
    }

    // Create product and save it
    const product = new Product({
      name,
      basePrice,
      taxCategory,
      discountRules,
    });

    await product.save();

    // Calculate final price
    const finalPrice = calculateFinalPrice(basePrice, discountRules, taxCategory);

    return res.status(201).json({
      status: true,
      message: "Product created successfully",
      productId: product._id,
      finalPrice,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Error creating product",
      error: error.message,
    });
  }
};


const applyDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, value, stackable } = req.body;
    if (!["fixed", "percentage"].includes(type)) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid discount type." });
    }
    if (value < 0) {
      return res.status(400).json({
        status: false,
        message: "Discount value must be non-negative.",
      });
    }
    // Find the product
    const product = await Product.findById(id);
    console.log("old Product", product);

    if (!product) {
      return res
        .status(404)
        .json({ status: false, message: "Product not found." });
    }
    if (type === "percentage" && value > 50) {
      return res.status(400).json({
        status: false,
        message: "Percentage discount cannot exceed 50%.",
      });
    }
    if (type === "fixed" && value > product.basePrice) {
      return res.status(400).json({
        status: false,
        message: "Fixed discount cannot exceed the base price.",
      });
    }
    const newDiscount = { type, value, stackable };

    if (!stackable) {
      product.discountRules = product.discountRules.filter((d) => d.stackable);
      product.discountRules.push(newDiscount);
    } else {
      product.discountRules.push(newDiscount);
    }

    // Save the updated product
    await product.save();
    const productAfterNew = await Product.findById(id);
    console.log("new product", productAfterNew);
    const finalPrice = calculateFinalPrice(
      productAfterNew.basePrice,
      productAfterNew.discountRules,
      productAfterNew.taxCategory
    );

    return res.status(200).json({
      status: true,
      message: "Discount applied successfully.",
      //   results: productAfterNew,
      updatedFinalPrice: finalPrice,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Error applying discount",
      error: error.message,
    });
  }
};

const calculate_Final_Price = async (req, res) => {
  try {
    const id = req.params.id;

    const product = await Product.findById(id);
    if (!product) {
      return res
        .status(404)
        .json({ status: false, message: "Product not found." });
    }
    const finalPrice = calculateFinalPrice(
      product.basePrice,
      product.discountRules,
      product.taxCategory
    );
    return res.status(200).json({
      status: true,
      message: "Final price calculated successfully.",
      finalPrice: finalPrice,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Error Calculating the Final Price",
      error: error.message,
    });
  }
};


const productInfo = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id);
    if (!product) {
      return res
        .status(404)
        .json({ status: false, message: "Product not found." });
    }
    const finalPrice = calculateFinalPrice(
        product.basePrice,
        product.discountRules,
        product.taxCategory
      );
    return res.status(200).json({
      status: true,
      message: "Product information retrieved successfully.",
      results: product,
      finalPrice: finalPrice
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Error While Fetching the ProductInfo",
      error: error.message,
    });
  }
};
module.exports = {
  createProduct,
  applyDiscount,
  calculate_Final_Price,
  productInfo,
};
