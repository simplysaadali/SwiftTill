const crypto = require("crypto");
const User = require("../models/User");

const secret = () => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured.");
  return process.env.JWT_SECRET;
};

const createToken = (userId) => {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + 604800 })).toString("base64url");
  const content = `${header}.${payload}`;
  const signature = crypto.createHmac("sha256", secret()).update(content).digest("base64url");
  return `${content}.${signature}`;
};

const verifyToken = (token) => {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) return null;
  const content = `${header}.${payload}`;
  const expected = crypto.createHmac("sha256", secret()).update(content).digest();
  const received = Buffer.from(signature, "base64url");
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.sub || data.exp <= Math.floor(Date.now() / 1000)) return null;
    return data.sub;
  } catch (_err) {
    return null;
  }
};

const hashPassword = (password) => new Promise((resolve, reject) => {
  const salt = crypto.randomBytes(16).toString("hex");
  crypto.scrypt(password, salt, 64, (err, derivedKey) => {
    if (err) return reject(err);
    resolve(`${salt}:${derivedKey.toString("hex")}`);
  });
});

const comparePassword = (password, storedHash) => new Promise((resolve, reject) => {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return resolve(false);
  crypto.scrypt(password, salt, 64, (err, derivedKey) => {
    if (err) return reject(err);
    const expected = Buffer.from(key, "hex");
    resolve(expected.length === derivedKey.length && crypto.timingSafeEqual(expected, derivedKey));
  });
});

const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : "";
    const userId = token ? verifyToken(token) : null;
    if (!userId) return res.status(401).json({ message: "Please sign in to continue." });
    const user = await User.findById(userId).select("name email");
    if (!user) return res.status(401).json({ message: "Please sign in to continue." });
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { comparePassword, createToken, hashPassword, requireAuth };