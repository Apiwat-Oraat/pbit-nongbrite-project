import livesService from "../services/livesService.js";
import { autoFormatDates, formatToThai } from "../utils/dateFormatter.js";

const livesController = {
  async getLives(req, res) {
    try {
      const lives = await livesService.getLives(req.user.userId);
      res.status(200).json({
        success: true,
        data: autoFormatDates(lives, formatToThai)
      });
    } catch (err) {
      res.status(500).json({ 
        success: false,
        message: err.message 
      });
    }
  },

  async useLives(req, res) {
    try {
      const lives = await livesService.useLife(req.user.userId);
      res.status(200).json({
        success: true,
        data: autoFormatDates(lives, formatToThai)
      });
    } catch (err) {
      if (err.message === "NO_LIVES_LEFT") {
        return res.status(400).json({ 
          success: false,
          message: "No lives left" 
        });
      }
      res.status(500).json({ 
        success: false,
        message: err.message 
      });
    }
  },

  async resetLives(req, res) {
    try {
      const lives = await livesService.resetLives(req.user.userId);
      res.status(200).json({
        success: true,
        data: autoFormatDates(lives, formatToThai)
      });
    } catch (err) {
      res.status(500).json({ 
        success: false,
        message: err.message 
      });
    }
  },
};

export default livesController;
