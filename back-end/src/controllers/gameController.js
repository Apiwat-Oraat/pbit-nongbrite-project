
import GameService from "../services/gameService.js";
import RankingCacheService from "../services/rankingCacheService.js";
import { autoFormatDates, formatToThai } from "../utils/dateFormatter.js";

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
        data: autoFormatDates(leaderboard, formatToThai)
      });
    } catch (error) {
      console.error("Get Ranking Error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch leaderboard" 
      });
    }
  },

  async getLastStage(req, res) {
    try {
      const userId = req.user.userId;
      const lastStage = await GameService.getLastStage(userId);

      if (!lastStage) {
        return res.status(200).json({
          success: true,
          data: null,
          message: "No stage played yet"
        });
      }

      res.status(200).json({
        success: true,
        data: autoFormatDates(lastStage, formatToThai)
      });
    } catch (error) {
      console.error("Get Last Stage Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch last stage"
      });
    }
  },

  /**
   * Rebuild ranking cache (Admin only - ควรเพิ่ม auth middleware)
   * ใช้เมื่อต้องการ sync cache ทั้งหมดใหม่
   */
  async rebuildCache(req, res) {
    try {
      // TODO: เพิ่ม admin check middleware
      // if (req.user.role !== 'ADMIN') {
      //   return res.status(403).json({ success: false, message: "Forbidden" });
      // }

      res.status(202).json({
        success: true,
        message: "Cache rebuild started. This may take a while..."
      });

      // รัน rebuild ใน background (ไม่ block response)
      RankingCacheService.rebuildAllCache()
        .then(result => {
          console.log('✅ Cache rebuild completed:', result);
        })
        .catch(error => {
          console.error('❌ Cache rebuild failed:', error);
        });

    } catch (error) {
      console.error("Rebuild Cache Error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to rebuild cache" 
      });
    }
  }
};

export default GameController;