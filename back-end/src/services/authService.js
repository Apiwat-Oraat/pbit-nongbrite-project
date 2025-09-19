
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import tokenService from "./tokenService.js";

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
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName ?? user.profile?.playerName,
        avatar: user.avatar ?? user.profile?.icon,
      },
      tokens: { accessToken, refreshToken },
    };
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
  }
};




export default AuthService;
