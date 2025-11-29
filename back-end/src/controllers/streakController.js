import streaksService from "../services/streaksService.js";

const getStreak = async (req, res) => {
  try {
    const userId = req.user.userId;
    const streak = await streaksService.getStreak(userId);

    if (!streak) {
      return res.status(200).json({
        success: true,
        data: {
          userId,
          current: 0,
          longest: 0,
        }
      });
    }

    res.status(200).json({
      success: true,
      data: streak
    });
  } catch (err) {
    console.error("Error getStreak:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to get streak" 
    });
  }
};

const updateStreak = async (req, res) => {
  try {
    const userId = req.user.userId;
    const streak = await streaksService.updateStreak(userId);
    res.status(200).json({
      success: true,
      data: streak
    });
  } catch (err) {
    console.error("Error updateStreak:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to update streak" 
    });
  }
};

export default {
  getStreak,
  updateStreak,
};
