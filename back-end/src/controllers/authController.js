import AuthService from "../services/authService.js";
import tokenService from "../services/tokenService.js";
import { autoFormatDates, formatToThai } from "../utils/dateFormatter.js";

const AuthController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const data = await AuthService.login(email, password);

      // Access Token
      res.cookie('accessToken', data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        // maxAge: 15 * 60 * 1000
        maxAge: 30 * 24 * 60 * 60 * 1000

      });

      res.status(200).json({
        success: true,
        message: "Login successfully",
        data: autoFormatDates(data.user, formatToThai),
      });

    } catch (error) {
      res.status(401).json({ 
        success: false,
        message: error.message 
      });
    }
  },

  async logout(req, res) {
    try {
      await AuthService.logout();
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      };

      res.clearCookie('accessToken', cookieOptions);
      res.clearCookie('registerToken', cookieOptions);

      res.status(200).json({
        success: true,
        message: "Logged out successfully"
      });
    } catch (error) {
      res.clearCookie('accessToken');
      res.status(200).json({ success: true, message: "Logged out (Local only)" });
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
        message: "Step 1 complete. Proceed to profile info."
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

      // 3. สร้าง login Token ทันที เพื่อให้ User ใช้งานได้เลย
      const payload = { userId: newUser.userId, role: 'USER' };
      const accessToken = tokenService.generateAccessToken(payload);

      // 4. ล้าง Cookie สมัครทิ้ง และใส่ Cookie ล็อกอินแทน
      res.clearCookie('registerToken');

      // ฝัง Access Token
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1 * 60 * 1000 // 1 นาทีสำหรับ test
        // maxAge: 30 * 24 * 60 * 60 * 1000   // 30 วัน
      });


      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: autoFormatDates(newUser, formatToThai),
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


  async forgotPassword(req, res) {
    const { email } = req.body;

    try {
      // เรียก Service - จะ throw error ถ้าไม่มี email ในระบบ
      await AuthService.forgotPassword(email);

      // ส่ง PIN สำเร็จ (เฉพาะ user ที่มี email ในระบบ)
      return res.status(200).json({
        success: true,
        message: "Reset PIN has been sent to your email."
      });

    } catch (err) {
      console.error("Forgot Password Error:", err);

      // ตรวจสอบว่าเป็น error ที่ไม่มี email หรือ error อื่นๆ
      if (err.message === "Email not found in our system") {
        return res.status(404).json({
          success: false,
          message: "Email not found in our system. Please check your email address."
        });
      }

      // Error อื่นๆ (เช่น email service error)
      return res.status(500).json({
        success: false,
        message: "Unable to process request at this time. Please try again later."
      });
    }
  },


  async resetPassword(req, res) {
    const { email, pin, newPassword } = req.body;
    try {
      await AuthService.resetPassword(email, pin, newPassword);
      res.status(200).json({ 
        success: true,
        message: "Password reset successfully" 
      });
    } catch (err) {
      res.status(400).json({ 
        success: false,
        message: err.message 
      });
    }
  }




};

export default AuthController;