import chapterService from "../services/chapterService.js";

const chapterController = {

  async getAllChapters(req, res){
    try {
      const chapters = await chapterService.getAllChapters();
      res.status(200).json({
        success: true,
        data: { chapters }
      });
    } catch (error) {
      console.error('Get all chapters error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get all chapters'
      });
    }
  },

  async getChapterById(req, res) {
    try {
      const { chapterId } = req.params;
      
      // Validation: ตรวจสอบว่า chapterId เป็นตัวเลข
      const chapterIdNum = parseInt(chapterId);
      if (isNaN(chapterIdNum) || chapterIdNum <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid chapterId: must be a positive number"
        });
      }

      const chapter = await chapterService.getChapterById(chapterIdNum);

      res.status(200).json({
        success: true,
        data: chapter
      });
    } catch (error) {
      console.error('Get chapter error:', error);

      if (error.message === 'Chapter not found'){
        return res.status(404).json({
          success: false,
          message: 'Chapter not found'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to get chapter'
      });
    }
  },

  async getChaptersWithProgress(req, res) {
    try {
      const userId = req.user.userId; // ดึง userId จาก auth middleware

      const chapters = await chapterService.getChaptersWithProgress(userId);

      res.status(200).json({
        success: true,
        data: { chapters }
      });
    } catch (error) {
      console.error('Get chapters with progress error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get chapters with progress'
      });
    }
  }
}

export default chapterController;