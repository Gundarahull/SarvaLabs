const request = require("supertest");
const Product = require("../models/product.model");
const mongoose = require("mongoose");
const app = require("../app");

jest.setTimeout(20000); // Increase timeout to 10 seconds

describe("POST /products/:id/discount", () => {
  beforeAll(async () => {
    // Connect to the database
    await mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
  });

//   beforeEach(async () => {
//     // Clear existing data in the Product collection
//     await Product.deleteMany({});
//   });

  afterAll(async () => {
    // Close the database connection
    await mongoose.connection.close();
  });

  it("should return 400 if discount type is invalid", async () => {
    const product = new Product({
      name: "Product A",
      basePrice: 200,
      taxCategory: "basic",
      discountRules: [],
    });
    await product.save();

    const response = await request(app)
      .post(`/products/${product._id}/discount`)
      .send({
        type: "invalid-type",
        value: 10,
        stackable: true,
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message", "Invalid discount type.");
    expect(response.body).toHaveProperty("status", false);
  });

  it("should return 400 if discount value is negative", async () => {
    const product = new Product({
      name: "Product B",
      basePrice: 200,
      taxCategory: "basic",
      discountRules: [],
    });
    await product.save();

    const response = await request(app)
      .post(`/products/${product._id}/discount`)
      .send({
        type: "fixed",
        value: -10,
        stackable: true,
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message", "Discount value must be non-negative.");
    expect(response.body).toHaveProperty("status", false);
  });

  it("should return 400 if percentage discount exceeds 50%", async () => {
    const product = new Product({
      name: "Product C",
      basePrice: 200,
      taxCategory: "basic",
      discountRules: [],
    });
    await product.save();

    const response = await request(app)
      .post(`/products/${product._id}/discount`)
      .send({
        type: "percentage",
        value: 60,
        stackable: true,
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message", "Percentage discount cannot exceed 50%.");
    expect(response.body).toHaveProperty("status", false);
  });

  it("should return 400 if fixed discount exceeds base price", async () => {
    const product = new Product({
      name: "Product D",
      basePrice: 200,
      taxCategory: "basic",
      discountRules: [],
    });
    await product.save();

    const response = await request(app)
      .post(`/products/${product._id}/discount`)
      .send({
        type: "fixed",
        value: 300,
        stackable: true,
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message", "Fixed discount cannot exceed the base price.");
    expect(response.body).toHaveProperty("status", false);
  });

  it("should add a percentage discount successfully", async () => {
    const product = new Product({
      name: "Product E",
      basePrice: 200,
      taxCategory: "basic",
      discountRules: [],
    });
    await product.save();

    const response = await request(app)
      .post(`/products/${product._id}/discount`)
      .send({
        type: "percentage",
        value: 20,
        stackable: false,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("message", "Discount applied successfully.");
    expect(response.body).toHaveProperty("updatedFinalPrice");
  });

  it("should add a fixed discount successfully", async () => {
    const product = new Product({
      name: "Product F",
      basePrice: 200,
      taxCategory: "basic",
      discountRules: [],
    });
    await product.save();

    const response = await request(app)
      .post(`/products/${product._id}/discount`)
      .send({
        type: "fixed",
        value: 30,
        stackable: true,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("message", "Discount applied successfully.");
    expect(response.body).toHaveProperty("updatedFinalPrice");
  });

  it("should overwrite non-stackable discounts with stackable ones", async () => {
    const product = new Product({
      name: "Product G",
      basePrice: 200,
      taxCategory: "basic",
      discountRules: [{ type: "fixed", value: 20, stackable: false }],
    });
    await product.save();

    const response = await request(app)
      .post(`/products/${product._id}/discount`)
      .send({
        type: "fixed",
        value: 30,
        stackable: true,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("message", "Discount applied successfully.");
    expect(response.body).toHaveProperty("updatedFinalPrice");
  });

  it("should apply stackable discounts without removing existing ones", async () => {
    const product = new Product({
      name: "Product H",
      basePrice: 200,
      taxCategory: "basic",
      discountRules: [{ type: "percentage", value: 10, stackable: true }],
    });
    await product.save();

    const response = await request(app)
      .post(`/products/${product._id}/discount`)
      .send({
        type: "fixed",
        value: 30,
        stackable: true,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("message", "Discount applied successfully.");
    expect(response.body).toHaveProperty("updatedFinalPrice");
  });

  it("should return 404 if product is not found", async () => {
    const invalidId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .post(`/products/${invalidId}/discount`)
      .send({
        type: "percentage",
        value: 20,
        stackable: true,
      });

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("message", "Product not found.");
    expect(response.body).toHaveProperty("status", false);
  });

  it("should handle internal server errors", async () => {
    // Mocking the Product model's findById method to throw an error
    jest.spyOn(Product, "findById").mockRejectedValue(new Error("DB Error"));

    const product = new Product({
      name: "Product I",
      basePrice: 200,
      taxCategory: "basic",
      discountRules: [],
    });
    await product.save();

    const response = await request(app)
      .post(`/products/${product._id}/discount`)
      .send({
        type: "fixed",
        value: 30,
        stackable: true,
      });

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("message", "Error applying discount");
    expect(response.body).toHaveProperty("status", false);
  });
});
