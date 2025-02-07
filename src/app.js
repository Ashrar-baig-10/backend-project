import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"

const app=express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true,
}))
//allowing type of files to be acessed from frontend like json url etc..
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))

app.use(cookieParser())

//routes
import userRouter from"./routes/user.routes.js"
//import commentRouter from "./routes/comment.routes.js"
import videoRouter from "./routes/video.routes.js"
//routes declaration
app.use("/api/v1/users",userRouter)
//app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/videos", videoRouter)



export {app}