import { asyncHandle } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";
import { Subscription } from "../models/subscription.models.js";
import { User } from "../models/user.models.js";

const toggleSubscription = asyncHandle(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId?.trim()) throw new apiError(400, "Enter a channel-Id");

  const userId = req.user?._id;

  if (userId.toString() === channelId)
    throw new apiError(400, "You cannot subscribe your own channel");

  const existingSub = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  });
  if (existingSub) {
    const deleteSub = await Subscription.findByIdAndDelete(existingSub._id);
    return res.status(200).json(new apiResponse(200, "unsubscribed success"));
  } else {
    const addSub = await Subscription.create({
      subscriber: userId,
      channel: channelId,
    });
    return res
      .status(200)
      .json(new apiResponse(200, { addSub }, "subscribed success"));
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandle(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId?.trim()) throw new apiError(400, "Enter a channel-Id");

  const isChannelExists = await User.findById(channelId);
  if (!isChannelExists) throw new apiError(400, "Channel does not exists");

  const { page = 1, limit = 30 } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const result = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberDetails",
      },
    },
    {
      $unwind: "subscriberDetails",
    },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limitNum },
          {
            $project: {
              _id: 1,
              subscriber: "$subscriberDetails._id",
              subscriberName: "$subscriberDetails.fullName",
              subscriberUsername: "$subscriberDetails.username",
              subscriberAvatar: "$subscriberDetails.avatar",
              subscriberEmail: "$subscriberDetails.email",
              subscribedAt: "$createdAt",
            },
          },
        ],
        totalCount: [{ $count: "total" }],
      },
    },
  ]);
  const subscribers = result[0]?.data || [];
  const totalCount = result[0]?.totalCount?.$total || 0;
  const totalPage = Math.ceil(totalCount / limitNum);
  const hasNextPage = pageNum < totalPage;
  const hasPreviousPage = pageNum > 1;

  return res.status(200).json(
    new apiResponse(
      200,
      {
        subscribers,
        pagination: {
          currentPage: pageNum,
          limit: limitNum,
          totalsubscribers: totalCount,
          totalPage,
          hasNextPage,
          hasPreviousPage,
        },
      },
      "successfully subscribers fetched"
    )
  );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandle(async (req, res) => {
  const { subscriberId } = req.params;
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
