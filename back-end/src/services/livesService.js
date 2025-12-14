import prisma from "../lib/prismaClient.js";

// ค่าคงที่ (ถ้าอนาคตเปลี่ยนจาก 5 → 10 lives, ปรับตรงนี้)
const MAX_LIVES = 5;

/**
 * ดึงข้อมูลหัวใจของ user
 */
async function getLives(userId) {
  let life = await prisma.life.findUnique({
    where: { userId },
  });

  if (!life) {
    // ถ้ายังไม่มี record lives → สร้างใหม่
    life = await prisma.life.create({
      data: {
        userId,
        current: MAX_LIVES,
        max: MAX_LIVES,
      },
    });
  }

  // เช็คว่า reset วันใหม่หรือยัง
  const now = new Date();
  const lastReset = life.lastResetAt;

  if (!lastReset || !isSameDay(now, lastReset)) {
    life = await prisma.life.update({
      where: { userId },
      data: {
        current: MAX_LIVES,
        lastResetAt: now,
      },
    });
  }

  return {
    current: life.current,
    max: life.max,
    lastResetAt: life.lastResetAt,
  };
}

/**
 * ใช้หัวใจ 1 ดวง
 */
async function useLife(userId) {

  const life = await getLives(userId);

  if (life.current <= 0) {
    throw new Error("NO_LIVES_LEFT");
  }

  const updated = await prisma.life.update({
    where: { userId },
    data: {
      current: life.current - 1,
    },
  });

  return {
    current: updated.current,
    max: updated.max,
    lastResetAt: updated.lastResetAt,
  }
}


/**
 * รีเซ็ตหัวใจ (force reset เช่น admin หรือกรณีพิเศษ)
 */
async function resetLives(userId) {
  let life = await prisma.life.findUnique({
    where: { userId },
  });

  if (!life) {
    // ถ้า user นี้ยังไม่มี lives → สร้างใหม่พร้อม reset เลย
    life = await prisma.life.create({
      data: {
        userId,
        current: MAX_LIVES,
        max: MAX_LIVES,
        lastResetAt: new Date(),
      },
    });
  } else {
    // ถ้ามีแล้ว → reset ให้เต็ม
    life = await prisma.life.update({
      where: { userId },
      data: {
        current: MAX_LIVES,
        lastResetAt: new Date(),
      },
    });
  }

  return {
    current: life.current,
    max: life.max,
    lastResetAt: life.lastResetAt,
  };
}

/**
 * helper: เช็คว่าวันเดียวกันหรือไม่
 */
function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export default {
  getLives,
  useLife,
  resetLives,
};
