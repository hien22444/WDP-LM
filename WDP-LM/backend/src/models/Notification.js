const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: null },
    read: { type: Boolean, default: false, index: true },
    data: { type: Object, default: {} }
  },
  { 
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false
  }
);

module.exports = mongoose.model("Notification", NotificationSchema);


