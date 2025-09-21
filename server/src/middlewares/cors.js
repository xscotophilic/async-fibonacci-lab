const cors = require("cors");

function allowedOrigins() {
  const origins = process.env.CORS_ORIGINS ?? "";

  if (origins === "") {
    return "*";
  }

  const parts = origins.split(",");
  const cleaned = parts.map((o) => o.trim()).filter(Boolean);

  return cleaned;
}

const corsOptions = {
  origin: allowedOrigins(),
};

module.exports = cors(corsOptions);
