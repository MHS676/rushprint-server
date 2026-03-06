require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const emailRoutes = require("./routes/emailRoutes");
const quoteRoutes = require("./routes/quoteRoutes");
const contactRoutes = require("./routes/contactRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ─── AUTH ────────────────────────────────────────────────────────────────────
app.use("/api/admin", authRoutes);

// ─── ADMIN (banner, products CRUD, subscribers) ───────────────────────────
app.use("/api/admin", adminRoutes);

// ─── EMAIL ───────────────────────────────────────────────────────────────────
app.use("/api/admin", emailRoutes);

// ─── QUOTE (public) ───────────────────────────────────────────────────────────
app.use("/api/quote", quoteRoutes);

// ─── CONTACT (public) ────────────────────────────────────────────────────────
app.use("/api/contact", contactRoutes);

// ─── UPLOAD (protected – Cloudinary via server) ───────────────────────────────
app.use("/api/admin/upload", uploadRoutes);

// Get all products
app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, sku, description, price, image, category, rating, colors,
              color_enabled AS "colorEnabled", color_mode AS "colorMode",
              in_stock AS "inStock",
              lower_qty AS "lowerQty", lower_total_cost AS "lowerTotalCost", lower_unit_price AS "lowerUnitPrice",
              higher_qty AS "higherQty", higher_total_cost AS "higherTotalCost", higher_unit_price AS "higherUnitPrice",
              delivery_days AS "deliveryDays", created_at
       FROM products ORDER BY id ASC`
    );
    res.json({
      success: true,
      count: result.rowCount,
      data: result.rows,
    });
  } catch (err) {
    console.error("GET /api/products error:", err.message);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// Get single product by ID
app.get("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  if (isNaN(id)) {
    return res.status(400).json({ success: false, message: "Invalid ID" });
  }
  try {
    const result = await pool.query(
      `SELECT id, name, sku, description, price, image, category, rating, colors,
              color_enabled AS "colorEnabled", color_mode AS "colorMode",
              in_stock AS "inStock",
              lower_qty AS "lowerQty", lower_total_cost AS "lowerTotalCost", lower_unit_price AS "lowerUnitPrice",
              higher_qty AS "higherQty", higher_total_cost AS "higherTotalCost", higher_unit_price AS "higherUnitPrice",
              delivery_days AS "deliveryDays", created_at
       FROM products WHERE id = $1`,
      [parseInt(id)]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("GET /api/products/:id error:", err.message);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "Server is running", db: "PostgreSQL connected" });
  } catch (err) {
    res.status(500).json({ status: "Server is running", db: "DB connection failed", error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`PrintNgo server running on http://localhost:${PORT}`);
});
