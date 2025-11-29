// ✅ 1. เติม .js
import GameService from "../services/gameService.js";

const GameController = {
  async submitLevel(req, res) {
    try {
      // ดึง User ID
      const userId = req.user.userId;

      const { levelId, score, stars, playTime } = req.body;

      // Validation: ตรวจสอบ required fields
      if (!levelId || playTime === undefined || score === undefined || stars === undefined) {
        return res.status(400).json({
          success: false,
          message: "Missing fields: levelId, score, stars, playTime are required"
        });
      }

      // Validation: ตรวจสอบว่าเป็นตัวเลขและอยู่ใน range ที่เหมาะสม
      const levelIdNum = parseInt(levelId);
      const scoreNum = parseInt(score);
      const starsNum = parseInt(stars);
      const playTimeNum = parseInt(playTime);

      if (isNaN(levelIdNum) || levelIdNum <= 0) {
        return res.status(400).json({
          success: false,
          message: "levelId must be a positive number"
        });
      }

      if (isNaN(scoreNum) || scoreNum < 0) {
        return res.status(400).json({
          success: false,
          message: "score must be a non-negative number"
        });
      }

      if (isNaN(starsNum) || starsNum < 0 || starsNum > 3) {
        return res.status(400).json({
          success: false,
          message: "stars must be between 0 and 3"
        });
      }

      if (isNaN(playTimeNum) || playTimeNum < 0) {
        return res.status(400).json({
          success: false,
          message: "playTime must be a non-negative number"
        });
      }

      const result = await GameService.submitLevelResult(
        userId,
        levelIdNum,
        scoreNum,
        starsNum,
        playTimeNum
      );

      res.status(200).json({
        success: true,
        data: result
      });
      
    } catch (error) {
      console.error("Submit Level Error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error"
      });
    }
  },

  async getRanking(req, res) {
    try {
      const leaderboard = await GameService.getLeaderboard();
      res.status(200).json({
        success: true,
        data: leaderboard
      });
    } catch (error) {
      console.error("Get Ranking Error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch leaderboard" 
      });
    }
  }
};

export default GameController;