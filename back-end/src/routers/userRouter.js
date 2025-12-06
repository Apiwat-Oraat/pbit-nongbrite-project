import UserController from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { validateAge, validateGender } from "../middlewares/validateMiddleware.js";

const UserRouters = (router) => {
  // อัปเดต profile (name, age, gender, icon)
  // ใช้ validateAge และ validateGender เฉพาะเมื่อมีการส่งค่าเข้ามา
  router.put(
    "/user/profile",
    authMiddleware.verifyToken,
    validateAge,
    validateGender,
    UserController.updateProfile
  );
};

export default UserRouters;

