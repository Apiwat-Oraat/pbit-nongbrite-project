
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import tokenService from "./tokenService.js";
import emailService from "./emailService.js";
import crypto from "crypto";
import prisma from "../lib/prismaClient.js"
// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();




const AuthService = {
  async login(email, password) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) throw new Error("Invalid credentials");

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error("Invalid credentials");

    // Generate token
    const payload = { userId: user.id, role: user.role };
    const accessToken = tokenService.generateAccessToken(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        gender: user.gender,
        profile: {
          playerName: user.profile.playerName,
          icon: user.profile.icon,
          totalScore: user.profile.totalScore,
          currentRank: user.profile.currentRank,
          joinedDate: user.profile.joinedDate,
          currentStreak: user.profile.currentStreak,
          longestStreak: user.profile.longestStreak,
          totalStars: user.profile.totalStars
        }
      },
    };
  },

  async logout() {
    // Logout logic - no refreshToken needed
    return;
  },

  async registerStep1(email, password, confirmPassword) {
    if (password !== confirmPassword) throw new Error("Passwords do not match");

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error("Email already exists");

    const hashedPassword = await bcrypt.hash(password, 10);

    // สร้าง registration token เก็บ email + passwordHash (อายุสั้น)
    const token = tokenService.generateRegisterToken({ email, password: hashedPassword }, "15m");

    return token;
  },

  async registerStep2(registerToken, name, age, gender) {
    const payload = tokenService.verifyRegisterToken(registerToken);

    const newUser = await prisma.user.create({
      data: {
        email: payload.email,
        password: payload.password,
        name,
        age,
        gender,
        profile: {
          create: { playerName: name },
        },
      },
      include: { profile: true },
    });

    return {
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      age: newUser.age,
      gender: newUser.gender,
      profile: newUser.profile,
    };
  },


  async forgotPassword(email) {
    // 1. ค้นหา user
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new Error("Email not found in our system");
    }

    const pin = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 นาที

    try {
      await prisma.$transaction([
        prisma.resetToken.deleteMany({ where: { userId: user.id } }),
        prisma.resetToken.create({
          data: {
            userId: user.id,
            pin,
            expiresAt
          }
        })
      ]);

      await emailService.sendResetPinEmail(email, pin);
    } catch (error) {
      console.error("Forgot Password Error:", error);

      const err = new Error("Unable to process request");
      err.name = "ServiceError";
      throw err;
    }
  },


  async resetPassword(email, pin, newPassword) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("User not found");

    const resetToken = await prisma.resetToken.findFirst({
      where: {
        userId: user.id,
        pin,
        expiresAt: { gt: new Date() }
      },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new Error("Invalid or expired PIN");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    await prisma.resetToken.deleteMany({
      where: { userId: user.id }
    });
  }


};




export default AuthService;
