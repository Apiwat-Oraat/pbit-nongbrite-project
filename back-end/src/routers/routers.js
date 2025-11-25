import express from 'express';
import AuthRoute from './authRouters.js';
import LivesRouters from './livesRoutes.js';
import StreakRouters from './streakRouter.js';
import ChapterRouters from './chapterRouters.js';
import GameRouters from './gameRouters.js';

const router = express.Router();

AuthRoute(router);
LivesRouters(router);
StreakRouters(router);
ChapterRouters(router);
GameRouters(router);


export default router;