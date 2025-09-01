import { App } from "./http/express";
import routes from "./routes/index.routes";

import database from "../Contexts/Shared/framework/database";

routes(App);

App.listen(process.env.PORT_SERVER || 3030, async () => {
  console.log(`🤖 Mode: ${process.env.NODE_ENV}`);
  console.log(
    `🚀 Server is running on ${process.env.SERVER_NAME || "http://localhost"}:${
      process.env.PORT_SERVER || 3030
    }`
  );
  await database.run();
});
