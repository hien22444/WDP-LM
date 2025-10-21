const mongoose = require("mongoose");

const TeachingSlotSchema = new mongoose.Schema(
	{
		tutorProfile: { type: mongoose.Schema.Types.ObjectId, ref: "TutorProfile", required: true, index: true },
		start: { type: Date, required: true },
		end: { type: Date, required: true },
		mode: { type: String, enum: ["online", "offline"], required: true },
		price: { type: Number, default: 0 },
		courseCode: { type: String, default: null, index: true },
		courseName: { type: String, required: true, trim: true, maxlength: 120 },
		location: { type: String, default: null, trim: true, maxlength: 200 },
		notes: { type: String, default: null, maxlength: 500 },
		capacity: { type: Number, default: 1, min: 1, max: 20 },
		status: { type: String, enum: ["open", "closed", "booked"], default: "open", index: true }
	},
	{
		timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
		versionKey: false,
		collection: "teaching_slots",
	}
);

TeachingSlotSchema.index({ start: 1, tutorProfile: 1 });

module.exports = mongoose.model("TeachingSlot", TeachingSlotSchema);


