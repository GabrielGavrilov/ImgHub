const express = require('express')
const bodyParser = require('body-parser')
const router = express.Router()
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const usersDB = require('../Models/UserModel.js')
const filesDB = require('../Models/FileUploadModel.js')

//Creates the file storage
const fileStorage = multer.diskStorage({
    destination: (req, file, cb)=> {
        cb(null, './Uploads/')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + ' - ' + file.originalname)
    }
})

//Creates the upload for the files
const fileUpload = multer({
    storage: fileStorage,
    fileFilter: (req, file, cb)=> {
        const ext = path.extname(file.originalname)
        if(ext != '.png' && ext != '.jpg' && ext != '.jpeg') {
            return cb(new Error('Only images are allowed'))
        }
        cb(null, true)
    }
})

// @POST: Upload Post
// @DESCRIPTION: Saves the image's data onto the database.
router.post('/upload', fileUpload.single('fileInput'), (req, res)=> {
    if(req.session.loggedIn == true) {
        const user = req.session.username

        if(req.fileValidationError) {
            res.redirect('/')
        } 

        const newFile = new filesDB({
            img: {
                data: fs.readFileSync(path.join('./Uploads/' + req.file.filename)),
                contentType: 'image/png'
            },
            uploader: user,
            likes: 0,
            comments: 0
        })

        newFile.save((err, data)=> {
            if(err) {
                throw err
            } else {
                console.log(`> ${req.session.username} has uploaded: ${req.file.filename}`)
                usersDB.findOne({'username': user}, (err, userData)=> {
                    if(err) {
                        throw err
                    } else {
                        const findUser = {
                            'username': user
                        }

                        usersDB.findOneAndUpdate(findUser, {'posts': userData.posts + 1}, (err, data)=> {
                            if(err) {
                                throw err
                            } else {
                                res.redirect('/user/' + user)
                            }
                        })
                    }
                })
            }
        })
    } else if(req.session.loggedIn != true) {
        res.redirect('/')
    }
})

module.exports = router