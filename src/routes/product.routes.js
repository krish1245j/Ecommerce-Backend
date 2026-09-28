import { Router } from "express";
import upload from "../middleware/multer.middleware.js";
import isAdmin from "../middleware/isAdmin.middleware.js";
import verifyJwt from "../middleware/verifyjwt.js";
import * as productController from "../controller/products.controller.js"
const productRouter=Router();

productRouter.post("/products",verifyJwt,isAdmin,upload.single("image"),productController.createProducts);
productRouter.get("/products",productController.getProducts);
productRouter.get("/products/:id",productController.getProductById);
productRouter.patch("/products/:id", verifyJwt, isAdmin, upload.single("image"), productController.updateProduct);
productRouter.delete("/products/:id", verifyJwt, isAdmin, productController.deleteProduct);
export default productRouter;