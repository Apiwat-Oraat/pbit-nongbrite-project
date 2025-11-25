import streaksService from "../services/streaksService.js";

const getStreak = async (req, res) => {
  try {
    const userId = req.user.userId;
    const streak = await streaksService.getStreak(userId);

    if (!streak) {
      return res.status(200).json({
        userId,
        current: 0,
        longest: 0,
      });
    }

    res.json(streak);
  } catch (err) {
    console.error("Error getStreak:", err);
    res.status(500).json({ message: "Failed to get streak" });
  }
};

const updateStreak = async (req, res) => {
  try {
    const userId = req.user.userId;
    const streak = await streaksService.updateStreak(userId);
    res.json(streak);
  } catch (err) {
    console.error("Error updateStreak:", err);
    res.status(500).json({ message: "Failed to update streak" });
  }
};

export default {
  getStreak,
  updateStreak,
};
