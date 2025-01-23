import {asynchandler} from"../utils/asynchandler.js"
import {ApiError} from "../utils/apierror.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from"../utils/cloudinary.js"
import{ApiResponse} from"../utils/apiresponse.js"

const registerUser=asynchandler(async(req,res)=>{
    //get user detail
    //validation -not emoty
    //check if user already exists:username or email
    //check for images,check for avatar
    //upload them to cloudinary
    //create user object-create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return res

    const{fullname,email,username,password }=req.body
    //  console.log(req.body);
    
   // console.log("email",email);

    if(
        [fullname,email,username,password].some((field)=>(field?.trim===""))

    ){
        throw new ApiError(400,"al fields are required")
    }

    const existeduser=await User.findOne({
        $or:[{username},{email}]
    })
    // console.log(existeduser);
    
    if(existeduser){
        throw new ApiError(409,"user with email or username already exists")
    }
     
    //console.log(req.files);
    
    const avatarLocalPath=req.files?.avatar[0]?.path;
    //const coverImageLocalPath=req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) &&req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is required")
    }

    
   const avatar= await uploadOnCloudinary(avatarLocalPath)
   const coverImage=await uploadOnCloudinary(coverImageLocalPath)

   if(!avatar){
    throw new ApiError(400,"avatar file is required")
   }

   const user=await User.create({
    fullname,
    avatar:avatar.url,
    coverImage:coverImage?.url||"",
    email,
    password,
    username:username.toLowerCase()
   })

   const createdUser=await User.findById(user.id).select(
    "-password -refreshToken"
   )

   if(!createdUser){
    throw new ApiError(500, "something went wrong while registering user")
   }

   return res.status(201).json(
    new ApiResponse(200,createdUser, "User registered Successfully")
   )
})


export {registerUser}