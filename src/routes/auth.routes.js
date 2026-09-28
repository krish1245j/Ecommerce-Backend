import { Router } from "express";
import * as authController from "../controller/auth.controller.js" 
import verifyJwt from "../middleware/verifyjwt.js";
const authRouter = Router();

authRouter.post("/register",authController.register)
authRouter.get("/getMe",verifyJwt,authController.getMe)
authRouter.post("/login",authController.loginUser)
authRouter.post("/refresh",authController.refreshTokens)
authRouter.post("/logout",authController.logoutUser)
export default authRouter;