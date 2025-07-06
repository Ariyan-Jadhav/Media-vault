import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { apiError } from "../utils/apiError.js";
import { asyncHandle } from "../utils/asyncHandler.js";

// Middleware to verify the JWT token and attach the user to the request object
export const verifyJWT = asyncHandle(async (req, _, next) => {
  // ✅ Get token from either cookies or Authorization header (Bearer token)
  const token =
    req.cookies.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new apiError(401, "Unauthorized");
  }
  // ✅ Verify the token using your secret key
  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // ✅ Get the user from DB using the _id stored in the token payload
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new apiError(401, "Unauthorized");
    }
    // ✅ Attach the user to the request object so future middleware/routes can use it
    req.user = user;

    // ✅ Move to the next middleware/route
    next();
  } catch (error) {
    throw new apiError(401, error?.message || "Invalid access token");
  }
});
