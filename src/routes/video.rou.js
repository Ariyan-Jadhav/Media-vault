import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.mid.js";
import { getAllVideos } from "../controllers/video.con.js";

const videoRouter = Router();

videoRouter.route("/get-video").get(verifyJWT, getAllVideos);

export default videoRouter;
