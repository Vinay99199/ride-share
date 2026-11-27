const developmentOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

export const parseClientOrigins = (value, { requireHttps = false } = {}) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("CLIENT_URL must contain at least one allowed origin");
  }

  return [...new Set(value.split(",").map((entry) => entry.trim()))].map(
    (origin) => {
      let parsed;
      try {
        parsed = new URL(origin);
      } catch {
        throw new Error("CLIENT_URL must contain valid origins");
      }
      if (
        !["http:", "https:"].includes(parsed.protocol) ||
        parsed.origin !== origin ||
        (requireHttps && parsed.protocol !== "https:")
      ) {
        throw new Error("CLIENT_URL must contain valid HTTPS origins");
      }
      return origin;
    }
  );
};

export const getAllowedOrigins = (env = process.env) => {
  if (env.CLIENT_URL?.trim()) {
    return parseClientOrigins(env.CLIENT_URL, {
      requireHttps: env.NODE_ENV === "production",
    });
  }
  return env.NODE_ENV === "production" ? [] : developmentOrigins;
};

export const createOriginValidator = (env = process.env) => {
  const allowedOrigins = new Set(getAllowedOrigins(env));
  return (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    const error = new Error("Origin is not allowed");
    error.statusCode = 403;
    return callback(error);
  };
};

export const validateEnvironment = (env = process.env) => {
  const missing = ["MONGO_URI", "JWT_SECRET"].filter(
    (name) => typeof env[name] !== "string" || !env[name].trim()
  );
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const port = env.PORT === undefined ? 5000 : Number(env.PORT);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  if (env.NODE_ENV === "production") {
    if (env.JWT_SECRET.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters in production");
    }
    parseClientOrigins(env.CLIENT_URL, { requireHttps: true });
    const missingEmailSettings = ["EMAIL_USER", "EMAIL_PASS"].filter(
      (name) => typeof env[name] !== "string" || !env[name].trim()
    );
    if (missingEmailSettings.length) {
      throw new Error(
        `Missing required environment variables: ${missingEmailSettings.join(", ")}`
      );
    }
  }

  return { port };
};
