const DEMO_USERNAME = process.env.DEMO_USERNAME || "divi";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "divi123";
const AUTH_TOKEN = process.env.AUTH_TOKEN || "divigrow-demo-token";

function login(req, res) {
  const { username, password } = req.body || {};

  if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
    return res.json({ token: AUTH_TOKEN, username: DEMO_USERNAME });
  }

  return res.status(401).json({ error: "Invalid username or password" });
}

module.exports = {
  login,
};
