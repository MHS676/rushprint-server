require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { Pool } = require("pg");
const products = require("./products");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log("Ensuring tables exist ...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id               SERIAL PRIMARY KEY,
        name             VARCHAR(255) NOT NULL,
        sku              VARCHAR(100),
        description      TEXT,
        price            NUMERIC(10,2) NOT NULL DEFAULT 0,
        image            TEXT,
        category         VARCHAR(100),
        rating           NUMERIC(3,1) DEFAULT 0,
        in_stock         BOOLEAN DEFAULT true,
        lower_qty        INTEGER DEFAULT 0,
        lower_total_cost NUMERIC(10,2) DEFAULT 0,
        lower_unit_price NUMERIC(10,2) DEFAULT 0,
        higher_qty       INTEGER DEFAULT 0,
        higher_total_cost NUMERIC(10,2) DEFAULT 0,
        higher_unit_price NUMERIC(10,2) DEFAULT 0,
        colors           TEXT DEFAULT '',
        delivery_days    INTEGER DEFAULT 3,
        color_enabled    BOOLEAN DEFAULT true,
        color_mode       VARCHAR(10) DEFAULT 'single',
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Table 'products' OK.\n");
    console.log("Seeding products from data/products.js ...");

    for (const p of products) {
      const exists = await client.query(
        "SELECT id FROM products WHERE name = $1",
        [p.name]
      );

      if (exists.rowCount > 0) {
        await client.query(
          `UPDATE products SET
            description = $1,
            price       = $2,
            image       = $3,
            category    = $4,
            rating      = $5,
            in_stock    = $6
          WHERE name = $7`,
          [p.description, p.price, p.image, p.category, p.rating, p.inStock, p.name]
        );
        console.log(`  ✔ Updated : ${p.name}`);
      } else {
        await client.query(
          `INSERT INTO products (name, description, price, image, category, rating, in_stock)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [p.name, p.description, p.price, p.image, p.category, p.rating, p.inStock]
        );
        console.log(`  ✔ Inserted: ${p.name}`);
      }
    }

    const { rows } = await client.query("SELECT COUNT(*) FROM products");
    console.log(`\nDone. Total products in DB: ${rows[0].count}`);
  } catch (err) {
    console.error("Seed error:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
