import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { uploadFileCloudinary } from "../utils/cloudinary.js";
import { response } from "express";

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
  const { videoId } = req.params._id;
  //TODO: get video by id

  if (!videoId) {
    throw new ApiError(400, "video not found.");
  }
  res
    .status(200)
    .json(new ApiResponse(200, videoId, "video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  //TODO: update video details like title, description, thumbnail
  try {
    const { videoId } = req.params._id;

    const { title, description } = req.body;

    if (!title || !description) {
      throw new ApiError(400, "title and description not found");
    }

    const localPathThumbnail = req.file?.path;
    if (!localPathThumbnail) {
      throw new ApiError(400, "Thumbnail is missing");
    }
    const thumbnail = await uploadFileCloudinary(localPathThumbnail);
    if (!thumbnail.url) {
      throw new ApiError(400, "Error while uploading thumbnail");
    }

    const video = await Video.findByIdAndUpdate(
      videoId,
      {
        $set: {
          title,
          description,
          thumbnail: thumbnail.url,
        },
      },
      {
        new: true,
      }
    );

    res.status(200).json(200, video, "Video updated successfully");
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while updating video.",
      error.messege
    );
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params._id;
  //TODO: delete video
  try {
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(400, "video not found");
    }

    await video.remove();
    res
      .status(200)
      .json(new ApiResponse(200, {}, "video deleted successfully."));
  } catch (error) {
    throw new ApiError(500, "there is problem to delete the video.");
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  try {
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "video not found");
    }

    video.isPublished = !video.isPublished;

    await video.save();
    res.status(200).json(
      new response(
        200,
        {
          isPublished: video.isPublished,
        },
        "video toggled successfully."
      )
    );
  } catch (error) {
    throw new ApiError(500, "failed to update public status");
  }
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
