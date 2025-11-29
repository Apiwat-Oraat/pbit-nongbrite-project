import chapterController from "../controllers/chapterController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const ChapterRouters = (router) => {
  router.get("/chapters", authMiddleware.verifyToken, chapterController.getAllChapters);
  router.get("/chapters/:chapterId", authMiddleware.verifyToken, chapterController.getChapterById);
};

export default ChapterRouters;
