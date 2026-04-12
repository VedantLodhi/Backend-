import fs from "fs"; // 🔥 ADD THIS
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/User.model.js';
import { uploadOnCloudinary } from '../utils/Cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';


// FUNCTION TO GENERATE ACCESS TOKEN AND REFRESH TOKEN FOR THE USER
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Error while generating access and refresh token");
    }
};
//  REGISTER USER
const registerUser = asyncHandler(async (req, res) => {

    console.log("CONTENT-TYPE:", req.headers["content-type"]);
    console.log("FILES:", req.files);

    const { fullName, email, username, password } = req.body;
    console.log("email:", email);

    if (!fullName || !email || !username || !password) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }

    // 🔥 FILE PATHS
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    console.log("FILES:", req.files);
    console.log("avatarLocalPath:", avatarLocalPath);
    console.log("coverImageLocalPath:", coverImageLocalPath);

    // 🔥 DEBUG (IMPORTANT)
    console.log("AVATAR EXISTS:", avatarLocalPath ? fs.existsSync(avatarLocalPath) : "No avatar");
    console.log("COVER EXISTS:", coverImageLocalPath ? fs.existsSync(coverImageLocalPath) : "No cover");

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required");
    }

    // 🔥 UPLOAD AVATAR
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log("CLOUDINARY AVATAR:", avatar);

    if (!avatar) {
        throw new ApiError(400, "Error while uploading avatar image");
    }

    // COVER IMAGE
    let coverImage = null;
    if (coverImageLocalPath) {
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
        console.log("CLOUDINARY COVER:", coverImage);
    }

    // 🔥 CREATE USER
    const user = await User.create({
        fullName,
        avatar: avatar.secure_url,
        coverImage: coverImage?.secure_url || "",
        username: username.toLowerCase(),
        email,
        password
    });

    // AFTER BOTH UPLOADS
if (avatarLocalPath && fs.existsSync(avatarLocalPath)) {
  fs.unlinkSync(avatarLocalPath);
}

if (coverImageLocalPath && fs.existsSync(coverImageLocalPath)) {
  fs.unlinkSync(coverImageLocalPath);
}

    const createdUser = await User.findById(user._id)
        .select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Error while creating user");
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
});

// LOGIN USER
const loginUser = asyncHandler(async (req, res) => {

    const { username, email, password } = req.body;
    console.log("login email:", email);

    if ((!username && !email) || !password) {
        throw new ApiError(400, "Username/email and password are required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const LoggedInUser = await User.findById(user._id)
        .select("-password -refreshToken");

    const cookieOptions = {
        httpOnly: true,
        secure: false, // 🔥 DEV FIX
    };

    return res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(200,
                {
                    user: LoggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        );
});

// LOGOUT USER
const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { refreshToken: undefined }
        },
        { new: true }
    );

    const cookieOptions = {
        httpOnly: true,
        secure: false, // 🔥 DEV FIX
    };

    return res.status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, null, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => 
    {
       const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

       if(!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorised Request");
       }

        try {
            const decodedToken = jwt.verify
            (
             incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET
            );
    
            const user = await User.findById(decodedToken?._id)
            
            if(!user)
            {
                throw new ApiError(401, "Invalid refresh token");
            }
    
            if(user?.refreshToken !== incomingRefreshToken)
            {
                throw new ApiError(401, "Refresh token is expired or used");
            }
    
            const cookieOptions = {
                httpOnly: true,
                secure: true, 
            }
    
            const { accessToken, newrefreshToken } = await generateAccessAndRefreshToken(user._id)
            return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", newrefreshToken, cookieOptions)
            .json(
                new ApiResponse(200,
                    { accessToken, refreshToken : newrefreshToken}
                 , "Access token refreshed successfully")
                )
        } catch (error) {
            throw new ApiError(401, error?.message || "Invalid refresh token");
        }
    })

export { registerUser, loginUser, logoutUser, refreshAccessToken };