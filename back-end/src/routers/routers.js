import express from 'express';
import AuthRoute from './authRouters.js';
import LivesRouters from './livesRoutes.js';
import StreakRouters from './streakRouter.js';

const router = express.Router();

AuthRoute(router);
LivesRouters(router);
StreakRouters(router);

export default router;