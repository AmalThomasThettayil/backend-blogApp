const expressAsyncHandler = require("express-async-handler")
const Post = require("../../model/post/post");
const validateMongodbId = require("../../utils/validateMongodbID");
const Filter = require("bad-words");
const User = require("../../model/user/User");
const cloudinaryUploadImg = require("../../utils/cloudinary");
// const objectId = require('mongodb').ObjectId



//-------------------------------------------------
//create post
//--------------------------------------------------
const createPostCtrl = expressAsyncHandler(async (req, res) => {
    const { _id } = req.user;
    //Display message if user is blocked
    // blockUser(req.user);
    //validateMongodbId(req.body.user);
    //Check for bad words
    const filter = new Filter();
    const isProfane = filter.isProfane(req.body.title, req.body.description);
    //Block user
    if (isProfane) {
        await User.findByIdAndUpdate(_id, {
            isBlocked: true,
        });
        throw new Error(
            "Creating Failed because it contains profane words and you have been blocked"
        );
    }



    if (
        req?.user?.accountType === "Starter Account" &&
        req?.user?.postCount >= 2
    ) {
        throw new Error(
            "Starter account can only create two posts. Get more followers."
        );
    }

    // //1. Get the path to img
    const localPath = `public/images/posts/${req.file.filename}`;
    // //2.Upload to cloudinary
    const imgUploaded = await cloudinaryUploadImg(localPath);
    try {
        const post = await Post.create({
            ...req.body,
            user: _id,
            image: imgUploaded?.url,
        });

        // update the user post count
        await User.findByIdAndUpdate(
            _id,
            {
                $inc: { postCount: 1 },
            },
            {
                new: true,
            }
        );

        // Remove uploaded img
        fs.unlinkSync(localPath);
        res.json(post);
    } catch (error) {
        res.json(error);
    }
});

//-------------------------------------------------
//fetch all post
//--------------------------------------------------
const fetchPostsCtrl = expressAsyncHandler(async (req, res) => {
    const hasCategory = req.query.category;
    try {
        //check for category
        if (hasCategory) {
            const posts = await Post.find({ category: hasCategory })
                .populate("user")
                .populate("comments");
            res.json(posts)
        } else {
            const posts = await Post.find({})
                .populate("user")
                .populate("comments")
                .sort({ createdAt: -1 });
            res.json(posts)
        }
    } catch (error) {
        console.log(error);
        res.json(error)
    }
})

//---------------------------------------------------
// fetch a single post
//---------------------------------------------------
const fetchPostCtrl = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id)
    try {
        const post = await Post.findById(id)
            .populate("user")
            .populate("dislikes")
            .populate("likes")
            .populate("comments")
        //update number of views
        await Post.findByIdAndUpdate(id, {
            $inc: { numViews: 1 },
        }, {
            new: true
        })
        res.json(post)
    } catch (error) {
        res.json(error)
    }
});

//--------------------------------------
//Update post
//--------------------------------------
const updatePostCtrl = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);
    try {
        const post = await Post.findByIdAndUpdate(id, {
            ...req.body,
            user: req.user?._id,
        },
            {
                new: true,
            }
        );
        res.json(post)
    } catch (error) {
        res.json(error)
    }
    res.json("Update");

});


//--------------------------------------
//Delete post
//--------------------------------------
const deletePostCtrl = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        const post = await Post.findByIdAndDelete(id)
        res.json(post);
    } catch (error) {
        res.json(error)
    }
})

//-------------------------------------------
//Likes
//-------------------------------------------
const toggleAddLikeToPostCtrl = expressAsyncHandler(async (req, res) => {

    //find the post to like
    const { postId } = req.body;
    const post = await Post.findById(postId);
    //find the login user
    const loginUserId = req?.user?._id;

    //find is this user has liked this post?
    const isLiked = post?.isLiked

    //If this user has disliked the post?
    const alreadyDisliked = post?.disLikes?.find(
        (userId) => userId?.toString() === loginUserId?.toString())

    // if alreadyDisliked remove the user from dislike array
    if (alreadyDisliked) {
        const post = await Post.findByIdAndUpdate(
            postId, {
            $pull: { disLikes: loginUserId },
            isDisliked: false,
        },
            { new: true }
        )
        res.json(post);
    }
    //remove the user if he  has liked the post
    if (isLiked) {
        const post = await Post.findByIdAndUpdate(postId, {
            $pull: { likes: loginUserId },
            isLiked: false
        }, {
            new: true
        })
        res.json(post)
    } else {
        //add to likes
        const post = await Post.findByIdAndUpdate(postId, {
            $push: { likes: loginUserId },
            isLiked: true,
        }, {
            new: true,
        })
        res.json(post);
    }
})
//---------------------------------------------------
//dislikes
//----------------------------------------------------
const toggleAndDislikeToPostCtrl = expressAsyncHandler(async (req, res) => {
    //find the post to be disliked
    const { postId, } = req.body;
    const post = await Post.findById(postId)
    //find the login user
    const loginUserId = req?.user?._id
    //check if the user has already disLikes
    const isDisLiked = post?.isDisliked
    //check if already like the post
    const alreadyLiked = post?.likes?.find(
        userId => userId.toString() === loginUserId?.toString()
    );
    //Remove this user from the likes array if it exists
    if (alreadyLiked) {
        const post = await Post.findByIdAndUpdate(postId, {
            $pull: { likes: loginUserId },
            isLiked: false
        },
            {
                new: true
            })
        res.json(post);
    }
    //toggling
    //remove this user from dislikes if alredy disliked
    if (isDisLiked) {
        const post = await Post.findByIdAndUpdate(postId, {
            $pull: { disLikes: loginUserId },
            isDisliked: false,
        }, { new: true })
        res.json(post);

    } else {
        const post = await Post.findByIdAndUpdate(postId, {
            $push: { disLikes: loginUserId },
            isDisliked: true,
        }, {
            new: true
        })
        res.json(post);
    }
})
module.exports = {
    createPostCtrl,
    fetchPostsCtrl,
    fetchPostCtrl,
    updatePostCtrl,
    deletePostCtrl,
    toggleAddLikeToPostCtrl,
    toggleAndDislikeToPostCtrl,

};