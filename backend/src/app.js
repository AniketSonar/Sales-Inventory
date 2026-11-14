const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const apiRoutes = require("./routes/apiRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", apiRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "B2B Sales & Inventory API with Live Database" });
});

module.exports = app;
