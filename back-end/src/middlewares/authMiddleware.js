
import tokenService from "../services/tokenService.js";

const authMiddleware = {

  // 1. ตัวตรวจสอบ Token หลัก
  verifyToken: (req, res, next) => {

    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No token provided",
        error: "MISSING_TOKEN"
      });
    }

    try {
      const payload = tokenService.verifyAccessToken(token);
      req.user = payload;
      next();
    } catch (error) {

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: "Token Expired",
          error: "TOKEN_EXPIRED"
        });
      }

      return res.status(403).json({
        success: false,
        message: "Invalid Token",
        error: "INVALID_TOKEN"
      });
    }
  } 
};

export default authMiddleware;
