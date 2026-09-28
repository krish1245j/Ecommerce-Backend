import { Router } from "express";
import * as cartController from "../controller/cart.controller.js"
import verifyJwt from "../middleware/verifyjwt.js";

const cartRouter=Router();

cartRouter.get("/items",verifyJwt,cartController.getCart);
cartRouter.post("/items",verifyJwt,cartController.addItem);
cartRouter.patch("/items/:productId",verifyJwt,cartController.updateCart);
cartRouter.delete("/items/:productId",verifyJwt,cartController.deleteCartItem);
cartRouter.delete("/items",verifyJwt,cartController.deleteCart);

export default cartRouter; 