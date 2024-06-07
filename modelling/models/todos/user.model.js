import mongoose from "mongoose";

const userSchema =  new mongoose.Schema({
    username:{
      type:String,
      required:true,
      unique:true,
      lowercase:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
    },
    password:{
        type:String,
        required:true,
    }
},{timestamps:true});

export const User = mongoose.model("User",userSchema);

//it's store in database like - users putting everything in lowercase with also making plural as adding 's'

