import express from "express";
import {
  SendMoneyController,
  verifyToken,
} from "../Controllers/controllers.js";

export const SendMoneyRoute = express.Router();

//! For Adding User
SendMoneyRoute.post("/", verifyToken, SendMoneyController);
