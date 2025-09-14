import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

const productService = {
  getAllProducts: async () => {
  return await prisma.product.findMany();
},
  createProduct: async ({ name, description, price }) => {
    return await prisma.product.create({
      data: { name, description, price },
    });
  }
};


export default productService;