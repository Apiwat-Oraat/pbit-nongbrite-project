import AuthService from "../services/authService.js";
import tokenService from "../services/tokenService.js";
import userService from "../services/userService.js";

const AuthController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const data = await AuthService.login(email, password);

      // Refresh Token 7 วัน
      res.cookie('refreshToken', data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      // Access Token 15 นาที
      res.cookie('accessToken', data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000
      });

      res.status(200).json({
        success: true,
        message: "Login successfully",
        data: data.user,
      });

    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  },

  async logout(req,res){
    try {
      const refreshToken = req.cookies.refreshToken;
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      };

      res.clearCookie('accessToken', cookieOptions);
      res.clearCookie('refreshToken', cookieOptions);
      res.clearCookie('registerToken', cookieOptions);

      res.status(200).json({
        success: true,
        message: "Logged out successfully"
      });
    } catch (error) {
      
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      res.status(200).json({success: true, message: "Logged out (Local only)"});
    }
  },

  
  async registerStep1(req, res) {
    try {
      const { email, password, confirmPassword } = req.body;
      const registerToken = await AuthService.registerStep1(email, password, confirmPassword);

      // ส่ง registerToken ให้ frontend เอาไปใช้ใน step2
      res.cookie('registerToken', registerToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000 // 15 นาที
      });

      res.status(200).json({
        success: true,
        message: "Step 1 complete. Proceed to profile info.",
        // debug_token: registerToken
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },



  async registerStep2(req, res) {
    try {

      // 1. รับ Token จาก Cookie
      const registerToken = req.cookies.registerToken;
      if (!registerToken) throw new Error("Session expired, please register again");

      const { name, age, gender } = req.body;

      // 2. เรียก Service สร้าง User
      const newUser = await AuthService.registerStep2(registerToken, name, age, gender);

      // 3. สร้าง login Token (Access/Refresh) ทันที เพื่อให้ User ใช้งานได้เลย
      const payload = { userId: newUser.userId, role: 'user' };
      const accessToken = tokenService.generateAccessToken(payload);
      const refreshToken = tokenService.generateRefreshToken(payload);

      // บันทึก Refresh Token ลง DB (เหมือนตอน Login)
      await userService.updateRefreshToken(newUser.userId, refreshToken);

      // 4. ล้าง Cookie สมัครทิ้ง และใส่ Cookie ล็อกอินแทน
      res.clearCookie('registerToken');

      // ใส่ Token จริง
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      // 3. ฝัง Access Token (กุญแจห้อง - อยู่สั้น 15 นาที)
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000
      });


      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: newUser,
      });
    } catch (error) {
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        return res.status(409).json({
          success: false,
          message: "This email has already been registered just now."
        });
      }

      if (error.message === 'SESSION_EXPIRED') {
        res.clearCookie('registerToken');
        return res.status(401).json({
          success: false,
          message: "The application time has expired. Please start again.",
          code: "SESSION_EXPIRED" // ส่ง code ให้ frontend เช็คง่ายๆ
        })
      }
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async refreshToken(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ message: "No token provided" });
      }

      const { accessToken, refreshToken: newRefreshToken } = await AuthService.refreshTokens(refreshToken);

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000
      });

      if (newRefreshToken) {
        res.cookie('refreshToken', newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000
        });
      }

      res.json({ success: true, message: "Token refreshed" });

    } catch (err) {

      console.error("Refresh Token Error:", err.message);
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      res.status(403).json({ message: "Invalid refresh token, please login again" });
    }
  },

async forgotPassword(req, res) {
    const { email } = req.body;
    
    try {
      // เรียก Service
      // (ซึ่งใน Service เราคุยกันแล้วว่าถ้าไม่เจอ User ให้ return เงียบๆ ห้าม throw error)
      await AuthService.forgotPassword(email);

      // ✅ ตอบ Success เสมอ ไม่ว่าจะมีอีเมลจริงหรือไม่
      return res.status(200).json({ 
          success: true, 
          message: "If an account exists for this email, we have sent a reset PIN." 
      });

    } catch (err) {
      console.error("Forgot Password Error:", err);

      // 🚨 ถ้าเป็น Error อื่นๆ (เช่น DB ล่ม, ส่งเมลไม่ได้) ให้ตอบ 500
      // แต่ "ห้าม" แยก case NotFoundError ออกมาตอบ User
      return res.status(500).json({ 
          success: false, 
          message: "Unable to process request at this time." 
      });
    }
},


  async resetPassword(req, res) {
    const { email, pin, newPassword } = req.body;
    try {
      await AuthService.resetPassword(email, pin, newPassword);
      res.json({ message: "Password reset successfully" });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }




};

export default AuthController;