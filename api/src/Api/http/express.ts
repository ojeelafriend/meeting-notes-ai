import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

export const App = express();

App.use(morgan("dev"));

App.use(helmet());

App.use(cors({ origin: "http://localhost:5174", credentials: true }));

App.use(cookieParser());

App.use(
  express.json({ limit: "100mb" }),
  express.raw({ limit: "100mb" }),
  express.urlencoded({ limit: "100mb", extended: false })
);

App.use(express.static(`/public`));

App.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ ok: true, message: "Smart Notes API is running" });
});

App.use((req: any, res: Response, next: NextFunction) => {
  if (req.url === "/login" || req.url === "/me") {
    next();
    return;
  }

  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

  if (!decoded) {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }

  if (typeof decoded === "string") {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }

  req.user = {
    userId: decoded.userId,
    username: decoded.username,
  };
  next();
});
