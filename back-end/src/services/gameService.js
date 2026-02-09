// import { PrismaClient } from "@prisma/client";
import { calculateRank } from "../utils/rankSystem.js";
import RankingCacheService from "./rankingCacheService.js";
import streaksService from "./streaksService.js";
import prisma from "../lib/prismaClient.js"
// const prisma = new PrismaClient(); 

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

    // 4. อัปเดต LastStage (เฉพาะเมื่อเล่น level ใหม่ ไม่นับการเล่นซ้ำ)
    const existingLastStage = await prisma.lastStage.findUnique({
      where: { userId: userId }
    });

    // อัปเดต LastStage เฉพาะเมื่อ:
    // - ยังไม่มี LastStage (เล่นครั้งแรก)
    // - เล่น level ใหม่ (levelId เปลี่ยน)
    // - เล่น chapter ใหม่ (chapterId เปลี่ยน)
    const shouldUpdateLastStage = !existingLastStage ||
      existingLastStage.levelId !== levelId ||
      existingLastStage.chapterId !== chapterId;

    if (shouldUpdateLastStage) {
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
    }

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

    // ดึงข้อมูลเก่าก่อนอัปเดต (เพื่อ update cache)
    const oldProfile = await prisma.profile.findUnique({
      where: { userId: userId },
      select: {
        totalScore: true,
        totalStars: true,
        updatedAt: true
      }
    });
    const oldScore = oldProfile?.totalScore || 0;
    const oldTotalStars = oldProfile?.totalStars || 0;
    const oldUpdatedAt = oldProfile?.updatedAt || new Date();

    // ใช้ rank จาก RankingCache แทนการคำนวณใหม่
    // ส่ง totalStars และ updatedAt เก่าไปด้วย (ก่อนอัปเดต) เพื่อคำนวณ rank ที่ถูกต้อง
    let rankingPosition = null;
    if (totalScore !== oldScore || totalStars !== oldTotalStars) {
      // อัปเดต cache และดึง rank (ใช้ updatedAt เก่าก่อนอัปเดต)
      try {
        const cacheResult = await RankingCacheService.updateUserCache(userId, totalScore, totalStars, oldUpdatedAt);
        rankingPosition = cacheResult.rank;
      } catch (err) {
        console.error('Failed to update ranking cache:', err);
        // Fallback: คำนวณ rank เองถ้า cache fail
        rankingPosition = await prisma.profile.count({
          where: {
            totalScore: { gt: totalScore }
          }
        }) + 1;
      }
    } else {
      // ถ้าคะแนนไม่เปลี่ยน ให้ดึง rank จาก cache ที่มีอยู่
      const existingCache = await prisma.rankingCache.findUnique({
        where: { userId },
        select: { rank: true }
      });

      if (existingCache) {
        rankingPosition = existingCache.rank;
      } else {
        // ถ้ายังไม่มี cache ให้สร้างใหม่
        try {
          const cacheResult = await RankingCacheService.updateUserCache(userId, totalScore, totalStars, oldUpdatedAt);
          rankingPosition = cacheResult.rank;
        } catch (err) {
          console.error('Failed to create ranking cache:', err);
          // Fallback: คำนวณ rank เองถ้า cache fail
          rankingPosition = await prisma.profile.count({
            where: {
              totalScore: { gt: totalScore }
            }
          }) + 1;
        }
      }
    }

    await prisma.profile.upsert({
      where: { userId: userId },
      update: {
        totalScore: totalScore,
        totalStars: totalStars,
        currentRank: rankingPosition,
        updatedAt: new Date()
      },
      create: {
        userId: userId,
        totalScore: totalScore,
        totalStars: totalStars,
        currentRank: rankingPosition,
      }
    });

    // 6. อัปเดต Streak (async - ไม่ต้องรอ)
    // อัปเดต streak เมื่อ user submit level
    streaksService.updateStreak(userId)
      .catch(err => {
        console.error('Failed to update streak:', err);
        // ไม่ throw error เพื่อไม่ให้กระทบ flow หลัก
      });

    return {
      success: true,
      earnedScore: score,
      totalScore: totalScore,
      rank: newRankInfo.name,
      rankLabel: newRankInfo.label
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
          }
        }
      }
    });

    return leaderboard.map((player, index) => {
      const rankInfo = calculateRank(player.totalScore);

      return {
        rank: index + 1,
        userId: player.userId,
        name: player.playerName || player.user.name || "Unknown Hero",
        icon: player.icon,

        totalScore: player.totalScore,
        totalStars: player.totalStars,

        tier: rankInfo.name,
        tierLabel: rankInfo.label,
        tierIcon: rankInfo.icon
      };
    });
  },

  // =========================================
  // ฟังก์ชันที่ 4: ดึงด่านล่าสุดที่เล่น (Last Stage)
  // =========================================
  async getLastStage(userId) {
    const lastStage = await prisma.lastStage.findUnique({
      where: { userId },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            orderIndex: true
          }
        },
        level: {
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

    if (!lastStage) {
      return null;
    }

    return {
      chapterId: lastStage.chapterId,
      levelId: lastStage.levelId,
      score: lastStage.score,
      stars: lastStage.stars,
      updatedAt: lastStage.updatedAt,
      chapter: lastStage.chapter,
      level: lastStage.level
    };
  }

};

export default GameService;