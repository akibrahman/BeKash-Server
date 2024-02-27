import express from "express";
import { SystemBalanceController } from "../Controllers/controllers.js";

export const SystemBalanceRoute = express.Router();

//! For Adding User
SystemBalanceRoute.get("/", SystemBalanceController);
