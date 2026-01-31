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
      const userProfile = await prisma.profile.findUnique({
        where: { userId },
        select: {
          totalStars: true,
          updatedAt: true
        }
      });

      if (!userProfile) {
        throw new Error("Profile not found");
      }

      if (userTotalStars === null) {
        userTotalStars = userProfile.totalStars;
      }
      if (userUpdatedAt === null) {
        userUpdatedAt = userProfile.updatedAt;
      }
    }

    // นับคนที่อยู่เหนือ user นี้ตาม leaderboard logic
    // คนที่อยู่เหนือ = totalScore มากกว่า หรือ totalScore เท่ากันแต่ totalStars มากกว่า หรือ totalScore และ totalStars เท่ากันแต่ updatedAt ก่อนหน้า
    const rank = await prisma.profile.count({
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
    const affectedUsers = await prisma.profile.findMany({
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
            avatar: true,
            displayName: true
          }
        }
      }
    });

    return cachedLeaderboard.map((cache, index) => ({
      rank: index + 1, // Rank ใน leaderboard (1-10)
      cacheRank: cache.rank, // Rank จริงของ user (อาจมากกว่า 10)
      userId: cache.userId,
      name: cache.user.displayName || cache.user.name || "Unknown Hero",
      avatar: cache.user.avatar,
      totalScore: cache.points,
      lastUpdated: cache.lastUpdated
    }));
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
            displayName: true,
            avatar: true
          }
        }
      }
    });

    if (!cache) {
      // ถ้ายังไม่มี cache ให้สร้างใหม่
      const profile = await prisma.profile.findUnique({
        where: { userId }
      });

      if (!profile) return null;

      const updated = await this.updateUserCache(userId, profile.totalScore);
      return {
        rank: updated.rank,
        points: updated.points,
        user: {
          name: profile.user?.name,
          displayName: profile.user?.displayName,
          avatar: profile.user?.avatar
        }
      };
    }

    return {
      rank: cache.rank,
      points: cache.points,
      lastUpdated: cache.lastUpdated,
      user: cache.user
    };
  },

  /**
   * Rebuild cache ทั้งหมด (ใช้เมื่อต้องการ sync ใหม่ทั้งหมด)
   * ควรเรียกใช้เป็น background job หรือ cron job
   */
  async rebuildAllCache() {
    console.log('🔄 Starting to rebuild ranking cache...');

    // ดึง profiles ทั้งหมดพร้อม totalStars และ updatedAt
    const profiles = await prisma.profile.findMany({
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

    console.log(`📊 Found ${profiles.length} profiles to cache`);

    // อัปเดต cache ทีละ batch (เพื่อไม่ให้ database overload)
    const batchSize = 100;
    let processed = 0;

    for (let i = 0; i < profiles.length; i += batchSize) {
      const batch = profiles.slice(i, i + batchSize);
      
      // ใช้ updateUserCache เพื่อคำนวณ rank ที่ถูกต้อง
      const updatePromises = batch.map(profile => 
        this.updateUserCache(profile.userId, profile.totalScore, profile.totalStars, profile.updatedAt)
      );

      await Promise.all(updatePromises);
      processed += batch.length;
      console.log(`✅ Processed ${processed}/${profiles.length} profiles`);
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

