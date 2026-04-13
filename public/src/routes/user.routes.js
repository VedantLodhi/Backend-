import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentUserPassword, getCurrentUser, updateAccountdetails, updateUserAvatar, getUserChannelProfile, getWatchHistory } from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

//  TEMP FOLDER PATH
const tempDir = path.join(process.cwd(), "public/temp");

// ENSURE FOLDER EXISTS
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// MULTER CONFIG (INLINE - NO CONFLICT)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const cleanName = file.originalname
      .replace(/\s+/g, "")
      .replace(/[()]/g, "")
      .replace(/:/g, "-");

    cb(null, Date.now() + "-" + cleanName);
  }
});

const upload = multer({ storage });

//  REGISTER ROUTE
router.post(
  "/register",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 }
  ]),
  registerUser
);

//  LOGIN ROUTE
router.route("/login").post(loginUser);

//  SECURED ROUTE 
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken)

// CHANGE PASSWORD 
router.route("/change-password").post(verifyJWT, changeCurrentUserPassword);
// GET CURRENT USER
router.route("/current-user").get(verifyJWT,getCurrentUser);
// UPDATE ACCOUNT DETAILS
router.route("/update-account").patch(verifyJWT, updateAccountdetails);
// UPDATE AVATAR
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
// UPDATE COVER IMAGE
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserAvatar);
// GET USER BY USERNAME
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);

router.route("/history").get(verifyJWT, getWatchHistory);


export default router;