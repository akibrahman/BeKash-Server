import express from "express";
import {
  FindUserController,
  LogInUserController,
  RegisterController,
} from "../Controllers/controllers.js";

export const UserRoute = express.Router();

//! For Adding User
UserRoute.post("/register", RegisterController);
UserRoute.get("/find", FindUserController);
// UserRoute.get("/logout", LogOutUserController);
UserRoute.post("/login", LogInUserController);
