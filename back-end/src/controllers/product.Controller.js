import productService from '../services/product.Service.js';


const productController = {
  getAllProducts: async (req, res) => {
    try {
      const products = await productService.getAllProducts();
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  },

  createProduct: async (req, res) => {
    const { name, description } = req.body;
    const price = parseFloat(req.body.price);

    try {
      const newProduct = await productService.createProduct({ name, description, price });
      res.status(200).json(newProduct, { message: 'Product created successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create product' });
    }
  },
};

export default productController;