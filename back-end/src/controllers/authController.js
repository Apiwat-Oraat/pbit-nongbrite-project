import AuthService from "../services/authService.js";

const AuthController = {
  login: async (req, res) => {
    try {
      const { email, password} = req.body;
      const token = await AuthService.login(email, password);
      res.status(200).json({ token });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  },

  async registerStep1(req, res) {
    try {
      const { email, password, confirmPassword } = req.body;
      const token = await AuthService.registerStep1(email, password, confirmPassword);

      res.status(200).json({
        success: true,
        message: "Step 1 complete. Proceed to profile info.",
        token: token // ส่ง token ให้ frontend เอาไปใช้ใน step2
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async registerStep2(req, res) {
    try {
      const { token, name, age, gender } = req.body;
      const user = await AuthService.registerStep2(token, name, age, gender);

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: user,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token required" });
      }

      const newTokens = await AuthService.refreshTokens(refreshToken);
      res.json(newTokens);
    } catch (err) {
      res.status(401).json({ message: err.message });
    }
  },

async forgotPassword(req, res) {
  const { email } = req.body;
  try {
    await AuthService.forgotPassword(email);
    return res.json({ message: "Reset PIN sent to email" });
  } catch (err) {
    console.error(err);

    if (err.name === "NotFoundError") {
      return res.status(404).json({ message: "User not found" });
    }

    if (err.name === "UnauthorizedError") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
},


  async resetPassword(req, res){
    const { email, pin, newPassword } = req.body;
    try {
      await AuthService.resetPassword(email, pin, newPassword);
      res.json({ message: "Password reset successfully"});
    } catch (err) {
      res.status(400).json({ message: err.message});
    }
  }




};

export default AuthController;