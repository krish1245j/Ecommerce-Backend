import app from "./src/app.js"
import { connectDb } from "./src/config/db.js";
import config from "./src/config/config.js";
app.listen(config.PORT,()=>{
    console.log("Server is running at localhost:3000");
})
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Ecommerce backend is running"
    });
});
console.log("JWT SECRET:", config.JWT_SECRET_R ? "FOUND" : "MISSING");
connectDb();  