const { uploadFile } = require('../utils/aws')
const bcrypt = require('bcrypt');
const {userModel, passwordModel} = require('../models/userModel')
const jwt = require("jsonwebtoken")

const { isValid, isValidRequestBody, isValidObjectId, isValidName, isValidPincode, isValidEmail, isValidPhoneNumber, isValidPassword, checkImage } = require("../utils/validator")


//*************************************************< User Registration >*****************************************************//

const createUser = async function (req, res) {
    try {
        let tempPass = req.body.password
        let data = JSON.parse(JSON.stringify(req.body));
        let files = req.files
    
        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, msg: 'Enter details for user creation.' })

        let { fname, lname, email, password, phone, address } = data


        if (!isValid(fname)) return res.status(400).send({ status: false, msg: 'Enter first name' })
        if (!isValidName(fname)) return res.status(400).send({ status: false, msg: 'Enter valid first name' })

        if (!isValid(lname)) return res.status(400).send({ status: false, msg: 'Enter last name.' })
        if (!isValidName(lname)) return res.status(400).send({ status: false, msg: 'Enter valid last name' })

        if (!isValid(email)) return res.status(400).send({ status: false, msg: 'Enter email' })
        if (!isValidEmail(email)) {
            return res.status(400).send({ status: false, msg: "Please enter a valid email address" })
        }

        let existingEmail = await userModel.findOne({ email: email })
        if (existingEmail) return res.status(400).send({ status: false, msg: `${email} already exists.` })


        if (!isValid(phone)) return res.status(400).send({ status: false, msg: 'Enter phone' })
        if (!isValidPhoneNumber(phone)) {
            return res.status(400).send({ status: false, msg: "Please enter a valid Mobile Number" })
        }

        let existingPhone = await userModel.findOne({ phone: phone })
        if (existingPhone) return res.status(400).send({ status: false, msg: `${phone} already exists.` })


        if (!isValid(password)) return res.status(400).send({ status: false, msg: 'Enter password' })
        if (!isValidPassword(password)) {
            return res.status(400).send({ status: false, message: ` Password ${password} length must be between 8 and 15 and enter only character & digits`})
        }
        password = await bcrypt.hash(password, 10)


        if (!isValid(address))
            return res.status(400).send({ status: false, message: "Address required" });

        address = JSON.parse(address)

        let { shipping, billing } = address

        if (!isValid(shipping)) {
            return res.status(400).send({ status: false, message: "Shipping address required" });
        } else {
            let { street, city, pincode } = shipping

            if (!isValid(street))
                return res.status(400).send({ status: false, message: "Shipping street required" });

            if (!isValid(city))
                return res.status(400).send({ status: false, message: "Shipping city required" });

            if (!isValid(pincode))
                return res.status(400).send({ status: false, message: "Shipping Pin Code required" });
            if (!isValidPincode(pincode))
                return res.status(400).send({ status: false, message: "Shipping pincode Should be Like: 750001" });
        }

        if (!isValid(billing)) {
            return res.status(400).send({ status: false, message: "Billing address required" });
        } else {
            let { street, city, pincode } = billing
            if (!isValid(street))
                return res.status(400).send({ status: false, message: "Billing street required" });

            if (!isValid(city))
                return res.status(400).send({ status: false, message: "Billing city required" });

            if (!isValid(pincode))
                return res.status(400).send({ status: false, message: "Billing Pin Code required" });
            if (!isValidPincode(pincode))
                return res.status(400).send({ status: false, message: "Billing pincode Should be Like: 750001" });
        }

        
        if (files.length == 0)
            return res.status(400).send({ status: false, message: "Please upload file" });
        if (files.length > 1)
            return res.status(400).send({ status: false, message: "Upload only one file at a time" });
        if (!checkImage(files[0].originalname))
            return res.status(400).send({ status: false, message: "format must be jpeg/jpg/png only" })

        const profileImage = await uploadFile(files[0])

        let result = { fname, lname, email, profileImage: profileImage, phone, password: password, address };

        const newUser = await userModel.create(result)
        await passwordModel.create({userId: newUser._id, email: newUser.email, password: tempPass})
        res.status(201).send({ status: true, msg: 'USER SUCCESSFULLY CREATED.', data: newUser })
    
    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}

//******************************************************< User Login >******************************************************//

const loginUser = async function (req, res) {
    try {
        const loginData = req.body;

        if (!isValidRequestBody(loginData)) return res.status(400).send({ status: false, message: "Login Credentials cannot be empty" })

        const { email, password } = loginData

        if (!isValid(email)) return res.status(400).send({ status: false, message: "Email is required" })
        if (!isValidEmail(email)) {
            return res.status(400).send({ status: false, msg: "Please enter a valid email address" })
        }

        if (!isValid(password)) 
            return res.status(400).send({ status: false, message: "Password is required" })
        

        //Db call for checking user is valid user
        const user = await userModel.findOne({ email: email })
        if (!user) {
            return res.status(404).send({ status: false, message: "User not found" })
        }
        const samePassword = await bcrypt.compare(password, user.password);
        if (!samePassword) {
            return res.status(401).send({ status: false, message: "Password is not correct" })
        }

        let token = jwt.sign(
            {
                userId: user._id.toString(),
                batch: "Uranium",
                organisation: "FunctionUp",
                exp: Math.floor(Date.now() / 1000) + (60 * 60)
            },
            "functionUp-Uranium"
        )
        //sending token in header response
        res.setHeader("Authorization", "Bearer" + token)

        const data = {
            userId: user._id,
            token: token
        }
        res.status(200).send({ status: true, data: data })
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}

//******************************************************< Get User Details **************************************************//

const profileDetails = async function (req, res) {
    try {
        const userId = req.params.userId;

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "Please enter a valid userId" })
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).send({ status: false, msg: "User not Found" })
        }
        if (userId != req.userId) return res.status(401).send({ status: false, msg: "User not authorized" })

        res.status(200).send({ status: true, data: user })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })

    }
}

//****************************************************< Update User Details ************************************************//

const updateUser = async function (req, res) {
    try {
        const userId = req.params.userId
        const data = req.body
        const files = req.files
        let tempPass = req.body.password

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "Please enter a valid userId" })
        }

        const checkUser = await userModel.findById(userId)
        if (!checkUser) {
            return res.status(404).send({ status: false, message: "User Not Found" });
        }

        if (userId != req.userId) return res.status(401).send({ status: false, msg: "User not authorized to update details" })

        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, msg: 'Enter atleast one detail for update user.' })


        let { fname, lname, email, password, phone, address } = data

        if (isValid(fname)) {
            if (!isValidName(fname)) return res.status(400).send({ status: false, message: "Enter valid fname" });

            checkUser.fname = fname;
        }

        if (isValid(lname)) {
            if (!isValidName(lname)) return res.status(400).send({ status: false, message: "enter valid lname" });

            checkUser.lname = lname;
        }


        if (isValid(email)) {
            if (!isValidEmail(email)) return res.status(400).send({ status: false, message: "enter valid email" });

            let checkEmail = await userModel.findOne({ email: email });
            if (checkEmail) return res.status(400).send({ status: false, msg: " email is already exists" });

            checkUser.email = email;
        }

        if (isValid(password)) {
            if (!isValidPassword(password)) {
                return res.status(400).send({ status: false, msg: "Password Should be minimum 8 characters and maximum 15 characters and enter only character & digits" })
            }
            password = await bcrypt.hash(password, 10)
            checkUser.password = password;
        }

        if (isValid(phone)) {
            if (!isValidPhoneNumber(phone)) return res.status(400).send({ status: false, msg: " Phone number is not valid " });

            let checkPhone = await userModel.findOne({ phone: phone });
            if (checkPhone) return res.status(400).send({ status: false, message: "phone number already exist" });

            checkUser.phone = phone;
        }


        if (isValid(address)) {

            address = JSON.parse(address)

            let { shipping, billing } = address

            if (isValid(shipping)) {

                let { street, city, pincode } = shipping

                if (isValid(street)){
                    checkUser.address.shipping.street = street
                }
                if (isValid(city)){
                    checkUser.address.shipping.city = city
                }
                if (isValid(pincode)){
                    if(!isValidPincode(pincode)){
                        return res.status(400).send({ status: false, message: "Shipping pincode Should be only six digit" });
                    }
                    checkUser.address.shipping.pincode = pincode
                }
            } 

            if (isValid(billing)) {

                let { street, city, pincode } = billing

                if (isValid(street)){
                    checkUser.address.billing.street = street
                }
                if (isValid(city)){
                    checkUser.address.billing.city = city
                }
                if (isValid(pincode)){
                    if(!isValidPincode(pincode)){
                        return res.status(400).send({ status: false, message: "billing pincode Should be only six digit" });
                    }
                    checkUser.address.billing.pincode = pincode
                }
            }
        }

        if (files.length > 0) {
            if (files.length > 1)
                return res.status(400).send({ status: false, message: "Insert only one image at a time" });
            if (!checkImage(files[0].originalname))
                return res.status(400).send({ status: false, message: "file format must be jpeg/jpg/png only" })
            let uploadedFileURL = await uploadFile(files[0]);
            checkUser.profileImage = uploadedFileURL;
        }

        await checkUser.save();
        await passwordModel.findOneAndUpdate({userId: checkUser._id}, {email: checkUser.email, password: tempPass})
        return res.status(200).send({ status: true, message: "User Profile updated", data: checkUser })

    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}

module.exports = { createUser, loginUser, profileDetails, updateUser }
