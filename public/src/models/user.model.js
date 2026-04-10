import mongoose ,{Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

//  USER MODEL WILL HAVE THE FOLLOWING FIELDS
const userSchema = new Schema({
username : {
    type : String,
    required : true,
    unique : true,
    lowercase : true,
    trim: true,
    index: true
},
email : {
    type : String,
    required : true,
    unique : true,
    lowercase : true,
    trim: true
},
fullName : {
    type : String,
    required : true,
    trim: true,
    index : true
},

avatar : {
    type : String,   // WILL USE CLOUDINARY URL 
    required : true,
},

coverImage : {
    type : String,  // WILL USE CLOUDINARY URL  
},

watchHistory : [
    {
        type : Schema.Types.ObjectId,   
        ref: "Video"
    }],

    password: {
        type: String,
        required: [true, "Password is required"],
    },

    refreshToken: {
        type: String,
    }
},

{
    timestamps : true
}
)

userSchema.pre("save", async function () {
    if (!this.isModified("password")) 
    {  // IF PASSWORD IS NOT MODIFIED, THEN WE DON'T NEED TO HASH IT AGAIN
        return ;
    }
    
    const SALT_ROUNDS = 10;
    this.password = await bcrypt.hash(this.password, 10);
    
})

//  CHECK IF THE PASSWORD IS CORRECT OR NOT
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
} 

// GENERATE ACCESS TOKEN FOR THE USER
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },

        // SECRET KEY FOR SIGNING THE TOKEN, SHOULD BE IN .ENV FILE
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
        }
    )
}
//  GENERATE REFRESH TOKEN FOR THE USER
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
        }
    )
}

export const User = mongoose.models.User || mongoose.model("User", userSchema);
