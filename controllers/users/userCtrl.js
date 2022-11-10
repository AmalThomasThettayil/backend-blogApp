const expressAsyncHandler = require("express-async-handler");
const sgMail = require("@sendgrid/mail");
const fs = require("fs")
const crypto = require("crypto")
const generateToken = require("../../config/token/generateToken");
const User = require("../../model/user/User");
const validateMongodbId = require("../../utils/validateMongodbID");
const cloudinaryUploadImg = require("../../utils/cloudinary");
sgMail.setApiKey(process.env.SEND_GRID_API_KEY);

//USER REGISTER
const userRegisterCtrl = expressAsyncHandler(async (req, res) => {
  //checkif user Exist
  const userExists = await User.findOne({ email: req?.body?.email });
  if (userExists) throw new Error("User already exists");
  try {
    const user = await User.create({
      firstName: req?.body?.firstName,
      lastName: req?.body?.lastName,
      email: req?.body?.email,
      password: req?.body?.password,
    });
    res.json(user);
  } catch (error) {
    res.json(error);
  }
});

//USER LOGIN
const loginUserCtrl = expressAsyncHandler(async (req, res) => {
  const { email, password } = req.body;
  //check if user Exist
  const userFound = await User.findOne({ email });
  //Check if password is match
  if (userFound && (await userFound.isPasswordMatched(password))) {
    res.json({
      _id: userFound?._id,
      firstName: userFound?.firstName,
      lastName: userFound?.lastName,
      email: userFound?.email,
      profilePhoto: userFound?.profilePhoto,
      isAdmin: userFound?.isAdmin,
      token: generateToken(userFound?._id),
    });
  } else if (!userFound) {
    res.status(404);
    throw new Error("Invalid Email!");
  } else {
    res.status(404);
    throw new Error("Invalid Password!");
  }
});

//FETCHING all users
const fetchUsersCtrl = expressAsyncHandler(async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    res.json(error);
  }
});

//DELETE USER
const deleteUserCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log(id);
  //checkif user id is valid
  validateMongodbId(id);
  try {
    const deletedUser = await User.findByIdAndDelete(id);
    res.json(deletedUser);
  } catch (error) {
    res.json(error);
  }
});

//Fetch single user
const fetchUserDetailsCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  //check if user id is valid
  validateMongodbId(id);
  try {
    const user = await User.findById(id);
    res.json(user);
  } catch (error) {
    res.json(error);
  }
})

//FETCH USER PROFILE
const userProfileCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params
  validateMongodbId(id)
  try {
    const myProfile = await User.findById(id).populate("posts")
    res.json(myProfile);
  } catch {
    res.json(error)
  }
})

//UPDATE USER PROFILE
const updateUserCtrl = expressAsyncHandler(async (req, res) => {
  const { _id } = req?.user

  validateMongodbId(_id)
  const user = await User.findByIdAndUpdate(_id, {
    firstName: req?.body?.firstName,
    lastName: req?.body?.lastName,
    email: req?.body?.email,
    bio: req?.body?.bio
  }, {
    new: true,
    runValidators: true,
  })
  res.json(user)
})

//UPDATE PASSWORD
const updateUserPasswordCtrl = expressAsyncHandler(async (req, res) => {
  //destructure the login user
  const { _id } = req.user;
  const { password } = req.body;
  validateMongodbId(_id);
  //find the user  by _id
  const user = await User.findById(_id);

  if (password) {
    user.password = password;
    const updatedUser = await user.save();
    res.json(updatedUser);
  } else {
    res.json(user)
  }
})

//FOLLOWING
const followingUserCtrl = expressAsyncHandler(async (req, res) => {
  const { followId } = req.body;
  const loginUserId = req.user.id;

  //find the target user and check if the login id exist
  const targetUser = await User.findById(followId)

  const alreadyFollowing = targetUser?.followers?.find(
    user => user?.toString() === loginUserId.toString()
  );

  if (alreadyFollowing) throw new Error("You have already followed this user")
  console.log(alreadyFollowing);

  //1. Find the user you want to follow(followId) and update its followers field
  await User.findByIdAndUpdate(followId, {
    $push: { followers: loginUserId },
    isFollowing: true,
  },
    {
      new: true
    })
  //2. Update the login user following field.
  await User.findByIdAndUpdate(loginUserId, {
    $push: { following: followId },
  },
    { new: true })
  console.log({ followId, loginUserId });
  res.json("YOu have successfully followed this user")
})

//------------------------------------------
//UNFOLLOW
//---------------------------------------
const unfollowUserCtrl = expressAsyncHandler(async (req, res) => {
  const { unFollowId } = req.body;
  const loginUserId = req.user.id;

  await User.findByIdAndUpdate(unFollowId, {
    $pull: { followers: loginUserId },
    isFollowing: false,
  }, { new: true })


  await User.findByIdAndUpdate(
    loginUserId,
    {
      $pull: { following: unFollowId },
    }, { new: true }
  )
  res.json("you have successfully unfollowed this user")
})

//------------------------------------------
//Block User
//--------------------------------------------
const blockUserCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id)

  const user = await User.findByIdAndUpdate(
    id,
    { isBlocked: true, },
    { new: true }
  );
  res.json(user)
})

//------------------------------------------
//UnBlock User
//--------------------------------------------
const unblockUserCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id)

  const user = await User.findByIdAndUpdate(
    id,
    { isBlocked: false, },
    { new: true }
  );
  res.json(user)
})

//-----------------------------------------
//GENERATE EMAIL VERIFICATION TOKEN
//-----------------------------------------

const generateVerificationTokenCtrl = expressAsyncHandler(async (req, res) => {
  const loginUserId = req.user.id;

  const user = await User.findById(loginUserId)
  console.log(user);
  try {
    //Generate token
    const verificationToken = await user.createAccountVerificationToken();
    //save the user
    await user.save()
    console.log(verificationToken)

    //build your message

    const resetURL = `Verify account within 10 minutes 
    <a href="http://localhost:3000/verify-account/${verificationToken}">
    Click to verify
    </a>`
    const msg = {
      to: 'amal.thms@gmail.com', // Change to your recipient
      from: 'amal.thms@gmail.com', // Change to your verified sender
      subject: 'Express: verify account',
      html: resetURL,
    }
    await sgMail.send(msg);
    res.json(resetURL)
  } catch (error) {
    res.json(error)
  }
}
)
//------------------------------
//ACCOUNT VERIFICATION
//------------------------------
const accountVerificationCtrl = expressAsyncHandler(async (req, res) => {
  const { token } = req.body
  const hashedToken = crypto.createHash('sha256').update("2623e8defc05eec0a031ef69ba91a8e307a88934fff15ed6e0bae943ef61b10a").digest('hex')
  //finsd this user by token
  const userFound = await User.findOne({
    accountVerficationToken: hashedToken,
    accountVerficationTokenExpires: { $gt: new Date() },
  })
  if (!userFound) throw new Error("Token expired, try again later")
  //update the property to true
  userFound.isAccountVerified = true;
  userFound.accountVerficationToken = undefined
  userFound.accountVerficationTokenExpires = undefined
  await userFound.save();
  res.json(userFound)
})
//---------------------------------------
//Forgot token generator
//-----------------------------------------
const forgetPasswordToken = expressAsyncHandler(async (req, res) => {
  //find the user by email
  const { email } = req.body
  const user = await User.findOne({ email })
  if (!user) throw new Error("User not found")

  try {
    const token = await user.createPasswordResetToken()
    console.log(token)
    await user.save();

    //build your message
    const resetURL = `Reset your password within 10 minutes 
    <a href="http://localhost:3000/reset-password/${token}">
    Click to reset
    </a>`
    const msg = {
      to: email, // Change to your recipient
      from: 'amal.thms@gmail.com', // Change to your verified sender
      subject: 'Express: Reset password',
      html: resetURL,
    };

    await sgMail.send(msg);
    res.json({
      msg: `A verification message is successfully sent to ${user?.email}.Reset now within 10 minutes, ${resetURL}`
    })
  } catch (error) {
    res.json(error)
  }

})

//---------------------------------------
//Passsword reset
//-------------------------------------------
const passwordResetCtrl = expressAsyncHandler(async (req, res) => {
  const { token, password } = req.body
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  //find this user by token
  const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: new Date() } })
  if (!user) throw new Error("Token expires, try again");

  //update the paSSword
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save()
  res.json(user);
});

//----------------------------------------
//PROFILE PHOTO UPLOAD
//-----------------------------------------

const profilePhotoUploadCtrl = expressAsyncHandler(async (req, res) => {
  //Find the login user
  const { _id } = req.user

  //1. Get the path to img
  const localPath = `public/images/profile/${req.file.filename}`;
  //2. Upload to cloudinary
  const imgUploaded = await cloudinaryUploadImg(localPath);

  const foundUser = await User.findByIdAndUpdate(_id, {
    profilePhoto: imgUploaded?.url,
  }, { new: true })

  //remove the saved images
  fs.unlinkSync(localPath);

  res.json(imgUploaded);

});


module.exports = {
  userRegisterCtrl,
  loginUserCtrl,
  fetchUsersCtrl,
  deleteUserCtrl,
  fetchUserDetailsCtrl,
  userProfileCtrl,
  updateUserCtrl,
  updateUserPasswordCtrl,
  followingUserCtrl,
  unfollowUserCtrl,
  blockUserCtrl,
  unblockUserCtrl,
  generateVerificationTokenCtrl,
  accountVerificationCtrl,
  forgetPasswordToken,
  passwordResetCtrl,
  profilePhotoUploadCtrl,
};
