import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    level: { type: Number, required: true, index: true },
    topic: { type: String, required: true, index: true },
    type: { type: String, required: true, enum: ["mc", "tf", "multi"] },
    q: { type: String, required: true },
    options: { type: [String], required: true },
    // number for mc/tf, array of numbers for multi
    answer: { type: mongoose.Schema.Types.Mixed, required: true },
    why: { type: String, default: "" },
  },
  { collection: "question", versionKey: false }
);

export default mongoose.model("Question", questionSchema);
