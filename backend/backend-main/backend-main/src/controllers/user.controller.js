import mongoose from "mongoose";
import { User } from "../models/usermodel.js";

const invalidId = (id) => !mongoose.isValidObjectId(id);

// CREATE
export const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }

    const user = await User.create({ name, email, password });
    const { password: _pw, ...safeUser } = user.toObject();
    res.status(201).json(safeUser);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Name or email already exists" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// READ all
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// READ one
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (invalidId(id)) return res.status(400).json({ message: "Invalid user id" });

    const user = await User.findById(id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (invalidId(id)) return res.status(400).json({ message: "Invalid user id" });

    const user = await User.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Name or email already exists" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (invalidId(id)) return res.status(400).json({ message: "Invalid user id" });

    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
