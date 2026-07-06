import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import resumeRoutes from "./routes/resume";
import exportRouter from "./routes/export";
import tailorRouter from "./routes/tailor";
import jobsRouter from "./routes/jobs";
import templateConfigRouter from "./routes/templateConfig";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS to allow your frontend
app.use(
  cors({
    origin: "http://localhost:5173", // your Vite frontend URL
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Register routes
app.use("/api/v1/resume", resumeRoutes);
app.use("/api/v1/export", exportRouter);
app.use("/api/v1/tailor", tailorRouter);
app.use("/api/v1/jobs", jobsRouter);
app.use("/api/v1/template-config", templateConfigRouter);

// Health check
app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
