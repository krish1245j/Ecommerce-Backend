import { Router } from "express";
import verifyJwt from "../middleware/verifyjwt.js";
import upload from "../middleware/multer.middleware.js";
import isAdmin from "../middleware/isAdmin.middleware.js";
import * as adminController from "../controller/admin.controller.js"
import * as productController from "../controller/products.controller.js"
const adminRouter = Router();
adminRouter.use(verifyJwt);
adminRouter.use(isAdmin);

/* ==================== DASHBOARD ==================== */

adminRouter.get("/dashboard",adminController.getDashboard);

/* ==================== ORDERS ==================== */

adminRouter.get("/orders", adminController.getOrder);
adminRouter.get("/orders/:id",adminController.getSingleOrder)
adminRouter.patch("/orders/:id/status",adminController.updateOrderStatus)

/* ==================== Products ==================== */

adminRouter.post("/products", upload.single("image"), productController.createProducts);
adminRouter.get("/products", productController.getProducts);
adminRouter.get("/products/:id", productController.getProductById);
adminRouter.patch("/products/:id", upload.single("image"), productController.updateProduct);
adminRouter.delete("/products/:id", productController.deleteProduct);

/* ==================== USERS ==================== */

adminRouter.get("/users",adminController.getAllUsers)
adminRouter.get("/users/:id",adminController.getUser)
adminRouter.patch("/users/:id/status",adminController.changeUserStatus)

export default adminRouter;