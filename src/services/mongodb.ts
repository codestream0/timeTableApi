import { MongoClient } from "mongodb";
import { mongodbUri } from "../variables";
require("dotenv").config();

export const dbClient = new MongoClient(mongodbUri);
export const database = dbClient.db("timeTableApi");

export const usersCollection = database.collection("users");
export const subjectCollection = database.collection("subjects");