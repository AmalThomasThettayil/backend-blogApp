const express = require("express");
const { sendEmailMsgCtrl } = require("../../controllers/email/emailMsgCtrl");
const authMiddleware = require('../../middlewares/auth/authMiddleware');

const emailRouter = express.Router();

emailRouter.post("/",
    authMiddleware,
    sendEmailMsgCtrl,)

module.exports = emailRouter;