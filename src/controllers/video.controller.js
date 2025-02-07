import mongoose,{isValidObjectId} from "mongoose";
import {Video} from "../models/video.model.js"
import{User} from "../models/user.model.js"
import{Like} from"../models/like.model.js"
import{Comment}from "../models/comment.model.js"
import {Tweet}from "../models/tweet.model.js"
import {ApiError} from "../utils/apierror.js"
import {ApiResponse} from "../utils/apiresponse.js"
import {asynchandler} from "../utils/asynchandler.js"
import {uploadOnCloudinary}from "../utils/cloudinary.js"

const getAllVideos=asynchandler(async(req,res)=>{       //need clarity
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    const videos=await Video.aggregate([
        {
            $match:{
                $or:[
                    {title:{$regex:query,$options:"i"}},
                    {description:{$regex:query,$options:"i"}}
                ]
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"videoBy"
            }
        },
        {
            $unwind:"$videoBy"
        },
        {
            $project:{
                thumbnail:1,
                videoFile:1,
                title:1,
                description:1,
                videoBy:{
                    fullname:1,
                    username:1,
                    avatar:1
                }
            }
        },
        {
            $sort:{
                [sortBy]:sortType==="asc"?1:-1
            }
        },
        {
            $skip:(page-1)*limit
        },
        {
            $limit:parseInt(limit)
        }
    ])
})

const publishAVideo=asynchandler(async(req,res)=>{          //tested
    const{title,description}=req.body
    
    if([title,description].some(item=>item.trim()==="")){
        throw new ApiError(400," description,title required")
    }

    const videoLocalPath=req.files?.videoFile[0].path
    const thumbnailLocalPath=req.files?.thumbnail[0].path

    if(!videoLocalPath||!thumbnailLocalPath){
        throw new ApiError(404,"thumbnail and video are required")
    }

    const videoFileCloud=await uploadOnCloudinary(videoLocalPath)
    const thumbnailCloud=await uploadOnCloudinary(thumbnailLocalPath)

    if(!videoFileCloud ||!thumbnailCloud){
        throw new ApiError(500,"error while uploading to cloudinary")
    }

    const video=await Video.create({
        owner: req.user._id,
        title,
        description,
        videoFile:videoFileCloud.url,
        thumbnail:thumbnailCloud.url,
        duration:videoFileCloud.duration
    })

    if(!video){
        throw new ApiError(500,"something went wrong when creating the video")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,video,"video created and uploaded succesfully"))
})

const getVideoById = asynchandler(async (req, res) => {     //tested
    const { videoId } = req.params
    //TODO: get video by id
    if(!videoId||!isValidObjectId(videoId)){
        throw new ApiError(404,"video file unavailable")
    }

    const video= await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"video not available")
    }

    res
    .status(200)
    .json(new ApiResponse(200,video,"Video retreived succesfully"))
})

const updateVideo = asynchandler(async (req, res) => {      //tested
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const {titleNew,descriptionNew}=req.body

    if(!videoId||!isValidObjectId(videoId)){
        throw new ApiError(404,"video ID is invalid")
    }

    const video=await Video.findById(videoId)

    if(!video ){
        throw new ApiError(404,"video file not available")
    }

    if((video.owner.toString())!==(req.user._id.toString())){
        throw new ApiError(409,"you are not allowed to modify the video file")
    }

    if(!titleNew&&!descriptionNew){
        throw new ApiError(404,"please provide a description or a title")
    }

    const thumbnailLocalPath=req.file?.path

    if(!thumbnailLocalPath){
        throw new ApiError(404,"thumbnail is required")
    }
    const thumbnailNew=await uploadOnCloudinary(thumbnailLocalPath)
    if(!thumbnailNew){
        throw new ApiError(500,"error while uploading thumbnail to cloudinary")
    }
    
    const updateVideo=await Video.findByIdAndUpdate(videoId,
        {
            $set:{
                title:titleNew||title,
                description:descriptionNew|| description,
                thumbnail:thumbnailNew?.url|| thumbnail

            }
        },{new:true}
    )

    if(!updateVideo){
        throw new ApiError(500,"error while uploading video file")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,updateVideo,"video ufile updated successfully"))
})

const deleteVideo = asynchandler(async (req, res) => {      //tested but not deleted from cloudinary
    const { videoId } = req.params

    const user= await req.user;
    if(!user){
        throw new ApiError(404,"you are not logged in to delete the video")
    }

    // const videoOwner=await Video.owner
    // if((videoOwner.toString())!==(user._id.toString())){
    //     throw new ApiError(404,"you are not allowed to delete this video")
    // }

    if(!videoId && !isValidObjectId(videoId)){
        throw new ApiError(400,"video id is invalid")
    }

    const isVideoDeleted=await Video.findByIdAndDelete(videoId)

    if(!isVideoDeleted){
        throw new ApiError(500,"error while deleting the video")
    }

    await Like.deleteMany({video:videoId})
    await Comment.deleteMany({video:videoId})
    await User.updateMany({watchHistory:videoId},{$pull:{watchHistory:videoId}})//need clarification

    return res
    .status(200)
    .json(new ApiResponse(200,isVideoDeleted,"Video file successfully deleted"))
})

const togglePublishStatus=asynchandler(async(req,res)=>{    //
    const{videoId}=req.params

    if(!videoId||!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid video id")
    }

    const video=await Video.findById(videoId)

    if(!video){
        throw new ApiError(404,"video not found")
    }

    if((video.owner.toString())!==(req.user._id.toString())){
        throw new ApiError(408,"you are not allowed to update the video")
    }
    const newIsPublished=!video.isPublished
    const isVideoUpdated=await Video.findByIdAndUpdate(videoId,
        {
            $set:{
                isPublished:newIsPublished
            }
        },{
            new:true
        }
    )

    if(!isVideoUpdated){
        throw new ApiError(500,"error while updating the video")
    }

    return res.status(200)
                .json(new ApiResponse(200,isVideoUpdated,"video succesfully updated"))
})
export {
    getAllVideos,
    updateVideo,
    publishAVideo,
    getVideoById,
    deleteVideo,
    togglePublishStatus
}