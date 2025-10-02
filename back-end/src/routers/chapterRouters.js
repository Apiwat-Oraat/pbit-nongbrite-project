import chapterController from "../controllers/chapterController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const ChapterRouters = (router) => {
  router.get("/chapters", authMiddleware, chapterController.getAllChapters);
  router.get("/chapters/:chapterId", authMiddleware, chapterController.getChapterById);
}

export default ChapterRouters