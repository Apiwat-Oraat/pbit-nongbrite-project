import livesService from "../services/livesService.js";

const livesController = {
  async getLives(req, res) {
    try {
      const lives = await livesService.getLives(req.user.userId);
      res.json(lives);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async useLives(req, res) {
    try {
      const lives = await livesService.useLife(req.user.userId);
      res.json(lives);
    } catch (err) {
      if (err.message === "NO_LIVES_LEFT") {
        return res.status(400).json({ message: "No lives left" });
      }
      res.status(500).json({ message: err.message });
    }
  },

  async resetLives(req, res) {
    try {
      const lives = await livesService.resetLives(req.user.userId);
      res.json(lives);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};

export default livesController;
