const express = require("express");
const cors = require("cors");
const holdingsRoutes = require("./routes/holdings.routes");
const authRoutes = require("./routes/auth.routes");
const authMiddleware = require("./middleware/auth.middleware");

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  }),
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/holdings", authMiddleware, holdingsRoutes);

module.exports = app;
