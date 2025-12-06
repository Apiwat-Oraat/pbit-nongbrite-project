import { PrismaClient } from "@prisma/client";
import { calculateRank, calculateLevel } from "../utils/rankSystem.js";
import RankingCacheService from "./rankingCacheService.js";
import streaksService from "./streaksService.js";

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

    // ดึงคะแนนเก่าก่อนอัปเดต (เพื่อ update cache)
    const oldProfile = await prisma.profile.findUnique({
      where: { userId: userId },
      select: { totalScore: true }
    });
    const oldScore = oldProfile?.totalScore || 0;

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

    // 6. อัปเดต Streak (async - ไม่ต้องรอ)
    // อัปเดต streak เมื่อ user submit level
    streaksService.updateStreak(userId)
      .catch(err => {
        console.error('Failed to update streak:', err);
        // ไม่ throw error เพื่อไม่ให้กระทบ flow หลัก
      });

    // 7. อัปเดต RankingCache (async - ไม่ต้องรอ)
    // ถ้าคะแนนเปลี่ยน ให้อัปเดต cache ของ user นี้และคนที่ได้รับผลกระทบ
    if (totalScore !== oldScore) {
      RankingCacheService.updateUserCache(userId, totalScore)
        .then(() => {
          // อัปเดต rank ของคนอื่นที่ได้รับผลกระทบ (optional - อาจช้า)
          // RankingCacheService.updateAffectedRanks(totalScore, oldScore);
        })
        .catch(err => {
          console.error('Failed to update ranking cache:', err);
          // ไม่ throw error เพื่อไม่ให้กระทบ flow หลัก
        });
    }

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
  async getLeaderboard(useCache = true) {
    // ใช้ RankingCache เพื่อเพิ่มประสิทธิภาพ
    if (useCache) {
      try {
        const cachedLeaderboard = await RankingCacheService.getLeaderboardFromCache(10);
        
        // ดึง totalStars จาก Profile (เพราะ RankingCache ไม่มี)
        const userIds = cachedLeaderboard.map(p => p.userId);
        const profiles = await prisma.profile.findMany({
          where: { userId: { in: userIds } },
          select: {
            userId: true,
            totalStars: true
          }
        });

        const profileMap = new Map(profiles.map(p => [p.userId, p]));

        return cachedLeaderboard.map((player) => {
          const profile = profileMap.get(player.userId);
          const rankInfo = calculateRank(player.totalScore);

          return {
            rank: player.rank,
            userId: player.userId,
            name: player.name,
            avatar: player.avatar,
            
            totalScore: player.totalScore,
            totalStars: profile?.totalStars || 0,
            
            tier: rankInfo.name,     
            tierLabel: rankInfo.label,
            tierIcon: rankInfo.icon  
          };
        });
      } catch (error) {
        console.error('Error fetching from cache, falling back to Profile:', error);
        // Fallback to Profile query if cache fails
        return this.getLeaderboard(false);
      }
    }

    // Fallback: Query จาก Profile โดยตรง (ใช้เมื่อ cache ไม่พร้อม)
    const leaderboard = await prisma.profile.findMany({
        take: 10,
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
                    avatar: true,
                    displayName: true
                }
            }
        }
    });

    return leaderboard.map((player, index) => {
        const rankInfo = calculateRank(player.totalScore);

        return {
            rank: index + 1,
            userId: player.userId,
            name: player.user.displayName || player.user.name || "Unknown Hero",
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