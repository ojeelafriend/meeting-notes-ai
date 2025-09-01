import express, { Request, Response, Express } from "express";

const router = express.Router();

const routes = (server: Express) => {
  server.use("/core/", router);
};

router.get("", (req: Request, res: Response) => {
  return res.status(200).json({ data: "" });
});

export default routes;
