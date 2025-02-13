import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/apierror.js"
import {ApiResponse} from "../utils/apiresponse.js"
import {asynchandler} from '../utils/asynchandler.js'
import{Video} from "../models/video.model.js"
const createPlaylist = asynchandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist
    
    const user=req.user
    if(!user){
        throw new ApiError(401,"User not logged in")
    }
    if(!name || !description){
        throw new ApiError(400,"need a name and description for the playlist")
    }

    const playlistCreated=await Playlist.create({
        name:name,
        description:description,
        owner:user._id,
    })

    if(!playlistCreated){
        throw new ApiError(500,"Error while creating playlist ")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,playlistCreated,"playlist created succesfully"))
})

const getUserPlaylists = asynchandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

})

const getPlaylistById = asynchandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"invalid object id")
    }
    
    const playlist=await Playlist.findById(playlistId)
    //console.log(playlist);
    
    if(!playlist){
        throw new ApiError(404,"playlist not found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,playlist,"playlist retrieved succesfully"))
})

const addVideoToPlaylist = asynchandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!(isValidObjectId(playlistId)&&isValidObjectId(videoId))){
        throw new ApiError(400,"playlist or video id is invalid")
    }
    const video=await Video.findById(videoId) 
     if(!video){
         throw new ApiError(401,"video with this id does not exist")
    }
     const addToPlaylist=await Playlist.findOneAndUpdate(
        {_id:playlistId,owner:req.user._id},
        {$addToSet:{videos:videoId}},
        {new:true}
     )

     if(!addToPlaylist){
        throw new ApiError(500,"error while adding video to playlist")
     }
     return res
     .status(200)
     .json(new ApiResponse(200,addToPlaylist,"video added to playlist successfully"))
})

const removeVideoFromPlaylist = asynchandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!(isValidObjectId(playlistId)&&isValidObjectId(videoId))){
        throw new ApiError(400,"playlist or video id is invalid")
    }
    const playlist=await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"playlist not found")
    }
    if(!playlist.videos.some(video=>video.equals(videoId))){
        throw new ApiError(401,"video does not exist in the playlist to be deleted")
    }
     const removeFromPlaylist=await Playlist.findOneAndUpdate(
        {_id:new mongoose.Types.ObjectId(playlistId),owner:req.user._id},//just checking if this kind of conversion works
        {$pull:{videos:new mongoose.Types.ObjectId(videoId)}},
        {new:true}
     )
     if(!removeFromPlaylist){
        throw new ApiError(500,"error while removing video from playlist")
     }
    
     return res
     .status(200)
     .json(new ApiResponse(200,removeFromPlaylist,"video successfullly removed from playlist"))

})

const deletePlaylist = asynchandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"invalid playlist id")
    }
    if(!req.user){
        throw new ApiError(401,"user needs to be logged in to delete ")
    }
    const playlist=await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404,"playlist does not exist or has already been deleted")
    }
    if(req.user._id.toString()!==playlist.owner.toString()){
        throw new ApiError(404,"you are not allowed to delee the playlist")
    }

    const deletedPlaylist=await Playlist.findOneAndDelete(
        {_id:playlistId,owner:req.user._id}
    )
    if(!deletedPlaylist){
        throw new ApiError(500,"error while deleting the playlist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,deletedPlaylist,"playlist successfully deleted"))
})

const updatePlaylist = asynchandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"invalid object id")
    }
    if(!name || !description){
        throw new ApiError(404,"name and description cannot be empty ")
    }
    const updatedPlaylist=await Playlist.findOneAndUpdate(
        {_id:playlistId,owner:req.user._id},
        {
            $set:{
                name,
                description,
            },
        },{new:true}
    )
    if(!updatedPlaylist){
       throw new ApiError (500,"error while updating playlist")
     }
     res
     .status(200)
     .json(new ApiResponse(200,updatedPlaylist,"playlist updated successfuly"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}