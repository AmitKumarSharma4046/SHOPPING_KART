const express = require('express')
const multer = require("multer")
const { AppConfig } = require('aws-sdk')
const bodyparser = require('body-parser')
const mongoose = require('mongoose')

const app = express()
app.use(bodyparser.json())
app.use(multer().any())

const router = require('./routes/route')

mongoose.connect("mongodb+srv://amit-DB:amit3112@cluster0.eztoe.mongodb.net/group41Database",
    { useNewUrlParser: true })
    .then(() => console.log("mongoDB is Connected!!"))
    .catch(err => console.log(err))

app.use('/', router)

app.listen(process.env.PORT || 3000, () => {
    console.log("server connected at Port :", process.env.PORT || 3000)
})