require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const newProducts = [
  {
    name: "Full Color Foam Coolies",
    sku: "K_29",
    description: "Keep your drinks cold in style with full-color custom printed foam coolies. Perfect for events, promotions, and giveaways. Vibrant full-color printing on durable foam.",
    image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80",
    category: "Promotional",
    rating: 4.7,
    in_stock: true,
    lower_qty: 50,
    lower_total_cost: 108.00,
    lower_unit_price: 2.16,
    higher_qty: 100,
    higher_total_cost: 162.00,
    higher_unit_price: 1.62,
    delivery_days: 3,
  },
  {
    name: "16oz Stadium Cups",
    sku: "16S",
    description: "Custom printed 16oz stadium cups ideal for sporting events, parties, and promotions. Full wrap printing available with bright, long-lasting colors.",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80",
    category: "Drinkware",
    rating: 4.6,
    in_stock: true,
    lower_qty: 50,
    lower_total_cost: 115.70,
    lower_unit_price: 2.31,
    higher_qty: 100,
    higher_total_cost: 134.70,
    higher_unit_price: 1.35,
    delivery_days: 3,
  },
  {
    name: "2\" Round Custom Buttons",
    sku: "RBTN_13",
    description: "Eye-catching 2-inch round custom buttons. Great for campaigns, events, and brand promotion. Durable pin-back with full-color printing.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80",
    category: "Accessories",
    rating: 4.5,
    in_stock: true,
    lower_qty: 50,
    lower_total_cost: 68.15,
    lower_unit_price: 1.36,
    higher_qty: 100,
    higher_total_cost: 95.50,
    higher_unit_price: 0.96,
    delivery_days: 4,
  },
  {
    name: "Printed Wristbands",
    sku: "BANDS_4",
    description: "Durable silicone wristbands with custom text or logo. Perfect for events, fundraisers, and awareness campaigns. Available in multiple colors.",
    image: "https://images.unsplash.com/photo-1573612664822-d7d347da7b80?w=600&q=80",
    category: "Wristbands",
    rating: 4.8,
    in_stock: true,
    lower_qty: 100,
    lower_total_cost: 72.00,
    lower_unit_price: 0.72,
    higher_qty: 200,
    higher_total_cost: 114.00,
    higher_unit_price: 0.57,
    delivery_days: 2,
  },
  {
    name: "Full Color Lanyards",
    sku: "CL_7",
    description: "Custom full-color lanyards for ID badges, keys, and event passes. Full-color dye sublimation printing for vivid, detailed designs on soft polyester.",
    image: "https://images.unsplash.com/photo-1617059063786-f8b3132b0a28?w=600&q=80",
    category: "Lanyards",
    rating: 4.9,
    in_stock: true,
    lower_qty: 50,
    lower_total_cost: 135.00,
    lower_unit_price: 2.70,
    higher_qty: 100,
    higher_total_cost: 144.00,
    higher_unit_price: 1.44,
    delivery_days: 3,
  },
];

async function run() {
  const client = await pool.connect();
  try {
    // ── Add new columns to products table if they don't exist ─────────────
    const newCols = [
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100)",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS lower_qty INTEGER DEFAULT 0",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS lower_total_cost NUMERIC(10,2) DEFAULT 0",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS lower_unit_price NUMERIC(10,2) DEFAULT 0",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS higher_qty INTEGER DEFAULT 0",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS higher_total_cost NUMERIC(10,2) DEFAULT 0",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS higher_unit_price NUMERIC(10,2) DEFAULT 0",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS colors TEXT DEFAULT ''",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_days INTEGER DEFAULT 3",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS color_enabled BOOLEAN DEFAULT true",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS color_mode VARCHAR(10) DEFAULT 'single'",
    ];
    for (const sql of newCols) {
      await client.query(sql);
    }
    console.log("Product columns OK.");

    // ── Ensure banner and subscribers tables exist ────────────────────────
    await client.query(
      "CREATE TABLE IF NOT EXISTS banner (" +
      "id SERIAL PRIMARY KEY," +
      "badge VARCHAR(255) DEFAULT '🖨️ #1 Online Print Shop'," +
      "title VARCHAR(255) DEFAULT 'Your Ideas,'," +
      "highlight VARCHAR(255) DEFAULT 'Perfectly Printed.'," +
      "description TEXT DEFAULT 'From business cards to canvas art, we bring your creative vision to life.'," +
      "btn1_text VARCHAR(100) DEFAULT 'Shop Now'," +
      "btn1_link VARCHAR(255) DEFAULT '#products'," +
      "btn2_text VARCHAR(100) DEFAULT 'Our Services'," +
      "btn2_link VARCHAR(255) DEFAULT '#'," +
      "image_url TEXT DEFAULT 'https://images.unsplash.com/photo-1626785774625-ddcddc3445e9?w=600&q=80'," +
      "stat1_number VARCHAR(50) DEFAULT '10K+'," +
      "stat1_label VARCHAR(100) DEFAULT 'Happy Clients'," +
      "stat2_number VARCHAR(50) DEFAULT '50+'," +
      "stat2_label VARCHAR(100) DEFAULT 'Products'," +
      "stat3_number VARCHAR(50) DEFAULT '24hr'," +
      "stat3_label VARCHAR(100) DEFAULT 'Delivery'," +
      "sort_order INTEGER DEFAULT 1," +
      "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
      ")"
    );
    await client.query("ALTER TABLE banner ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 1");
    const bc = await client.query("SELECT COUNT(*) FROM banner");
    if (parseInt(bc.rows[0].count) === 0) {
      await client.query("INSERT INTO banner DEFAULT VALUES");
    }
    console.log("banner table OK.");

    await client.query(
      "CREATE TABLE IF NOT EXISTS subscribers (" +
      "id SERIAL PRIMARY KEY," +
      "email VARCHAR(255) UNIQUE NOT NULL," +
      "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
      ")"
    );
    console.log("subscribers table OK.");

    // ── Seed the 5 promotional products ──────────────────────────────────
    for (const p of newProducts) {
      const exists = await client.query(
        "SELECT id FROM products WHERE sku = $1",
        [p.sku]
      );
      if (exists.rowCount > 0) {
        // Update existing
        await client.query(
          `UPDATE products SET
            name=$1, description=$2, price=$3, image=$4, category=$5,
            rating=$6, in_stock=$7, sku=$8,
            lower_qty=$9, lower_total_cost=$10, lower_unit_price=$11,
            higher_qty=$12, higher_total_cost=$13, higher_unit_price=$14,
            delivery_days=$15
          WHERE sku=$8`,
          [
            p.name, p.description, p.lower_unit_price, p.image, p.category,
            p.rating, p.in_stock, p.sku,
            p.lower_qty, p.lower_total_cost, p.lower_unit_price,
            p.higher_qty, p.higher_total_cost, p.higher_unit_price,
            p.delivery_days,
          ]
        );
        console.log(`Updated: ${p.name}`);
      } else {
        await client.query(
          `INSERT INTO products
            (name, description, price, image, category, rating, in_stock, sku,
             lower_qty, lower_total_cost, lower_unit_price,
             higher_qty, higher_total_cost, higher_unit_price, delivery_days)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
          [
            p.name, p.description, p.lower_unit_price, p.image, p.category,
            p.rating, p.in_stock, p.sku,
            p.lower_qty, p.lower_total_cost, p.lower_unit_price,
            p.higher_qty, p.higher_total_cost, p.higher_unit_price,
            p.delivery_days,
          ]
        );
        console.log(`Inserted: ${p.name}`);
      }
    }

    const total = await client.query("SELECT COUNT(*) FROM products");
    console.log(`Total products in DB: ${total.rows[0].count}`);
    const tables = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
    );
    console.log("All tables:", tables.rows.map((r) => r.table_name).join(", "));
  } catch (err) {
    console.error("Error:", err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
    console.log("Done.");
  }
}

run();
