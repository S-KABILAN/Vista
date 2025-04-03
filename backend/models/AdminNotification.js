const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AdminNotificationSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "info",
        "success",
        "warning",
        "error",
        "trip",
        "promotion",
        "system",
      ],
      default: "info",
    },
    sentBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    sentTo: {
      type: String,
      required: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    data: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

// Add indexes for better query performance
AdminNotificationSchema.index({ sentBy: 1 });
AdminNotificationSchema.index({ sentAt: -1 });

module.exports = mongoose.model("AdminNotification", AdminNotificationSchema);
