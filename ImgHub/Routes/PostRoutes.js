const express = require('express')
const bodyParser = require('body-parser')
const router = express.Router()
const usersDB = require('../Models/Users')
const filesDB = require('../Models/FileUpload')
const likeDB = require('../Models/Like')
const commentDB = require('../Models/Comments')
const settings = require('../ServerSettings.json')

//@ROUTE: Post Route
//@DESCRIPTION: Shows the selected image, along with its stats & comments.
router.get('/:id', (req, res)=> {
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
                        pageTitle: "Post :: " + settings.WEBSITE_NAME,
                        curSession: req.session,
                        comments: commentData,
                        image: [fileData]
                    })
                }
            })
        }
    })
})

// @GET: Like Post
// @DESCRIPTION: Like post feature - finds the post and adds 1 to the likes, or removes 1, depending on if the user is already liking the post or not
router.get('/like/:id', (req, res)=> {
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

//@POST: Comment Post
//@DESCRIPTION: Creates & saves a new comment to the post, as well as updating the posts stats.
router.post('/comment/:id', (req, res)=> {
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

module.exports = router