import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
        unique: [true, "Username must be unique"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: [true, "Email must be unique"],
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, "password is required"],
        minlength:[8,"password must be 8 character long"]

    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    isBlocked: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

const userModel = mongoose.model("users", userSchema);

export default userModel;