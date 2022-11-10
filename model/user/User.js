const mongoose = require('mongoose')
const bcrypt = require('bcryptjs');
const crypto = require('crypto')

const userSchema = new mongoose.Schema({
    firstName: {
        required: [true, "First name is required"],
        type: String,
    },
    lastName: {
        required: [true, "Last name is required"],
        type: String,
    },
    profilePhoto: {
        type: String,
        default: 'https://image.pngaaa.com/441/1494441-middle.png'
    },
    email: {
        required: [true, "Email is required"],
        type: String,
    },
    password: {
        required: [true, "Password is required"],
        type: String,
    },
    postCount: {
        default: 0,
        type: Number
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ['Admin', 'Guest', 'Blogger'],
    },
    isFollowing: {
        type: Boolean,
        default: false
    },
    isUnFollowing: {
        type: Boolean,
        default: false
    },
    isAccountVerified: {
        type: Boolean,
        default: false
    },
    accountVerficationToken: String,
    accountVerficationTokenExpires: Date,
    veiwedBy: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            }
        ]
    },
    followers: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            }
        ]
    },
    following: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            }
        ]
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: false
    }
}, {
    toJSON: {
        virtuals: true,
    },
    toObject: {
        virtuals: true,
    },
    timestamps: true
})

//virtual method to populate created post
userSchema.virtual('posts', {
    ref: 'Post',
    foreignField: 'user',
    localField: '_id'
})

//Hash password
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    //hash password
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next();
})

//match password
userSchema.methods.isPasswordMatched = async function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password)
}

//verify account
userSchema.methods.createAccountVerificationToken = async function () {
    //create token
    const verificationToken = crypto.randomBytes(32).toString("hex")
    this.accountVerficationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest("hex");
    this.accountVerficationTokenExpires = Date.now() + 30 * 60 * 1000; //10minutes
    return verificationToken;
};

//forget password/reset
userSchema.methods.createPasswordResetToken = async function () {
    //create token
    const resetToken = crypto.randomBytes(32).toString("hex")
    this.passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex")
    this.passwordResetExpires = Date.now() + 30 * 60 * 1000 //10 min
    return resetToken
};


//compile schema into model
const User = mongoose.model("User", userSchema)
module.exports = User;