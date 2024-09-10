import dotenv from "dotenv";
import connectDb from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDb()
  .then(console.log(`process is running on port ${process.env.PORT}`))
  .catch((error) => {
    console.log("there is problem in connection to database", error.messege);
  });

app.listen(process.env.PORT);
