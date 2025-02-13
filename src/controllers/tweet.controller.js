import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"

import {ApiError} from "../utils/apierror.js"
import {ApiResponse} from "../utils/apiresponse.js"
import {asynchandler} from "../utils/asynchandler.js"

const createTweet = asynchandler(async (req, res) => {
    //TODO: create tweet
    const {content}=req.body
    if(!content){
        throw new ApiError(404,"content cannot be empty")
    }
    const tweet=await Tweet.create({
        owner:req.user._id,
        content:content
    })
    if(!tweet){
        throw new ApiError(500,"Error while generating tweet")
    }
    res
    .status(200)
    .json(new ApiResponse(200,tweet,"tweet successfully created"))
})

const getUserTweets = asynchandler(async (req, res) => {
    // TODO: get user tweets
})

const updateTweet = asynchandler(async (req, res) => {
    //TODO: update tweet
    const{tweetId}=req.params
    const {content}=req.body

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"invalid object id")
    }
    if(!content){
        throw new ApiError(400,"content cannot be empty")
    }
    const tweet=await Tweet.findById(tweetId)

    if(req.user._id.toString()!==tweet.owner.toString()){
        throw new ApiError(404,"You are not allowed to update tweet")
    }

    const isTweetUpdated=await Tweet.findOneAndUpdate(
        {_id:tweetId,owner:req.user._id},
        {
            $set:{
                content:content
            }
        },{new:true}
    )
    if(!isTweetUpdated){
        throw new ApiError(500,"error while updating tweet")
    }
     return res
     .status(200)
     .json(new ApiResponse(200,isTweetUpdated,"updated tweet succesfully"))

})

const deleteTweet = asynchandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId}=req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"invalid object id")
    }
    const tweet=await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404,"tweet does not exist")
    }
    if(req.user._id.toString()!==tweet.owner.toString()){
        throw new ApiError(404,"You are not allowed to delete tweet")
    }
    const isTweetDeleted=await Tweet.findOneAndDelete(
        {_id:tweetId,owner:req.user._id}
    )
    if(!isTweetDeleted){
        throw new ApiError(500,"error while deleting tweet")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,isTweetDeleted,"tweet deleted succesfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}