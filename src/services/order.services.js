import mongoose from "mongoose";
import orderModel from "../models/order.model.js";
import cartModel from "../models/cart.model.js";
import productModel from "../models/product.model.js";
import client from "../config/redis.js";

export async function placeOrder({
    userId,
    shippingAddress,
    paymentMethod,
    paymentStatus,
    razorpayPaymentId,
    razorpayOrderId
}) {

    let session;

    try {

        const cart = await cartModel.findOne({
            user: userId
        });

        if (!cart) {
            const error = new Error("Cart not found");
            error.status = 404;
            throw error;
        }

        if (cart.items.length === 0) {
            const error = new Error("Cart is empty");
            error.status = 400;
            throw error;
        }

        // Your validation + total calculation
        let totalAmount = 0;

        for (const cartItem of cart.items) {

            const product = await productModel.findById(
                cartItem.product
            );

            if (!product) {
                const error = new Error("Product does not exist");
                error.status = 400;
                throw error;
            }

            if (cartItem.quantity <= 0) {
                const error = new Error(
                    "Quantity must be greater than 0"
                );
                error.status = 400;
                throw error;
            }

            if (cartItem.quantity > product.stock) {
                const error = new Error("Insufficient Stock");
                error.status = 400;
                throw error;
            }

            totalAmount += product.price * cartItem.quantity;
        }

        session = await mongoose.startSession();
        session.startTransaction();

        const orderData = {
            user: userId,
            items: [],
            totalAmount,
            shippingAddress,
            paymentMethod,
            paymentStatus,
            razorpayPaymentId,
            razorpayOrderId
        };

        // Build order items + validate stock again
        for (const item of cart.items) {

            const product = await productModel
                .findById(item.product)
                .session(session);

            if (!product) {
                const error = new Error(
                    "Product does not exist"
                );
                error.status = 400;
                throw error;
            }

            if (item.quantity > product.stock) {
                const error = new Error(
                    "Insufficient Stock"
                );
                error.status = 400;
                throw error;
            }

            orderData.items.push({
                pname: product.pname,
                product: product._id,
                price: product.price,
                quantity: item.quantity
            });
        }

        const [order] = await orderModel.create(
            [orderData],
            { session }
        );

        // Decrease stock
        for (const item of cart.items) {

            const product = await productModel
                .findById(item.product)
                .session(session);

            product.stock -= item.quantity;

            await product.save({ session });
        }

        // Clear cart
        cart.items = [];
        await cart.save({ session });

        await session.commitTransaction();

        await client.del(`cart:${userId}`);

        return order;

    } catch (error) {

        if (session && session.inTransaction()) {
            await session.abortTransaction();
        }

        throw error;

    } finally {

        if (session) {
            await session.endSession();
        }
    }
}