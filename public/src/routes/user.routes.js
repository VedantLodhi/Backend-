import { Router } from "express";
import { registerUser } from "../controllers/user.controllers.js";
import {upload} from "../middlewares/multer.middlewares.js";

const router = Router();

router.route("/register").post(
    // HANDLE IMAGE UPLOAD USING MULTER
    upload.fields([
        {
            // HANDLE AVATAR UPLOAD
            name: "avatar",
            maxCount: 1
        },
        {
            // HANDLE COVER IMAGE UPLOAD
            name: "coverImage",
            maxCount: 1
        }
    ]),
    // CALL THE CONTROLLER FUNCTION TO REGISTER THE USER
    registerUser
     );


export default router;