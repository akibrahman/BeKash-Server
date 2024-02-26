import express from "express";
import {
  FindUserController,
  LogInUserController,
  LogOutUserController,
  RegisterController,
} from "../Controllers/controllers.js";

export const UserRoute = express.Router();

//! For Adding User
UserRoute.post("/register", RegisterController);
UserRoute.get("/find", FindUserController);
UserRoute.post("/login", LogInUserController);
UserRoute.post("/logout", LogOutUserController);
