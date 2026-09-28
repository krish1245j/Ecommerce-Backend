import mongoose from "mongoose"

const cartSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users",
        required:true,
        unique:true
    },
    items:[
        {
            product:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"products",
                required:true
            },
            quantity:{
                type:Number,
                required:true,
                min:1
            }
        }
    ],
    
},{timestamps:true})

const cartModel=mongoose.model('cart',cartSchema);

export default cartModel;  