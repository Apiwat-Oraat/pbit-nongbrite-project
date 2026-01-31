// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();
import prisma from "../lib/prismaClient.js"
import RankingCacheService from "./rankingCacheService.js"

const userService = {
  /**
   * ดึงข้อมูล profile ของ user
   * @param {number} userId - User ID
   * @returns {Object} User และ Profile
   */
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        rankingCache: {
          select: {
            rank: true
          }
        }
      }
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Sync currentRank จาก RankingCache (realtime)
    if (user.rankingCache && user.profile) {
      const cacheRank = user.rankingCache.rank;
      
      // อัปเดต Profile.currentRank ถ้าไม่ตรงกับ RankingCache
      if (user.profile.currentRank !== cacheRank) {
        await prisma.profile.update({
          where: { userId },
          data: { currentRank: cacheRank }
        });
        user.profile.currentRank = cacheRank;
      }
    } else if (user.profile && !user.rankingCache) {
      // ถ้ายังไม่มี RankingCache ให้สร้างใหม่
      try {
        const cacheResult = await RankingCacheService.updateUserCache(
          userId, 
          user.profile.totalScore,
          user.profile.totalStars,
          user.profile.updatedAt
        );
        
        // อัปเดต Profile.currentRank
        await prisma.profile.update({
          where: { userId },
          data: { currentRank: cacheResult.rank }
        });
        user.profile.currentRank = cacheResult.rank;
      } catch (err) {
        console.error('Failed to sync ranking:', err);
        // ไม่ throw error เพื่อไม่ให้กระทบการดึง profile
      }
    }

    return user;
  },

  /**
   * อัปเดตข้อมูล profile ของ user
   * @param {number} userId - User ID
   * @param {Object} data - ข้อมูลที่จะอัปเดต { name?, age?, gender?, icon? }
   * @returns {Object} User และ Profile ที่อัปเดตแล้ว
   */
  async updateProfile(userId, data) {
    const { name, age, gender, icon } = data;

    // สร้าง object สำหรับอัปเดต User
    const userUpdateData = {};
    if (name !== undefined) userUpdateData.name = name;
    if (age !== undefined) userUpdateData.age = age;
    if (gender !== undefined) userUpdateData.gender = gender;

    // สร้าง object สำหรับอัปเดต Profile
    const profileUpdateData = {};
    if (icon !== undefined) profileUpdateData.icon = icon;
    // ถ้า name เปลี่ยน ให้อัปเดต playerName ใน Profile ด้วย
    if (name !== undefined) profileUpdateData.playerName = name;

    // อัปเดต User (ถ้ามีข้อมูลที่จะอัปเดต)
    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userUpdateData
      });
    }

    // อัปเดต Profile (ถ้ามีข้อมูลที่จะอัปเดต)
    if (Object.keys(profileUpdateData).length > 0) {
      await prisma.profile.upsert({
        where: { userId },
        update: profileUpdateData,
        create: {
          userId,
          ...profileUpdateData
        }
      });
    }

    // ดึงข้อมูลล่าสุด
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    return updatedUser;
  }
  
}


export default userService;