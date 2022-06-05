const orderModel = require("../models/orderModel")
const cartModel = require("../models/cartModel")
const {userModel} = require("../models/userModel")

const { isValidObjectId, isValid, isValidRequestBody } = require("../utils/validator")

//----------------------------------------create Order---------------------------------------

const createOrder = async function (req, res) {
    try {
        let userId = req.params.userId;
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "Invalid User Id" })
        }

        let findUser = await userModel.findById(userId);
        if (!findUser) {
            return res.status(404).send({ status: false, message: `No user found` })
        }
        if (userId != req.userId) return res.status(401).send({ status: false, msg: "User not authorized" })

        let requestBody = req.body;
        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: 'Data is required to place your order' });
        }

        const { cartId, cancellable, status } = requestBody;

        if (!isValid(cartId)) return res.status(400).send({ status: false, message: "CartId is required" })
        if (!isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: "Enter a valid cart-ID" })
        }
        
         let findCart = await cartModel.findOne({ _id: cartId, userId: userId });
         if(!findCart) return res.status(404).send({ status: false, message: `No cart found with this user-ID` })

         if (findCart.items.length == 0) return res.status(400).send({ status: false, message: "Cart is already empty" });

        if(cancellable){
            if (typeof cancellable !== 'boolean') 
                return res.status(400).send({ status: false, message: "Cancellable should be in boolean value" })
        }
            
        if(status){
            if(!["pending", "completed", "cancled"].includes(status)){
                return res.status(400).send({ status: false, message: "Status should be pending/completed/cancelled " })
            }
        }
        let count = 0;
        for(let i =0; i<findCart.items.length; i++){
            count += findCart.items[i].quantity;
        }

        const order={
            userId: userId,
            items: findCart.items,
            totalPrice: findCart.totalPrice,
            totalItems: findCart.totalItems,
            totalQuantity: count,
            cancellable,
            status
        }

        let resData = await orderModel.create(order);
        let temp=[]
        let c=0
        // Empty the cart after Order placed successfully
        await cartModel.findOneAndUpdate({_id: cartId, userId: userId },{ items: temp, totalPrice: c, totalItems: c})
        res.status(200).send({ status: true, message: "Order Placed successfully", data: resData });
    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}

//---------------------------------------------update Order------------------------------------------
const updateOrder = async (req, res) => {
    try {
        const userId = req.params.userId
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, msg: "Invalid User Id" })

        const checkUser = await userModel.findOne({ userId })
        if (!checkUser) return res.status(404).send({ status: false, msg: "User does not exist" })

        if (userId != req.userId) return res.status(401).send({ status: false, msg: "User not authorized to update details" })

        const requestBody = req.body;
        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, msg: 'Please Enter details to Update.' })
        }

        const { orderId, status } = requestBody;
        if (!isValid(orderId)) {
            return res.status(400).send({ status: false, msg: 'orderId is Required' })
        }
        if (!isValidObjectId(orderId)) {
            return res.status(400).send({ status: false, msg: "Invalid orderId" })
        }

        const findOrder = await orderModel.findOne({ _id: orderId, userId: userId })
        if (!findOrder) {
            return res.status(404).send({ status: false, msg: "Order not Found" })
        }

        if (!["pending", "completed", "cancled"].includes(status)) {
            return res.status(400).send({ status: false, msg: 'status must be pending/completed/cancelled' })
        }

        if (findOrder.status == "completed") {
            return res.status(400).send({ status: false, msg: 'This order is already completed' })
        }

        if (findOrder.status == "cancled") {
            return res.status(400).send({ status: false, msg: 'This order is already cancelled' })
        }

        if (findOrder.cancellable == false && status == "cancled") {
            return res.status(400).send({ status: false, msg: 'You cannot cancel this order' })
        }

        const updateStatus = await orderModel.findOneAndUpdate({ _id: orderId, isDeleted: false }, { status: status }, { new: true })
        return res.status(200).send({ status: true, msg: 'Order status updated Successfully', data: updateStatus })
    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}


module.exports = { createOrder, updateOrder }