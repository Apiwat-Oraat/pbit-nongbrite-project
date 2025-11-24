
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import tokenService from "./tokenService.js";
import emailService from "./emailService.js";

const prisma = new PrismaClient();



const AuthService = {
  async login(email, password) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) throw new Error("Invalid credentials");

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error("Invalid credentials");

    // Generate tokens
    const payload = { userId: user.id, role: user.role };
    const accessToken = tokenService.generateAccessToken(payload);
    const refreshToken = tokenService.generateRefreshToken(payload);

    // Save refreshToken in DB
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        gender: user.gender,
        profile: user.profile
      },
    };
  },

  async logout(refreshToken) {
    await prisma.user.updateMany({
      where: { refreshToken: refreshToken },
      data: { refreshToken: null }
    })
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

  async refreshTokens(refreshToken) {
    try {
      const payload = tokenService.verifyRefreshToken(refreshToken);

      // สร้าง accessToken ใหม่
      const accessToken = tokenService.generateAccessToken({ userId: payload.userId });

      // Optional: rotate refresh token (เพิ่มความปลอดภัย)
      const newRefreshToken = tokenService.generateRefreshToken({ userId: payload.userId });

      return { accessToken, refreshToken: newRefreshToken };
    } catch (err) {
      throw new Error("Invalid or expired refresh token");
    }
  },

  async forgotPassword(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const err = new Error("User not found");
      err.name = "NotFoundError";
      throw err;
    }

    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    try {
      await prisma.resetToken.create({
        data: { userId: user.id, pin, expiresAt },
      });
    } catch (dbErr) {
      dbErr.name = "DatabaseError";
      throw dbErr;
    }

    try {
      await emailService.sendResetPinEmail(email, pin);
    } catch (mailErr) {
      mailErr.name = "EmailError";
      throw mailErr;
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

    await prisma.resetToken.delete({ where: { id: resetToken.id } });
  }
};




export default AuthService;
