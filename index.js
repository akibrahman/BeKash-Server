import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";

const app = express();
const port = process.env.PORT || 8000;

mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });

app.use(
  cors()
  // {
  //     origin: [
  //       "http://localhost:5173",
  //       "https://house-hunter-akib.web.app",
  //       "https://house-hunter-akib.firebaseapp.com",
  //     ],
  //     credentials: true,
  //     optionsSuccessStatus: 200,
  //   }
);
app.use(express.json());
app.use(cookieParser());
// app.use("/", IndexRoute);
// app.use("/user", UserRoute);
// app.use("/house", HouseRoute);
// app.use("/booking", BookingRoute);

app.listen(port, () => {
  console.log(`Bekash Server is Running on Port - ${port}`);
});
