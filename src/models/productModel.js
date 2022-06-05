const mongoose = require("mongoose")

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        trim: true
    },
    currencyId: {
        type: String, //INR
        required: true,
        trim: true
    },
    currencyFormat: {
        type: String,  //₹ (Rupee Symbol)
        required: true,
        trim: true
    },
    isFreeShipping: {
        type: Boolean,
        default: false
    },
    productImage: {
        type: String,
        required: true,
        trim: true
    },
    style: {
        type: String,
        trim: true
    },
    availableSizes: [{
        type: String,
        enum: ["S", "XS", "M", "X", "L", "XXL", "XL"],
        trim: true
    }],
    installments: {
        type: Number,
        trim: true
    },
    deletedAt: {
        type: Date,
        trim: true
    },
    isDeleted: {
        type: Boolean,
        default: false,
        trim: true
    }
}, {
    timestamps: true
})

module.exports = mongoose.model("Product", productSchema)
