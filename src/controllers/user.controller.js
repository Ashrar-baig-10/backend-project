import {asynchandler} from"../utils/asynchandler.js"
import jwt from "jsonwebtoken"
import {ApiError} from "../utils/apierror.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from"../utils/cloudinary.js"
import{ApiResponse} from"../utils/apiresponse.js"

const generateAccessAndRefreshToken=async(UserId)=>{
    try {
        const user=await User.findById(UserId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}
        
    } catch (error) {
        throw new ApiError(500,"something went wrong whie generating refresh an access token")
    }
}

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

const loginUser=asynchandler(async(req,res)=>{
    //reqbody-data
    //username or email
    //find if user exist
    //check password
    //access and efresh token
    //send cookie

    const {username,email,password}=req.body;

    if(!(username || email)){
        throw new ApiError(400,"username or email is required")
    }
    
     const user=await User.findOne({
        $or:[{username},{email}]
     })

     if(!user){
        throw new ApiError(404,"User does not exist")
     }

    const isPasswordValid= await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401," Invalid credentials")
     }

     const{accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)

     const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

     const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,
            {
                user:loggedInUser,accessToken,refreshToken

            },"user logged in successfully")
    )
})

const logoutUser=asynchandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(200,{},"User signed out successfully"))
})

const refreshAccessToken= asynchandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken|| req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorised request")
    }

    try {
        const decodedToken=jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user=await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token expired or used")
    
        }
    
        const options={
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newRefreshToken}=await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",newAccessTokenaccessToken,options)
        .cookie("refreshToken",newRefreshTokenefreshToken,options)
        .json(
            new ApiResponse(200,{accessToken,newRefreshToken},"Access token refreshed successfully")
        )
    } catch (error) {
        throw  new ApiError(401,error?.message||"invslid refresh token")
        
    }
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}