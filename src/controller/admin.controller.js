import  client from "../config/redis.js";
import orderModel from "../models/order.model.js";
import productModel from "../models/product.model.js";
import userModel from "../models/user.model.js";
import mongoose from "mongoose";

/* ==================== DASHBOARD ==================== */

export async function getDashboard(req, res) {
    try {
        const cacheDashBoard = await client.get(`dashboard`)
        if (cacheDashBoard) {
            const dash = JSON.parse(cacheDashBoard)
            return res.status(200).json({
                totalOrders: dash.totalOrders,
                totalUser: dash.totalUser,
                totalProducts: dash.totalProducts,
                totalRevenue: dash.totalRevenue
            })
        }
        const totalOrders = await orderModel.countDocuments();
        const totalUser = await userModel.countDocuments();
        const totalProducts = await productModel.countDocuments();
        const totalRevenue = await orderModel.aggregate([
            {
                $match: {
                    orderStatus: "DELIVERED"
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalAmount" }
                }
            }

        ])
        const dashboard = {
            totalOrders,
            totalProducts,
            totalUser,
            totalRevenue: totalRevenue[0]?.totalRevenue || 0
        }
        await client.set("dashboard", JSON.stringify(dashboard), {
            ex: 300
        });
        return res.status(200).json({
            totalOrders,
            totalUser,
            totalProducts,
            totalRevenue: totalRevenue[0]?.totalRevenue || 0
        })

    } catch (err) {
        console.log(err);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

/* ==================== ORDERS ==================== */

export async function getOrder(req, res) {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;

        const skip = (page - 1) * limit;
        const totalOrders = await orderModel.countDocuments();
        const orders = await orderModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
        return res.status(200).json({
            message: "All orders :",
            orders,
            pagination: {
                page,
                limit,
                totalOrders,
                totalPages: Math.ceil(totalOrders / limit)
            }
        })
    } catch (err) {
        console.log(err);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }

}

export async function getSingleOrder(req, res) {
    try {
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Order id"
            });
        }
        const order = await orderModel.findById(id);
        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            })
        }
        return res.status(200).json({
            message: "Order found :",
            order
        })
    } catch (err) {
        console.log(err);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }

}

export async function updateOrderStatus(req, res) {
    try {
        const id = req.params.id;
        const { status } = req.body;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Order id"
            });
        }
        const allowedFields = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELED"];
        if (!allowedFields.includes(status)) {
            return res.status(400).json({
                message: "Invalid order status"
            });
        }
        const order = await orderModel.findById(id);
        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            })
        }
        order.orderStatus = status;
        await order.save();
        return res.status(200).json({
            message: "Order status updated successfully",
            order
        })
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }

}

/* ==================== USERS ==================== */

export async function getAllUsers(req, res) {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const users = await userModel.find().limit(limit).skip(skip).sort({ createdAt: -1 }).select("-password -refreshToken");
        const totalUsers = await userModel.countDocuments();
        return res.status(200).json({
            message: "All users :",
            users,
            pagination: {
                page,
                limit,
                totalUsers,
                totalPages: Math.ceil(totalUsers / limit)
            }
        })
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

export async function getUser(req, res) {
    try {
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid User id"
            });
        }
        const user = await userModel.findById(id).select("-password -refreshToken");
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        return res.status(200).json({
            message: "User fetched successfully",
            user
        })
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

export async function changeUserStatus(req, res) {
    try {
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid User id"
            });
        }
        const { isBlocked } = req.body;
        if (typeof isBlocked !== "boolean") {
            return res.status(400).json({
                message: "isBlocked must be a boolean"
            });
        }
        const user = await userModel.findById(id);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        user.isBlocked = isBlocked;
        await user.save();
        return res.status(200).json({
            message: "User status changed successfully",
            isBlocked: user.isBlocked
        })

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
} 