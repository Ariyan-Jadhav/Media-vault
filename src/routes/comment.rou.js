import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.mid.js";
import { addComment } from "../controllers/comments.con.js";

const commentRouter = Router();

commentRouter.route("/add-com/:videoId").post(verifyJWT, addComment);

export default commentRouter;
