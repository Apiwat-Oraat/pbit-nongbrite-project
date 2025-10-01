import livesController from "../controllers/livesController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const LivesRouters = (router) => {
  router.get("/users/lives", authMiddleware, livesController.getLives);
  router.put("/users/lives", authMiddleware, livesController.useLives);
  router.put("/users/lives/reset", authMiddleware, livesController.resetLives);
};

export default LivesRouters;