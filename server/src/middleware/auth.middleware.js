const AUTH_TOKEN = process.env.AUTH_TOKEN || "divigrow-demo-token";

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || token !== AUTH_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return next();
}

module.exports = authMiddleware;
