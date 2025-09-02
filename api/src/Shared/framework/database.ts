import mongoose, { ConnectOptions } from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const config: ConnectOptions = {
  dbName: process.env.MONGO_DATABASE,
  user: process.env.MONGO_USERNAME,
  pass: process.env.MONGO_PASSWORD,
};

async function run() {
  await mongoose
    .connect(
      `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`,
      config
    )
    .then(() => console.log(`Database connected`))
    .catch((err) => console.log(`Database connection error: \n ${err}`));
}

async function stop() {
  await mongoose.disconnect().then(() => console.log(`Database disconnected`));
}

export default { run, stop };
