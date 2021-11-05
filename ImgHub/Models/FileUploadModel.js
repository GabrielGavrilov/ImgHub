const mongoose = require('mongoose')

const fileSchema = new mongoose.Schema({
    img: {
        data: Buffer,
        contentType: String
    },
    uploader: String,
    likes: Number,
    comments: Number
}, {timestamps: true})

const fileModel = new mongoose.model('file', fileSchema)
module.exports = fileModel