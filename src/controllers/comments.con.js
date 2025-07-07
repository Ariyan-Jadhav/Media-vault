import { asyncHandle } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";
import { Comment } from "../models/comment.models.js";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";

const getVideoComments = asyncHandle(async (req, res) => {
  //TODO: get all comments for a video

  const { page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const { videoId } = req.params;
  if (!videoId?.trim()) throw new apiError(200, "Video-Id not found");

  const video = await Video.findById(videoId);
  if (!video) throw new apiError(404, "Video not found");

  const pipeline = [
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
  ];

  const comments = await Comment.aggregate([
    ...pipeline,
    { $skip: skip },
    { $limit: limitNum },
  ]);
  const totalComments = await Comment.aggregate([
    ...pipeline,
    { $count: "total" },
  ]);

  const totalCount = totalComments[0]?.total || 0;
  const totalPage = Math.ceil(totalCount / limitNum);
  const hasNextPage = pageNum < totalPage;
  const hasPreviousPage = pageNum > 1;

  return res.status(200).json(
    new apiResponse(
      200,
      {
        comments,
        pagination: {
          currentPage: pageNum,
          limit: limitNum,
          totalComments: totalCount,
          totalPage,
          hasNextPage,
          hasPreviousPage,
        },
      },
      "successfully comments fetched"
    )
  );
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
    user: req.user._id,
    content,
  });
  //You can use mongoAgg but if user changes the title of the video or her username it will be not updated in the db
  return res
    .status(200)
    .json(new apiResponse(200, comment, "successfully commented"));
});

const updateComment = asyncHandle(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId?.trim()) throw new apiError(500, "Comment-Id not found");

  const { content } = req.body;
  if (!content?.trim()) throw new apiError(500, "content not found");

  const existingComment = await Comment.findById(commentId);
  if (!existingComment) throw new apiError(404, "Comment not found");

  if (existingComment.owner.toString() !== req.user._id?.toString())
    throw new apiError(400, "Sorry you are not Sigma");

  const comment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content,
      },
    },
    { new: true }
  );
  return res
    .status(200)
    .json(new apiResponse(200, comment, "user comment updated"));
});

const deleteComment = asyncHandle(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId?.trim()) throw new apiError(400, "Comment-Id not found");

  const comment = await Comment.findById(commentId);
  if (!comment) throw new apiError(404, "comment not found");

  if (comment.owner?.toString() !== req.user?._id.toString())
    throw new apiError(403, "Sorry ur not Sigma");

  await Comment.findByIdAndDelete(commentId);

  return res
    .status(200)
    .json(
      new apiResponse(200, { deletedId: commentId }, "comment deleted suckSex")
    );
});

export { addComment, getVideoComments, updateComment, deleteComment };
