const express = require('express')
const bodyParser = require('body-parser')
const session = require('express-session')
const router = express.Router()
const usersDB = require('../Models/UserModel.js')
const flash = require('connect-flash')

// @POST: Session Register Post
// @DESCRIPTION: Registers the user by saving their information onto the database
router.post('/register', (req, res)=> {
    const username = req.body.usernameInput
    const password = req.body.passwordInput
    const passwordConfirm = req.body.passwordConfirmation

    if(username.length >= 7) {
        req.flash('tooLongUsernameError', 'Username must be under 7 chars!')
        res.redirect('/register')
    } else if(password != passwordConfirm) {
        req.flash('passwordConfrimationError', 'Passwords do not match!')
        res.redirect('/register')

    } else if(password.length <= 5) {
        req.flash("passwordLengthError", "Password must be 6 digits or more!")
        res.redirect('/register')

    } else {
        usersDB.findOne({'username': {'$regex': `^${username}$`, $options: '?-i'}}, (err, data)=> {
            if(err) {
                throw err
            }

            if(data) {
                req.flash('usernameTakenError', "Username is already taken!")
                res.redirect('/register')
            } else if(!data) {
                const newUser = new usersDB({
                    username: username,
                    password: password,
                    followers: 0,
                    posts: 0
                })
        
                newUser.save((err, data)=> {
                    if(err) {
                        throw err
                    } else {
                        console.log(`> ${username} has signed up.`)
                        res.redirect('/login')
                    }
                })
            }
        })
    }
})

// @POST: Session Login Post
// @DESCRIPTION: Finds the user in the database and logs them in
router.post('/login', (req, res)=> {
    const username = req.body.usernameInput
    const password = req.body.passwordInput

    usersDB.findOne({'username': {'$regex': `^${username}$`, $options:'i'}, 'password': password}, (err, data)=> {
        if(err) {
            throw err
        } 

        if(!data) {
            req.flash('userNotFoundError', 'Incorrect username or password!')
            res.redirect('/login')
        } else if(data) {
            req.session.username = data.username
            req.session.loggedIn = true
            console.log(`> ${req.session.username} has logged in.`)

            res.redirect('/')
        }
    })

})

// @ROUTE: Log out Route
// @DESCRIPTION: Destroys the session & logs the user out
router.get('/logout', (req, res)=> {
    if(req.session.loggedIn == true) {
        req.session.destroy()
        res.redirect('/login')
    } else if(req.session.loggedIn != true) {
        res.redirect('/')
    }
})

module.exports = router