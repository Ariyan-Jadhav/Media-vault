import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.mid.js";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comments.con.js";

const commentRouter = Router();

commentRouter.route("/add-com/:videoId").post(verifyJWT, addComment);
commentRouter.route("/video-com/:videoId").get(verifyJWT, getVideoComments);
commentRouter.route("/update-com/:commentId").post(verifyJWT, updateComment);
commentRouter.route("/delete-com/:commentId").post(verifyJWT, deleteComment);

export default commentRouter;
