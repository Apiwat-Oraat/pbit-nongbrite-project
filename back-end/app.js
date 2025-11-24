import express from 'express';
import router from './src/routers/routers.js';import cookieParser from 'cookie-parser';
;

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use('/api/v1', router);

export default app;