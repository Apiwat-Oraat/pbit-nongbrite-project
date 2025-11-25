// ✅ 1. เติม .js
import GameService from "../services/gameService.js";

const GameController = {
  async submitLevel(req, res) {
    try {
      // ดึง User ID (รองรับทั้ง id และ userId ตามที่คุณเขียนไว้ ดีแล้วครับ)
      const userId = req.user.id || req.user.userId;

      const { levelId, score, stars, playTime } = req.body;

      // ✅ 2. เพิ่ม Validation ให้ครบทุกตัว
      if (!levelId || playTime === undefined || score === undefined || stars === undefined) {
        return res.status(400).json({
          success: false,
          message: "Missing fields: levelId, score, stars, playTime are required"
        });
      }

      const result = await GameService.submitLevelResult(
        userId,
        parseInt(levelId), // แปลงเป็น Int ดีแล้วครับ
        parseInt(score),   // กันเหนียว แปลง score เป็น Int ด้วย
        parseInt(stars),   // กันเหนียว แปลง stars เป็น Int ด้วย
        parseInt(playTime) // กันเหนียว
      );

      res.status(200).json(result);
      
    } catch (error) {
      console.error("Submit Level Error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error"
      });
    }
  }
};

export default GameController;