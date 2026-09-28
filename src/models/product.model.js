import mongoose from "mongoose";

const productSchema=new mongoose.Schema({
    pname:{
        type:String,
        required:[true,"Poduct Name is required"],
        trim:true
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        trim: true,
        maxlength: [1000, "Description cannot exceed 1000 characters"]
    },
    category:{
        type:String,
        required:[true,"Category is required"],
        enum: [
            "Protein",
            "PreWorkout",
            "Creatine",
            "MassGainer",
            "BCAA",
            "Multivitamin",
            "FishOil",
            "Accessories"
        ],
        index: true
    },
    price:{
        type:Number,
        required:[true,"Price for product is required"],
        min:[0,"Price cannot be negative"]
    },
    image:{
        type:String,
        required:[true,"Image url is required"],
        trim:true
    },
    fileId: {                         
        type: String,
        required: true
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    }
},{timestamps:true})
productSchema.index({ createdAt: -1, _id: -1 });
productSchema.index({ category: 1, createdAt: -1, _id: -1 });
const productModel=mongoose.model("products",productSchema);

export default productModel;