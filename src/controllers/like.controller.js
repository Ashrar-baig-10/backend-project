import mongoose,{  isValidObjectId} from "mongoose";
import {ApiError} from "../utils/apierror.js"
import {ApiResponse} from "../utils/apiresponse.js"
import {asynchandler} from "../utils/asynchandler.js"
import {Like} from "../models/like.model.js"
import {Video} from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"


const toggleVideoLike=asynchandler(async(req,res)=>{
    const {videoId}=req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid video id")
    }

     const video=await Video.findById(videoId) //needs to be tested //to check videoid is available in database for Videos since on testing I entered user id in params and a like was generated
     if(!video){
         throw new ApiError(401,"video with this id does not exist")
    }
    const user=req.user?._id

    if(!user){
        throw new ApiError(401,"you are not allowed to like or dislike the video")
    }

    const alreadyLikedVideo=await Like.findOne({
        video:videoId,
        likedBy:user
    })
    if(alreadyLikedVideo){
        await Like.findByIdAndDelete(alreadyLikedVideo._id)
        return res
                .status(200)
                .json(new ApiResponse(200,alreadyLikedVideo,"video successfully disliked"))
    }

     const videoLiked= await Like.create({
        video:videoId,
        likedBy:req.user._id,
     })
     if(!videoLiked){
        throw new ApiError(500,"error while creating video like")
     }

     res
     .status(200)
     .json(new ApiResponse(200,videoLiked,"video like succesfully created"))
})

const toggleCommentLike=asynchandler(async(req,res)=>{
    const{commentId}=req.params

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"comment id is invalid")
    }

    const comment=await Comment.findById(commentId) //needs to be tested(same reason as above)
    if(!comment){
         throw new ApiError(401,"comment with this id does not exist")
     }
    const user = req.user._id
    if(!user){
        throw new ApiError(401,"you are not alowed to like or dislike the comment")
    }

    const alreadyLikedComment=await Like.findOne(
        {
            comment:commentId,
            likedBy:user
        }
    )

    if(alreadyLikedComment){
        await Like.findByIdAndDelete(alreadyLikedComment._id)
        return res
                .status(200)
                .json(new ApiResponse(200,alreadyLikedComment,"comment succefully disliked"))
    }

    const commentLiked=await Like.create({
        comment:commentId,
        likedBy:user
    })
    if(!commentLiked){
        throw new ApiError(500,"error while creating comment like ")
    }

    return res
            .status(200)
            .json(new ApiResponse(200,commentLiked,"comment succesffully liked"))
})

const toggleTweetLike = asynchandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"tweet id is invalid")
    }
     const tweet=await Tweet.findById(tweetId) //needs to be tested(same reason as above)
     if(!tweet){
         throw new ApiError(401,"tweet with this id does not exist")
     }

    const user = req.user._id
    if(!user){
        throw new ApiError(401,"you are not alowed to like or dislike the tweet")
    }

    const alreadyLikedTweet=await Like.findOne(
        {
            tweet:tweetId,
            likedBy:user
        }
    )

    if(alreadyLikedTweet){
        await Like.findByIdAndDelete(alreadyLikedTweet._id)
        return res
                .status(200)
                .json(new ApiResponse(200,alreadyLikedTweet,"tweet  succefully disliked"))
    }

    const tweetLiked=await Like.create({
        tweet:tweetId,
        likedBy:user
    })
    if(!tweetLiked){
        throw new ApiError(500,"error while creating tweet like ")
    }

    return res
            .status(200)
            .json(new ApiResponse(200,tweetLiked,"tweet succesfully liked"))
}
)

// const getLikedVideos = asynchandler(async (req, res) => {
//     //TODO: get all liked videos

// })

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, /*getLikedVideos*/ };
