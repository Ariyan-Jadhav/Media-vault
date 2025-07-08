import { asyncHandle } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";
import { Tweet } from "../models/tweet.models.js";

const createTweet = asyncHandle(async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) throw new apiError(400, "No content found");

  const tweet = await Tweet.create({
    content,
    owner: req.user?._id,
  });

  return res.status(200).json(new apiResponse(200, tweet, "Tweeted success"));
});

const getUserTweets = asyncHandle(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const { userId } = req.params;
  if (!userId?.trim()) throw new apiError(400, "please enter user-Id");

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new apiError(469, "Invalid user-Id");
  }

  const pipeline = [
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
  ];

  const tweet = await Tweet.aggregate([
    ...pipeline,
    { $skip: skip },
    { $limit: limitNum },
  ]);

  tweetCounts = await Tweet.aggregate([...pipeline, { $count: "total" }]);

  const totalCount = tweetCounts[0]?.total || 0;
  const totalPage = Math.ceil(totalCount / limitNum);
  const hasNextPage = pageNum < totalPage;
  const hasPrevPage = pageNum > 1;

  return res.status(200).json(
    new apiResponse(
      200,
      {
        tweet,
        pagination: {
          currentPage: pageNum,
          limit: limitNum,
          totalTweets: totalCount,
          totalPage,
          hasNextPage,
          hasPrevPage,
        },
      },
      "successfully tweets fetched"
    )
  );
});

const updateTweet = asyncHandle(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId?.trim()) throw new apiError(500, "tweet-Id not found");

  const { content } = req.body;
  if (!content?.trim()) throw new apiError(400, "No content found");

  const existingTweet = await Tweet.findById(tweetId);

  if (!existingTweet) throw new apiError(500, "tweet not found");

  if (existingTweet.owner?.toString() !== req.user?._id?.toString())
    throw new apiError(400, "Sorry you are not sigma");

  const tweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new apiResponse(200, tweet, "Tweet updated success"));
});

const deleteTweet = asyncHandle(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId?.trim()) throw new apiError(500, "tweet-Id not found");

  const existingTweet = await Tweet.findById(tweetId);

  if (!existingTweet) throw new apiError(500, "tweet not found");

  if (existingTweet.owner?.toString() !== req.user?._id?.toString())
    throw new apiError(400, "Sorry you are not sigma");
  await Tweet.findByIdAndDelete(tweetId);
  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { deletedTweet: existingTweet },
        "Tweet updated success"
      )
    );
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
