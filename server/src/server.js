require("dotenv").config();
const app = require("./app");
const { initializeDatabase } = require("./db/init");

const PORT = Number(process.env.PORT || 4000);

async function start() {
  try {
    await initializeDatabase();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();