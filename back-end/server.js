import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. โหลด Environment Variables ก่อน!
dotenv.config({ path: path.join(__dirname, ".env") });

// 2. ใช้ await import แทน import ปกติ
// เพื่อบังคับให้ Code บรรทัดนี้ทำงาน "ทีหลัง" การโหลด dotenv ข้างบน
const { default: app } = await import("./app.js");

const port = process.env.API_PORT || 4000;
app.listen(port, () => console.log(`Server is running on port ${port}`));

// console.log(process.env.JWT_SECRET); 