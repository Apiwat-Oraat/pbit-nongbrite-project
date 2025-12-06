import express from 'express';
import AuthRoute from './authRouters.js';
import LivesRouters from './livesRoutes.js';
import StreakRouters from './streakRouter.js';
import ChapterRouters from './chapterRouters.js';
import GameRouters from './gameRouters.js';
import UserRouters from './userRouter.js';

const router = express.Router();


// Health check (ไม่ต้อง auth)
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

AuthRoute(router);
LivesRouters(router);
StreakRouters(router);
ChapterRouters(router);
GameRouters(router);
UserRouters(router);


export default router;