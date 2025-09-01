import mongoose, { ConnectOptions } from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const config: ConnectOptions = {};

async function run() {
  await mongoose
    .connect(`${process.env.URI_DB}`, config)
    .then(() => console.log(`Database connected`))
    .catch((err) => console.log(`Database connection error: \n ${err}`));
}

async function stop() {
  await mongoose.disconnect().then(() => console.log(`Database disconnected`));
}

export default { run, stop };
