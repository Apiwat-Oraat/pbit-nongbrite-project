import express from 'express';
import productRoutes from './productRoutes.js';

const router = express.Router();

productRoutes(router);

export default router;