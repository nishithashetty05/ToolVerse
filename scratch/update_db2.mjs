import pkg from 'pg';
const { Pool } = pkg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log("Adding contact_phone to tools...");
    await pool.query(`ALTER TABLE tools ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);`);
    console.log("Column added.");
    
    console.log("Updating view v_tools_with_rating...");
    await pool.query(`
      DROP VIEW IF EXISTS v_tools_with_rating;
      CREATE OR REPLACE VIEW v_tools_with_rating AS
      SELECT
        t.id,
        t.owner_id,
        t.category_id,
        t.name,
        t.description,
        t.location,
        t.price_per_day,
        t.status,
        t.condition,
        t.image_url,
        t.contact_phone,
        t.created_at,
        t.updated_at,
        c.name                        AS category_name,
        u.name                        AS owner_name,
        u.clerk_id                    AS owner_clerk_id,
        COALESCE(AVG(r.rating), 0)    AS rating,
        COUNT(r.id)                   AS review_count
      FROM tools t
      JOIN categories c ON c.id = t.category_id
      JOIN users u      ON u.id = t.owner_id
      LEFT JOIN reviews r ON r.tool_id = t.id
      GROUP BY
        t.id, t.owner_id, t.category_id, t.name, t.description,
        t.location, t.price_per_day, t.status, t.condition,
        t.image_url, t.contact_phone, t.created_at, t.updated_at,
        c.name, u.name, u.clerk_id;
    `);
    console.log("View updated.");
  } catch (error) {
    console.error("Error connecting or querying:", error);
  } finally {
    await pool.end();
  }
}

main();
