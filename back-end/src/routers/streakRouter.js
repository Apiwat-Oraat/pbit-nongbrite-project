import streakController from "../controllers/streakController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const StreakRouters = (router) => {
  router.get("/users/streak", authMiddleware, streakController.getStreak);
  router.put("/users/streak/update", authMiddleware, streakController.updateStreak);
};

export default StreakRouters;
