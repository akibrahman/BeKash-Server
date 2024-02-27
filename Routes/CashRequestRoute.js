import express from "express";
import {
  AddCashRequestController,
  ApproveCashRequestController,
  DeclineCashRequestController,
  EditCashRequestController,
  GetCashRequestsController,
  verifyToken,
} from "../Controllers/controllers.js";

export const CashRequestRoute = express.Router();

//! For Adding User
CashRequestRoute.post("/add", verifyToken, AddCashRequestController);
CashRequestRoute.get("/get", verifyToken, GetCashRequestsController);
CashRequestRoute.patch("/edit", verifyToken, EditCashRequestController);
CashRequestRoute.post("/approve", verifyToken, ApproveCashRequestController);
CashRequestRoute.post("/decline", verifyToken, DeclineCashRequestController);
