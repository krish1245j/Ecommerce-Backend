import productModel from "../models/product.model.js";
import { uploadFile } from "../services/storage.services.js";
import { deleteImg } from "../services/storage.services.js";
import client from "../config/redis.js";
import mongoose from "mongoose"

async function invalidateProductLists() {
    let cursor = "0";

    do {
        const result = await client.scan(cursor, {
            match: "products:*",
            count: 100
        });

        cursor = result[0];

        const keys = result[1];

        if (keys.length > 0) {
            await client.del(...keys);
        }

    } while (cursor !== "0");
}

export async function createProducts(req, res) {
    try {
        const { pname, category, price, description, stock } = req.body;
        if (!pname || !category || price == null || !description || stock == null) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }
        if (!req.file) {
            return res.status(400).json({
                message: "File does not exists"
            })
        }

        const result = await uploadFile(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );
        const product = await productModel.create({
            pname,
            description,
            category,
            price,
            stock,
            image: result.url,
            fileId: result.fileId
        })
        await invalidateProductLists();
        return res.status(201).json({
            message: "Product Created Successfully",
            product
        })
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

export async function getProducts(req, res) {
    try {
        const { category } = req.query;
        const limit = Math.min(Number(req.query.limit) || 5, 20);
        const { cursor } = req.query;
        const { minPrice, maxPrice, sort } = req.query;
        let sortOption = { createdAt: -1, _id: -1 };

        let filter = {}
        const cacheKey = {
            category,
            minPrice,
            maxPrice,
            sort,
            limit,
            cursor
        };
        if (category) {
            filter.category = category;
        }
        if (minPrice && maxPrice) {
            filter.price = {
                $gte: Number(minPrice),
                $lte: Number(maxPrice)
            }
        }
        else if (minPrice) {
            filter.price = {
                $gte: Number(minPrice),

            }
        }
        else if (maxPrice) {
            filter.price = {
                $lte: Number(maxPrice)
            }
        }
        if (sort === "price_asc") {
            sortOption = {
                price: 1,
                _id: 1
            }
        }
        if (sort === "price_desc") {
            sortOption = {
                price: -1,
                _id: -1
            }
        }

        if (cursor) {
            if (sort == "price_asc") {
                const priceCursor = JSON.parse(cursor);
                filter.$or = [
                    {
                        price: { $gt: priceCursor.price }
                    },
                    {
                        price: priceCursor.price,
                        _id: { $gt: new mongoose.Types.ObjectId(priceCursor._id) }
                    }
                ];
            }
            else if (sort == "price_desc") {
                const priceCursor = JSON.parse(cursor);
                filter.$or = [
                    {
                        price: { $lt: priceCursor.price }
                    },
                    {
                        price: priceCursor.price,
                        _id: { $lt: new mongoose.Types.ObjectId(priceCursor._id) }
                    }
                ];
            } else {
                if (cursor && !mongoose.Types.ObjectId.isValid(cursor)) {
                    return res.status(400).json({
                        message: "Invalid cursor"
                    });
                }
                filter._id = {
                    $lt: new mongoose.Types.ObjectId(cursor)
                };
            }

        }
        const redisKey = `products:${JSON.stringify(cacheKey)}`;
        const cacheProduct = await client.get(redisKey)
        if (cacheProduct) {
            const data = cacheProduct
            return res.status(200).json({
                message: "Products fetched Successfully :",
                products: data.products,
                nextCursor: data.nextCursor
            })
        }

        const products = await productModel.find(filter).sort(sortOption).limit(limit).lean();
        if (products.length === 0) {
            return res.status(200).json({
                products: [],
                nextCursor: null
            })
        }
        // const nextCursor = products.length > 0 ? products[products.length - 1]._id : null;
        const lastProduct = products.length > 0 ? products[products.length - 1] : null;
        let nextCursor;

        if (products.length < limit) {
            nextCursor = null;
        } else if (sort === "price_asc" || sort === "price_desc") {
            nextCursor = JSON.stringify({
                price: lastProduct.price,
                _id: lastProduct._id
            });
        } else {
            nextCursor = lastProduct._id;
        }

        const cache = {}
        cache.products = products;
        cache.nextCursor = nextCursor;
        await client.set(redisKey, JSON.stringify(cache), {
            ex: 300
        });
        return res.status(200).json({
            message: "Products fetched Successfully :",
            products,
            nextCursor
        })
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }

}

export async function getProductById(req, res) {
    try {
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid product id"
            });
        }
        const cache = await client.get(`product:${id}`)
        if (cache) {
            return res.status(200).json({
                message: "Product found:",
                product: JSON.parse(cache)
            })
        }
        const product = await productModel.findById(id);
        if (!product) {
            return res.status(404).json({
                message: "Product does not found"
            })
        }
        await client.set(`product:${id}`, JSON.stringify(product), {
            ex: 300
        });
        return res.status(200).json({
            message: "Product found:",
            product
        })
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

export async function updateProduct(req, res) {
    try {
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid product id"
            });
        }
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide at least one field to update."
            });
        }
        const allowedFields = ["pname", "category", "price", "description", "stock"];
        const updateData = {};
        const oldProduct = await productModel.findById(id);
        if (!oldProduct) {
            return res.status(404).json({
                message: "Product does not exists"
            })
        }

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });
        let fileId;
        if (req.file) {
            fileId = oldProduct.fileId;
            const result = await uploadFile(
                req.file.buffer,
                req.file.originalname,
                req.file.mimetype
            );

            updateData.image = result.url;
            updateData.fileId = result.fileId;

        }
        const product = await productModel.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });
        await client.del(`product:${id}`);
        await invalidateProductLists();
        if (req.file) {
            await deleteImg(fileId);
        }

        return res.status(200).json({
            message: "Product updated successfully",
            product
        })
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }

}

export async function deleteProduct(req, res) {
    try {
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid product id"
            });
        }

        const removeProduct = await productModel.findByIdAndDelete(id);
        if (!removeProduct) {
            return res.status(404).json({
                message: "Product does not found"
            })
        }
        await client.del(`product:${id}`);
        await invalidateProductLists();
        const fileId = removeProduct.fileId;
        await deleteImg(fileId);

        return res.status(200).json({
            message: "Product deleted successfully",
            removeProduct
        })
    } catch (err) {
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}