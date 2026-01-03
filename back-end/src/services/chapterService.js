
// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();
import prisma from "../lib/prismaClient.js"

const chapterService = {

  async getAllChapters(userId = null) {
    const chapters = await prisma.chapter.findMany({
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        title: true,
        desc: true,
        orderIndex: true,
        // createdAt: true,
        levels: {
          where: { isActive: true },
          orderBy: { number: 'asc' },
          select: {
            id: true,
            number: true,
            title: true,
            // maxScore: true,
            maxStars: true,
            difficulty: true,
            // เพิ่ม completions ถ้ามี userId
            ...(userId && {
              completions: {
                where: { userId },
                select: {
                  bestStars: true
                },
                take: 1
              }
            })
          }
        }
      }
    });

    // Transform data เพื่อเพิ่ม earnedStars ถ้ามี userId
    if (userId) {
      const transformedChapters = chapters.map(chapter => ({
        ...chapter,
        levels: chapter.levels.map(level => {
          // ดึง earnedStars จาก completions
          const earnedStars = level.completions?.[0]?.bestStars || 0;
          
          // สร้าง object ใหม่โดยไม่รวม completions
          const { completions, ...levelWithoutCompletions } = level;
          
          return {
            ...levelWithoutCompletions,
            earnedStars
          };
        })
      }));
      
      // เพิ่ม isUnlocked status
      return await this.addUnlockedStatus(transformedChapters, userId);
    }

    return chapters;
  },

  async getChapterById(chapterId, userId = null) {
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

    // ถ้ามี userId ให้คำนวณ unlocked status
    if (userId) {
      const chapters = await this.addUnlockedStatus([chapter], userId);
      return chapters[0];
    }

    return chapter;
  },

  /**
   * เพิ่ม unlocked status ให้กับ levels ใน chapters
   * Logic: 
   * - Level แรกของ Chapter แรก = unlocked ตั้งแต่เริ่มต้น
   * - Level ถัดไป = unlocked เมื่อผ่าน level ก่อนหน้า (bestStars > 0)
   * - Level แรกของ Chapter ถัดไป = unlocked เมื่อผ่าน level สุดท้ายของ chapter ก่อนหน้า
   */
  async addUnlockedStatus(chapters, userId) {
    // ดึงข้อมูล completions ของ user ทั้งหมด
    const completions = await prisma.levelCompletion.findMany({
      where: { userId },
      select: {
        levelId: true,
        bestStars: true
      }
    });

    // สร้าง map สำหรับเช็คว่า level ไหนผ่านแล้ว (bestStars > 0)
    const completedLevels = new Set(
      completions
        .filter(c => c.bestStars > 0)
        .map(c => c.levelId)
    );

    // คำนวณ unlocked status
    // Logic: level จะ unlock เมื่อ level ก่อนหน้าทั้งหมด (ในลำดับ) ผ่านแล้ว
    return chapters.map(chapter => {
      const levels = chapter.levels.map((level, index) => {
        let isUnlocked = false;

        if (chapter.orderIndex === 1 && index === 0) {
          // Level แรกของ Chapter แรก = unlocked ตั้งแต่เริ่มต้น
          isUnlocked = true;
        } else if (index === 0) {
          // Level แรกของ Chapter ถัดไป = unlocked เมื่อผ่าน level สุดท้ายของ chapter ก่อนหน้า
          const prevChapter = chapters.find(c => c.orderIndex === chapter.orderIndex - 1);
          if (prevChapter && prevChapter.levels.length > 0) {
            const lastLevelOfPrevChapter = prevChapter.levels[prevChapter.levels.length - 1];
            isUnlocked = completedLevels.has(lastLevelOfPrevChapter.id);
          }
        } else {
          // Level ถัดไป = unlocked เมื่อผ่าน level ก่อนหน้าทั้งหมด (ในลำดับ)
          // เช็คว่า level ก่อนหน้าทั้งหมดผ่านแล้วหรือไม่
          let allPreviousLevelsCompleted = true;
          for (let i = 0; i < index; i++) {
            const prevLevel = chapter.levels[i];
            if (!completedLevels.has(prevLevel.id)) {
              allPreviousLevelsCompleted = false;
              break;
            }
          }
          isUnlocked = allPreviousLevelsCompleted;
        }

        return {
          ...level,
          isUnlocked
          // earnedStars และ maxStars จะถูกเก็บไว้โดย spread operator (...level)
        };
      });

      return {
        ...chapter,
        levels
      };
    });
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