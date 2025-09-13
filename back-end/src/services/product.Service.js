import {PrismaClient} from '../generated/prisma/index.js';

const prisma = new PrismaClient();

const productService = {
  getAllProducts: async () => {
  return await prisma.product.findMany();
}
};


export default productService;