const cartModel = require('../models/cartModel')
const { userModel } = require('../models/userModel')
const productModel = require('../models/productModel')

const { isValidObjectId, isValid, isValidRequestBody } = require('../utils/validator')


// ============== POST / Create Cart =======================//

const createCart = async function (req, res) {
    try {
        let userId = req.params.userId
        if (userId != req.userId) return res.status(401).send({ status: false, msg: "User not authorized." })
        let data = JSON.parse(JSON.stringify(req.body))
        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, msg: 'Provide details' })

        if (data.cartId == undefined) {
            if (!isValid(data.productId)) return res.status(400).send({ status: false, msg: 'Provide productId' })
            if (!isValidObjectId(data.productId)) return res.status(400).send({ status: false, msg: 'Provide valid productId' })

            let existingCart = await cartModel.findOne({ userId: userId })
            //if cart already exists............................ 
            if (existingCart) {

                let product = await productModel.findOne({ _id: data.productId, isDeleted: false })
                if (!product) return res.status(404).send({ status: false, msg: 'Product not found.' })
                data.quantity = data.quantity ?? 1
                for (let i = 0; i < existingCart.items.length; i++) {
                    if (data.productId.toString() == existingCart.items[i].productId) {
                        existingCart.items[i].quantity += Number(data.quantity)
                        existingCart.totalPrice += product.price * (data.quantity)
                        existingCart.totalItems = existingCart.items.length
                        existingCart.save()
                        return res.status(200).send({ status: true, msg: 'Success', data: existingCart })
                    }
                }
                let obj = {
                    productId: data.productId,
                    quantity: data.quantity
                }
                existingCart.items.push(obj)
                existingCart.totalPrice += product.price * (data.quantity)
                existingCart.totalItems = existingCart.items.length
                existingCart.save()
                res.status(200).send({ status: true, msg: 'Success', data: existingCart })
            } else {
                //new cart is created.......
                let product = await productModel.findOne({ _id: data.productId, isDeleted: false })
                if (!product) return res.status(404).send({ status: false, msg: 'Product not found.' })
                data.quantity = data.quantity ?? 1
                let creationData = {
                    userId: userId,
                    items: [{
                        productId: data.productId,
                        quantity: data.quantity
                    }],
                    totalPrice: product.price * (data.quantity),

                }
                creationData.totalItems = creationData.items.length
                let newCart = await cartModel.create(creationData)
                res.status(201).send({ status: true, msg: 'Cart Created Successfully', data: newCart })

            }
        } else {
            let existingCart = await cartModel.findOne({ userId: userId ,_id:data.cartId})
            if(!existingCart)return res.status(400).send({status:false,msg:'cart NOT FOUND.'})
            if (existingCart) {

                let product = await productModel.findOne({ _id: data.productId, isDeleted: false })
                if (!product) return res.status(404).send({ status: false, msg: 'Product not found.' })
                data.quantity = data.quantity ?? 1
                for (let i = 0; i < existingCart.items.length; i++) {
                    if (data.productId.toString() == existingCart.items[i].productId) {
                        existingCart.items[i].quantity += Number(data.quantity)
                        existingCart.totalPrice += product.price * (data.quantity)
                        existingCart.totalItems = existingCart.items.length
                        existingCart.save()
                        return res.status(200).send({ status: true, msg: 'Success', data: existingCart })
                    }
                }
                let obj = {
                    productId: data.productId,
                    quantity: data.quantity
                }
                existingCart.items.push(obj)
                existingCart.totalPrice += product.price * (data.quantity)
                existingCart.totalItems = existingCart.items.length
                existingCart.save()
                res.status(200).send({ status: true, msg: 'Success', data: existingCart })
            }

        }


    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}
// ============== PUT / Update Cart =======================//

const updateCart = async (req, res) => {
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

        const { productId, cartId, removeProduct } = requestBody;

        if (isValid(productId)) {
            if (!isValidObjectId(productId)) {
                return res.status(400).send({ status: false, msg: 'productId is inValid' })
            }
        }

        const findProduct = await productModel.findById(productId);
        if (!findProduct) {
            return res.status(404).send({ status: false, msg: "No Poduct Found" })
        }

        if (findProduct.isDeleted == true) {
            return res.status(400).send({ status: false, msg: "Poduct is Already Deleted" })
        }

        if (isValid(cartId)) {
            if (!isValidObjectId(cartId)) {
                return res.status(400).send({ status: false, msg: 'cartId is inValid' })
            }
        }

        const findCart = await cartModel.findOne({ userId: userId, _id: cartId });
        if (!findCart) {
            return res.status(404).send({ status: false, msg: "No Cart Found" })
        }

        if (findCart.items.length == 0) {
            return res.status(400).send({ status: false, msg: "Cart of this user is already empty" })
        }



        if (!(removeProduct == 0 || removeProduct == 1)) {
            return res.status(400).send({ status: false, msg: "removePoduct value should be 0 or 1" })
        }
        if (removeProduct == 1) {
            for (let i = 0; i < findCart.items.length; i++) {
                if (productId == findCart.items[i].productId) {
                    let totalPrice = findCart.totalPrice - findProduct.price
                    if (findCart.items[i].quantity > 1) {
                        findCart.items[i].quantity -= 1
                        let updateCart = await cartModel.findOneAndUpdate({ _id: cartId }, { items: findCart.items, totalPrice: totalPrice }, { new: true })
                        return res.status(200).send({ status: true, msg: "Cart Update Successfully", data: updateCart })
                    } else {
                        let totalItem = findCart.totalItems - 1
                        findCart.items.splice(i, 1)
                        let updateCart = await cartModel.findOneAndUpdate({ _id: cartId }, { items: findCart.items, totalPrice: totalPrice, totalItems: totalItem }, { new: true })
                        return res.status(200).send({ status: true, msg: "Cart Update Successfully", data: updateCart })
                    }
                }
                else {
                    return res.status(400).send({ status: false, msg: "Cart not found from this product Id" })
                }
            }
        }

        if (removeProduct == 0) {
            for (let i = 0; i < findCart.items.length; i++) {
                if (productId == findCart.items[i].productId) {
                    let totalPrice = findCart.totalPrice - (findProduct.price * findCart.items[i].quantity)
                    let totalItem = findCart.totalItems - 1
                    findCart.items.splice(i, 1)
                    let updateCart = await cartModel.findOneAndUpdate({ _id: cartId }, { items: findCart.items, totalPrice: totalPrice, totalItems: totalItem }, { new: true })
                    return res.status(200).send({ status: true, msg: "Cart Update Successfully", data: updateCart })
                }
                else {
                    return res.status(400).send({ status: false, msg: "Cart not found from this product Id" })
                }
            }
        }
    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}

// ============== GET / Get Cart =======================//

const getCart = async (req, res) => {
    try {
        const userId = req.params.userId
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, msg: "Invalid User Id" })

        const checkUser = await userModel.findOne({ _id: userId })
        if (!checkUser) return res.status(400).send({ status: false, msg: "User does not exist" })

        if (userId != req.userId) return res.status(401).send({ status: false, msg: "User not authorized" })

        checkCart = await cartModel.findOne({ userId: userId }).select({ __v: 0 })
        if (!checkCart) return res.status(404).send({ status: false, message: "Cart not found" })

        res.status(200).send({ status: true, data: checkCart })

    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}

// ============== DELETE / Delete Cart =======================//

const deleteCart = async (req, res) => {
    try {
        const userId = req.params.userId
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, msg: "Invalid User Id" })

        const checkUser = await userModel.findOne({ userId })
        if (!checkUser) return res.status(404).send({ status: false, msg: "User does not exist" })

        if (userId != req.userId) return res.status(401).send({ status: false, msg: "User not authorized" })

        const findCart = await cartModel.findOne({ userId })
        if (!findCart) {
            return res.status(404).send({ status: false, msg: "No Cart Found" })
        }
        let temp=[]
        let c=0
        await cartModel.findOneAndUpdate({userId: userId },{ items: temp, totalPrice: c, totalItems: c})
        return res.status(200).send({ status: true, msg: "Cart deleted Successfully" })
    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}



module.exports = { createCart, updateCart, getCart, deleteCart }