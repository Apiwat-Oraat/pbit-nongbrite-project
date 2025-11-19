import AuthController from "../controllers/authController.js";
import emailService from "../services/emailService.js";


const AuthRoutes = (router) => {
  router.post("/auth/login", AuthController.login);
  router.post("/auth/refresh", AuthController.refreshToken);
  router.post("/auth/register/step1", AuthController.registerStep1);
  router.post("/auth/register/step2", AuthController.registerStep2);
  router.post("/auth/forgot-password", AuthController.forgotPassword);
  router.post("/auth/reset-password", AuthController.resetPassword);


  //test
  router.get("/test-email", async (req,res) => {
  try {
    await emailService.sendResetPinEmail("pipoococonut@gmail.com", "123456");
    res.json({ message: "Email sent" });
  } catch (err) {
    console.error("Test email error:", err);
    res.status(500).json({ message: err.message });
  }
});

};

export default AuthRoutes;
