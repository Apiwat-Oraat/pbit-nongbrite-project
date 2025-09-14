import productController from '../controllers/product.Controller.js';

const productRoutes = (router) => {
  router.get('/products', productController.getAllProducts);
  router.post('/createproduct', productController.createProduct);
}

export default productRoutes;