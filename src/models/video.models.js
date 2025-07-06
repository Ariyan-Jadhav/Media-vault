import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

/* 
  id string pk
  videoFile string
  thumbnail string
  owner ObjectId users
  title string
  description string
  duration number
  views number
  isPublished boolean
  createdAt Date
  updatedAt Date 
  */

const videoSchema = new Schema(
  {
    videoFile: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    views: {
      type: Number,
      default: true,
    },
    duration: {
      type: Number,
      required: true,
      default: true,
    },
    isPublished: {
      type: Number,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);
videoSchema.plugin(mongooseAggregatePaginate);
export const Video = mongoose.model("Video", videoSchema);
