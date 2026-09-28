import orderModel from "../models/order.model.js";
import { placeOrder } from "../services/order.services.js";
export async function createOrder(req, res) {
    try {
        const {
            fullName,
            phone,
            address,
            city,
            state,
            pincode,
            paymentMethod
        } = req.body;
        if (paymentMethod !== "COD") {
            return res.status(400).json({
                message: "Online payment must be completed through payment endpoint"
            });
        }
        const order = await placeOrder({
            userId: req.user.id,
            shippingAddress: {
                fullName,
                phone,
                address,
                city,
                state,
                pincode
            },
            paymentMethod,
            paymentStatus: "PENDING"
        });

        return res.status(201).json({
            message: "Order placed successfully",
            order
        });

    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || "Internal Server Error"
        });
    }
}

export async function getAllOrders(req, res) {
    try {
        const orders = await orderModel.find({ user: req.user.id });

        return res.status(200).json({
            message: "All orders",
            orders
        })
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }

}

export async function getOrderById(req, res) {
    try {
        const id = req.params.id;

        const order = await orderModel.findOne({ _id: id, user: req.user.id });
        if (!order) {
            return res.status(404).json({
                message: "Order does not found"
            })
        }
        return res.status(200).json({
            order
        })
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }

}

export async function cancelOrder(req, res) {
    try {
        const id = req.params.id;

        const order = await orderModel.findOne({ _id: id, user: req.user.id });
        if (!order) {
            return res.status(404).json({
                message: "Order does not found"
            })
        }
        order.orderStatus = "CANCELED"
        order.save();
        return res.status(200).json({
            message: "Order canceled sucessfully",
            order
        })
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
    
} 