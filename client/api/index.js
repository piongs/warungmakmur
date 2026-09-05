import app from "./_app.js";

export default function handler(req, res) {
  // Rewrites can pass the path without the /api prefix to the function.
  if (req.url && !req.url.startsWith("/api")) {
    req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
  }
  return app(req, res);
}