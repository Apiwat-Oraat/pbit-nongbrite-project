import { PrismaClient } from "@prisma/client";
import { calculateRank, calculateLevel } from "../utils/rankSystem.js"; 

const prisma = new PrismaClient(); 

const GameService = {

  // =========================================
  // ฟังก์ชันที่ 1: ส่งผลการเล่น (Submit)
  // =========================================
  async submitLevelResult(userId, levelId, score, stars, playTime) {

    // 1. ตรวจสอบว่ามีด่านนี้จริงไหม
    const level = await prisma.level.findUnique({
      where: { id: levelId },
      include: { chapter: true }
    });

    if (!level) throw new Error("level not found");

    const chapterId = level.chapterId;

    // 2. บันทึก History
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
      await prisma.levelCompletion.create({
        data: {
          userId,
          levelId,
          score,
          stars,
          time: playTime,
          bestScore: score,
          bestStars: stars,
          bestTime: isPassed ? playTime : 999999,
          attempts: 1
        }
      });
    } else {
      let newBestTime = existing.bestTime;
      if (isPassed) {
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
          bestTime: newBestTime
        }
      });
    } 

    // 4. อัปเดต LastStage
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

    // 5. อัปเดต Profile & Rank
    const aggregations = await prisma.levelCompletion.aggregate({
        _sum: { 
            bestScore: true,
            bestStars: true 
        },
        where: { userId: userId }
    });

    const totalScore = aggregations._sum.bestScore || 0;
    const totalStars = aggregations._sum.bestStars || 0;

    const newRankInfo = calculateRank(totalScore); 
    const newLevel = calculateLevel(totalScore);

    await prisma.profile.upsert({
        where: { userId: userId },
        update: {
            totalScore: totalScore,
            totalStars: totalStars,
            currentRank: newLevel,    
            updatedAt: new Date()
        },
        create: {
            userId: userId,
            totalScore: totalScore,
            totalStars: totalStars,
            currentRank: newLevel,
        }
    });

    return { 
        success: true,
        earnedScore: score,
        totalScore: totalScore,
        rank: newRankInfo.name,
        rankLabel: newRankInfo.label,
        playerLevel: newLevel
    };
  },

  // =========================================
  // ฟังก์ชันที่ 2: ดึงอันดับ (Ranking)
  // =========================================
  async getLeaderboard() {
    const leaderboard = await prisma.profile.findMany({
        take: 10, // ดึงแค่ 10 อันดับแรก
        
        // กฎการตัดสิน: คะแนน > ดาว > เวลาที่ทำได้
        orderBy: [
            { totalScore: 'desc' },   
            { totalStars: 'desc' },   
            { updatedAt: 'asc' }      
        ],
        
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    avatar: true
                }
            }
        }
    });

    return leaderboard.map((player, index) => {
        const rankInfo = calculateRank(player.totalScore);

        return {
            rank: index + 1,
            userId: player.userId,
            name: player.user.name || "Unknown Hero",
            avatar: player.user.avatar,
            
            totalScore: player.totalScore,
            totalStars: player.totalStars,
            
            tier: rankInfo.name,     
            tierLabel: rankInfo.label,
            tierIcon: rankInfo.icon  
        };
    });
  }

};

export default GameService;