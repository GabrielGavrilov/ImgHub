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

const usersDB = require('./Models/Users.js')
const filesDB = require('./Models/FileUpload.js')
const likeDB = require('./Models/Like.js')
const commentDB = require('./Models/Comments.js')
const server = express()

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
    storage: fileStorage
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
//                     ROUTES                     //
///////////////////////////////////////////////////

// @ROUTE: Home Route
// @DESCRIPTION: Renders the homepage
server.get('/', (req, res)=> {
    filesDB.find({}).sort({createdAt: '-1'}).exec((err, data) => {
        if(err) {
            throw err
        } else {
            res.render('Home.ejs', {
                pageTitle: "Feed :: ImgHub",
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
        res.render('Register.ejs', {
            pageTitle: "Register :: ImgHub",
            passwordConfrimationError: req.flash('passwordConfrimationError'),
            passwordLengthError: req.flash('passwordLengthError'),
            usernameTakenError: req.flash('usernameTakenError'),
            tooLongUsernameError: req.flash('tooLongUsernameError'),
            curSession: req.session
        })
    }
})

// @POST: Api Register Post
// @DESCRIPTION: Registers the user by saving their information onto the database
server.post('/api/register', (req, res)=> {
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

// @ROUTE: Login Route
// @DESCRIPTION: Renders the login page
server.get('/login', (req, res)=> {
    if(req.session.loggedIn == true) {
        res.redirect('/')
    } else {
        res.render('Login.ejs', {
            pageTitle: "Login :: ImgHub",
            userNotFoundError: req.flash('userNotFoundError'),
            curSession: req.session
        })
    }
})

// @POST: Api Login Post
// @DESCRIPTION: Finds the user in the database and logs them in
server.post('/api/login', (req, res)=> {
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

// @ROUTE: Logout Route
// @DESCRIPTION: Destroys the session & logs the user out
server.get('/api/logout', (req, res)=> {
    if(req.session.loggedIn == true) {
        req.session.destroy()
        res.redirect('/login')
    } else if(req.session.loggedIn != true) {
        res.redirect('/')
    }
})

// @ROUTE: Upload Route
// @DESCRIPTION: Renders the upload file page
server.get('/upload', (req, res)=> {
    if(req.session.loggedIn == true) {
        res.render('Upload.ejs', {
            pageTitle: "Upload :: ImgHub",
            curSession: req.session
        })
    } else {
        res.redirect('/login')
    }
})

// @POST: Upload Post
// @DESCRIPTION: Saves the image's data onto the database.
server.post('/api/upload', fileUpload.single('fileInput'), (req, res)=> {
    if(req.session.loggedIn == true) {
        const user = req.session.username

        const newFile = new filesDB({
            img: {
                data: fs.readFileSync(path.join(__dirname + '/Uploads/' + req.file.filename)),
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

// @ROUTE: User Route
// @DESCRIPTION: Renders all the posts that were uploaded by the selected user
server.get('/user/:username', (req, res)=> {
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
                    res.render('User.ejs', {
                        pageTitle: `${username}'s posts :: ImgHub`,
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

// @GET: Like Post
// @DESCRIPTION: Like post feature - finds the post and adds 1 to the likes, or removes 1, depending on if the user is already liking the post or not
server.get('/api/like/:id', (req, res)=> {
    if(req.session.loggedIn == true) {
        const id = req.params.id
        const likedByUser = req.session.username 

        //Finds the like query
        likeDB.findOne({'postId': id, 'likedBy': likedByUser}, (err, likeData)=> {
            if(err) {
                throw err
            } 

            //If like query is found ~ subtract one from the posts likes and remove the query
            if(likeData) {
                filesDB.findOne({'_id': id}, (err, postData)=> {
                    if(err) {
                        throw err
                    }

                    if(!postData) {
                        res.redirect('/')
                    } else if(postData) {
                        const findPost = {
                            '_id': id
                        }

                        filesDB.findOneAndUpdate(findPost, {'likes': postData.likes - 1}, (err, data)=> {
                            if(err) {
                                throw err
                            } else {
                                likeDB.deleteOne({'postId': id, 'likedBy': likedByUser}, (err)=> {
                                    if(err) {
                                        throw err
                                    } else {
                                        res.redirect('/')
                                    }
                                })
                            }
                        })
                    }
                })

            //If like query is not found ~ add one to the posts like and create a query
            } else if(!likeData) {
                filesDB.findOne({'_id': id}, (err, postData)=> {
                    if(err) {
                        throw err
                    }
    
                    if(!postData) {
                        res.redirect('/')
                    } else if(postData) {
                        const findPost = {
                            '_id': id
                        }
    
                        filesDB.findOneAndUpdate(findPost, {'likes': postData.likes + 1}, (err, data)=> {
                            if(err) {
                                throw err
                            } else {
                                const newLike = new likeDB({
                                    postId: id,
                                    likedBy: likedByUser
                                })
                    
                                newLike.save((err, data)=> {
                                    if(err) {
                                        throw err
                                    } else {
                                        res.redirect('/')
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })   
    } else if(req.session.loggedIn != true) {
        res.redirect('/login')
    }
})

//@ROUTE: Post Route
//@DESCRIPTION: Shows the selected image, along with its stats & comments.
server.get('/post/:id', (req, res)=> {
    const id = req.params.id

    filesDB.findById(id, (err, fileData)=> {
        if(err) {
            throw err
        } 

        if(!fileData) {
            res.redirect('/')
        } else if(fileData) {
            commentDB.find({'postId': id}).sort({createdAt: '-1'}).exec((err, commentData) => {
                if(err) {
                    throw err
                } else {
                    res.render('Posts.ejs', {
                        pageTitle: "Post :: ImgHub",
                        curSession: req.session,
                        comments: commentData,
                        image: [fileData]
                    })
                }
            })
        }
    })
})

//@POST: Comment Post
//@DESCRIPTION: Creates & saves a new comment to the post, as well as updating the posts stats.
server.post('/api/comment/:id', (req, res)=> {
    const id = req.params.id
    const comment = req.body.commentInput

    const newComment = new commentDB({
        postId: id,
        commentAuthor: req.session.username,
        commentText: comment
    })

    if(comment.length > 70) {
        res.redirect(`/post/${id}`)
    } else {
        newComment.save((err, data)=> {
            if(err) {
                throw err
            } else {
                filesDB.findOne({'_id': id}, (err, fileData) => {
                    if(err) {
                        throw err
                    }
    
                    if(!fileData) {
                        res.redirect('/')
                    } else if(fileData) {
                        const findPost = {
                            '_id': id
                        }
    
                        filesDB.findOneAndUpdate(findPost, {'comments': fileData.comments + 1}, (err, data)=> {
                            if(err) {
                                throw err
                            } else {
                                res.redirect(`/post/${id}`)
                            }
                        })
    
                    }
                })
            }
        })
    }
})

//@ROUTE: 404 Error Route
//@DESCRIPTION: Renders the 404 page when the route is not found -- Don't like how it looks like, might update it later
server.get('*', (req, res)=> {
    res.render('404.ejs', {
        pageTitle: "404 Error :: ImgHub",
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
        console.log(`\n ImgHub Web Server - ${settings.SERVER_VERSION}`)
        console.log(`-------------------------------------------------------`)
        console.log('> Server is up and running.')
    }
})