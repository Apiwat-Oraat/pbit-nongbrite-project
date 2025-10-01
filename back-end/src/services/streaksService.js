import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isNextDay(d1, d2) {
  const diff = d1.setHours(0, 0, 0, 0) - d2.setHours(0, 0, 0, 0);
  return diff === 24 * 60 * 60 * 1000; // 1 วัน
}

async function updateStreak(userId) {
  let streak = await prisma.streak.findUnique({ where: { userId } });
  const now = new Date();

  if (!streak) {
    return prisma.streak.create({
      data: {
        userId,
        current: 1,
        longest: 1,
        lastActiveDate: now,
      },
    });
  }

  if (streak.lastActiveDate && isSameDay(now, streak.lastActiveDate)) {
    return streak; // เล่นวันเดียวกัน → ไม่อัปเดต
  }

  let current = 1;
  if (streak.lastActiveDate && isNextDay(now, streak.lastActiveDate)) {
    current = streak.current + 1;
  }

  const longest = Math.max(current, streak.longest);

  return prisma.streak.update({
    where: { userId },
    data: {
      current,
      longest,
      lastActiveDate: now,
    },
  });
}

async function getStreak(userId) {
  return prisma.streak.findUnique({ where: { userId } });
}

export default {
  updateStreak,
  getStreak,
};
