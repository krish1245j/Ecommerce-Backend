import express from "express"
import morgan from "morgan"
import cookieParser from "cookie-parser"
import multer from "multer"
import authRouter from "./routes/auth.routes.js";
import productRouter from "./routes/product.routes.js";
import cartRouter from "./routes/cart.routes.js";
import transactionRouter from "./routes/transaction.routes.js";
import adminRouter from "./routes/admin.routes.js"
import cors from "cors";
import paymentRouter from "./routes/payment.routes.js";
import * as paymentController from "./controller/payment.controller.js"

const app = express();
app.use(cors({
    origin: ["http://localhost:5173",
        "https://ecommerce-frontend-smoky-two.vercel.app"],
    credentials: true
}));
app.post(
    "/api/payment/webhook",
    express.raw({ type: "application/json" }),
    paymentController.webhook
);
app.use(express.json());
app.use(cookieParser());


const upload = multer({ storage: multer.memoryStorage() })
app.use(morgan("dev"));
app.use("/api/auth", authRouter);
app.use("/api", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/transaction", transactionRouter);
app.use("/api/admin", adminRouter)
app.use("/api/payment", paymentRouter);
export default app;