import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient(); 
// แนะนำ: ถ้ามีไฟล์ prismaClient.js ให้ import มาใช้แทน new PrismaClient() จะดีกว่าครับ

const GameService = {

  async submitLevelResult(userId, levelId, score, stars, playTime) {

    // 1. ตรวจสอบว่ามีด่านนี้จริงไหม
    const level = await prisma.level.findUnique({
      where: { id: levelId },
      include: { chapter: true }
    });

    if (!level) throw new Error("level not found");

    const chapterId = level.chapterId;

    // 2. บันทึก History (Log)
    await prisma.gamePlayHistory.create({
      data: { userId, levelId, score, stars, playTime }
    });

    // 3. จัดการ Save File (LevelCompletion)
    const existing = await prisma.levelCompletion.findUnique({
      where: {
        userId_levelId: { userId, levelId }
      }
    });

    const isPassed = stars > 0;

    if (!existing) {
      // --- กรณี A: เล่นครั้งแรก ---
      await prisma.levelCompletion.create({
        data: {
          userId,
          levelId,
          score,
          stars,
          time: playTime,

          bestScore: score,
          bestStars: stars,
          // ✅ แก้คำผิด: bestTiem -> bestTime
          bestTime: isPassed ? playTime : 999999,
          attempts: 1
        }
      });
    } else {
      // --- กรณี B: เคยเล่นแล้ว ---

      // ✅ แก้คำผิด: bestTiem -> bestTime
      let newBestTime = existing.bestTime;
      
      if (isPassed) {
        // ✅ แก้คำผิด และ Logic
        if (existing.bestTime === 999999 || playTime < existing.bestTime) {
          newBestTime = playTime;
        }
      }

      await prisma.levelCompletion.update({
        where: { id: existing.id },
        data: {
          score,
          stars,
          time: playTime,
          completedAt: new Date(),
          attempts: { increment: 1 },

          bestScore: Math.max(existing.bestScore, score),
          bestStars: Math.max(existing.bestStars, stars),
          // ✅ แก้คำผิด: bestTiem -> bestTime
          bestTime: newBestTime
        }
      });
    } // <--- 🛑 ปีกกาปิด else อยู่ตรงนี้

    // 4. อัปเดต LastStage (ต้องอยู่นอก if/else เพื่อให้ทำงานทั้งคู่)
    await prisma.lastStage.upsert({
        where: { userId: userId },
        update: {
            chapterId: chapterId,
            levelId: levelId,
            score: score,
            stars: stars,
            updatedAt: new Date()
        },
        create: {
            userId: userId,
            chapterId: chapterId,
            levelId: levelId,
            score: score,
            stars: stars
        }
    });

    return { success: true };
  }
};

export default GameService;