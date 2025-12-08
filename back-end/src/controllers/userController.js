import userService from "../services/userService.js";
import { autoFormatDates, formatToThai } from "../utils/dateFormatter.js";

const UserController = {
  /**
   * ดึงข้อมูล profile ของ user
   * GET /api/user/profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.userId;

      const user = await userService.getProfile(userId);

      const formattedData = autoFormatDates({
        id: user.id,
        name: user.name,
        age: user.age,
        gender: user.gender,
        profile: user.profile
      }, formatToThai);

      res.status(200).json({
        success: true,
        data: formattedData
      });
    } catch (error) {
      console.error("Get profile error:", error);
      
      if (error.message === "User not found") {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to get profile"
      });
    }
  },

  /**
   * อัปเดตข้อมูล profile ของ user
   * PUT /api/user/profile
   * Body: { name?, age?, gender?, icon? }
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      const { name, age, gender, icon } = req.body;

      // ตรวจสอบว่ามีข้อมูลที่จะอัปเดตอย่างน้อย 1 field
      if (name === undefined && age === undefined && gender === undefined && icon === undefined) {
        return res.status(400).json({
          success: false,
          message: "At least one field (name, age, gender, icon) must be provided"
        });
      }

      // อัปเดต profile
      const updatedUser = await userService.updateProfile(userId, {
        name,
        age,
        gender,
        icon
      });

      const formattedData = autoFormatDates({
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        age: updatedUser.age,
        gender: updatedUser.gender,
        profile: updatedUser.profile
      }, formatToThai);

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: formattedData
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update profile"
      });
    }
  }
};

export default UserController;

