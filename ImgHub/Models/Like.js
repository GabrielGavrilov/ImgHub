const mongoose = require('mongoose')

const likeSchema = new mongoose.Schema({
    postId: String,
    likedBy: String
})

const likeModel = new mongoose.model('like', likeSchema)
module.exports = likeModel