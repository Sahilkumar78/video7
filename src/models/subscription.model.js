import mongoose, {Schema} from "mongoose";


const subscriptionSchema = mongoose.Schema({
      subscriber: {
         type: Schema.Types.objectId, // one who subscribing the channel
         ref: "User"
      },

      channel: {
         type: Schema.Types.objectId, // one to whome 'subscriber' is subscribing
         ref: "User"
      },
      
},  {timestamps: true})

export const Subscription = mongoose.model("Subscription", subscriptionSchema)