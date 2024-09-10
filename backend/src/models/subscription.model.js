import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    //  one who subscribing...
    subscription: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // to whom subscriber is subscribing..
    channel: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
