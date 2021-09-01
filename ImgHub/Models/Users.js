const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    followers: Number,
    posts: Number
})

const userModel = new mongoose.model('user', userSchema)
module.exports = userModel;