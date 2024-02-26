import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: "String",
    required: true,
  },
  email: {
    type: "String",
    required: true,
  },
  role: {
    type: "String",
    required: true,
  },
  isRoleVerified: {
    type: "Boolean",
    required: true,
  },
  mobileNumber: {
    type: "String",
    required: true,
    unique: true,
  },
  email: {
    type: "String",
    required: true,
    unique: true,
  },
  nid: {
    type: "Number",
    required: true,
    unique: true,
  },
  profilePicture: {
    type: "String",
    required: true,
  },
  balance: {
    type: "Number",
    required: true,
  },
  isLoggedIn: {
    type: "Boolean",
    required: true,
  },
});

export const UserModel = mongoose.model("users", userSchema);
