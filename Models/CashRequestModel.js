import mongoose from "mongoose";

const cashRequestSchema = new mongoose.Schema({
  agentId: {
    type: "String",
    requirde: true,
  },
  agentName: {
    type: "String",
    requirde: true,
  },
  agentEmail: {
    type: "String",
    requirde: true,
  },
  agentNumber: {
    type: "String",
    requirde: true,
  },
  status: {
    type: "String",
    requirde: true,
  },
  createdAt: {
    type: "String",
    requirde: true,
  },
});

export const CashRequestModel = mongoose.model(
  "cashrequests",
  cashRequestSchema
);
