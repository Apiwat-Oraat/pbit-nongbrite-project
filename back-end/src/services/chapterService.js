
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
    // chapterId ถูก validate แล้วใน controller และส่งมาเป็น number แล้ว
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
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
  },

  // =========================================
  // ฟังก์ชัน: ดึงรายชื่อ Chapter พร้อมดาวที่ทำได้
  // =========================================
  async getChaptersWithProgress(userId) {
    // 1. ดึง Chapter ทั้งหมด + Level + ผลการเล่นของ User คนนี้
    const chapters = await prisma.chapter.findMany({
      orderBy: { orderIndex: 'asc' }, // เรียงตามลำดับบท
      include: {
        levels: {
          where: { isActive: true }, // เฉพาะ level ที่ active
          orderBy: { number: 'asc' }, // เรียงตาม number
          select: {
            id: true,
            maxStars: true, // เอามาเพื่อคำนวณคะแนนเต็ม
            completions: {
              where: { userId: userId }, // ดึงเฉพาะของ User คนนี้
              select: { bestStars: true } // เอาแค่ดาวที่ดีที่สุด
            }
          }
        }
      }
    });

    // 2. วนลูปคำนวณดาว (Transformation)
    const formattedChapters = chapters.map(chapter => {
      let earnedStars = 0;
      let totalMaxStars = 0;
      let levelsPassed = 0;

      // วนลูป Level ย่อยๆ ใน Chapter นั้น
      chapter.levels.forEach(level => {
        totalMaxStars += level.maxStars; // บวกดาวเต็มของด่านนั้น (เช่น 3)

        // เช็คว่า User เคยเล่นด่านนี้ไหม (Array จะมี 0 หรือ 1 ตัว)
        const userProgress = level.completions?.[0]; // เพิ่ม optional chaining

        if (userProgress && userProgress.bestStars > 0) {
          earnedStars += userProgress.bestStars; // บวกดาวที่ทำได้
          levelsPassed++; // นับเฉพาะด่านที่ได้ดาว > 0
        }
      });

      // คำนวณ % ความสำเร็จของ Chapter นี้
      const progressPercent = totalMaxStars > 0 
        ? Math.round((earnedStars / totalMaxStars) * 100) 
        : 0;

      return {
        id: chapter.id,
        title: chapter.title, // { th: "...", en: "..." }
        desc: chapter.desc,
        images: chapter.images,
        orderIndex: chapter.orderIndex,

        // ข้อมูลสรุปดาวที่ต้องการ
        stars: {
          earned: earnedStars,      // ได้กี่ดาว (เช่น 15)
          total: totalMaxStars,     // เต็มกี่ดาว (เช่น 27)
          percent: progressPercent  // กี่ %
        },

        levelsPassed: levelsPassed,   // ผ่านกี่ด่านแล้ว
        totalLevels: chapter.levels.length,
        isCompleted: levelsPassed === chapter.levels.length && chapter.levels.length > 0 // ผ่านครบทุกด่านและมีด่านอย่างน้อย 1 ด่าน
      };
    });

    return formattedChapters;
  }
}

export default chapterService;