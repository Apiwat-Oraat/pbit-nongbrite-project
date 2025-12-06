import userService from "../services/userService.js";

const UserController = {
  /**
   * อัปเดตข้อมูล profile ของ user
   * POST /api/v1/user/profile
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

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          age: updatedUser.age,
          gender: updatedUser.gender,
          profile: updatedUser.profile
        }
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

