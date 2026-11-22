import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, lowercase: true, maxLength:100, minLength: 1  },
    email: { type: String, required: true, unique: true, lowercase:true, trim:true },
    password: { type: String, trim:true, required:true},
  },
 // { timestamps: true }
);

export const User = mongoose.model("User", userSchema, "users");
