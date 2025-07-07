import { asyncHandle } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";
import { apiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandle(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  // Convert page and limit to numbers and validate

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  // Build the match stage for aggregation i.e Only get published videos

  const matchStage = {
    isPublished: true,
  };

  // Add search query if provided

  if (query) {
    matchStage.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  // Add userId filter if provided

  if (userId) {
    matchStage.owner = new mongoose.Types.ObjectId(userId);
  } else {
    throw new apiError(400, "Invalid userId format");
  }
  // Build sort stage

  const sortStage = {};
  const validSortFields = ["createdAt", "views", "duration", "title"];
  const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sortOrder = sortType.toLowerCase() === "asc" ? 1 : -1;
  sortStage[sortField] = sortOrder;

  // Aggregation pipeline

  const pipeline = [
    {
      $match: matchStage,
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: { $first: "$owner" },
      },
    },
    {
      $project: {
        title: 1,
        description: 1,
        thumbnail: 1,
        videoFile: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        owner: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
    {
      $sort: sortStage,
    },
  ];

  // Execute aggregation with pagination

  const videos = await Video.aggregate([
    ...pipeline,
    { $skip: skip },
    { $limit: limitNum },
  ]);

  // Get total count for pagination info

  const totalVideos = await Video.aggregate([
    ...pipeline,
    {
      $count: "total",
    },
  ]);

  const totalCount = totalVideos[0]?.total || 0;
  const totalPage = Math.ceil(totalCount / limitNum);
  const hasNextPage = pageNum < totalPage;
  const hasPreviousPage = pageNum > 1;

  // Response with pagination info

  return res.status(200).json(
    new apiResponse(
      200,
      {
        videos,
        pagination: {
          currentPage: pageNum,
          limit: limitNum,
          totalVideos: totalCount,
          totalPage,
          hasNextPage,
          hasPreviousPage,
        },
      },
      "Videos fetched suckSex"
    )
  );
});

const publishAVideo = asyncHandle(async (req, res) => {
  const { title, description } = req.body;
  //Validation
  if ([title, description].some((field) => field?.trim() === ""))
    throw new apiError(400, "all fields are rerquired");

  const videoLocalPath = req.files?.video?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoLocalPath) throw new apiError(500, "failed to upload video");

  let videoFile;
  try {
    videoFile = await uploadOnCloudinary(videoLocalPath);
    console.log("video uploaded successfully");
  } catch (error) {
    console.log("Error uploading video", error);
    throw new apiError(500, "Failed to upload video");
  }
  let thumbnail;
  try {
    thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    console.log("thumbnail uploaded successfully");
  } catch (error) {
    console.log("Error uploading thumbnail", error);
    throw new apiError(500, "Failed to upload thumbnail");
  }
  try {
    const video = await Video.create({
      title,
      description,
      videoFile: videoFile.url,
      thumbnail: thumbnail?.url || "",
      duration: videoFile.duration || videoFile.resource?.duration || 0,
      isPublished: true,
      owner: req.user._id,
    });

    return res.status(201).json(new apiResponse(201, video, "Video Uploaded"));
  } catch (error) {
    console.log("SWW while uploading VDO");
    if (videoFile.public_id) await deleteFromCloudinary(videoFile.public_id);
    if (thumbnail.public_id) await deleteFromCloudinary(thumbnail.public_id);
    throw new apiError(500, "Something went wrong while uploading VDO");
  }
});

const getVideoById = asyncHandle(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId?.trim()) {
    throw new apiError(400, "Video-Id is required");
  }

  if (!mongoose.Types.ObjectId.isValid(videoId))
    throw new apiError(400, "Video-Id is incorrect BABUUU!!");

  const video = await Video.findById(videoId);

  if (!video) throw new apiError(401, "Could not find video");

  return res
    .status(200)
    .json(new apiResponse(200, video, "found the video by Id"));
});

const updateVideo = asyncHandle(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  if (!videoId?.trim()) {
    throw new apiError(400, "Video-Id is required");
  }

  if (!mongoose.Types.ObjectId.isValid(videoId))
    throw new apiError(400, "Video-Id is incorrect BABUUU!!");

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
      },
    },
    { new: true }
  );

  return res.status(201).json(new apiResponse(201, video, "Updated SuckSex"));
});

const updateThumbnail = asyncHandle(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId?.trim()) {
    throw new apiError(400, "Video ID is required");
  }

  const thumbnailLocalPath = req.file?.path;
  if (!thumbnailLocalPath) {
    throw new apiError(401, "File is req");
  }

  const existingVideo = await Video.findById(videoId);
  if (!existingVideo) throw new apiError(403, "your id not found");

  if (existingVideo.owner.toString() !== req.user._id.toString())
    throw new apiError(403, "you can only update your videos");

  console.log(req.user._id);

  let thumbnail;
  try {
    thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail.url) throw new apiError(403, "failed to upload");
  } catch (error) {
    console.log(error);
    if (!thumbnail.url) throw new apiError(403, "failed to upload");
  }

  const newVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        thumbnail: thumbnail.url,
      },
    },
    { new: true }
  );
  if (existingVideo.thumbnail) {
    try {
      // Extract public_id from old thumbnail URL
      const oldPublicId = existingVideo.thumbnail
        .split("/")
        .pop()
        .split(".")[0];
      await deleteFromCloudinary(oldPublicId);
    } catch (error) {
      console.log("Error deleting old thumbnail:", error);
      // Don't throw error here, just log it
    }
  }

  return res
    .status(200)
    .json(new apiResponse(200, newVideo, "Thumbnail updated successfully"));
});

const deleteVideo = asyncHandle(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId?.trim()) throw new apiError(400, "video-Id not found");

  const video = await Video.findById(videoId);
  if (!video) throw new apiError(400, "video not found");

  if (video.owner.toString() !== req.user?._id.toString())
    throw new apiError(400, "Damn!!! his video does not belongs to you");

  if (video.thumbnail) {
    try {
      const oldPublicId = video.thumbnail.split("/").pop().split(".")[0];
      await deleteFromCloudinary(oldPublicId);
    } catch (error) {
      console.log("Error deleting thumbnail:", error);
    }
  }
  if (video.videoFile) {
    try {
      const oldPublicId = video.videoFile.split("/").pop().split(".")[0];
      await deleteFromCloudinary(oldPublicId);
    } catch (error) {
      console.log("Error deleting videoFile:", error);
    }
  }
  await Video.findByIdAndDelete(videoId);
  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { deletedVideo: video },
        "Video deleated successfully"
      )
    );
});

const togglePublishStatus = asyncHandle(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId?.trim()) throw new apiError(400, "video-Id not found");

  const video = await Video.findById(videoId);
  if (!video) throw new apiError(400, "video not found");

  if (video.owner.toString() !== req.user?._id.toString())
    throw new apiError(400, "Damn!!! his video does not belongs to you");
  video.isPublished = !video.isPublished;
  await video.save();
  return res
    .status(200)
    .json(new apiResponse(200, video, "ispublished toggle successfully"));
});
export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateThumbnail,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
