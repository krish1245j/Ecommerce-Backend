import config from "../config/config.js";
import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

function generateToken(user, res) {
    const accessToken = jwt.sign({
        id: user._id,
        role: user.role
    }, config.JWT_SECRET, {
        expiresIn: "15m"
    })

    const refreshToken = jwt.sign({
        id: user._id,
        role: user.role
    }, config.JWT_SECRET_R, {
        expiresIn: "7d"
    })
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    })
    return { accessToken, refreshToken };
}
export async function register(req, res) {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }
    if (password.length < 8) {
        return res.status(400).json({
            message: "Password must be at least 8 characters long"
        });
    }
    if (password !== password.trim()) {
        return res.status(400).json({
            message: "Password cannot start or end with spaces."
        });
    }
    const isAlreadyExist = await userModel.findOne(
        {
            $or: [
                { username },
                { email }
            ]
        }
    );
    if (isAlreadyExist) {
        return res.status(401).json({
            message: "User already exist"
        })
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
        username,
        email,
        password: hashedPassword
    })

    const { accessToken } = generateToken(user, res);


    res.status(201).json({
        message: "User created sucessfully",
        user: {
            username: user.username,
            email: user.email,
            accessToken
        }
    })

}

export async function getMe(req, res) {

    const user = await userModel.findById(req.user.id);
    if (!user) {
        return res.status(401).json({
            message: "User does not found"
        })
    }
    return res.status(200).json({
        message: "User fetched successfully",
        user: {
            username: user.username,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        }
    });

}
 
export async function loginUser(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(401).json({
            message: "email and password are required"
        })
    }
    if (password.length < 8) {
        return res.status(400).json({
            message: "Password must be at least 8 characters long"
        });
    }
    const user = await userModel.findOne({ email });
    if (!user) {
        return res.status(401).json({
            message: "User does not found"
        })
    }
 
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({
            message: "Password is incorrect"
        })
    }
    const { accessToken } = generateToken(user, res);
    return res.status(200).json({
        message: "User login successfully",
        user: {
            username: user.username,
            email: user.email,
            role: user.role,
        },
        accessToken: accessToken
    })
}

export async function refreshTokens(req, res) {
    const token = req.cookies.refreshToken;
    if (!token) {
        return res.status(401).json({
            message: "Token is required"
        })
    }
    let decoded;
    try {
        decoded = jwt.verify(token, config.JWT_SECRET);
    } catch (err) {
        console.log(err);
        return res.status(401).json({
            message: "Invalid or expired refresh token"
        })
    }


    const user = await userModel.findById(decoded.id);
    if (!user) {
        return res.status(401).json({
            message: "User does not found"
        })
    }
    const { accessToken, refreshToken } = generateToken(user, res);
    return res.status(200).json({
        message: "Token refreshed Successfully",
        accessToken
    })
}

export async function logoutUser(req, res) {
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
    });
    return res.status(200).json({
        message: "User logged out Scuccessfully"
    })
}   