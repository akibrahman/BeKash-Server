import express from "express";
import { IndexController } from "../Controllers/controllers.js";

export const IndexRoute = express.Router();

IndexRoute.get("/", IndexController);
