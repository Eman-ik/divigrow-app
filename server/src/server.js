require("dotenv").config();
const app = require("./app");

const PORT = Number(process.env.PORT || 4000);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});