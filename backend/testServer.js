const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3002; // Different port than your main server

app.use(cors({ origin: "*" }));
app.use(express.json());

// Very simple endpoint
app.get("/test", (req, res) => {
  res.json({ message: "Test server is working!" });
});

app.get("/", (req, res) => {
  res.json({ message: "Root endpoint is working!" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Test server running on port ${PORT}`);
});
