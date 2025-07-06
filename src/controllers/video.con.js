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
    matchStage.owner = userId;
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
        form: "users",
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
  const totalPage = totalCount / limitNum;
  const hasNextPage = pageNum < totalCount;
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
export { getAllVideos };
