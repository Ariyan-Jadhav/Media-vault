import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.mid.js";
import { getAllVideos, publishAVideo } from "../controllers/video.con.js";
import { upload } from "../middlewares/multer.mid.js";

const videoRouter = Router();

videoRouter.route("/get-video").get(verifyJWT, getAllVideos);
videoRouter.route("/publish-video").post(
  verifyJWT,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  publishAVideo
);
export default videoRouter;
