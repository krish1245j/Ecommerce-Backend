import dotenv from "dotenv";

dotenv.config();

if(!process.env.MONGO_URI){
    throw new Error("MONGO_URI is not defined in environmental variables");
}

const config={
    MONGO_URI:process.env.MONGO_URI,
    JWT_SECRET:process.env.JWT_SECRET,
    JWT_SECRET_R:process.env.JWT_SECRET_R,
    PORT:process.env.PORT,
    IMAGEKIT_PRIVATE_KEY:process.env.IMAGEKIT_PRIVATE_KEY,
    IMAGEKIT_URL_ENDPOINT:process.env.IMAGEKIT_URL_ENDPOINT,
    IMAGEKIT_PUBLIC_KEY:process.env.IMAGEKIT_PUBLIC_KEY,
    RAZORPAY_API_KEY:process.env.RAZORPAY_API_KEY,
    RAZORPAY_SECRET:process.env.RAZORPAY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
    UPSTASH_REDIS_REST_URL:process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN:process.env.UPSTASH_REDIS_REST_TOKEN
}

export default config;