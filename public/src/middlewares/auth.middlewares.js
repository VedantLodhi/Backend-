import { ApiError } from '../utils/ApiError.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import jwt from 'jsonwebtoken';
import {User} from '../models/user.model.js';


export const verifyJWT = asyncHandler(async (req,res,next) =>
    {
    try {
        // STEP-1: EXTRACT THE TOKEN FROM THE AUTHORIZATION HEADER
        const token = req.cookies?.accessToken || req.headers?.Authorization?.replace("Bearer ", "");
    
        if(!token)
        {
            throw new ApiError(401, "Unauthorized: No token provided"); 
        }
    
        //  STEP-2: VERIFY THE TOKEN
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decoded?._id).select("-password -refreshToken")
    
        if(!user)
        {
            throw new ApiError(401, "Unauthorized: Invalid token"); 
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Unauthorized: Invalid token"); 
    }

})
