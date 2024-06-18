import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler( async (req,res)=>{
   //get user details from frontend
   const {fullName, email, username, password} =  req.body
   console.log(fullName, "fullname",email,"email");

   //validation

   //check if user already exists

   //check for images, avatar

   //upload them to cloudinary

   //create user object - create entry in db


   //remove password and refresh token field from response

   //check for user creation 

   //return response
})

export {registerUser};