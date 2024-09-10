const request = require("supertest");
const app = require("../app");
const Product = require("../models/product.model");
const mongoose = require("mongoose");

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

describe("POST /products", () => {
  // Before each test, mock the Product model
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a product successfully with a valid percentage discount", async () => {
    const validProduct = {
      name: "Product A",
      basePrice: 200,
      taxCategory: "basic",
      discountRules: [{ type: "percentage", value: 20 }],
    };

    const mockProduct = {
      ...validProduct,
    };

    Product.prototype.save = jest.fn().mockResolvedValue(mockProduct);

    const response = await request(app).post("/products").send(validProduct);
    console.log("response in the test", response._body.productId);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("status", true);
    expect(response.body).toHaveProperty(
      "message",
      "Product created successfully"
    );
    expect(response.body).toHaveProperty("productId", response._body.productId);
    expect(response.body).toHaveProperty(
      "finalPrice",
      response._body.finalPrice
    );
  });
  
  it("should return 400 if product name is missing", async () => {
    const invalidProduct = {
      basePrice: 100,
      taxCategory: "basic",
    };

    const response = await request(app).post("/products").send(invalidProduct);

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message", "Name is required");
    expect(response.body).toHaveProperty("status", false);
  });

  it("should return 400 if base price is negative", async () => {
    const invalidProduct = {
      name: "Product B",
      basePrice: -50,
      taxCategory: "basic",
    };

    const response = await request(app).post("/products").send(invalidProduct);

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty(
      "message",
      "Base price cannot be negative"
    );
    expect(response.body).toHaveProperty("status", false);
  });

  it("should return 400 if tax category is invalid", async () => {
    const invalidProduct = {
      name: "Product C",
      basePrice: 100,
      taxCategory: "invalid-category",
    };

    const response = await request(app).post("/products").send(invalidProduct);

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message", "Invalid tax category");
    expect(response.body).toHaveProperty("status", false);
  });

  it("should return 400 if discount type is invalid", async () => {
    const invalidProduct = {
      name: "Product D",
      basePrice: 100,
      taxCategory: "luxury",
      discountRules: [{ type: "invalid-type", value: 10 }],
    };

    const response = await request(app).post("/products").send(invalidProduct);

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message", "Invalid discount type.");
    expect(response.body).toHaveProperty("status", false);
  });

  it("should return 400 if percentage discount exceeds 50%", async () => {
    const invalidProduct = {
      name: "Product E",
      basePrice: 100,
      taxCategory: "luxury",
      discountRules: [{ type: "percentage", value: 60 }],
    };

    const response = await request(app).post("/products").send(invalidProduct);

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty(
      "message",
      "Percentage-based discounts cannot exceed 50%"
    );
    expect(response.body).toHaveProperty("status", false);
  });

  it("should return 400 if fixed discount exceeds base price", async () => {
    const invalidProduct = {
      name: "Product F",
      basePrice: 100,
      taxCategory: "luxury",
      discountRules: [{ type: "fixed", value: 150 }],
    };

    const response = await request(app).post("/products").send(invalidProduct);

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty(
      "message",
      "Fixed discount cannot exceed the base price"
    );
    expect(response.body).toHaveProperty("status", false);
  });

  it("should return 400 if discount value is negative", async () => {
    const invalidProduct = {
      name: "Product G",
      basePrice: 100,
      taxCategory: "zero-tax",
      discountRules: [{ type: "fixed", value: -10 }],
    };

    const response = await request(app).post("/products").send(invalidProduct);

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty(
      "message",
      "Discount value must be non-negative."
    );
    expect(response.body).toHaveProperty("status", false);
  });

  it("should return 500 if an error occurs during product creation", async () => {
    const validProduct = {
      name: "Product H",
      basePrice: 200,
      taxCategory: "basic",
      discountRules: [{ type: "fixed", value: 20 }],
    };

    Product.prototype.save = jest.fn().mockRejectedValue(new Error("DB Error"));

    const response = await request(app).post("/products").send(validProduct);

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("message", "Error creating product");
    expect(response.body).toHaveProperty("status", false);
  });

  
});
