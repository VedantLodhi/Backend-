import { Router } from "express";
import { registerUser } from "../controllers/user.controllers.js";
import {upload} from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { loginUser, logoutUser } from "../controllers/user.controllers.js";
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

// LOGIN ROUTE FOR THE USER  
router.route("/login").post(loginUser);   

//  SECRET ROUTE TO TEST THE AUTHENTICATION MIDDLEWARE
router.route("/logout").post(verifyJWT, logoutUser);


export default router;