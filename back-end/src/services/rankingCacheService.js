import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * RankingCache Service
 * จัดการ cache ของ ranking เพื่อเพิ่มประสิทธิภาพการดึง leaderboard
 */
const RankingCacheService = {
  
  /**
   * อัปเดต cache ของ user หนึ่งคน
   * เรียกใช้เมื่อ user submit level หรือคะแนนเปลี่ยน
   */
  async updateUserCache(userId, totalScore) {
    // คำนวณ rank จาก totalScore
    // Rank = จำนวนคนที่มีคะแนนมากกว่า + 1
    const rank = await prisma.profile.count({
      where: {
        totalScore: { gt: totalScore }
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

    // ดึง profiles ทั้งหมดเรียงตามคะแนน
    const profiles = await prisma.profile.findMany({
      orderBy: { totalScore: 'desc' },
      select: {
        userId: true,
        totalScore: true
      }
    });

    console.log(`📊 Found ${profiles.length} profiles to cache`);

    // อัปเดต cache ทีละ batch (เพื่อไม่ให้ database overload)
    const batchSize = 100;
    let processed = 0;

    for (let i = 0; i < profiles.length; i += batchSize) {
      const batch = profiles.slice(i, i + batchSize);
      
      const updatePromises = batch.map((profile, index) => {
        const rank = i + index + 1; // Rank = position ใน array + 1
        return prisma.rankingCache.upsert({
          where: { userId: profile.userId },
          update: {
            rank,
            points: profile.totalScore,
            lastUpdated: new Date()
          },
          create: {
            userId: profile.userId,
            rank,
            points: profile.totalScore
          }
        });
      });

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

