require("dotenv").config();
const express = require("express");
const db = require("./dbConfig/dbConfig");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", require("./routes/product.route"));

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`server is running on port ${port} at DMM`);
  });
}

module.exports=app
