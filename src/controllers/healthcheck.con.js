import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandle } from "../utils/asyncHandler.js";

const healthCheck = asyncHandle(async (req, res) => {
  return res
    .status(200)
    .json(new apiResponse(200, "OK", "Boom diggy diggy boom boom"));
});

export { healthCheck };
