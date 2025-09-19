import express from 'express';
import AuthRoute from './authRoutes.js';

const router = express.Router();

AuthRoute(router);

export default router;