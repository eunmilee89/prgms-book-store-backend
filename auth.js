const jwt = require("jsonwebtoken");
require("dotenv").config();

const ensureAuthorization = (req) => {
  try {
    const token = req.headers["authorization"];
    if (!token) return new jwt.JsonWebTokenError("no token");
    return jwt.verify(token, process.env.PRIVATE_KEY);
  } catch (err) {
    return err; // TokenExpiredError | JsonWebTokenError
  }
};

module.exports = ensureAuthorization;
