import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";

export const App = express();

App.use(morgan("dev"));

App.use(helmet());

App.use(cors({ origin: "http://localhost:3000" }));

App.use(express.json(), express.urlencoded({ extended: false }));

App.use(express.static(`/public`));
