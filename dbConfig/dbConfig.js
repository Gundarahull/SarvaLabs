const mongoose = require("mongoose");
require("dotenv").config();

const mongoURL = process.env.MONGO_URL;

// Connection
mongoose
  .connect(mongoURL)
  .then(() => {
    console.log("Connected Successfully  to MongoDB!");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

const db = mongoose.connection;

db.on("connected", () => {
  console.log(`Mongoose connected to MongoDB at ${mongoURL}`);
});

db.on("disconnected", () => {
  console.log("Mongoose disconnected");
});

db.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

module.exports = db;
