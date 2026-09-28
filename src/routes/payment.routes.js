import {Router} from "express"
import verifyJwt from "../middleware/verifyjwt.js";
import * as paymentController from "../controller/payment.controller.js";
const paymentRouter=Router();

paymentRouter.post("/create-order",verifyJwt,paymentController.createRazorpayOrder);
paymentRouter.post("/verify",verifyJwt,paymentController.verifyPayment);

export default paymentRouter;