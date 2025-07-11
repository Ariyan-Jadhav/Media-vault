import { Router } from "express";
import { healthCheck } from "../controllers/healthcheck.con.js";
import { upload } from "../middlewares/multer.mid.js";

const router = Router();

router.route("/").get(healthCheck);
export default router;
