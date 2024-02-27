import express from "express";
import {
  AllTransactionsController,
  TransactionsController,
  verifyToken,
} from "../Controllers/controllers.js";

export const TransactionsRoute = express.Router();

//! For Adding User
TransactionsRoute.post("/", verifyToken, TransactionsController);
TransactionsRoute.post("/admin", verifyToken, AllTransactionsController);
