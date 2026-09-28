import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true
        },

        razorpayOrderId: {
            type: String,
            required: true,
            unique: true
        },

        razorpayPaymentId: {
            type: String,
            unique: true,
            sparse: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        shippingAddress: {
            fullName: {
                type: String,
                required: true
            },
            phone: {
                type: String,
                required: true
            },
            address: {
                type: String,
                required: true
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
                required: true
            }
        },

        status: {
            type: String,
            enum: ["CREATED", "PAID", "FAILED", "PROCESSED"],
            default: "CREATED"
        }
    },
    {
        timestamps: true
    }
);

paymentSchema.index({ user: 1 });

const paymentModel = mongoose.model("payments", paymentSchema);

export default paymentModel;