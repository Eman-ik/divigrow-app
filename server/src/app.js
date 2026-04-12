const express = require("express");
const cors = require("cors");
const pool = require("./db/db");

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  }),
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("DiviGrow Notes API is running");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/notes", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title, content, created_at, updated_at FROM notes ORDER BY id DESC",
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch notes" });
  }
});

app.post("/api/notes", async (req, res) => {
  const title = String(req.body?.title || "").trim();
  const content = String(req.body?.content || "").trim();

  if (!title) {
    return res.status(400).json({ error: "title is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO notes (title, content)
       VALUES ($1, $2)
       RETURNING id, title, content, created_at, updated_at`,
      [title, content],
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: "Failed to create note" });
  }
});

app.put("/api/notes/:id", async (req, res) => {
  const noteId = Number(req.params.id);
  const title = String(req.body?.title || "").trim();
  const content = String(req.body?.content || "").trim();

  if (!Number.isInteger(noteId)) {
    return res.status(400).json({ error: "Invalid note id" });
  }

  if (!title) {
    return res.status(400).json({ error: "title is required" });
  }

  try {
    const result = await pool.query(
      `UPDATE notes
       SET title = $1,
           content = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, title, content, created_at, updated_at`,
      [title, content, noteId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Note not found" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update note" });
  }
});

app.delete("/api/notes/:id", async (req, res) => {
  const noteId = Number(req.params.id);

  if (!Number.isInteger(noteId)) {
    return res.status(400).json({ error: "Invalid note id" });
  }

  try {
    const result = await pool.query("DELETE FROM notes WHERE id = $1 RETURNING id", [noteId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Note not found" });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete note" });
  }
});

module.exports = app;