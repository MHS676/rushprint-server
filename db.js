require("dotenv").config();
const { Pool } = require("pg");
const prisma = require("./prisma/client");

// Legacy pg Pool — kept for backward-compatible routes while migrating to Prisma
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes("railway.app") ? { rejectUnauthorized: false } : false,
});

pool.on("connect", () => {
    console.log("Connected to PostgreSQL (pg Pool)");
});

pool.on("error", (err) => {
    console.error("PostgreSQL pool error:", err);
});

module.exports = pool;
module.exports.prisma = prisma;

