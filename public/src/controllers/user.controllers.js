// import { response } from 'express';
import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {User} from '../models/User.model.js';
import {uploadOnCloudinary} from '../utils/Cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';

const registerUser = asyncHandler(async (req,res) => 
    {
    // STEPS TO REGISTER A USER  

    // STEP-1: VALIDATE THE USER DETAILS
    const { fullName, email, username, password } = req.body;
    console.log("email", email);

    if(fullName === "" || email === "" || username === "" || password === "") 
    {
        throw new ApiError(400, "All fields are required"); 
    }    

    // STEP-2: CHECK IF THE USER ALREADY EXISTS
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser)
    {
        throw new ApiError(409, "User already exists with the provided email or username");
    }

    // CHECK FOR IMAGE UPLOAD & AVATAR CREATION 
    //  HANDLE IMAGE UPLOAD USING MULTER
    const avatarLocalPath = req.files?.avatar[0]?.path;
    console.log("avatarLocalPath:", avatarLocalPath);
    // HANDLE COVER IMAGE UPLOAD
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    console.log("coverImageLocalPath:", coverImageLocalPath);


    // CHECK IF AVATAR IMAGE IS UPLOADED  
    if(!avatarLocalPath)
    {
        throw new ApiError(400, "Avatar image is required");
    }
    
    // STEP-4: UPLOAD THE AVATAR IMAGE & COVER IMAGE TO CLOUDINARY AND GET THE URL

    // UPLOAD THE AVATAR IMAGE TO CLOUDINARY AND GET THE URL
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log("CLOUDINARY RESPONSE:", avatar);
    // UPLOAD THE COVER IMAGE TO CLOUDINARY AND GET THE URL
     const coverImage = coverImageLocalPath? await uploadOnCloudinary(coverImageLocalPath): null;
     
    // CHECK IF AVATAR UPLOAD WAS SUCCESSFUL
    if(!avatar)
    {
        throw new ApiError(400, "Error while uploading avatar image");
    }

    // STEP-5: CREATE A NEW USER OBJECT - CREATE ENTRY IN THE DATABASE
    const user = await User.create
    ({
        fullName,
        // avatar: avatar.url,
        avatar: avatar.secure_url,
        coverImage: coverImage?.secure_url || "",
        username: username.toLowerCase(),
        email,
        password
    })
 
    // STEP-6: CHECK IF THE USER WAS CREATED SUCCESSFULLY
    const createdUser = await User.findById(user._id).select(
    // STEP-7: REMOVE PASSWORD AND REFRESH TOKEN FIELD FROM THE RESPONSE
        "-password -refreshToken"
    )

    //  STEP-8: CHECK IF THE USER WAS CREATED SUCCESSFULLY
    if(!createdUser)
    {
        throw new ApiError(500, "Error while creating user");
    }

    // STEP-9: RETURN A RESPONSE TO THE FRONTEND
    return res.status(201).json
    (
        new ApiResponse(201, createdUser, "User registered successfully")
    );

})

export {registerUser,}
