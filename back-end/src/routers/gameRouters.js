import GameController from "../controllers/gameController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const GameRouters = (router) => {
  router.get("/game/ranking", authMiddleware.verifyToken, GameController.getRanking);
  router.get("/game/last-stage", authMiddleware.verifyToken, GameController.getLastStage);
  router.post("/game/submit", authMiddleware.verifyToken, GameController.submitLevel);
  // Admin endpoint - ควรเพิ่ม admin middleware ในอนาคต
  router.post("/game/rebuild-cache", authMiddleware.verifyToken, GameController.rebuildCache);
};

export default GameRouters;