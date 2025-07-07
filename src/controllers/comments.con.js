import { asyncHandle } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";
import { Comment } from "../models/comment.models.js";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { getVideoById } from "./video.con.js";

const getVideoComments = asyncHandle(async (req, res) => {
  //TODO: get all comments for a video
  const { page = 1, limit = 10 } = req.query;

  const { videoId } = req.params;
  if (!videoId?.trim()) throw new apiError(200, "Video-Id not found");

  const video = await Video.findById(videoId);
  if (!video) throw new apiError("Video not found");

  //aggregation work pending
});

const addComment = asyncHandle(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId?.trim()) throw new apiError(200, "Video-Id not found");
  const video = await Video.findById(videoId);
  if (!video) throw new apiError("Video not found");

  const { content } = req.body;
  if (!content || content.trim() === "") {
    throw new apiError(400, "Comment text is required");
  }

  const comment = await Comment.create({
    video: videoId,
    owner: req.user._id,
    content,
  });

  const populatedcomment = await Comment.findById(comment._id).populate({
    path: "owner",
    select: "fullName username avatar",
  });

  return res
    .status(200)
    .json(new apiResponse(200, populatedcomment, "successfully commented"));
});

export { addComment };
