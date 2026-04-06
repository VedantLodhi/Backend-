import dotenv from "dotenv";
dotenv.config();   // <-- ye sabse pehle hona chahiye

import connectDB from "./db/db.js";

connectDB();