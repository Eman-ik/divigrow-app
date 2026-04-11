require("dotenv").config();
const app = require("./app");

const PORT = Number(process.env.PORT || 4000);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("DiviGrow API is LIVE - Jenkins CI/CD Working");
});

app.get("/test", (req, res) => {
  res.json({
    message: "Jenkins pipeline triggered successfully",
    timestamp: new Date()
  });
});