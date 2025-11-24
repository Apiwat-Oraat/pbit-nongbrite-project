import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const userService = {
  async updateRefreshToken(userId, refreshToken) {
    return await prisma.user.update({
      where: {id: userId},
      data: {refreshToken},
    });
  }
  
}


export default userService;