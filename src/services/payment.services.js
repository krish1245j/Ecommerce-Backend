import paymentModel from "../models/tempPayment.model.js";
import orderModel from "../models/order.model.js";
import { placeOrder } from "./order.services.js";

export async function processSuccessfulPayment({
    razorpayOrderId,
    razorpayPaymentId,
    razorpayAmount
}) {
    const tempPayment = await paymentModel.findOne({
        razorpayOrderId
    });

    if (!tempPayment) {
        const error = new Error("Payment record not found");
        error.status = 404;
        throw error;
    }
    if (razorpayAmount !== tempPayment.amount * 100) {
        const error = new Error("Payment amount mismatch");
        error.status = 400;
        throw error;
    }
    // Idempotency check
    const existingOrder = await orderModel.findOne({
        razorpayPaymentId
    });

    if (existingOrder) {
        return existingOrder;
    }

    const order = await placeOrder({
        userId: tempPayment.user,
        shippingAddress: tempPayment.shippingAddress,
        paymentMethod: "ONLINE",
        paymentStatus: "PAID",
        razorpayPaymentId,
        razorpayOrderId
    });

    tempPayment.razorpayPaymentId = razorpayPaymentId;
    tempPayment.status = "PROCESSED";

    await tempPayment.save();

    return order;
}