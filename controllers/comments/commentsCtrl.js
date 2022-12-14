const expressAsyncHandler = require("express-async-handler");
const Comment = require("../../model/comment/comment");
const Post = require("../../model/post/post");
const validateMongodbId = require("../../utils/validateMongodbID");

//--------------------------------------
// create
//------------------------------------------
const createCommentCtrl = expressAsyncHandler(async (req, res) => {
    //1.Get the user
    const user = req.user
    //2. get the post
    const { postId, description } = req.body;
    try {
        const comment = await Comment.create({
            post: postId,
            user,
            description,
        })
        res.json(comment)
    } catch (error) {
        res.json(error)
    }

})
//-------------------------------------
//fetch all comments
//-------------------------------------
const fetchAllCommentsCtrl = expressAsyncHandler(async (req, res) => {
    try {
        const comments = await Comment.find({}).sort("-created");
        res.json(comments)
    } catch (error) {
        res.json(error)
    }
})
//------------------------------------------
//comment details
//----------------------------------------------

const fetchSingleComment = expressAsyncHandler(async (req, res) => {
    const { id } = req.params
    validateMongodbId(id)
    try {
        const comment = await Comment.findById(id);
        res.json(comment)
    } catch (error) {
        res.json(error)
    }

})
//------------------------------------------
//update 
//----------------------------------------------
const updateCommandCtrl = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log(id);
    validateMongodbId(id)
    try {
        const update = await Comment.findByIdAndUpdate(id, {

            user: req?.user,
            description: req?.body?.description,
        }, {
            new: true,
            runValidators: true,
        })
        res.json(update);
    } catch (error) {
        res.json(error)
    }
})
//------------------------------------------
//delete 
//----------------------------------------------
const deleteCommentCtrl = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id)
    try {
        const comment = await Comment.findByIdAndDelete(id);
        res.json(comment)
    } catch (error) {
        res.json(error)
    }
})
module.exports = {
    createCommentCtrl,
    fetchAllCommentsCtrl,
    fetchSingleComment,
    updateCommandCtrl,
    deleteCommentCtrl,
}