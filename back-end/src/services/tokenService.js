import jwt from "jsonwebtoken";

// ใช้ JWT_SECRET เดียวกันสำหรับทุก token type (หรือแยกเป็น 3 secrets สำหรับความปลอดภัยมากขึ้น)
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn('⚠️  Warning: JWT_SECRET is not set. Tokens will not work properly.');
}

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;
const REGISTER_TOKEN_SECRET = process.env.JWT_REGISTER_SECRET || JWT_SECRET;

const tokenService = {
  generateAccessToken: function (payload) {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
  },
  generateRefreshToken: function (payload) {
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
  },
  verifyAccessToken: function (token) {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
  },
  verifyRefreshToken: function (token) {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  },
  generateRegisterToken: function (payload, expiresIn = "15m") {
    return jwt.sign(payload, REGISTER_TOKEN_SECRET, { expiresIn });
  },
  verifyRegisterToken: function (token) {
    try {
      return jwt.verify(token, REGISTER_TOKEN_SECRET);
    } catch (err) {
      throw new Error("Invalid or expired registration token");
    }
  },

};

export default tokenService;