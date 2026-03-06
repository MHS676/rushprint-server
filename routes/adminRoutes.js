const express = require("express");
const pool = require("../db");
const verifyToken = require("../middleware/authMiddleware");
const router = express.Router();

// ─── BANNER (up to 4) ────────────────────────────────────────────────────────

// GET /api/admin/banners  (public – used by frontend carousel too)
router.get("/banners", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM banner ORDER BY sort_order ASC");
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single banner (kept for backwards compat)
router.get("/banner", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM banner ORDER BY sort_order ASC LIMIT 1");
    res.json({ success: true, data: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/banners  (protected – create new banner, max 4)
router.post("/banners", verifyToken, async (req, res) => {
  const { badge, title, highlight, description, btn1_text, btn1_link, btn2_text, btn2_link, image_url,
    stat1_number, stat1_label, stat2_number, stat2_label, stat3_number, stat3_label } = req.body;
  try {
    const count = await pool.query("SELECT COUNT(*) FROM banner");
    if (parseInt(count.rows[0].count) >= 4) {
      return res.status(400).json({ success: false, message: "Maximum 4 banners allowed. Delete one first." });
    }
    const sortRes = await pool.query("SELECT COALESCE(MAX(sort_order),0)+1 AS next FROM banner");
    const nextOrder = sortRes.rows[0].next;
    const result = await pool.query(
      `INSERT INTO banner (badge, title, highlight, description, btn1_text, btn1_link, btn2_text, btn2_link,
         image_url, stat1_number, stat1_label, stat2_number, stat2_label, stat3_number, stat3_label, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [badge, title, highlight, description, btn1_text, btn1_link, btn2_text, btn2_link,
        image_url, stat1_number, stat1_label, stat2_number, stat2_label, stat3_number, stat3_label, nextOrder]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/banners/:id  (protected – update existing)
router.put("/banners/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { badge, title, highlight, description, btn1_text, btn1_link, btn2_text, btn2_link, image_url,
    stat1_number, stat1_label, stat2_number, stat2_label, stat3_number, stat3_label } = req.body;
  try {
    const result = await pool.query(
      `UPDATE banner SET badge=$1, title=$2, highlight=$3, description=$4,
         btn1_text=$5, btn1_link=$6, btn2_text=$7, btn2_link=$8, image_url=$9,
         stat1_number=$10, stat1_label=$11, stat2_number=$12, stat2_label=$13,
         stat3_number=$14, stat3_label=$15, updated_at=NOW()
       WHERE id=$16 RETURNING *`,
      [badge, title, highlight, description, btn1_text, btn1_link, btn2_text, btn2_link,
        image_url, stat1_number, stat1_label, stat2_number, stat2_label, stat3_number, stat3_label, parseInt(id)]
    );
    if (result.rowCount === 0) return res.status(404).json({ success: false, message: "Banner not found." });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/banners/:id  (protected)
router.delete("/banners/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM banner WHERE id=$1", [parseInt(id)]);
    if (result.rowCount === 0) return res.status(404).json({ success: false, message: "Banner not found." });
    res.json({ success: true, message: "Banner deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PRODUCTS ────────────────────────────────────────────────────────────────

// POST /api/admin/products  (protected)
router.post("/products", verifyToken, async (req, res) => {
  const { name, description, price, image, category, rating, inStock,
    sku, lowerQty, lowerTotalCost, lowerUnitPrice,
    higherQty, higherTotalCost, higherUnitPrice, deliveryDays, colors, colorEnabled, colorMode } = req.body;
  if (!name || !price) {
    return res.status(400).json({ success: false, message: "Name and price are required." });
  }
  try {
    const result = await pool.query(
      `INSERT INTO products (name, description, price, image, category, rating, in_stock, sku,
         lower_qty, lower_total_cost, lower_unit_price,
         higher_qty, higher_total_cost, higher_unit_price, delivery_days, colors, color_enabled, color_mode)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING id, name, sku, description, price, image, category, rating,
         in_stock AS "inStock", colors,
         color_enabled AS "colorEnabled", color_mode AS "colorMode",
         lower_qty AS "lowerQty", lower_total_cost AS "lowerTotalCost", lower_unit_price AS "lowerUnitPrice",
         higher_qty AS "higherQty", higher_total_cost AS "higherTotalCost", higher_unit_price AS "higherUnitPrice",
         delivery_days AS "deliveryDays"`,
      [name, description, price, image, category, rating || 0, inStock !== false,
        sku || null, lowerQty || 0, lowerTotalCost || 0, lowerUnitPrice || 0,
        higherQty || 0, higherTotalCost || 0, higherUnitPrice || 0, deliveryDays || 3, colors || "",
        colorEnabled !== false, colorMode || "single"]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/products/:id  (protected)
router.put("/products/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, image, category, rating, inStock,
    sku, lowerQty, lowerTotalCost, lowerUnitPrice,
    higherQty, higherTotalCost, higherUnitPrice, deliveryDays, colors, colorEnabled, colorMode } = req.body;
  try {
    const result = await pool.query(
      `UPDATE products SET
         name=$1, description=$2, price=$3, image=$4, category=$5, rating=$6, in_stock=$7, sku=$8,
         lower_qty=$9, lower_total_cost=$10, lower_unit_price=$11,
         higher_qty=$12, higher_total_cost=$13, higher_unit_price=$14, delivery_days=$15, colors=$16,
         color_enabled=$17, color_mode=$18
       WHERE id=$19
       RETURNING id, name, sku, description, price, image, category, rating,
         in_stock AS "inStock", colors,
         color_enabled AS "colorEnabled", color_mode AS "colorMode",
         lower_qty AS "lowerQty", lower_total_cost AS "lowerTotalCost", lower_unit_price AS "lowerUnitPrice",
         higher_qty AS "higherQty", higher_total_cost AS "higherTotalCost", higher_unit_price AS "higherUnitPrice",
         delivery_days AS "deliveryDays"`,
      [name, description, price, image, category, rating, inStock, sku || null,
        lowerQty || 0, lowerTotalCost || 0, lowerUnitPrice || 0,
        higherQty || 0, higherTotalCost || 0, higherUnitPrice || 0,
        deliveryDays || 3, colors || "", colorEnabled !== false, colorMode || "single", parseInt(id)]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/products/:id  (protected)
router.delete("/products/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM products WHERE id=$1", [parseInt(id)]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }
    res.json({ success: true, message: "Product deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── SUBSCRIBERS ─────────────────────────────────────────────────────────────

// GET /api/admin/subscribers  (protected)
router.get("/subscribers", verifyToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM subscribers ORDER BY created_at DESC");
    res.json({ success: true, count: result.rowCount, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/subscribers  (public – subscribe from frontend)
router.post("/subscribe", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: "Email is required." });
  try {
    const existing = await pool.query("SELECT id FROM subscribers WHERE email=$1", [email]);
    if (existing.rowCount > 0) {
      return res.json({ success: true, message: "Already subscribed." });
    }
    await pool.query("INSERT INTO subscribers (email) VALUES ($1)", [email]);
    res.json({ success: true, message: "Subscribed successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
