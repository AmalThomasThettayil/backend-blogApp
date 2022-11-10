const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        // required: true,
        trim: true,
    },
    //created by admin only
    category: {
        type: String,
        required: [true, "Post category is required"],

    },
    isLiked: {
        type: Boolean,
        default: false,
    },
    isDisliked: {
        type: Boolean,
        default: false,
    },
    numViews: {
        type: Number,
        default: 0,
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    disLikes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        //required: [true, "Author is required"],
    },
    description: {
        type: String,
        // required: [true, "Description is required"],
    },
    image: {
        type: String,
        default: "https://cdn.pixabay.com/photo/2022/05/21/09/30/cat-7211080_960_720.jpg",
    }
}, {
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    },
    timestamps: true,
})

//populate comment
postSchema.virtual('comments', {
    ref: 'Comment',
    foreignField: 'post',
    localField: '_id',
})

//compile

const Post = mongoose.model("Post", postSchema)
module.exports = Post; 