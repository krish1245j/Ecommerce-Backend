import createRazorPayInstance from "../config/razorpay.config.js";
import cartModel from "../models/cart.model.js";
import { getSubTotal } from "../../utils/cart.utils.js";
import crypto from "crypto";
import config from "../config/config.js";
import paymentModel from "../models/tempPayment.model.js";
import { processSuccessfulPayment } from "../services/payment.services.js";
const razorpay = createRazorPayInstance();
export async function createRazorpayOrder(req, res) {
    try {
        const {
            fullName,
            phone,
            address,
            city,
            state,
            pincode
        } = req.body;
        const cart = await cartModel.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({
                message: "Cart Not Found"
            })
        }
        await cart.populate({
            path: "items.product",
            select: "pname price image stock"
        });
        if (cart.items.length === 0) {
            return res.status(400).json({
                message: "Cart is empty"
            });
        }
        for (const item of cart.items) {
            if (item.quantity > item.product.stock) {
                return res.status(400).json({
                    message: `Insufficient stock for ${item.product.pname}`
                });
            }
        }

        const totalAmount = getSubTotal(cart);
        const razorpayOrder = await razorpay.orders.create({
            amount: totalAmount * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                userId: req.user.id,
            }
        });
        await paymentModel.create({
            user: req.user.id,
            razorpayOrderId: razorpayOrder.id,
            amount: totalAmount,
            shippingAddress: {
                fullName,
                phone,
                address,
                city,
                state,
                pincode
            },
            status: "CREATED"
        })
        return res.status(200).json({
            razorpayOrder,
            key: config.RAZORPAY_API_KEY
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error Occured While Doing Paymnet"
        })
    }
}

export async function verifyPayment(req, res) {
    try {
        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
        } = req.body;
        const body =
            razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", config.RAZORPAY_SECRET)
            .update(body)
            .digest("hex");
        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                message: "Payment verification failed"
            });
        }
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        const order = await processSuccessfulPayment({
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpayAmount:payment.amount
        });
        return res.status(200).json({
            message: "Payment Is Verified",
            order
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error Occured While Doing Paymnet"
        })
    }
}

export async function webhook(req, res) {
    try {
        const webhookSignature =
            req.headers["x-razorpay-signature"];

        if (!webhookSignature) {
            return res.status(400).json({
                message: "Webhook signature missing"
            });
        }

        const expectedSignature = crypto
            .createHmac(
                "sha256",
                config.RAZORPAY_WEBHOOK_SECRET
            )
            .update(req.body)
            .digest("hex");

        if (expectedSignature !== webhookSignature) {
            return res.status(400).json({
                message: "Invalid webhook signature"
            });
        }

        const event = JSON.parse(req.body.toString());

        if (event.event !== "payment.captured") {
            return res.status(200).json({
                message: "Event ignored"
            });
        }

        const payment =
            event.payload.payment.entity;

        const razorpayPaymentId = payment.id;
        const razorpayOrderId = payment.order_id;

        const order = await processSuccessfulPayment({
            razorpayOrderId,
            razorpayPaymentId
        });

        return res.status(200).json({
            message: "Webhook processed",
            order
        });

    } catch (error) {
        console.log(error);

        return res.status(error.status || 500).json({
            message: error.message || "Webhook processing failed"
        });
    }
}