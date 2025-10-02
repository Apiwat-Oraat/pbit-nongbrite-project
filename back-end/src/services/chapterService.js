
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const chapterService = {

  async getAllChapters() {
    return await prisma.chapter.findMany({
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        title: true,
        desc: true,
        orderIndex: true,
        createdAt: true,
        levels: {
          where: { isActive: true },
          orderBy: { number: 'asc' },
          select: {
            id: true,
            number: true,
            title: true,
            maxScore: true,
            maxStars: true,
            difficulty: true
          }
        }
      }
    });
  },

  async getChapterById(chapterId) {
    const chapter = await prisma.chapter.findUnique({
      where: { id: parseInt(chapterId) },
      select: {
        id: true,
        title: true,
        desc: true,
        orderIndex: true,
        createdAt: true,
        levels: {
          where: { isActive: true },
          orderBy: { number: 'asc' },
          select: {
            id: true,
            number: true,
            title: true,
            maxScore: true,
            maxStars: true,
            difficulty: true
          }
        }
      }
    });

    if (!chapter) {
      throw new Error("Chapter not found");
    }

    return chapter;
  }
}

export default chapterService;