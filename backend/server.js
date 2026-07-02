require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

console.log("DB_HOST =", process.env.DB_HOST || "localhost");
console.log("DB_USER =", process.env.DB_USER || "root");
console.log("DB_PASSWORD =", process.env.DB_PASSWORD ? "********" : "(empty)");
console.log("DB_NAME =", process.env.DB_NAME || "railway");
console.log("DB_PORT =", process.env.DB_PORT || 3306);

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "railway",
  port: Number(process.env.DB_PORT) || 3306,

  ssl:
    process.env.DB_HOST &&
    process.env.DB_HOST !== "localhost"
      ? {
          ca: fs.readFileSync(path.join(__dirname, "isrgrootx1.pem"))
        }
      : undefined
  });

db.connect((err) => {

  if (err) {
    console.log(err);
    return;
  }

  console.log("MySQL Connected");
});

app.post("/login", (req, res) => {

  const { username, password } =
    req.body;

  db.query(
    `
    SELECT *
    FROM manufacturers
    WHERE username = ?
    AND password = ?
    `,
    [username, password],

    (err, result) => {

      if (err) {

        console.log(err);

        return res.json({
          success: false
        });
      }

      if (result.length > 0) {

        res.json({
          success: true,
          manufacturer:
            result[0]
        });

      } else {

        res.json({
          success: false
        });
      }
    }
  );
});

app.post("/retailer-login", (req, res) => {

    const {
      retailerId,
      password
    } = req.body;

    db.query(
      `
      SELECT *
      FROM retailers
      WHERE retailer_id = ?
      AND password = ?
      `,
      [retailerId, password],

      (err, result) => {

        if (err) {

          console.log(err);

          return res.json({
            success: false
          });

        }

        if (
          result.length > 0
        ) {

          res.json({
            success: true,
            retailer:
              result[0]
          });

        } else {

          res.json({
            success: false
          });

        }

      }
    );

});

app.post( "/report-product", (req, res) => {


    const {
      productId,
      batchNumber,
      reason
    } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Report reason is required."
      });
    }

    db.query(
      `
      INSERT INTO suspicious_reports
      (
        product_id,
        batch_number,
        report_reason
      )
      VALUES (?, ?, ?)
      `,
      [
        productId,
        batchNumber,
        reason
      ],

      (err) => {

        if (err) {

          console.log(err);

          return res.json({
            success: false
          });
        }

        res.json({
          success: true
        });
      }
    );
  }
);

app.post( "/register-retailer", (req, res) => {

    console.log(req.body);
    
    const {
      retailerId,
      retailerName,
      password
    } = req.body;

    db.query(
      `
      INSERT INTO retailers
      (
        retailer_id,
        retailer_name,
        password
      )
      VALUES (?, ?, ?)
      `,
      [
        retailerId,
        retailerName,
        password
      ],

      (err) => {

        if (err) {

          console.log(err);

          return res.json({
            success: false
          });

        }

        res.json({
          success: true
        });

      }
    );

  }
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server Running on Port ${PORT}`);
});