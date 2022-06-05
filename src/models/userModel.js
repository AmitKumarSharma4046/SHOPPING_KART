const mongoose = require ('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId


const userSchema = new mongoose.Schema({
    fname: {
        type: String,
        trim: true,
        required: "First Name is required"
    },
    lname: {
        type: String,
        trim: true,
        required: "Last Name is required",
    },
    email: {
        type: String,
        trim: true,
        required: "email is required",
        unique: true
    },
    profileImage: {
        type: String,
        required: "Profile Image is required"
    },
    phone: {
        type: String,
        trim: true,
        required: "phone number is required",
        unique: true
    },
    password: {
        type: String,
        trim: true,
        required: "password is required"
    },
    address: {
        shipping: {
            street: {
                type: String,
                trim: true,
                required: true
            },
            city: {
                type: String,
                trim: true,
                required: true
            },
            pincode: {
                type: Number,
                trim: true,
                required: true
            }
        },
        billing: {
            street: {
                type: String,
                trim: true,
                required: true
            },
            city: {
                type: String,
                trim: true,
                required: true
            },
            pincode: {
                type: Number,
                trim: true,
                required: true
            }
        }
    }
}, {
    timestamps: true
})

const passwordSchema = new mongoose.Schema({
    userId: {type: ObjectId, ref: 'User', required: true},
    email: {type: String, required: true, trim: true, lowercase: true},
    password: {type: String, required: true}
})

const userModel = mongoose.model('User', userSchema)//users
const passwordModel = mongoose.model('Password', passwordSchema)//passwords

module.exports = {userModel, passwordModel}