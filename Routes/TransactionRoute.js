import express from "express";
import {
  AllTransactionsController,
  IdTransactionsController,
  TransactionsController,
  UserWiseTransactionsController,
  verifyToken,
} from "../Controllers/controllers.js";

export const TransactionsRoute = express.Router();

//! For Adding User
TransactionsRoute.post("/", verifyToken, TransactionsController);
TransactionsRoute.post("/admin", verifyToken, AllTransactionsController);
TransactionsRoute.get("/id", verifyToken, IdTransactionsController);
TransactionsRoute.post(
  "/user-wise",
  verifyToken,
  UserWiseTransactionsController
);
