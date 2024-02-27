import express from "express";
import { CashInController, verifyToken } from "../Controllers/controllers.js";

export const CashInRoute = express.Router();

//! For Adding User
CashInRoute.post("/", verifyToken, CashInController);
