import AuthController from "../controllers/authController.js";

const AuthRoutes = (router) => {
  router.post("/auth/login", AuthController.login);
  router.post("/auth/refresh", AuthController.refreshToken);
  router.post("/auth/register/step1", AuthController.registerStep1);
  router.post("/auth/register/step2", AuthController.registerStep2);
};

export default AuthRoutes;