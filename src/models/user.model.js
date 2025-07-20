import mongoose, {Schema} from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'


const userSchema = new Schema({
       username: {
         type: String,
         required: true,
         unique: true,
         lowercase: true,
         trim: true,
         index: true, // searching field ke liye jaruri hota hai idx
       },

       email: {
         type: String,
         required: true,
         unique: true,
         lowercase: true,
         trim: true
       },
       fullname: {
         type: String,
         required: true,
         trim: true,
         index: true
       },
       avatar: {
         type:String, // cloudinary url
         required: true 
       },
       coverImage: {
         type: String // cloudinary url
       },

       watchHistory: [{
         type: Schema.Types.ObjectId,
         ref: "Video"
       }],
       password: {
         type: String,
         required: [true, "Password is required"] // custom error message
       },
       refreshToken:{
          type: String
       }
       
}, {timestamps: true})


userSchema.pre('save', async function (){ // pre is a middleware
     
  if(!this.isModified("password")) return next();
   this.password = await bcrypt.hash(this.password, 10);
    next();
})

userSchema.methods.isPasswordCorrect = async function(passowrd){
  return await bcrypt.compare(passowrd, this.passowrd);
}


userSchema.methods.generateAccessToken = function(){
    jwt.sign({
       _id: this._id,
       email: this.email,
       username: this.username,
       fullname: this.fullname
    },
    process.env.ACESS_TOKEN_SECRET,
   {
    expiresIn: process.env.ACESS_TOKEN_EXPIRY
   }
  )
}

userSchema.methods.generateRefreshToken = function(){
    jwt.sign({
       _id: this._id,
     
    },
    process.env.REFRESH_TOKEN_SECRET,
   {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY
   }
  )
}


export const User = mongoose.model("User", userSchema);
