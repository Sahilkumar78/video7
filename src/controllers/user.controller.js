import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken"


const generateAccessAndRefreshTokens = async (userId) => {
     
   try {

        const user = await User.findById(userId);
        console.log("user :", user)
      const accessToken =  user.generateAccessToken();
      const refreshToken =  user.generateRefreshToken();
         console.log(accessToken)
         console.log(refreshToken);

      user.refreshToken= refreshToken;
      await user.save({ validateBeforeSave: false });
        
       return {accessToken, refreshToken};
 
   } catch (error) {
       throw new ApiError(500, 
        "Something went wrong while generating refresh and access token")
   }
} 

const registerUser = asyncHandler(async (req, res) => {
          // get user detail from frontend
         // validation 
        // check if user is already exists: username, email
        // check for images , check for avatar
        // upload them on cloudinary, avatar
        // mongoDB-> me objects hi pass karney padtey hai
        // create user object - create entry in db
        // remove password and refresh token field from response
        // check for user creation
        // return res
     
       const {fullname, email, username, password} = req.body;
         console.log("email", email)
         
        //  if(fullname === ""){
        //      throw new ApiError(400, "Fullname is required")
        //  }

        // lets moves on the advanced syntax
        if(
            [fullname, email, username, password].some((field) => 
                   field?.trim() === "")
        ){
             throw new ApiError(400, "All fields are required")
        }

       const existedUser= await User.findOne({
                $or: [{username}, {email}]
        })
        
      if(existedUser){
         throw new ApiError(400, " User with email or username already existed ");
      }

      // check for images

      console.log(req.files);
     const avatarLocalPath =  req.files?.avatar[0]?.path;
   //   const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) &&
      req.files.coverImage.length>0
   ){
       coverImageLocalPath = req.files.coverImage[0].path
   }

       
        if(!avatarLocalPath){
                 throw new ApiError(404, "Avatar file is required")
        }

        // upload on cloudinary
       const avatar = await uploadOnCloudinary(avatarLocalPath);
     const coverImage=  await uploadOnCloudinary(coverImageLocalPath);

      if(!avatar){
         throw new ApiError(400, "Avatar file is required");

      }
      
       // entry in database
     const user = await User.create({
           fullname, 
           avatar: avatar.url,
           coverImage: coverImage?.url || "",
           email,
           password,
           username: username.toLowerCase()
       })

      const createdUser = await User.findById(user._id).select(
         "-password -refreshToken"
       )

       if(!createdUser){
          throw new ApiError(500, "Something went wrong while registering the user")
       }

       return res.status(201).json( 
         new ApiResponse(200, createdUser, "User registered Successfully")
       )

})

const loginUser = asyncHandler(async (req, res) => {
        // req body se data le aao
        // username, email
        // find the user
        // password check
        // access and refresh token 
        // send cookies -> tokens ko hum cookies me bhejtey hai

      const {email, username, password} = req.body;
       console.log(email)
       console.log(password)
       
       if(!username &&  !email){
         throw new ApiError(400, 
        "username or email is required");
       }

    


      const user = await User.findOne({
         $or: [{username}, {email}]
       })

       if(!user){
           throw new ApiError(404, "User does not exist")
       }
       
    const isPasswordValid = await user.isPasswordCorrect(password)
     
       if(!isPasswordValid){
         throw new ApiError(401, "Invalid user credentials")
       }  
        
     console.log(isPasswordValid);

      const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);
      
       console.log(accessToken)

      const loggedInUser = await User.findById(user._id).select("-password -refreshToken")  // it is optional step


      const options = { // cookies ko frontend se change nhi kar paengey
        httpOnly: true,
          secure: true
      }

     return res
     .status(200)
     .cookie("accessToken" , accessToken, options) // it is like a key value pair
     .cookie("refreshToken", refreshToken, options)
     .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser, accessToken, refreshToken
          },
          "User logged In Successfully"
        )
     )
})  

const logoutUser = asyncHandler(async (req, res) => {
         
     await User.findByIdAndUpdate(
        req.user._id,
        {
          $set: {
            refreshToken: undefined
          }
        }, 
        {
          new : true
        },
        
      )

       const options = { // cookies ko frontend se change nhi kar paengey
        httpOnly: true,
          secure: true
      }
      
      return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) =>{
      const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken // req body for mbile user
     
      if(!incomingRefreshToken){
          throw new ApiError(401, "unauthorized request")
      }
       
      
       
     try {
      //verify the token
      const decodedToken = jwt.verify(incomingRefreshToken, 
       process.env.REFRESH_TOKEN_SECRET);
        
     const user = await User.findById(decodedToken?._id)
 
       if(!user){
          throw new ApiError(401, "Invalid refresh token")
       }
 
      if(incomingRefreshToken !== user?.refreshToken){
         throw new ApiError(401, "Refresh token is expired or used")
      }
        
      const options ={ // cookies
           httpOnly: true, 
           secure: true
      }
 
   const{accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
 
      return res
     .status(201)
     .cookie("accessToken", accessToken)
     .cookie("refreshToken", newRefreshToken)
     .json(
         new ApiResponse(
           200,
           {accessToken, refreshToken: newRefreshToken},
           "Access token refreshed"
         )
     )
     } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
     }
        

    })


const changeCurrentPassword = asyncHandler(async (req, res) => {
          const {oldPassword, newPassword} = req.body;

         const user = await User.findById(req.user?._id);
         const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

         if(!isPasswordCorrect){
             throw new ApiError(401, "Invalid old password")
         }

         user.password = newPassword
        await user.save({ validateBeforeSave: false}) // don't wanna run other validations, so 
        // validatebeforesave: false
        
        return res
        .status(200)
        .json(new ApiResponse(201, {}, "changed password successfully"))
            
})

const getCurrentUser = asyncHandler(async (req, res) => {
          return res.status(200).json(200, req.user,
             "current user fetched sucessfully")
})

const updateAccountDetails = asyncHandler(async(req, res) => {
        const {fullname, email} = req.body

        if(!fullname || !email){
           throw new ApiError(400, "All fields are required")
        }

        // find user firstly
     const user = await User.findByIdAndUpdate(
                     req.user?._id,
                     {
                       $set: {
                         fullname,
                         email: email
                       }
                     },
                     {
                      new :true // update honey ke baad ki information aapko miley
                     }
                     
                    ).select("-password")

      return res
      .status(200)
      .json(new ApiResponse(201, user, "Account Details successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
      const avatarLocalPath = req.file?.path;

      if(!avatarLocalPath){
         throw new ApiError(400, "Avatar file is missing")
      }

      const avatar = await uploadOnCloudinary(avatarLocalPath);
         
         if(!avatar.url){
           throw new ApiError(401, "Error while uploading the avatar")
         }

         const user = await User.findByIdAndUpdate(
                  req.user?._id,
                  {
                    $set: {
                      avatar: avatar.url
                    }
                  },
                  {new : true}
         ).select("-password")

         return res
         .status(200)
         .json(new ApiResponse(201, user,  "avatar image updated successfully"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
      const coverImageLocalPath = req.file?.path;

      if(!coverImageLocalPath){
         throw new ApiError(400, "coverImage file is missing")
      }

      const coverImage = await uploadOnCloudinary(avatarLocalPath);
         
         if(!coverImage.url){
           throw new ApiError(401, "Error while uploading the cover image")
         }

      const user = await User.findByIdAndUpdate(
                  req.user?._id,
                  {
                    $set: {
                      coverImage: coverImage.url
                    }
                  },
                  {new : true}
         ).select("-password")

         return res
         .status(200)
         .json(new ApiResponse(201, user, "cover image updated successfully"))
})



export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage

}
