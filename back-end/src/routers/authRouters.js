import AuthController from "../controllers/authController.js";
import { validateEmail, validatePassword, validateAge, validateGender, validatePIN } from "../middlewares/validateMiddleware.js";


const AuthRoutes = (router) => {
  router.post("/auth/login", validateEmail, validatePassword, AuthController.login);
  router.post("/auth/logout", AuthController.logout);
  router.post("/auth/refresh", AuthController.refreshToken);
  router.post("/auth/register/step1", validateEmail, validatePassword, AuthController.registerStep1);
  router.post("/auth/register/step2", validateAge, validateGender, AuthController.registerStep2);
  router.post("/auth/forgot-password", validateEmail, AuthController.forgotPassword);
  router.post("/auth/reset-password", validateEmail, validatePIN, validatePassword, AuthController.resetPassword);

};

export default AuthRoutes;
