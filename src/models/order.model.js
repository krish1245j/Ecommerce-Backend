import mongoose, { Types } from "mongoose";

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,

    },
    items: {
        type: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "products",
                    required: true
                },
                pname: {
                    type: String,
                    required: true
                },
                price: {
                    type: Number,
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1
                }
            }
        ],
        validate: {
            validator: function (items) {
                return items.length > 0;
            },
            message: "Order must contain at least one item."
        }
    },
    totalAmount: {
        type: Number,
        required: [true, "totalAmount is required"],
        min: 0
    },
    orderStatus: {
        type: String,
        enum: ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELED"],
        default: "PENDING"
    },
    paymentStatus: {
        type: String,
        enum: ["PAID", "PENDING", "FAILED", "REFUNDED"],
        default: "PENDING"
    },
    shippingAddress: {
        fullName: {
            type: String,
            required: [true, "fullName is required"]
        },
        phone: {
            type: String,
            required: [true, "phone number is required"],
            match: [/^[6-9]\d{9}$/, "Invalid phone number"]
        },
        address: {
            type: String,
            required: [true, "Address is required"]
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        pincode: {
            type: String,
            required: true,
            match: [/^\d{6}$/, "Invalid pincode"]
        }
    },
    paymentMethod: {
        type: String,
        enum: ["ONLINE", "COD"],
        default: "ONLINE"
    },
    razorpayPaymentId: {
        type: String,
        unique: true,
        sparse: true
    },
    razorpayOrderId: {
        type: String
    }

}, { timestamps: true })
orderSchema.index({ user: 1 });
orderSchema.index({ orderStatus: 1 });
const orderModel = mongoose.model("orders", orderSchema);

export default orderModel;