import { Router } from "express";
import {
  registerUser,
  logoutUser,
  loginUser,
  changeCurrentPassword,
  getCurrentUser,
  UpdateAccDetails,
  getUserChannelProfile,
  UpdateUserAvatar,
  UpdateUserCoverImage,
  getWatchHistory,
  refreshAccessToken,
} from "../controllers/user.con.js";
import { upload } from "../middlewares/multer.mid.js";
import { verifyJWT } from "../middlewares/auth.mid.js";
const router = Router();

//unsecured routes
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);
//secured routes

router.route("/logout").post(verifyJWT, logoutUser);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);

router.route("/user-details").get(verifyJWT, getCurrentUser);
router.route("/update-details").post(verifyJWT, UpdateAccDetails);
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
router.route("/wh/:username").get(verifyJWT, getWatchHistory);
router
  .route("/update-avatar")
  .patch(verifyJWT, upload.single("avatar"), UpdateUserAvatar);
router
  .route("/update-coverimg")
  .patch(verifyJWT, upload.single("coverImage"), UpdateUserCoverImage);

export default router;
