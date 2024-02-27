import express from "express";
import { AddTransactionController } from "../Controllers/controllers.js";

export const TransactionRoute = express.Router();

//! For Adding User
TransactionRoute.post("/add", AddTransactionController);
