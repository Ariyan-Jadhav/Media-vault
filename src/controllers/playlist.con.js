import { asyncHandle } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";
import { Playlist, playlist } from "../models/playlist.models.js";
import { Video } from "../models/video.models.js";

const createPlaylist = asyncHandle(async (req, res) => {
  const { name, description } = req.body;

  if (name?.trim() === "" || description?.trim() === "")
    throw new apiError(200, "Please enter the required field");

  const userId = await req.user?._id;

  const playlist = await Playlist.create({
    name,
    description,
    owner: userId,
    videos: [],
  });

  return res
    .status(200)
    .json(new apiResponse(200, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandle(async (req, res) => {
  const { userId } = req.params;
  if (!userId?.trim()) throw new apiError(400, "please enter a valid User-Id");

  const { page = 1, limit = 30 } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const pipeline = [
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
  ];
  const playlist = await Comment.aggregate([
    ...pipeline,
    { $skip: skip },
    { $limit: limitNum },
  ]);
  const totalPlaylist = await Comment.aggregate([
    ...pipeline,
    { $count: "total" },
  ]);

  const totalCount = totalPlaylist[0]?.total || 0;
  const totalPage = Math.ceil(totalCount / limitNum);
  const hasNextPage = pageNum < totalPage;
  const hasPreviousPage = pageNum > 1;

  return res.status(200).json(
    new apiResponse(
      200,
      {
        playlist,
        pagination: {
          currentPage: pageNum,
          limit: limitNum,
          totalPlaylist: totalCount,
          totalPage,
          hasNextPage,
          hasPreviousPage,
        },
      },
      "successfully playlist fetched"
    )
  );
});

const getPlaylistById = asyncHandle(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId?.trim())
    throw new apiError(400, "please enter a valid playlist-Id");

  const { page = 1, limit = 30 } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  const pipeline = [
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
  ];
  const playlist = await Comment.aggregate([
    ...pipeline,
    { $skip: skip },
    { $limit: limitNum },
  ]);
  const totalPlaylist = await Comment.aggregate([
    ...pipeline,
    { $count: "total" },
  ]);
  const totalCount = totalPlaylist[0]?.total || 0;
  const totalPage = Math.ceil(totalCount / limitNum);
  const hasNextPage = pageNum < totalPage;
  const hasPreviousPage = pageNum > 1;

  return res.status(200).json(
    new apiResponse(
      200,
      {
        playlist,
        pagination: {
          currentPage: pageNum,
          limit: limitNum,
          totalPlaylist: totalCount,
          totalPage,
          hasNextPage,
          hasPreviousPage,
        },
      },
      "successfully playlist fetched"
    )
  );
});

const addVideoToPlaylist = asyncHandle(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId?.trim() || !videoId?.trim())
    throw new apiError(400, "please enter a valid playlist-Id and video-Id");

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new apiError(400, "Invalid playlist-Id");

  const video = await Video.findById(videoId);
  if (!video) throw new apiError(400, "Invalid Video-Id");

  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new apiError(403, "You can only add videos on your own playlists");
  }

  if (playlist.videos.includes(videoId))
    throw new apiError(
      400,
      "Video already exists in playlist - no need to be greedy!"
    );
  playlist.videos.push(videoId);
  await playlist.save();
  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { videoAdded: playlist.videos },
        "Video successfully added to playlist"
      )
    );
});

const removeVideoFromPlaylist = asyncHandle(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!playlistId?.trim() || !videoId?.trim())
    throw new apiError(400, "please enter a valid playlist-Id and video-Id");

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new apiError(400, "Invalid playlist-Id");

  const userId = req.user._id;
  if (!userId) throw new apiError(404, "Sorry ur not a Sigma");

  if (playlist.owner.toString() !== userId.toString()) {
    throw new apiError(
      403,
      "You can only remove videos from your own playlists"
    );
  }

  if (!playlist.videos.includes(videoId))
    throw new apiError(
      400,
      "Video does not exists in playlist - no need to be a fool!"
    );

  playlist.videos = playlist.videos.filter((x) => x.toString() !== videoId);
  await Playlist.save();

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { remainingVideo: playlist.videos },
        "Video successfully deleted from the playlist"
      )
    );
});

const deletePlaylist = asyncHandle(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId?.trim())
    throw new apiError(400, "please enter a valid playlist-Id");

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new apiError(400, "Invalid playlist-Id");

  const userId = req.user._id;
  if (!userId) throw new apiError(404, "Sorry ur not a Sigma");

  if (playlist.owner.toString() !== userId.toString()) {
    throw new apiError(403, "You can only delete your own playlists");
  }
  await Playlist.findByIdAndDelete(playlistId);

  return res
    .status(200)
    .json(new apiResponse(200, {}, "playlist successfully deleted"));
});

const updatePlaylist = asyncHandle(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId?.trim())
    throw new apiError(400, "please enter a valid playlist-Id");

  const oldPlaylist = await Playlist.findById(playlistId);
  if (!oldPlaylist) throw new apiError(400, "Invalid playlist-Id");

  const { name, description } = req.body;
  if (name?.trim() === "" || description?.trim() === "")
    throw new apiError(200, "Please enter the required field");

  const userId = req.user._id;
  if (!userId) throw new apiError(404, "Sorry ur not a Sigma");

  if (oldPlaylist.owner.toString() !== userId.toString()) {
    throw new apiError(403, "You can only update your own playlists");
  }
  const newPlaylist = await Playlist.findOneAndUpdate(
    playlistId,
    {
      name,
      description,
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .json(new apiResponse(200, newPlaylist, "playlist successfully updated"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
