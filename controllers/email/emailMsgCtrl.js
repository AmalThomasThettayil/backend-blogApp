const expressAsyncHandler = require('express-async-handler');
const sgMail = require("@sendgrid/mail");
const EmailMsg = require('../../model/EmailMessaging/EmailMessaging');
const Filter = require("bad-words")

const sendEmailMsgCtrl = expressAsyncHandler(async (req, res) => {
    console.log(req.body);
    const { to, subject, message } = req.body
    //get the message
    const emailMessage = subject + ' ' + message
    //prevent profane words
    const filter = new Filter();

    const isProfane = filter.isProfane(emailMessage);
    if (isProfane) throw new Error("Email sending failed, beacause  it contains profane words")
    try {
        // build up msg
        const msg = {
            to,
            subject,
            text: message,
            from: 'amal.thms@gmail.com'
        }
        // //send message
        await sgMail.send(msg)
        //save to our db
        await EmailMsg.create({
            sentBy: req?.user?._id,
            from: req?.user?.email,
            to,
            message,
            subject,
        });
        res.json("Mail send")
    } catch (error) {
        res.json(error)
    }
})
module.exports = { sendEmailMsgCtrl };
