import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import { CashInRoute } from "./Routes/CashInRoute.js";
import { CashOutRoute } from "./Routes/CashOutRoute.js";
import { IndexRoute } from "./Routes/IndexRoute.js";
import { SendMoneyRoute } from "./Routes/SendMoneyRoute.js";
import { TransactionsRoute } from "./Routes/TransactionRoute.js";
import { UserRoute } from "./Routes/UserRoute.js";

const app = express();
const port = process.env.PORT || 8000;

mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/", IndexRoute);
app.use("/user", UserRoute);
app.use("/transactions", TransactionsRoute);
app.use("/send-money", SendMoneyRoute);
app.use("/cash-out", CashOutRoute);
app.use("/cash-in", CashInRoute);

app.listen(port, () => {
  console.log(`Bekash Server is Running on Port - ${port}`);
});
