const productModel = require("../models/productModel")
const { uploadFile } = require('../utils/aws')
const {isValid, isValidRequestBody, isValidObjectId, checkImage, titleCheck, isValidPrice, isValidInstallment } = require("../utils/validator")


// ============== POST / Create Poduct =======================//


const createProduct = async function (req, res) {
    try {
        let data = JSON.parse(JSON.stringify(req.body));
        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, msg: 'Enter details for product creation.' })

        let files = req.files

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = data

        if (!isValid(title)) return res.status(400).send({ status: false, msg: "Enter Title" })
        if (!titleCheck(title)) return res.status(400).send({ status: false, msg: "Enter Title is not valid" })

        let usedTitle = await productModel.findOne({ title: title })
        if (usedTitle) return res.status(400).send({ status: false, msg: "Title already exist" })

        if (!isValid(description)) return res.status(400).send({ status: false, msg: "Enter description" })

        if (!isValid(price)) 
            return res.status(400).send({ status: false, msg: "Enter Price" })
        if (!isValidPrice(price)) 
            return res.status(400).send({ status: false, msg: "Bad Price" })

        if (!isValid(currencyId)) 
            return res.status(400).send({ status: false, msg: "Enter Currency Id" })

        if (currencyId != 'INR')
            return res.status(400).send({ status: false, msg: "CurrencyId must be only INR" })

        if (!isValid(currencyFormat)) 
            return res.status(400).send({ status: false, msg: "Enter Currency Format" })

        if (!(/₹/.test(currencyFormat))) 
            return res.status(400).send({ status: false, msg: "CurrencyFormat must be only ₹" })

        if (typeof isFreeShipping != 'undefined') {
            if (!['true', 'false'].includes(isFreeShipping)) 
                return res.status(400).send({ status: false, msg: "isFreeShipping must be boolean value" })
        }
        if (availableSizes) {
            var arr1 = ["S", "XS", "M", "X", "L", "XXL", "XL"]
            var arr2 = availableSizes.toUpperCase().split(",").map((s) => s.trim())
            
            for (let i = 0; i < arr2.length; i++) {
                if (!(arr1.includes(arr2[i]))) {
                        return res.status(400).send({
                        status: false,
                        message: "availableSizes must be [S, XS, M, X, L, XXL, XL]"
                    });
                }
            }
        }

        if (installments){
            if (!isValidInstallment(installments)) 
                return res.status(400).send({ status: false, msg: "Bad installments field" })
        }

        if (files.length == 0)
            return res.status(400).send({ status: false, message: "Please upload file" });
        if (files.length > 1)
            return res.status(400).send({ status: false, message: "Upload only one file at a time" });
        if (!checkImage(files[0].originalname))
            return res.status(400).send({ status: false, message: "format must be jpeg/jpg/png only" })

        const productImageUrl = await uploadFile(files[0])

        let result = {
            title,
            description,
            price,
            currencyId,
            currencyFormat,
            isFreeShipping,
            style,
            availableSizes: arr2,
            installments,
            productImage: productImageUrl
        }

        let created = await productModel.create(result)
        res.status(201).send({ status: true, msg: "Product created successfull", data: created })

    } 
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}


// ============== GET / Get Poduct using filter =======================//

const getProduct = async function (req, res) {
    try {
        const queryParams = req.query;
        const filter = {
            isDeleted: false
        };

        let {
            size,
            name,
            priceGreaterThan,
            priceLessThan,
            priceSort
        } = queryParams

        if (Object.keys(queryParams).length !== 0) {

            if (size) {
                var arr1 = ["S", "XS", "M", "X", "L", "XXL", "XL"]
                var arr2 = size.toUpperCase().split(",").map((s) => s.trim())
                
                for (let i = 0; i < arr2.length; i++) {
                    if (!(arr1.includes(arr2[i]))) {
                            return res.status(400).send({
                            status: false,
                            message: "availableSizes must be [S, XS, M, X, L, XXL, XL]"
                        });
                    }
                }
                filter['availableSizes'] = size
            }

            if (isValid(name)) {
                const regexName = new RegExp(name, "i")
                filter.title = {
                    $regex: regexName
                }
            }

            if (priceGreaterThan) {
                filter.price = {
                    $gt: priceGreaterThan
                }
            }
            if (priceLessThan) {
                filter.price = {
                    $lt: priceLessThan
                }
            }
            if (priceSort) {
                if (!(priceSort == 1 || priceSort == -1))
                    return res.status(400).send({
                        status: false,
                        msg: "Price sort by the value 1 and -1 only"
                    })
            }
        }


        const getProductDetails = await productModel.find(filter).sort({ price: priceSort })
        if(getProductDetails.length == 0) return res.status(404).send({status : false, msg : "Product not found"})
        res.status(200).send({ status: true, msg: "Prodect Details find Successsully", data: getProductDetails })
    } 
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}


// ============== GET / Get Poduct by product Id =======================//


const getProductById = async function (req, res) {
    try {
        const productId = req.params.productId

        if (!isValidObjectId(productId)) 
            return res.status(400).send({ status: false, msg: "Please enter a valid productId" })

        const findProduct = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!findProduct) return res.status(404).send({ status: false, msg: "Product not found or Product is deleted" })
            
        res.status(200).send({ status: true, data: findProduct })

    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}


// ============== PUT / Update Poduct =======================//



const updateProduct = async function (req, res) {
    try {
        let productId = req.params.productId;
        let requestBody = req.body
        const files = req.files

        if (!isValidObjectId(productId))
            return res.status(400).send({ status: false, msg: 'Invalid productId' })

        const productDetails = await productModel.findById(productId)
        if (!productDetails) 
            return res.status(404).send({ status: false,  msg: 'Product Not Found' })
        
        if (productDetails.isDeleted == true) 
            return res.status(400).send({ status: false, msg: 'Product is already Deleted' })
        

        if (!isValidRequestBody(requestBody) && typeof files === 'undefined') 
            return res.status(400).send({ status: false, msg: 'Enter atleast One detail to update' })

            
        
        const { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = requestBody

        if (isValid(title)) {
            if (!titleCheck(title)) 
                return res.status(400).send({ status: false, msg: "Enter Title is not valid" })
                let usedTitle = await productModel.findOne({ title: title })
                if (usedTitle) return res.status(400).send({ status: false, msg: "Title already exist" })
            productDetails.title = title
        }

        if (isValid(description)) {
            productDetails.description = description
        }

        if (isValid(price)) {
            if (!isValidPrice(price)) 
                return res.status(400).send({ status: false, msg: "Bad Price" })
            productDetails.price = price
        }

        if (isValid(currencyId)) {
            if (currencyId != 'INR') 
                return res.status(400).send({ status: false, msg: "CurrencyId must be only INR" })
            productDetails.currencyId = currencyId
        }

        if (isValid(currencyFormat)) {
            if (!(/₹/.test(currencyFormat))) 
                return res.status(400).send({ status: false, msg: "Currency Format must be ₹" })
            productDetails.currencyFormat = currencyFormat
        }

        if (isValid(isFreeShipping)) {
            if (!['true', 'false'].includes(isFreeShipping))
                return res.status(400).send({ status: false, msg: "isFreeShipping must be boolean value" })
            productDetails.isFreeShipping = isFreeShipping
        }

        if (isValid(style)) {
            productDetails.style = style
        }

        if (availableSizes) {
            let arr1 = ["S", "XS", "M", "X", "L", "XXL", "XL"]
                var arr2 = availableSizes.toUpperCase().split(",").map((s) => s.trim())
                for (let i = 0; i < arr2.length; i++) {
                    if (!arr1.includes(arr2[i])) {
                        return res.status(400).send({
                            status: false,
                            message: "availableSizes must be [S, XS, M, X, L, XXL, XL]"
                        });
                    }
                }
                productDetails.availableSizes = arr2
        }
        

        if (isValid(installments)) {
            if (!isValidInstallment(installments)) {
                return res.status(400).send({ status: false, msg: "Bad installments field" })
            }
            productDetails.installments = installments
        }

        if (files.length > 0) {
            if (files.length > 1)
                return res.status(400).send({ status: false, message: "Insert only one image at a time" });
            if (!checkImage(files[0].originalname))
                return res.status(400).send({ status: false, message: "file format must be jpeg/jpg/png only" })
            let uploadedFileURL = await uploadFile(files[0]);
            productDetails.productImage = uploadedFileURL;
        }

        await productDetails.save();
        return res.status(200).send({ status: true, message: "Product updated", data: productDetails })

    } catch (err) {
        res.status(500).send({
            status: false,
            msg: err.message
        })
    }
}


// ============== DELETE / Delete Poduct =======================//


const deleteProductById = async function (req, res) {
    try {
        const productId = req.params.productId

        if (!isValidObjectId(productId)) 
            return res.status(400).send({ status: false, msg: "Please enter a valid productId" })
        
        const findProduct = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!findProduct) 
            return res.status(404).send({ status: false, msg: "Product not found or product already deleted." })

        let deletedProduct = await productModel.findOneAndUpdate({
            _id: productId
        }, {
            $set: {
                isDeleted: true,
                deletedAt: new Date()
            }
        }, {
            new: true
        })
        res.status(200).send({ status: true, message: " Product Deleted Successfully", data: deletedProduct })

    } 
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}


module.exports = {
    createProduct,
    getProduct,
    getProductById,
    updateProduct,
    deleteProductById
}