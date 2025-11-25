import livesController from "../controllers/livesController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const LivesRouters = (router) => {
  router.get("/users/lives", authMiddleware.verifyToken, livesController.getLives);
  router.put("/users/lives", authMiddleware.verifyToken, livesController.useLives);
  router.put("/users/lives/reset", authMiddleware.verifyToken, livesController.resetLives);
};

export default LivesRouters;