// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();
import prisma from "../lib/prismaClient.js"

function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isNextDay(d1, d2) {
  // สร้าง new Date เพื่อไม่ให้ modify original date
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  date1.setHours(0, 0, 0, 0);
  date2.setHours(0, 0, 0, 0);
  const diff = date1.getTime() - date2.getTime();
  return diff === 24 * 60 * 60 * 1000; // 1 วัน
}

async function updateStreak(userId) {
  let streak = await prisma.streak.findUnique({ where: { userId } });
  const now = new Date();

  let current = 1;
  let longest = 1;

  if (!streak) {
    // สร้าง streak ใหม่
    streak = await prisma.streak.create({
      data: {
        userId,
        current: 1,
        longest: 1,
        lastActiveDate: now,
      },
    });
    current = 1;
    longest = 1;
  } else {
    // ตรวจสอบว่าเล่นวันเดียวกันหรือไม่
    if (streak.lastActiveDate && isSameDay(now, streak.lastActiveDate)) {
      // เล่นวันเดียวกัน → ไม่อัปเดต แต่ต้อง sync Profile
      current = streak.current;
      longest = streak.longest;
    } else {
      // ตรวจสอบว่าเป็นวันถัดไปหรือไม่
      if (streak.lastActiveDate && isNextDay(now, streak.lastActiveDate)) {
        // วันถัดไป → เพิ่ม streak
        current = streak.current + 1;
      } else {
        // ข้ามวัน → reset streak
        current = 1;
      }
      
      longest = Math.max(current, streak.longest);

      // อัปเดต Streak table
      streak = await prisma.streak.update({
        where: { userId },
        data: {
          current,
          longest,
          lastActiveDate: now,
        },
      });
    }
  }

  // Sync กับ Profile.currentStreak และ Profile.longestStreak
  await prisma.profile.upsert({
    where: { userId },
    update: {
      currentStreak: current,
      longestStreak: longest,
      updatedAt: new Date()
    },
    create: {
      userId,
      currentStreak: current,
      longestStreak: longest
    }
  });

  return streak;
}

async function getStreak(userId) {
  return prisma.streak.findUnique({ where: { userId } });
}

export default {
  updateStreak,
  getStreak,
};
