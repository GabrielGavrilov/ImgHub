/*
* ImgHub - An image sharing platform.
* @version 1.1.1
* @authors Gabriel Gavrilov <gabrielgavrilov11@gmail.com>
*/

/////////////////////////////////////////////////////
//              NECESSARY REQUIREMENTS            //
///////////////////////////////////////////////////

const settings = require('./ServerSettings.json')

const express = require('express')
const session = require('express-session')
const mongoose = require('mongoose')
const MongoStore = require('connect-mongo')
const bodyParser = require('body-parser')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const flash = require('connect-flash')

const usersDB = require('./Models/UserModel.js')
const filesDB = require('./Models/FileUploadModel.js')
const likeDB = require('./Models/LikeModel.js')
const commentDB = require('./Models/CommentModel.js')
const server = express()

const sessionRoutes = require('./Routes/SessionRoutes')
const fileRoutes = require('./Routes/FileRoutes')
const userRoutes = require('./Routes/UserRoutes')
const postRoutes = require('./Routes/PostRoutes')

/////////////////////////////////////////////////////
//   DATABASE / EXPRESS SESSIONS / FILE STORAGE   //
///////////////////////////////////////////////////

//Connects to the database
mongoose.connect(settings.DBURI, {
    useUnifiedTopology: true,
    useNewUrlParser: true
}, (err) => {
    if(err) {
        throw err
    } else {
        console.log('> Server connected to the database.')
    }
})

//Creates a new storage for express sessions
const sessionStore = new MongoStore({
    mongoUrl: settings.DBURI,
    collectionName: 'sessions'
})

/////////////////////////////////////////////////////
//                   MIDDLEWARE                   //
///////////////////////////////////////////////////

server.set('view engine', 'ejs')
server.use(bodyParser.json())
server.use(bodyParser.urlencoded({extended: true}))

server.use(express.static(__dirname + '/CSS'))
server.use(express.static(__dirname + '/JavaScript'))

//Sets the settings for express sessions
server.use(session({
    secret: settings.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }
}))

server.use(flash())

/////////////////////////////////////////////////////
//                EXTERNAL ROUTES                 //
///////////////////////////////////////////////////

server.use('/session', sessionRoutes)
server.use('/file', fileRoutes)
server.use('/user', userRoutes)
server.use('/post', postRoutes)

/////////////////////////////////////////////////////
//                   STATIC WEB                   //
///////////////////////////////////////////////////

// @ROUTE: Home Route
// @DESCRIPTION: Renders the homepage
server.get('/', (req, res)=> {
    filesDB.find({}).sort({createdAt: '-1'}).exec((err, data) => {
        if(err) {
            throw err
        } else {
            res.render('FeedPage.ejs', {
                websiteTitle: settings.WEBSITE_NAME,
                curSession: req.session,
                images: data
            })
        }
    })
})

// @ROUTE: Register Route
// @DESCRIPTION: Renders the register page
server.get('/register', (req, res)=> {
    if(req.session.loggedIn == true) {
        res.redirect('/')
    } else {
        res.render('RegisterPage.ejs', {
            websiteTitle: settings.WEBSITE_NAME,
            passwordConfrimationError: req.flash('passwordConfrimationError'),
            passwordLengthError: req.flash('passwordLengthError'),
            usernameTakenError: req.flash('usernameTakenError'),
            tooLongUsernameError: req.flash('tooLongUsernameError'),
            curSession: req.session
        })
    }
})

// @ROUTE: Login Route
// @DESCRIPTION: Renders the login page
server.get('/login', (req, res)=> {
    if(req.session.loggedIn == true) {
        res.redirect('/')
    } else {
        res.render('LoginPage.ejs', {
            websiteTitle: settings.WEBSITE_NAME,
            userNotFoundError: req.flash('userNotFoundError'),
            curSession: req.session
        })
    }
})

// @ROUTE: Upload Route
// @DESCRIPTION: Renders the upload file page
server.get('/upload', (req, res)=> {
    if(req.session.loggedIn == true) {
        res.render('UploadPage.ejs', {
            websiteTitle: settings.WEBSITE_NAME,
            curSession: req.session
        })
    } else {
        res.redirect('/login')
    }
})

//@ROUTE: 404 Error Route
//@DESCRIPTION: Renders the 404 page when the route is not found -- Don't like how it looks like, might update it later
server.get('*', (req, res)=> {
    res.render('PageNotFound.ejs', {
        websiteTitle: settings.WEBSITE_NAME,
        curSession: req.session
    })
})

/////////////////////////////////////////////////////
//                      MISC                      //
///////////////////////////////////////////////////

//Starts the web server
server.listen(settings.PORT, settings.HOST, (err)=> {
    if(err) {
        throw err;
    } else {
        console.log(`${settings.WEBSITE_NAME} Web Server - ${settings.SERVER_VERSION}`)
        console.log(`-------------------------------------------------------`)
        console.log('> Server is up and running.')
    }
})