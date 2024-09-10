import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadFileCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    //saving the refreshToken in db...
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token "
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get the information eg. username , fullname, email etc. from the user from frontend..

  const { username, fullname, email, password } = req.body;
  // console.log(username);
  // console.log(email);
  // console.log(password);
  console.log(req.body);

  // checking validation...
  /*  if(fullname=== ""){
  return ApiError(404, "fullname is required.")
} */
  //this method can be used but we have to write code for every field so we will use advance and better method for validation...

  if (
    [fullname, username, email, password].some(
      (feilds) => feilds?.trim() === ""
    ) // this line returns true if any feild are empty. some method gives the functionality to check multiple elements together..
  ) {
    return ApiError(404, "all feilds are required!!");
  }

  // Now check if user exists..
  const existedUser = await User.findOne({
    $or: [{ username }, { email }], // $or operater is use to check multiple fields in db and this or operator if any od feild present it will return true..
  });

  if (existedUser) {
    throw new ApiError(409, "user already exists");
  }

  // check if avtar exists
  const avatarLocalPath = req.files?.avatar[0]?.path;
  console.log(avatarLocalPath);
  console.log(req.files);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required..");
  }

  // const coverImageLocalPath = req.files?.coverimage[0]?.path;
  // console.log(coverImageLocalPath);

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverimage) &&
    req.files.coverimage.length > 0
  ) {
    coverImageLocalPath = req.files.coverimage[0].path;
  }

  //  Now upload them on Cloudinary , avatar and coverimage..
  const avatar = await uploadFileCloudinary(avatarLocalPath);
  const coverimage = await uploadFileCloudinary(coverImageLocalPath);

  // check if avatar is uploaded or not as it is required field..
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required..");
  }

  // create object in db
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverimage: coverimage?.url || "",
    username,
    email,
    password,
  });

  // now check if user is created in db and remove feilds that are not required..
  const createdUser = await User.findById(user._id).select(
    "-password -refreshtoken"
  );
  if (!createdUser) {
    throw new ApiError(
      500,
      "something went wrong while registering the user.."
    );
  }

  // now last step is to send response..
  res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully..")); // here i made object of class ApiResponse and used to send the response..
});

// Here is a code of userlogin
const loginUser = asyncHandler(async (req, res) => {
  // step 1 is to get data from user...
  const { username, email, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "username and Email is required!");
  }

  // check whether username and email exist in database or not.
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "user does not Exist..");
  }

  // comparing the password from the hashed password

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(404, "Invalid user credentials..");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const option = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        " User Successfully loggedIn"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("refreshToken", option)
    .clearCookie("accessToken", option)
    .json(new ApiResponse(200, {}, "user loggedout"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorised Request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, " Refresh token is expired or used");
    }

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, "Invalid Refresh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid Password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: true });

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(200, req.user, "Current user fetched Successfully..")
    );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, "All fields are Required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { fullname, email },
    },
    {
      new: true,
    }
  ).select("-password");

  res
    .status(200)
    .json(new ApiResponse(200, user, "user information Updated Successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is missing");
  }

  const avatar = await uploadFileCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  const updatedAvatar = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  res
    .status(200)
    .json(new ApiResponse(200, updatedAvatar, "avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Coverimage is missing");
  }

  const coverimage = await uploadFileCloudinary(coverImageLocalPath);
  if (!coverimage.url) {
    throw new ApiError(400, "Error while uploading Coverimage");
  }

  const updatedCoverImage = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedCoverImage, "avatar updated successfully")
    );
});

// const getUserChannelProfile = asyncHandler(async (req, res) => {
//   const { username } = req.params;

//   if (!username?.trim()) {
//     throw new ApiError(400, "user is missing.");
//   }

//   const channel = await User.aggregate([
//     {
//       $addFields:
//     },
//   ]);
// });

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
};
