import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  senderNumber: {
    type: "String",
    requirde: true,
  },
  receiverNumber: {
    type: "String",
  },
  transactionID: {
    type: "String",
    requirde: true,
  },
  createdAt: {
    type: "String",
    requirde: true,
  },
  amount: {
    type: "Number",
    requirde: true,
  },
  methode: {
    type: "String",
    requirde: true,
  },
  for: {
    type: "String",
    requirde: true,
  },
  type: {
    type: "String",
    requirde: true,
  },
});

export const TransactionModel = mongoose.model(
  "transactions",
  transactionSchema
);
