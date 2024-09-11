import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { uploadFileCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  try {
    const { title, description } = req.body;
    // TODO: get video, upload to cloudinary, create video

    if (!(title || description)) {
      throw new ApiError(400, "video does not found");
    }

    const videoFileLocalPath = req.files?.videofile[0]?.path;
    console.log(videoFileLocalPath);

    if (!videoFileLocalPath) {
      throw new ApiError(400, "videofile is required");
    }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    console.log(thumbnailLocalPath);

    if (!thumbnailLocalPath) {
      throw new ApiError(400, "thumbnail is required");
    }

    const uploadVideoFile = await uploadFileCloudinary(videoFileLocalPath);
    const uploadThumbnail = await uploadFileCloudinary(thumbnailLocalPath);

    if (!uploadVideoFile && !uploadThumbnail) {
      throw new ApiError(
        400,
        "videofile as well as thumbnail both are required"
      );
    }

    const video = await Video.create({
      title,
      description,
      videofile: uploadVideoFile.url,
      thumbnail: uploadThumbnail.url,
      user: req.user._id,
    });

    res
      .status(200)
      .json(new ApiResponse(200, video, "video published successfully"));
  } catch (error) {
    throw new ApiError(500, "Problem in publishing the video");
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
