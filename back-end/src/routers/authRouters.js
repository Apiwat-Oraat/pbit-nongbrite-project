import AuthController from "../controllers/authController.js";
import emailService from "../services/emailService.js";


const AuthRoutes = (router) => {
  router.post("/auth/login", AuthController.login);
  router.post("/auth/logout", AuthController.logout);
  router.post("/auth/refresh", AuthController.refreshToken);
  router.post("/auth/register/step1", AuthController.registerStep1);
  router.post("/auth/register/step2", AuthController.registerStep2);
  router.post("/auth/forgot-password", AuthController.forgotPassword);
  router.post("/auth/reset-password", AuthController.resetPassword);

};

export default AuthRoutes;
