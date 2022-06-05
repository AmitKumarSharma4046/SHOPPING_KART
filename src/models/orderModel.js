const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

const orderSchema = new mongoose.Schema({

    userId: {
        type: ObjectId,
        ref: 'User',
        required: true,
        trim: true
    },
    items: [{
        productId: { type: ObjectId, ref: 'Product', required: true, trim: true },
        quantity: { type: Number, required: true, trim: true },
        _id:false
    }],
    totalPrice: {
        type: Number,
        required: true,
        trim: true
    },
    totalItems: {
        type: Number,
        required: true,
        trim: true
    },
    totalQuantity: {
        type: Number,
        required: true,
        trim: true
    },
    cancellable: {
        type: Boolean,
        default: true,
        trim: true
    },
    status: {
        type: String,
        enum: ["pending", "completed", "cancled"],
        default: "pending",
        trim: true
    },
    deletedAt: {
        type: Date,
        trim: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamp: true })

module.exports = mongoose.model('Order', orderSchema)