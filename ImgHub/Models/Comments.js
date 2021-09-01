const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
    postId: String,
    commentAuthor: String,
    commentText: String
}, {timestamps: true})

const commentModel = new mongoose.model('comment', commentSchema)
module.exports = commentModel