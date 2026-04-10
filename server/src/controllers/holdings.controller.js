const pool = require("../db/db");

async function getHoldings(req, res) {
  try {
    const result = await pool.query("SELECT * FROM holdings ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch holdings" });
  }
}

async function createHolding(req, res) {
  const { ticker, shares, avg_price, sector } = req.body;

  if (!ticker || !shares || !avg_price || !sector) {
    return res.status(400).json({ error: "ticker, shares, avg_price, and sector are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO holdings (ticker, shares, avg_price, sector)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [String(ticker).toUpperCase(), Number(shares), Number(avg_price), sector],
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: "Failed to create holding" });
  }
}

async function updateHolding(req, res) {
  const { id } = req.params;
  const { ticker, shares, avg_price, sector } = req.body;

  if (!ticker || !shares || !avg_price || !sector) {
    return res.status(400).json({ error: "ticker, shares, avg_price, and sector are required" });
  }

  try {
    const result = await pool.query(
      `UPDATE holdings
       SET ticker = $1,
           shares = $2,
           avg_price = $3,
           sector = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [String(ticker).toUpperCase(), Number(shares), Number(avg_price), sector, Number(id)],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Holding not found" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update holding" });
  }
}

async function deleteHolding(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM holdings WHERE id = $1 RETURNING id", [Number(id)]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Holding not found" });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete holding" });
  }
}

module.exports = {
  getHoldings,
  createHolding,
  updateHolding,
  deleteHolding,
};
