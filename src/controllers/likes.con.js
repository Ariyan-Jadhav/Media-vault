import { asyncHandle } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";
import { Like } from "../models/like.models.js";
import { Video } from "../models/video.models.js";
import { Comment } from "../models/comment.models.js";

const toggleVideoLike = asyncHandle(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId?.trim()) throw new apiError(400, "Please Enter a video-Id");

  const userId = req.user?._id;
  if (!userId) throw new apiError(404, "Could'nt find your Id");

  const video = await Video.findById(videoId);
  if (!video) throw new apiError(404, "Could'nt find your Video");

  const existinglike = await Like.findOne({
    video: videoId,
    likedBy: userId,
  });

  if (!existinglike) {
    const doLike = await Like.create({
      video: videoId,
      likedBy: userId,
    });
    return res.status(200).json(new apiResponse(200, "liked success"));
  } else {
    const undolLike = await Like.findByIdAndDelete(existinglike._id);
    return res.status(200).json(new apiResponse(200, "unliked success"));
  }
});

const toggleCommentLike = asyncHandle(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId?.trim()) throw new apiError(400, "Please Enter a commnet-Id");
  const userId = req.user?._id;
  if (!userId) throw new apiError(404, "Could'nt find your Id");

  const comment = await Video.findById(commentId);
  if (!comment) throw new apiError(404, "Could'nt find your comment");

  const existinglike = await Like.findOne({
    comment: commentId,
    likedBy: userId,
  });

  if (!existinglike) {
    const doLike = await Like.create({
      comment: commentId,
      likedBy: userId,
    });
    return res.status(200).json(new apiResponse(200, "liked success"));
  } else {
    const undolLike = await Like.findByIdAndDelete(existinglike._id);
    return res.status(200).json(new apiResponse(200, "unliked success"));
  }
});

const toggleTweetLike = asyncHandle(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId?.trim()) throw new apiError(400, "Please Enter a tweet-Id");

  const userId = req.user?._id;
  if (!userId) throw new apiError(404, "Could'nt find your Id");

  const tweet = await Video.findById(tweetId);
  if (!tweet) throw new apiError(404, "Could'nt find your tweet");

  const existinglike = await Like.findOne({
    tweet: tweetId,
    likedBy: userId,
  });

  if (!existinglike) {
    const doLike = await Like.create({
      tweet: tweetId,
      likedBy: userId,
    });
    return res.status(200).json(new apiResponse(200, "liked success"));
  } else {
    const undolLike = await Like.findByIdAndDelete(existinglike._id);
    return res.status(200).json(new apiResponse(200, "unliked success"));
  }
  
});

const getLikedVideos = asyncHandle(async (req, res) => {
  
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
