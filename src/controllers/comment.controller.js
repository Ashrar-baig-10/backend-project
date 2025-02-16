import mongoose,{isValidObjectId} from "mongoose";
import { ApiError } from "../utils/apierror.js";
import { ApiResponse } from "../utils/apiresponse.js";
import { asynchandler } from "../utils/asynchandler.js";
import { Comment } from "../models/comment.model.js";

const getVideoComments = asynchandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid video id")
    }
    
    const comments= await Comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            },
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"commentOnVideo"
            },
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"commentOwner"
            }
        },
        {
            $project:{
                content:1,
                video:{
                    $arrayElemAt:["$commentOnVideo",0]
                },
                owner:{
                    $arrayElemAt:["$commentOwner",0]
                },
                createdAt:1,
            }
        },
        {
            $project:{
                content:1,
                    owner:{
                        fullname:1,
                        username:1,
                        subscribersCount:1,
                        isSubscribed:1,
                        channelsSubscribedToCount:1,
                        avatar:1,
                        coverImage:1,
                        email:1,
                    },
                    video:{
                        videoFile:1,
                        thumbnail:1,
                        description:1,
                        duration:1,
                        isPublished:1,
                        owner:1,

                    },
                    createdAt:1,
            }
        },
        {
            $skip: (page - 1) * parseInt(limit),
        
        },
        {
            $limit: parseInt(limit),
        }
    ])
   // console.log(comments)
    if(!comments?.length){
        throw new ApiError(404,"Comments not found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, comments,"comments retrieved successfully"))

})

const addComment = asynchandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId}=req.params;
    const {content}=req.body;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id")
    }

    if(!req.user){
        throw new ApiError(404,"user not logged in to add comment")
    }
    //console.log(content)
    if(!content){
        throw new ApiError(400,"content cannot be empty")
    }

    const addedComment=await Comment.create({
        content:content,
        owner:req.user?.id,
        video:videoId
    })

    if(!addComment){
        throw new ApiError(500,"error ehile creating comment")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,addedComment,"comment successfully added"))

})

const updateComment = asynchandler(async (req, res) => {
    // TODO: update a comment
    const {commentId}= req.params
    const {content}=req.body

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"invalid comment id")
    }
    if(!req.user){
        throw new ApiError(401,"user not logged in")
    }
    if(!content){
        throw new ApiError(400,"comment cannot be empty")
    }

    const updatedComment=await Comment.findOneAndUpdate(
        {
            _id:commentId,
            owner:req.user._id
        },
        {
            $set:{
                content:content
            },
        },
        {new:true}
    );

    if(!updatedComment){
        throw new ApiError(500,"Error while updating the comment")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,updatedComment,"comment successfully updated"))
})

const deleteComment = asynchandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId}=req.params
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"invalid coment id")
    }
    if(!req.user){
        throw new ApiError(401,"user needs to be logged in")
    }
    const deletedComment=await Comment.findOneAndDelete(
        {
            _id:commentId,
            owner:req.user._id
        }
    );
    if(!deletedComment){
        throw new ApiError(400,"error while deleting comment")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,deletedComment,"comment succesfully deleted"))

})


export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }