import { v2 as cloudinary } from "cloudinary";
import fs from "fs"



    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });

    const uploadOnCloudinary=async(localfilepath)=>{
        try {
            if(!localfilepath)  return null
            const response= await cloudinary.uploader.upload(localfilepath,{
                resource_type:"auto"
            })
            //console.log("file is successfully uploaded",
            //response.url);
            fs.unlinkSync(localfilepath)
            return response
        } catch (error) {
            fs.unlinkSync(localfilepath)//remove local saved temp file
            
            return null
            
        }

    }

    const deleteThumbnailFromCloudinary=async(thumbnailUrl)=>{
        try {
            const thumbnailId=thumbnailUrl.split("/").pop().split(".")[0]
            // const id=thumbnailUrl.split("/")
            // const idlastpart=id[id.length-1]
            // const thumbnailId=idlastpart.split(".")[0]
            const response=await cloudinary.uploader.destroy(thumbnailId)
            console.log("thumbnail successfully deleted from cloudinary");
            return response
            
        } catch (error) {
            console.log("error while deleting thumbnail from cloudinary",error)
            return null
        }
    }

    const deleteVideoFromCloudinary=async(videoUrl)=>{
        try {
            const videoId=videoUrl.split("/").pop().split(".")[0]
            const response=await cloudinary.uploader.destroy(videoId,{
                resource_type:"video"
            })
            console.log("video successfully deleted from cloudinary")
            return response
        } catch (error) {
            console.log("Error while deleting video from cloudinary",error)
        }
    }


export {uploadOnCloudinary,deleteThumbnailFromCloudinary,deleteVideoFromCloudinary}