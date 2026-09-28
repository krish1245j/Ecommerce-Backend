import jwt from "jsonwebtoken";
import config from "../config/config.js";
import userModel from "../models/user.model.js";
export async function verifyJwt(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            message: "Token is required"
        })
    }
    let decoded;
    try {
        decoded = jwt.verify(token, config.JWT_SECRET);
        const user=await userModel.findById(decoded.id);
        if(!user){
            return res.status(401).json({
                message:"User does not found"
            })
        }
        if(user.isBlocked){
            return res.status(403).json({
                message:"User is blocked"
            })
        }
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }

}

export default verifyJwt;