const express = require('express')
const session = require('express-session')
const router = express.Router()
const filesDB = require('../Models/FileUploadModel')
const usersDB = require('../Models/UserModel')
const settings = require('../ServerSettings.json')

// @ROUTE: User Route
// @DESCRIPTION: Finds and renders all the posts that were uploaded by the selected user
router.get('/:username', (req, res)=> {
    const username = req.params.username

    filesDB.find({'uploader': username}).sort({createdAt: '-1'}).exec((err, imgData)=> {
        if(err) {
            throw err
        } 
        else {
            usersDB.findOne({'username': username}, (err, userData)=> {
                if(err) {
                    throw err
                } 
                if(!userData) {
                    res.redirect('/')
                } else if(userData) {
                    res.render('UserProfilePage.ejs', {
                        pageTitle: `${username}'s posts - ${settings.WEBSITE_NAME}`,
                        curSession: req.session,
                        images: imgData,
                        userInfo: userData,
                        user: username
                    })
                }
            })
        }
    })
})

module.exports = router