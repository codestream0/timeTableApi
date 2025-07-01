import cors from "cors";
import express from "express";
import { authRouter } from "./routes/auth.routes";
import { subjectRouter } from "./routes/subject.routes";
import bodyParser from "body-parser";

const app = express();
const port = process.env.PORT || 3000;


app.use(cors({ origin: "*" })); 

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/auth", authRouter);
app.use("/subject", subjectRouter);
app.get("/", (req, res) => {
  res.send("Welcome to the API");
});

app.listen(port,  () => {
  console.log(`Server is running at http://localhost:${port}`);
});
