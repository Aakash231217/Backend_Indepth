import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js'
import {User}from "../models/user.model.js"
import { uploadonCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

 //access and refresh token
 const generateAccessAndRefreshTokens =async(userId)=>{
      try{
         const user = await User.findById(userId);
         const accessToken = user.generateAccessToken()
         const refreshToken = user.generateRefreshToken();
         user.refreshToken = refreshToken;
         await user.save({validateBeforeSave:false})
         return {accessToken, refreshToken};

      } catch(error){
         throw new ApiError(500,"Something went wrong while generating tokens");
      }
 }
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
   const existedUser = await User.findOne({
      $or: [{username}, {email}]

   })
   if(existedUser){
      throw new ApiError(409,"User with email or username already exists");
   }

   //check for images, avatar
   const avatarLocalPath = req.files?.avatar[0]?.path
   let coverImageLocalPath;
   if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length > 0){
      coverImageLocalPath = req.files.coverImage[0].path;
   }
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
   return res.status(201).json(
   new ApiResponse(200,createdUser,"User registered successfully")
   )

})




const loginUser = asyncHandler(async(req,res)=>{
   //reqbody->data
   const {email, username, password} = req.body;
   // username or email
   if(!username || !email){
      throw new ApiError(400, "Username or password is required");
   }
   //find the user
   const user = await User.findOne({
      $or : [{username},{email}]
   })

   if(!user){
      throw new ApiError(404,"USer does not exist");
   }
   //password check
   const isPasswordValid = await user.isPasswordCorrect(password);
   if(!isPasswordValid){
      throw new ApiError(401,"Invalid user credentials");

   }
   const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id);

   const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
   const options = {
      httpOnly:true,
      secure:true,
   }
   return res.status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(
      new ApiResponse(
         200, {
            user:loggedInUser,accessToken,refreshToken
         },
         "User logged in Successfully",
      )
   )

   //send coookie
})


const logoutUser = asyncHandler(async(req,res)=>{
   await User.findByIdAndUpdate (
      req.user._id,{
         $set:{
            refreshToken:undefined,
         }
      },
      {
         new:true,
      }
   )
   const options={
      httpOnly:true,
      secure:true,
   }
   return res.status(200)
   .clearCookie("accessToken",options)
   .json(new ApiResponse(200,{},"User logged out"));
})


const refreshAccessToken = asyncHandler(async(req,res,)=>{
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
   if(!incomingRefreshToken){
      throw new ApiError(401,"unauthorised request");
   }
   const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
   )

   const user = await User.findById(decodedToken?._id)
   if(!user){
      throw new ApiError(401,"Invalid refresh token");
   }
   if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401,"Refresh token is expired or used");
   }
   const options = {
      httpOnly:true,
      secure:true,
   }
   const {newaccessToken,newrefreshToken} = await generateAccessAndRefreshTokens(user._id);
   return res
   .status(200)
   .cookie("accessToken",newaccessToken,options)
   .cookie("refreshToken",newrefreshToken,options)
   .json(
      new ApiResponse(
         200,
         {newaccessToken,refreshToken:newrefreshToken},
         "Access token refreshed",
      )
   )
} 
)


const changeCurrentPassword = asyncHandler(async(req,res)=>{
   const {oldPassword, newPassword} = req.body

   const user =  await User.findById(req.user?._id);
   const isPasswordCorrect = user.isPasswordCorrect(oldPassword);

   if(!isPasswordCorrect){
      throw new ApiError(400,"Invalid old password");
   }
   user.password = newPassword
   await user.save({validateBeforeSave:false});

   return res.status(200)
   .json(new ApiResponse(200,{},"Password changed successfully"))

})


const getCurrentUser = asyncHandler(async(req,res)=>{
   return res.status(200)
   .json(200,req.user,"Current User fetched successfully")
})


const updateAccountDetails = asyncHandler(async(req,res)=>{
   const {fullName, email} = req.body
   if(!(fullName || email)){
      throw new ApiError(400,"All fields are required")
   }
   const user = User.findByIdAndUpdate(req.user?._id,
      {
         $set:{
            fullName,
            email,

         }
      },
      {new:true}
   ).select("-password")

   return res.status(200).json(new ApiResponse(200,user,"Account details updated successfully"))
})


const updateUserAvatar = asyncHandler(async(req,res)=>{
   const avatarLocalPath = req.files?.path
   if(!avatarLocalPath){
      throw new ApiError(400,"Avatar file is missing");
   }
    const avatar = await uploadonCloudinary(avatarLocalPath);
    if(!avatar.url){
      throw new ApiError(400,"Error while uploading on avatar");
    }
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            avatar:avatar.url
         }
      },
      {new:true},
    ).select("-password")
    return res.status(200)
      .json(
         new ApiResponse(200, user, "Avatar image update successfully")
      )
})


const updateUserCoverImage = asyncHandler(async(req,res)=>{
   const coverImageLocalPath = req.file?.path;
   if(!coverImageLocalPath){
      throw new ApiError(400,"Cover image file is missing");
   }
   const coverImage = await uploadonCloudinary(coverImageLocalPath);
   if(!coverImage.url){
      throw new ApiError(400,"Error while uploading on avatar");
   }
   const user = await User.findByIdAndUpdate(
      req.user?._id,{
           $set:{
            avatar:avatar.url,
           }
      },{new:true}).select("-password")

      return res.status(200)
      .json(
         new ApiResponse(200, user, "Cover image update successfully")
      )
})
export {registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword, getCurrentUser, updateAccountDetails,updateUserAvatar, updateUserCoverImage};