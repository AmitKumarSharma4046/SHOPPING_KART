const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

const cartSchema = new mongoose.Schema({

    userId: { type: ObjectId, ref: 'User', required: true, unique: true, trim: true },
    items: [{
        productId: { type: ObjectId, ref: 'Product', required: true, trim: true },
        quantity: { type: Number, required: true, trim: true },
        _id:false
    }],
    totalPrice: { type: Number, required: true, trim: true },//Holds total price of all the items in the cart
    totalItems: { type: Number, required: true, trim: true }//Holds total number of items in the cart
}, { timestamp: true })

module.exports = mongoose.model('Cart', cartSchema)