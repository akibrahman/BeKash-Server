import express from "express";
import { CashOutController, verifyToken } from "../Controllers/controllers.js";

export const CashOutRoute = express.Router();

//! For Adding User
CashOutRoute.post("/", verifyToken, CashOutController);
