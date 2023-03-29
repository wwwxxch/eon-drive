import express from "express";
import dotenv from "dotenv";

dotenv.config();
const port = process.env.PORT;

const app = express();

app.use(express.static("./public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ---------------------------------------------------
// Simple check

app.get("/check", (req, res) => {
  console.log("/check");
  return res.send("Hello World!");
});

// ---------------------------------------------------
// Errors

app.use((req, res, next) => {
  console.log("ERROR req.path: ", req.path);
  const err = new Error("=====Page not found=====");
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {  
  res.status(err.status || 500)
    .json({ 
      status: err.status,
      message: err.message,
      stack: err.stack 
    });
});

// ---------------------------------------------------
app.listen(port, () => {
  console.log(`Server is running on port ${port}...`);
});
