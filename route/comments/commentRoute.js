const express = require('express');
const {
    createCommentCtrl,
    fetchAllCommentsCtrl,
    fetchSingleComment,
    updateCommandCtrl,
    deleteCommentCtrl,
} = require('../../controllers/comments/commentsCtrl');
const authMiddleware = require('../../middlewares/auth/authMiddleware');

const commentRouter = express.Router();


commentRouter.post("/",
    authMiddleware,
    createCommentCtrl)
commentRouter.get("/",
    fetchAllCommentsCtrl)
commentRouter.get("/:id",
    authMiddleware,
    fetchSingleComment)
commentRouter.put("/:id",
    authMiddleware,
    updateCommandCtrl)
commentRouter.delete("/:id",
    authMiddleware,
    deleteCommentCtrl)
module.exports = commentRouter;