import GameController from "../controllers/gameController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const GameRouters = (router) => {
  router.get("/game/ranking", authMiddleware.verifyToken, GameController.getRanking);
  router.post("/game/submit", authMiddleware.verifyToken, GameController.submitLevel);
};

export default GameRouters;