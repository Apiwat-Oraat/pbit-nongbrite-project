import productService from '../services/product.Service.js';


const productController = {
  getAllProducts: async (req, res) => {
    try {
      const products = await productService.getAllProducts();
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch products' });
    }
}
};

export default productController;