import { Router } from "express";
import verifyJwt from "../middleware/verifyjwt.js";
import * as transactionController from "../controller/transaction.controller.js"
const transactionRouter=Router()

transactionRouter.post("/orders",verifyJwt,transactionController.createOrder)
transactionRouter.get("/orders",verifyJwt,transactionController.getAllOrders)
transactionRouter.get("/orders/:id",verifyJwt,transactionController.getOrderById)
transactionRouter.patch("/orders/:id",verifyJwt,transactionController.cancelOrder)


export default transactionRouter