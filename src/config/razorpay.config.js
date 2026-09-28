import razorpay from "razorpay"
import config from "./config.js"

const createRazorPayInstance=()=>{
    return new razorpay({
        key_id:config.RAZORPAY_API_KEY,
        key_secret:config.RAZORPAY_SECRET
    })
}


export default createRazorPayInstance;