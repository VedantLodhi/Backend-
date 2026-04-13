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

    //  FILE PATHS
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    console.log("FILES:", req.files);
    console.log("avatarLocalPath:", avatarLocalPath);
    console.log("coverImageLocalPath:", coverImageLocalPath);

    //  DEBUG (IMPORTANT)
    console.log("AVATAR EXISTS:", avatarLocalPath ? fs.existsSync(avatarLocalPath) : "No avatar");
    console.log("COVER EXISTS:", coverImageLocalPath ? fs.existsSync(coverImageLocalPath) : "No cover");

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required");
    }

    //  UPLOAD AVATAR
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

    //  CREATE USER
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
            $unset: { refreshToken: 1 }
        },
        { new: true }
    );

    const cookieOptions = {
        httpOnly: true,
        secure: false, //  DEV FIX
    };

    return res.status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, null, "User logged out successfully"));
});

// REFRESH ACCESS TOKEN
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

//  CHANGE CURRENT USER PASSWORD
const changeCurrentUserPassword = asyncHandler(async (req, res) => 
    {
    const { oldPassword, newPassword } = req.body;  

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword, user.password)

    if(!isPasswordCorrect)
    {
        throw new ApiError(401, "Old password is incorrect");
    }

    user.password = newPassword;
    await user.save(validateBeforeSave = false);

    return res.status(200).json(
        new ApiResponse(200, {}, "Password changed successfully")
    );  

    }); 

// GET CURRENT USER
const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(200, req.user, "Current user fetched successfully");
}); 

//  UPDATE ACCOUNT DETAILS
const updateAccountdetails = asyncHandler(async (req, res) => 
    {
        const {fullName, email} =  req.body

        if(!fullName || !email)
        {
            throw new ApiError(400, "All fields are required");
        }

        const user = await User.findByIdAndUpdate(req.user._id, {
            $set : {
                fullName,
                email
            }
        }, { new: true }    
    ).select("-password -refreshToken");

    return res.status(200).json
    (
        new ApiResponse(200, user, "Account details updated successfully")
    );

    })
 
// UPDATE USER AVATAR
const updateUserAvatar = asyncHandler(async (req, res) => 
    {
        const avatarLocalPath = req.file?.path;

        if(!avatarLocalPath)
        {
            throw new ApiError(400, "Avatar file is missing");
        }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    
    if(!avatar.url)
    {
        throw new ApiError(500, "Error while uploading avatar");
    }

    const user = await User.findByIdAndUpdate(req.user._id, 
        {
            $set : {
                avatar : avatar.url
            }
        }, { new: true }
    ).select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(200, user, "Avatar updated successfully")
    );

    });

// UPDATE USER COVER IMAGE
const updateUserCoverImage = asyncHandler(async (req, res) => 
    {
        const coverImageLocalPath = req.file?.path;

        if(!coverImageLocalPath)
        {
            throw new ApiError(400, "Cover image file is missing");
        }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if(!coverImage.url)
    {
        throw new ApiError(500, "Error while uploading cover image");
    }

    const user =await User.findByIdAndUpdate(req.user._id, 
        {
            $set : {
                coverImage : coverImage.url
            }
        }, { new: true }
    ).select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(200, user, "Cover image updated successfully")
    );

    });    

// GET USER CHANNEL PROFILE
const getUserChannelProfile = asyncHandler(async (req, res) => 
    {
      const {username} = req.params

        if(!username?.trim())
        {
            throw new ApiError(400, "Username is missing");
        }

// AGGREGATION PIPELINE TO GET CHANNEL DETAILS ALONG WITH SUBSCRIBER COUNT AND SUBSCRIBED CHANNELS COUNT
       const channel = await User.aggregate([
            {
                $match: {
                    username: username?.toLowerCase().trim()
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: " subscribedChannels"
                }
            },
            {
                $addFields: {
                    subscriberCount: { $size: "$subscribers" },
                    channelsSubscribedToCount: { $size: "$subscribedChannels" }
                },
                isSubscribed: {
                    $if: 
                    { 
                        $in: [req.user?._id, "$subscribers.subscriber"] 
                    },
                    then : true,
                    else : false    
                }
            },
            {
                $project: {
                    fullName: 1,
                    username: 1,
                    subscriberCount: 1,
                    channelsSubscribedToCount: 1,
                    isSubscribed: 1,
                    avatar: 1,
                    coverImage: 1,
                    email: 1,
                    createdAt: 1,
                }
                }
        ])

//      VALIDATION 
        if(!channel || channel.length === 0)
        {
            throw new ApiError(404, "Channel not found");
        }

//      RESPONSE
        return res.status(200).json(
            new ApiResponse(200, channel[0], "Channel profile fetched successfully")
        );
    })

// GET USER WATCH HISTORY
const getWatchHistory = asyncHandler(async (req, res) => 
    {
        const user = await User.aggregate([
            {
                $match: {
                    // mongoose.Types.ObjectId(req.user._id) is not working in match stage, so we have to use new mongoose.Types.ObjectId(req.user._id)
                    _id: new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [
                        {
                            // Lookup owner details
                            $lookup:
                            {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "ownerDetails",
                                pipeline: [
                                    {
                                    // Project the required fields of the owner (channel) of the video
                                    $project:
                                    {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                    }
                                ]
                            }
                        },
                        {
                            // Since ownerDetails is an array (because of the $lookup), we need to use $first to get the first element of the array which contains the owner details
                            $addFields: {
                                owner:{
                                    $first: "$ownerDetails"
                                }
                            }
                        }
                    ]
                }

            }
        ])

        return res.status(200).json(
            new ApiResponse(200, user[0]?.watchHistory || [], "Watch history fetched successfully")
        );
    })    
    

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentUserPassword , getCurrentUser, updateAccountdetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory,};