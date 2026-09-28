import client from "../config/redis.js";
import cartModel from "../models/cart.model.js";
import productModel from "../models/product.model.js";
import mongoose from "mongoose";
import { getSubTotal, getTotalQuantity } from "../../utils/cart.utils.js";

export async function getCart(req, res) {
    try {
        const cacheCart = await client.get(`cart:${req.user.id}`)
        if (cacheCart) {
            return res.status(200).json({
                cart: cacheCart.cart,
                subTotal: getSubTotal(cacheCart.cart),
                totalQuantity: getTotalQuantity(cacheCart.cart)
            })
        }
        const cart = await cartModel.findOne({
            user: req.user.id
        })
        if (!cart) {
            return res.status(404).json({
                message: "Cart does not exists"
            })
        }
        await cart.populate({
            path: "items.product",
            select: "pname price image stock"
        })
        const cache = {
            cart
        }
        await client.set(
            `cart:${req.user.id}`,
            JSON.stringify(cache),
            {
                ex: 300
            }
        )
        return res.status(200).json({
            cart,
            subTotal: getSubTotal(cart),
            totalQuantity: getTotalQuantity(cart)
        })
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}
export async function addItem(req, res) {
    try {

        const { product, quantity = 1 } = req.body;
        if (!product) {
            return res.status(400).json({
                message: "Product is required"
            })

        }

        if (!mongoose.Types.ObjectId.isValid(product)) {
            return res.status(400).json({
                message: "Invalid product id"
            });
        }
        let finalCart;
        const productDoc = await productModel.findById(product);

        if (!productDoc) {
            return res.status(404).json({
                message: "Product not found"
            })
        }

        if (quantity <= 0) {
            return res.status(400).json({
                message: "Quantity must be greater than 0"
            })
        }
        const item = {
            product,
            quantity
        }
        const cart = await cartModel.findOne({
            user: req.user.id
        })
        if (cart) {
            let found = false;
            for (const cartItem of cart.items) {
                if (cartItem.product.equals(product)) {
                    if (cartItem.quantity + quantity > productDoc.stock) {
                        return res.status(400).json({
                            message: "Insufficient stock"
                        });
                    }
                    cartItem.quantity += quantity;
                    found = true;
                    break;
                }
            }
            if (!found) {
                if (quantity > productDoc.stock) {
                    return res.status(400).json({
                        message: "Insufficient stock"
                    });
                }
                cart.items.push(item);
            }
            await cart.save();

            await cart.populate({
                path: "items.product",
                select: "pname price image stock"
            });
            finalCart = cart;


        } else {
            if (quantity > productDoc.stock) {
                return res.status(400).json({
                    message: "Insufficient stock"
                });
            }
            const newCart = await cartModel.create({
                user: req.user.id,
                items: [item]
            });
            await newCart.populate({
                path: "items.product",
                select: "pname price image stock"
            });
            finalCart = newCart;

        }
        await client.del(`cart:${req.user.id}`)
        return res.status(201).json({
            message: "Item added in cart",
            cart: finalCart,
            subTotal: getSubTotal(finalCart),
            totalQuantity: getTotalQuantity(finalCart)
        })
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

export async function updateCart(req, res) {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;
        if (!quantity) {
            return res.status(400).json({
                message: "Quantity is required"
            })
        }
        if (quantity <= 0) {
            return res.status(400).json({
                message: "Quantity must be greater than 0"
            })
        }
        if (!productId) {
            return res.status(400).json({
                message: "ProductId is required"
            })
        }
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                message: "Invalid product id"
            });
        }
        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            })
        }


        if (quantity > product.stock) {
            return res.status(400).json({
                message: "Insufficient stock"
            });
        }
        const cart = await cartModel.findOne({
            user: req.user.id
        })

        if (cart) {
            let found = false;
            for (const cartItem of cart.items) {
                if (cartItem.product.equals(productId)) {
                    cartItem.quantity = quantity;
                    found = true;
                    break;
                }
            }
            if (!found) {
                return res.status(404).json({
                    message: "Product is not in the cart"
                })
            }
            await cart.save();
            await client.del(`cart:${req.user.id}`)
            await cart.populate({
                path: "items.product",
                select: "pname price image stock"
            });



            return res.status(200).json({
                message: "Cart updated successfully",
                cart,
                subTotal: getSubTotal(cart),
                totalQuantity: getTotalQuantity(cart)
            })

        } else {
            return res.status(404).json({
                message: "Cart does not exist"
            })
        }
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }

}

export async function deleteCartItem(req, res) {
    try {
        const { productId } = req.params;

        if (!productId) {
            return res.status(400).json({
                message: "ProductId is required"
            })
        }
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                message: "Invalid product id"
            });
        }

        const cart = await cartModel.findOne({
            user: req.user.id
        })

        if (cart) {
            let found = false;
            let idx = 0;
            for (const cartItem of cart.items) {
                if (cartItem.product.equals(productId)) {
                    cart.items.splice(idx, 1);
                    found = true;
                    break;
                }
                idx++;
            }
            if (!found) {
                return res.status(404).json({
                    message: "Product does not found"
                })
            }

            await cart.save();
            await client.del(`cart:${req.user.id}`)
            await cart.populate({
                path: "items.product",
                select: "pname price image stock"
            });

            return res.status(200).json({
                message: "Cart updated successfully",
                cart,
                subTotal: getSubTotal(cart),
                totalQuantity: getTotalQuantity(cart)
            })

        } else {
            return res.status(404).json({
                message: "cart not found"
            })
        }
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }

}

export async function deleteCart(req, res) {
    try {
        const cart = await cartModel.findOne({
            user: req.user.id
        })
        if (!cart) {
            return res.status(404).json({
                message: "Cart not found"
            })
        }
        cart.items = [];
        await cart.save();
        await client.del(`cart:${req.user.id}`)
        return res.status(200).json({
            message: "Cart cleared successfully",
            cart,
            subTotal: 0,
            totalQuantity: 0
        })
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}