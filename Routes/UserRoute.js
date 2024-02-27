import express from "express";
import {
  ApproveAgentController,
  BlockUserController,
  FindUserController,
  GetAgentsController,
  LogInUserController,
  LogOutUserController,
  RegisterController,
  RejectAgentController,
} from "../Controllers/controllers.js";

export const UserRoute = express.Router();

//! For Adding User
UserRoute.post("/register", RegisterController);
UserRoute.get("/find", FindUserController);
UserRoute.post("/login", LogInUserController);
UserRoute.post("/logout", LogOutUserController);
UserRoute.get("/getagents", GetAgentsController);
UserRoute.post("/approveagent", ApproveAgentController);
UserRoute.post("/rejectagent", RejectAgentController);
UserRoute.post("/blockuser", BlockUserController);
