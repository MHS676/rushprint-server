/**
 * Run once to create the DB user + database:
 *   node db-setup.js <postgres-password>
 *
 * Example:
 *   node db-setup.js mySecretPass
 */
require("dotenv").config();
const { Client } = require("pg");

const pgPassword = process.argv[2];
if (!pgPassword) {
    console.error("Usage: node db-setup.js <postgres-superuser-password>");
    process.exit(1);
}

const DB_NAME = "my_app_db";
const DB_USER = "aminul_dev";
const DB_PASS = "Aminul@676";

async function setup() {
    // Connect as postgres superuser
    const admin = new Client({
        host: "127.0.0.1",
        port: 5432,
        database: "postgres",
        user: "postgres",
        password: pgPassword,
        ssl: false,
    });

    try {
        await admin.connect();
        console.log("✔ Connected as postgres superuser\n");

        // Create user if not exists
        const userExists = await admin.query(
            "SELECT 1 FROM pg_roles WHERE rolname = $1",
            [DB_USER]
        );
        if (userExists.rowCount === 0) {
            await admin.query(
                `CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS.replace("'", "''")}'`
            );
            console.log(`✔ Created user: ${DB_USER}`);
        } else {
            await admin.query(
                `ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASS.replace("'", "''")}'`
            );
            console.log(`✔ User already exists, password updated: ${DB_USER}`);
        }

        // Create database if not exists
        const dbExists = await admin.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [DB_NAME]
        );
        if (dbExists.rowCount === 0) {
            await admin.query(`CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}`);
            console.log(`✔ Created database: ${DB_NAME}`);
        } else {
            await admin.query(`GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER}`);
            console.log(`✔ Database already exists, granted privileges: ${DB_NAME}`);
        }

        console.log("\n✅ Setup complete! Now run: npx prisma db push\n");
    } catch (err) {
        console.error("❌ Error:", err.message);
        if (err.message.includes("password authentication failed")) {
            console.error("   → Wrong postgres password. Try: node db-setup.js <correct-password>");
        }
        process.exit(1);
    } finally {
        await admin.end();
    }
}

setup();
