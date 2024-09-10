import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asynchandler.js";

export const verifyJwt = asyncHandler(async (req, _, next) => {
  // her res is not in use so at the place of res we can write _ ...
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", ""); // here I am using req.header to get the token from mobile devices as cookies does not exists ...
    console.log(token);

    if (!token) {
      throw new ApiError(401, "Unathorised Request");
    }

    //verifying the token accessed from cookies..
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError(400, "Invalid access Token");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.messege || "Invalid Access Token");
  }
});
