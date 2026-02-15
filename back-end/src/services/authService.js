
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import tokenService from "./tokenService.js";
import emailService from "./emailService.js";
import crypto from "crypto";
import prisma from "../lib/prismaClient.js"
import { platform } from "os";
// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();




const AuthService = {
  async login(username, password) {

    const user = await prisma.user.findUnique({
      where: { username },
      include: { profile: true, streaks: true, userStats: true },
    });

    if (!user) throw new Error("User not found");

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error("Invalid password");

    // Generate token
    const payload = { userId: user.id, username: user.username, role: user.role };
    const accessToken = tokenService.generateAccessToken(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        gender: user.gender,
        createdAt: user.createdAt,
        profile: {
          playerName: user.profile.playerName,
          icon: user.profile.icon,
          totalScore: user?.userStats?.totalScore || 0,
          currentRank: user.profile.currentRank,
          totalStars: user?.userStats?.totalStars || 0
        },
        streaks: {
          currentStreak: user.streaks.current,
          longestStreak: user.streaks.longest
        }
      },
    };
  },

  async logout() {
    // Logout logic - no refreshToken needed
    return;
  },

  async registerStep1(username, email, password, confirmPassword) {

    if (password !== confirmPassword) {
      throw new Error("Passwords do not match");
    }

    const existUsername = await prisma.user.findUnique({
      where: { username }
    });

    if (existUsername) {
      throw new Error("Username already exists");
    }

    const existEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (existEmail) {
      throw new Error("Email already exists");
    }

    const hash = await bcrypt.hash(password, 10);

    const token = tokenService.generateRegisterToken({
      username,
      email,
      password: hash
    }, "15m");


    return token;
  },

  async registerStep2(registerToken, name, age, gender) {
    const payload = tokenService.verifyRegisterToken(registerToken);

    const newUser = await prisma.user.create({
      data: {
        username: payload.username,
        email: payload.email,
        password: payload.password,
        name,
        age,
        gender,
        profile: {
          create: { playerName: name },
        },
        userStats: {
          create: { totalScore: 0, totalStars: 0 }
        }
      },
      include: { profile: true, userStats: true },
    });

    return {
      userId: newUser.id,
      username: newUser.username,
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

    const resetPin = crypto.randomInt(100000, 999999).toString();
    const hashedPin = await bcrypt.hash(resetPin, 10);
    const resetExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 นาที

    try {

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPin: hashedPin,
          resetExpire
        }
      });

      await emailService.sendResetPinEmail(email, resetPin);
    } catch (error) {
      console.error("Forgot Password Error:", error);

      const err = new Error("Unable to process request");
      err.name = "ServiceError";
      throw err;
    }
  },


  async resetPassword(email, resetPin, newPassword) {

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.resetPin || !user.resetExpire) {
      throw new Error("No reset request");
    }

    if (new Date() > user.expiresAt) {
      throw new Error("PIN expired");
    }

    const isMatch = await bcrypt.compare(resetPin, user.resetPin);

    if (!isMatch) {
      throw new Error("Invalid PIN");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPin: null,
        resetExpire: null
      }
    });

    return {
      success: true,
      message: "Password reset success"
    }
  }


};




export default AuthService;
