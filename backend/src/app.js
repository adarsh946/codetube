import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// cors is use to connect backend from frontend
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" })); // store json data
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // to encode the url
app.use(cookieParser()); //  manupulation on cookies with server like performing crud operation.
app.use(express.static("public"));

// Router Functionalities....
import userRouter from "./routers/user.routers.js";

//  router declaration
app.use("/api/v1/user", userRouter); // http://localhost:8000/api/v1/user

export { app };
