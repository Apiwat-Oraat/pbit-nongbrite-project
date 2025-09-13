import productController from '../controllers/product.Controller.js';

const productRoutes = (router) => {
  router.get('/products', productController.getAllProducts);
}

export default productRoutes;