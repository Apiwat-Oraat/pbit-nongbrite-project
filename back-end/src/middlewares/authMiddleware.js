import tokenService from "../services/tokenService.js";

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  // 1. ตรวจสอบว่า header มี token หรือไม่
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ 
      message: "Unauthorized: No token provided",
      error: "MISSING_TOKEN" 
    });
  }

  const token = authHeader.split(" ")[1];

  // ตรวจสอบว่า token ไม่ใช่ string ว่าง
  if (!token || token.trim() === "") {
    return res.status(401).json({ 
      message: "Unauthorized: Empty token",
      error: "EMPTY_TOKEN" 
    });
  }

  try {
    // 2. ตรวจสอบความถูกต้องของ token
    const payload = tokenService.verifyAccessToken(token);

    // ตรวจสอบว่า payload มีข้อมูลที่จำเป็น
    if (!payload || !payload.userId) {
      return res.status(403).json({ 
        message: "Forbidden: Invalid token payload",
        error: "INVALID_PAYLOAD" 
      });
    }

    // 3. แนบข้อมูลผู้ใช้ไปยัง req เพื่อใช้ใน route ถัดไป
    req.user = {
      id: payload.userId,
      role: payload.role || 'user', // default role
      email: payload.email,
      iat: payload.iat, // issued at
      exp: payload.exp  // expiration
    };

    next(); // ผ่านการตรวจสอบ → ไปยัง controller
  } catch (err) {
    console.error('Token verification error:', err.message);
    
    // แยกประเภท error เพื่อให้ response ที่เหมาะสม
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: "Unauthorized: Token has expired",
        error: "TOKEN_EXPIRED" 
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        message: "Forbidden: Invalid token",
        error: "INVALID_TOKEN" 
      });
    }
    
    // Error อื่นๆ
    return res.status(403).json({ 
      message: "Forbidden: Token verification failed",
      error: "VERIFICATION_FAILED" 
    });
  }
}

// Middleware สำหรับตรวจสอบ role เพิ่มเติม
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: "Unauthorized: User not authenticated",
        error: "NOT_AUTHENTICATED" 
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: "Forbidden: Insufficient permissions",
        error: "INSUFFICIENT_PERMISSIONS",
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
}

// Optional: Middleware สำหรับ token ที่ไม่บังคับ (optional auth)
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = tokenService.verifyAccessToken(token);
    req.user = {
      id: payload.userId,
      role: payload.role || 'user',
      email: payload.email
    };
  } catch (err) {
    req.user = null;
  }

  next();
}

export default authMiddleware;
export { requireRole, optionalAuth };