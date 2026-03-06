require("dotenv").config();
const pool = require("./db");

const products = [
  { name: "Custom Business Cards", description: "Premium quality business cards printed on 350gsm card stock with matte or glossy finish. Perfect for making a lasting impression.", price: 12.99, image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80", category: "Cards", rating: 4.8, in_stock: true },
  { name: "Photo Canvas Prints", description: "Transform your favorite photos into stunning canvas prints. Gallery-wrapped on solid wood frames, ready to hang.", price: 34.99, image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80", category: "Canvas", rating: 4.9, in_stock: true },
  { name: "Custom T-Shirt Printing", description: "High-quality DTG printed t-shirts with vibrant colors that last. Available in all sizes from XS to 3XL.", price: 19.99, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80", category: "Apparel", rating: 4.7, in_stock: true },
  { name: "Vinyl Stickers Pack", description: "Waterproof vinyl stickers with custom designs. Perfect for laptops, water bottles, and more. Comes in a pack of 50.", price: 8.99, image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80", category: "Stickers", rating: 4.6, in_stock: true },
  { name: "Custom Mug Printing", description: "Personalized ceramic mugs with your design or photo. Dishwasher safe with permanent printing that won't fade.", price: 14.99, image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80", category: "Mugs", rating: 4.5, in_stock: true },
  { name: "Large Format Posters", description: "Professional poster printing on premium photo paper. Available in sizes from A3 to A0 with vibrant color accuracy.", price: 24.99, image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80", category: "Posters", rating: 4.8, in_stock: true },
  { name: "Custom Phone Cases", description: "Durable phone cases with your own design. Available for all major phone models with snap-on or soft TPU options.", price: 16.99, image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80", category: "Accessories", rating: 4.4, in_stock: false },
  { name: "Brochure Printing", description: "Tri-fold and bi-fold brochures printed on glossy or matte paper. Ideal for marketing and promotional materials.", price: 29.99, image: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&q=80", category: "Marketing", rating: 4.7, in_stock: true },
];

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Running migration...");

    // Products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(10,2) NOT NULL,
        image TEXT,
        category VARCHAR(100),
        rating NUMERIC(3,1) DEFAULT 0,
        in_stock BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Table 'products' OK.");

    // Banner table
    await client.query(`
      CREATE TABLE IF NOT EXISTS banner (
        id SERIAL PRIMARY KEY,
        badge VARCHAR(255) DEFAULT '🖨️ #1 Online Print Shop',
        title VARCHAR(255) DEFAULT 'Your Ideas,',
        highlight VARCHAR(255) DEFAULT 'Perfectly Printed.',
        description TEXT DEFAULT 'From business cards to canvas art, we bring your creative vision to life with premium quality printing.',
        btn1_text VARCHAR(100) DEFAULT 'Shop Now',
        btn1_link VARCHAR(255) DEFAULT '#products',
        btn2_text VARCHAR(100) DEFAULT 'Our Services',
        btn2_link VARCHAR(255) DEFAULT '#',
        image_url TEXT DEFAULT 'https://images.unsplash.com/photo-1626785774625-ddcddc3445e9?w=600&q=80',
        stat1_number VARCHAR(50) DEFAULT '10K+',
        stat1_label VARCHAR(100) DEFAULT 'Happy Clients',
        stat2_number VARCHAR(50) DEFAULT '50+',
        stat2_label VARCHAR(100) DEFAULT 'Products',
        stat3_number VARCHAR(50) DEFAULT '24hr',
        stat3_label VARCHAR(100) DEFAULT 'Delivery',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Table 'banner' OK.");

    // Seed default banner row if empty
    const bannerCount = await client.query("SELECT COUNT(*) FROM banner");
    if (parseInt(bannerCount.rows[0].count) === 0) {
      await client.query("INSERT INTO banner DEFAULT VALUES;");
      console.log("Default banner seeded.");
    } else {
      console.log("Banner already has data. Skipping.");
    }

    // Subscribers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Table 'subscribers' OK.");

    // Seed products if empty
    const existing = await client.query("SELECT COUNT(*) FROM products;");
    if (parseInt(existing.rows[0].count) > 0) {
      console.log(`Products already seeded (${existing.rows[0].count} found). Skipping.`);
    } else {
      for (const p of products) {
        await client.query(
          `INSERT INTO products (name, description, price, image, category, rating, in_stock)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [p.name, p.description, p.price, p.image, p.category, p.rating, p.in_stock]
        );
      }
      console.log(`Seeded ${products.length} products.`);
    }

    console.log("Migration complete.");
  } catch (err) {
    console.error("Migration error:", err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

