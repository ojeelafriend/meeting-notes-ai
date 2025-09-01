import express, { NextFunction, Request, Response } from "express";
import { sign, decode } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";

import { audit } from "../../Contexts/Shared/framework/logger";

export const App = express();

App.use(morgan("dev"));

App.use(helmet());

App.use(cors());

App.use(express.json(), express.urlencoded({ extended: false }));

App.use(express.static(`/public`));

App.use((request: Request, response: Response, next: NextFunction) => {
  //test para futura auditoria
  audit.info(
    `${request.method}: ${request.url} - Agent: ${request.headers["user-agent"]}`
  );

  next();
});

/*
  Scripts para crear tokens o refrescar.
*/

// const secret = process.env.SECRET_GUEST || "SECRET_SHH";

// function createToken(uuid?: string): string {
//   return sign({ uuid: uuid ? uuid : uuidv4(), role: "guest" }, secret, {
//     expiresIn: "1d",
//   });
// }
