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
        message: 'Failed to get all chapters',
        error: error.message
      });
    }
  },

  async getChapterById(req, res) {
    try {
      const { chapterId } = req.params;
      const chapter = await chapterService.getChapterById(chapterId);

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
        message: 'Failed to get chapter',
        error: error.message
      });
    }
  }
}

export default chapterController;