import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

const productService = {
  getAllProducts: async () => {
  return await prisma.product.findMany();
}
};


export default productService;