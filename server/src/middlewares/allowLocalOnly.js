module.exports = function allowLocalOnly(req, res, next) {
  const ip = req.ip || (req.connection && req.connection.remoteAddress) || "";
  const allowed = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
  if (!allowed.has(ip)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};
