import prisma from "../lib/prismaClient.js";

/**
 * RankingCache Service
 * จัดการ cache ของ ranking เพื่อเพิ่มประสิทธิภาพการดึง leaderboard
 */
const RankingCacheService = {

  /**
   * อัปเดต cache ของ user หนึ่งคน
   * เรียกใช้เมื่อ user submit level หรือคะแนนเปลี่ยน
   */
  async updateUserCache(userId, totalScore, totalStars = null, updatedAt = null) {
    // คำนวณ rank ให้ตรงกับ leaderboard logic
    // Leaderboard เรียงตาม: totalScore DESC, totalStars DESC, updatedAt ASC

    // ดึง profile ของ user นี้เพื่อเอา totalStars และ updatedAt (ถ้ายังไม่ได้ส่งมา)
    let userTotalStars = totalStars;
    let userUpdatedAt = updatedAt;

    if (userTotalStars === null || userUpdatedAt === null) {
      const userStats = await prisma.userStats.findUnique({
        where: { userId },
        select: {
          totalStars: true,
          updatedAt: true
        }
      });

      if (!userStats) {
        throw new Error("UserStats not found");
      }

      if (userTotalStars === null) {
        userTotalStars = userStats.totalStars;
      }
      if (userUpdatedAt === null) {
        userUpdatedAt = userStats.updatedAt;
      }
    }

    // นับคนที่อยู่เหนือ user นี้ตาม leaderboard logic
    // คนที่อยู่เหนือ = totalScore มากกว่า หรือ totalScore เท่ากันแต่ totalStars มากกว่า หรือ totalScore และ totalStars เท่ากันแต่ updatedAt ก่อนหน้า
    const rank = await prisma.userStats.count({
      where: {
        OR: [
          { totalScore: { gt: totalScore } },
          {
            AND: [
              { totalScore: totalScore },
              { totalStars: { gt: userTotalStars } }
            ]
          },
          {
            AND: [
              { totalScore: totalScore },
              { totalStars: userTotalStars },
              { updatedAt: { lt: userUpdatedAt } }
            ]
          }
        ]
      }
    }) + 1;

    // Upsert cache
    await prisma.rankingCache.upsert({
      where: { userId },
      update: {
        rank,
        points: totalScore,
        lastUpdated: new Date()
      },
      create: {
        userId,
        rank,
        points: totalScore
      }
    });

    return { rank, points: totalScore };
  },

  /**
   * อัปเดต rank ของทุกคนที่ได้รับผลกระทบ
   * เมื่อ user หนึ่งคนได้คะแนนเพิ่มขึ้น อาจทำให้ rank ของคนอื่นเปลี่ยน
   */
  async updateAffectedRanks(newScore, oldScore = 0) {
    // หา range ของคะแนนที่ได้รับผลกระทบ
    const minScore = Math.min(newScore, oldScore);
    const maxScore = Math.max(newScore, oldScore);

    // ดึง users ที่มีคะแนนอยู่ใน range นี้
    const affectedUsers = await prisma.userStats.findMany({
      where: {
        totalScore: {
          gte: minScore,
          lte: maxScore
        }
      },
      select: {
        userId: true,
        totalScore: true
      }
    });

    // อัปเดต cache ของทุกคนที่ได้รับผลกระทบ
    const updatePromises = affectedUsers.map(profile =>
      this.updateUserCache(profile.userId, profile.totalScore)
    );

    await Promise.all(updatePromises);
  },

  /**
   * ดึง leaderboard จาก cache (เร็วกว่า query Profile)
   */
  async getLeaderboardFromCache(limit = 10) {
    const cachedLeaderboard = await prisma.rankingCache.findMany({
      take: limit,
      orderBy: [
        { points: 'desc' },
        { lastUpdated: 'asc' }
      ],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            // avatar: true // removed from User model based on earlier checks, checking profile instead
          }
        }
      }
    });

    // Need profiles for name/icon
    const userIds = cachedLeaderboard.map(c => c.userId);
    const profiles = await prisma.profile.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, playerName: true, icon: true }
    });
    const profileMap = new Map(profiles.map(p => [p.userId, p]));

    return cachedLeaderboard.map((cache, index) => {
      const profile = profileMap.get(cache.userId);
      return {
        rank: index + 1,
        cacheRank: cache.rank,
        userId: cache.userId,
        name: profile?.playerName || cache.user.name || "Unknown Hero",
        avatar: profile?.icon,
        totalScore: cache.points,
        lastUpdated: cache.lastUpdated
      };
    });
  },

  /**
   * ดึง rank ของ user หนึ่งคนจาก cache
   */
  async getUserRank(userId) {
    const cache = await prisma.rankingCache.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            name: true,
          }
        }
      }
    });

    if (!cache) {
      // ถ้ายังไม่มี cache ให้สร้างใหม่
      const userStats = await prisma.userStats.findUnique({
        where: { userId }
      });

      if (!userStats) return null;

      const updated = await this.updateUserCache(userId, userStats.totalScore);

      const profile = await prisma.profile.findUnique({ where: { userId } });

      return {
        rank: updated.rank,
        points: updated.points,
        user: {
          name: profile?.playerName || profile?.user?.name,
          displayName: profile?.playerName,
          avatar: profile?.icon
        }
      };
    }

    const profile = await prisma.profile.findUnique({ where: { userId } });

    return {
      rank: cache.rank,
      points: cache.points,
      lastUpdated: cache.lastUpdated,
      user: {
        name: profile?.playerName || cache.user.name,
        displayName: profile?.playerName,
        avatar: profile?.icon
      }
    };
  },

  /**
   * Rebuild cache ทั้งหมด (ใช้เมื่อต้องการ sync ใหม่ทั้งหมด)
   * ควรเรียกใช้เป็น background job หรือ cron job
   */
  async rebuildAllCache() {
    console.log('🔄 Starting to rebuild ranking cache...');

    // ดึง profiles ทั้งหมดพร้อม totalStars และ updatedAt
    const allUserStats = await prisma.userStats.findMany({
      orderBy: [
        { totalScore: 'desc' },
        { totalStars: 'desc' },
        { updatedAt: 'asc' }
      ],
      select: {
        userId: true,
        totalScore: true,
        totalStars: true,
        updatedAt: true
      }
    });

    console.log(`📊 Found ${allUserStats.length} profiles to cache`);

    // อัปเดต cache ทีละ batch (เพื่อไม่ให้ database overload)
    const batchSize = 100;
    let processed = 0;

    for (let i = 0; i < allUserStats.length; i += batchSize) {
      const batch = allUserStats.slice(i, i + batchSize);

      // ใช้ updateUserCache เพื่อคำนวณ rank ที่ถูกต้อง
      const updatePromises = batch.map(stats =>
        this.updateUserCache(stats.userId, stats.totalScore, stats.totalStars, stats.updatedAt)
      );

      await Promise.all(updatePromises);
      processed += batch.length;
      console.log(`✅ Processed ${processed}/${allUserStats.length} profiles`);
    }

    console.log('✨ Ranking cache rebuild completed!');
    return { totalProcessed: processed };
  },

  /**
   * ลบ cache ของ user (ใช้เมื่อลบ user)
   */
  async deleteUserCache(userId) {
    await prisma.rankingCache.deleteMany({
      where: { userId }
    });
  }
};

export default RankingCacheService;
