import { useEffect, useMemo, useState } from "react";

import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function formatDate(value) {
  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function App() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadNotes() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/notes`);

      if (!response.ok) {
        throw new Error("Failed to load notes.");
      }

      const data = await response.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setError(fetchError.message || "Backend is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotes();
  }, []);

  const noteCount = notes.length;
  const latestNote = useMemo(() => notes[0] || null, [notes]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save note.");
      }

      setTitle("");
      setContent("");
      await loadNotes();
    } catch (submitError) {
      setError(submitError.message || "Unable to save note.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setError("");
    try {
      const response = await fetch(`${API_BASE}/notes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok && response.status !== 204) {
        throw new Error("Failed to delete note.");
      }

      setNotes((current) => current.filter((note) => note.id !== id));
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete note.");
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">DiviGrow</p>
          <h1>Simple notes, backed by PostgreSQL.</h1>
          <p className="hero-text">
            A stripped-down web app for storing records in a database and
            deploying it with Docker on AWS EC2.
          </p>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <span>Notes</span>
            <strong>{noteCount}</strong>
          </div>
          <div className="stat-card">
            <span>Latest</span>
            <strong>
              {latestNote ? formatDate(latestNote.created_at) : "None"}
            </strong>
          </div>
        </div>
      </section>

      <section className="content-grid">
        <form className="panel form-panel" onSubmit={handleSubmit}>
          <div className="panel-heading">
            <h2>Add note</h2>
            <p>Title is required. Body is optional.</p>
          </div>
          <label>
            <span>Title</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Release checklist"
            />
          </label>
          <label>
            <span>Content</span>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="What needs to be remembered?"
              rows="6"
            />
          </label>
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save note"}
          </button>
        </form>

        <div className="panel notes-panel">
          <div className="panel-heading">
            <h2>Saved notes</h2>
            <p>Stored in PostgreSQL and loaded from the API.</p>
          </div>

          {error ? <div className="alert">{error}</div> : null}
          {loading ? <div className="empty-state">Loading notes...</div> : null}
          {!loading && notes.length === 0 ? (
            <div className="empty-state">
              No notes yet. Add one on the left.
            </div>
          ) : null}

          <div className="notes-list">
            {notes.map((note) => (
              <article key={note.id} className="note-card">
                <div>
                  <h3>{note.title}</h3>
                  <p>{note.content || "No additional details."}</p>
                </div>
                <footer>
                  <span>{formatDate(note.created_at)}</span>
                  <button type="button" onClick={() => handleDelete(note.id)}>
                    Delete
                  </button>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
