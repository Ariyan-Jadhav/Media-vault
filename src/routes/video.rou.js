import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.mid.js";
import {
  getAllVideos,
  getVideoById,
  publishAVideo,
  updateThumbnail,
  updateVideo,
} from "../controllers/video.con.js";
import { upload } from "../middlewares/multer.mid.js";

const videoRouter = Router();

videoRouter.route("/get-video").get(verifyJWT, getAllVideos);
videoRouter.route("/video-id/:videoId").get(verifyJWT, getVideoById);
videoRouter.route("/publish-video").post(
  verifyJWT,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  publishAVideo
);
videoRouter
  .route("/update-thumb/:videoId")
  .post(verifyJWT, upload.single("thumbnail"), updateThumbnail);
videoRouter.route("/update-video/:videoId").post(verifyJWT, updateVideo);
export default videoRouter;
