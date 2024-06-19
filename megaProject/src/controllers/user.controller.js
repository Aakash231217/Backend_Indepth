import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js'
import {User}from "../models/user.model.js"
import { uploadonCloudinary } from "../utils/cloudinary.js";
const registerUser = asyncHandler( async (req,res)=>{
   //get user details from frontend
   const {fullName, email, username, password} =  req.body
   console.log(fullName, "fullname",email,"email");
   if(
      [fullName,email,username,password].some((field)=>field?.trim()==="")
   ){
      throw new ApiError(400,"All fields are required");
   }
   //validation

   //check if user already exists
   const existedUser = User.findOne({
      $or: [{username}, {email}]

   })
   if(existedUser){
      throw new ApiError(409,"User with email or username already exists");
   }

   //check for images, avatar
   const avatarLocalPath = req.files?.avatar[0]?.path
   const coverImageLocalPath = req.files?.coverImage[0]?.path
   if(!avatarLocalPath){
      throw new ApiError(400,"Avatar file is required");
   }
   //upload them to cloudinary
   const avatar = await uploadonCloudinary(avatarLocalPath)
   const coverImage =  await uploadonCloudinary(coverImageLocalPath);
   if(!avatar){
      throw new ApiError(400, "Avatar file is required");
   }
   //create user object - create entry in db
   const user = await User.create({
      fullName,
      avatar:avatar.url,
      coverImage:coverImage?.url || "",
      email,
      password,
      username:username.toLowerCase(),
   })

   //remove password and refresh token field from response

   //check for user creation 
   const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
   )
   if(!createdUser){
       throw new ApiError(500,"Something went wrong while registering the user")
   }

   //return response
})

export {registerUser};