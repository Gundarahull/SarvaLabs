const request = require("supertest");
const app = require("../app"); // Update with the correct path to your app
const Product = require("../models/product.model");
const mongoose = require("mongoose");

// Mock the Product model's findById method
jest.mock("../models/product.model");

jest.setTimeout(10000); // Increase timeout to 10 seconds

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect(); // Disconnect after all tests
});


describe("GET /products/:id/price", () => {
  
     beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should return 200 with final price for a valid product", async () => {
    const validProduct = {
      _id: "66df3bf6593d33b205314f91",
      basePrice: 200,
      discountRules: [{ type: "percentage", value: 10 }],
      taxCategory: "basic",
    };

    Product.findById.mockResolvedValue(validProduct);

    const response = await request(app).get("/products/66df3bf6593d33b205314f91/price");

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("status", true);
    expect(response.body).toHaveProperty("message", "Final price calculated successfully.");
    expect(response.body).toHaveProperty("finalPrice");
  });

  it("should return 404 if product is not found", async () => {
    Product.findById.mockResolvedValue(null);

    const response = await request(app).get("/products/66df3bf6593d33b205314f91/price");

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("status", false);
    expect(response.body).toHaveProperty("message", "Product not found.");
  });

  it("should return 500 if there is an error during final price calculation", async () => {
    Product.findById.mockImplementation(() => {
      throw new Error("Simulated error");
    });

    const response = await request(app).get("/products/66df3bf6593d33b205314f91/price");

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("status", false);
    expect(response.body).toHaveProperty("message", "Error Calculating the Final Price");
  });

  it("should return 500 for an invalid product ID format", async () => {
    const response = await request(app).get("/products/invalid-id/price");

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("status", false);
    expect(response.body).toHaveProperty("message", "Error Calculating the Final Price");
  });

  it("should return 500 if product has no data", async () => {
    Product.findById.mockResolvedValue({ _id: "66df3bf6593d33b205314f91" });

    const response = await request(app).get("/products/66df3bf6593d33b205314f91/price");

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("status", false);
    expect(response.body).toHaveProperty("message", "Error Calculating the Final Price");
  });

  it("should return the correct final price with a zero base price", async () => {
    const validProduct = {
      _id: "66df3bf6593d33b205314f91",
      basePrice: 0,
      discountRules: [{ type: "percentage", value: 10 }],
      taxCategory: "basic",
    };

    Product.findById.mockResolvedValue(validProduct);

    const response = await request(app).get("/products/66df3bf6593d33b205314f91/price");

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("status", true);
    expect(response.body).toHaveProperty("message", "Final price calculated successfully.");
    expect(response.body).toHaveProperty("finalPrice", 0);
  });

  it("should return the correct final price for a product with no discount rules", async () => {
    const validProduct = {
      _id: "66df3bf6593d33b205314f91",
      basePrice: 100,
      discountRules: [],
      taxCategory: "basic",
    };

    Product.findById.mockResolvedValue(validProduct);

    const response = await request(app).get("/products/66df3bf6593d33b205314f91/price");

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("status", true);
    expect(response.body).toHaveProperty("message", "Final price calculated successfully.");
    expect(response.body).toHaveProperty("finalPrice", 110);
  });

  it("should return the correct final price for a product with discounts that do not affect the final price", async () => {
    const validProduct = {
      _id: "66df3bf6593d33b205314f91",
      basePrice: 100,
      discountRules: [{ type: "fixed", value: 120 }],
      taxCategory: "basic",
    };

    Product.findById.mockResolvedValue(validProduct);

    const response = await request(app).get("/products/66df3bf6593d33b205314f91/price");

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("status", true);
    expect(response.body).toHaveProperty("message", "Final price calculated successfully.");
    expect(response.body).toHaveProperty("finalPrice", 0); // Discount exceeds base price
  });

  it("should return the correct final price for a product with a percentage discount", async () => {
    const validProduct = {
      _id: "66df3bf6593d33b205314f91",
      basePrice: 200,
      discountRules: [{ type: "percentage", value: 10 }],
      taxCategory: "basic",
    };

    Product.findById.mockResolvedValue(validProduct);

    const response = await request(app).get("/products/66df3bf6593d33b205314f91/price");

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("status", true);
    expect(response.body).toHaveProperty("message", "Final price calculated successfully.");
    expect(response.body).toHaveProperty("finalPrice");
    expect(response.body.finalPrice).toBe(198); // 200 - 10% of 200
  });

  it("should return the correct final price for a product with a fixed discount", async () => {
    const validProduct = {
      _id: "66df3bf6593d33b205314f91",
      basePrice: 200,
      discountRules: [{ type: "fixed", value: 20 }],
      taxCategory: "basic",
    };

    Product.findById.mockResolvedValue(validProduct);

    const response = await request(app).get("/products/66df3bf6593d33b205314f91/price");

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("status", true);
    expect(response.body).toHaveProperty("message", "Final price calculated successfully.");
    expect(response.body).toHaveProperty("finalPrice");
    expect(response.body.finalPrice).toBe(198); // 200 - 20
  });
});
