import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON request body parser
  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "TailorHer by Venkata Laxmi API is running" });
  });

  app.post("/api/notify-order", async (req, res) => {
    const { customerName, customerEmail, orderId, date, serviceName, measurements } = req.body;
    
    console.log("--- EMAIL NOTIFICATION SENT ---");
    console.log(`To: mekalamanojkumar6@gmail.com`);
    console.log(`Subject: New Order Placed - ${customerName}`);
    console.log(`Body:`);
    console.log(`Customer ${customerName} (${customerEmail}) has placed an order.`);
    console.log(`Order ID: ${orderId}`);
    console.log(`Date: ${date}`);
    console.log(`Item: ${serviceName}`);
    console.log(`Measurements: ${JSON.stringify(measurements, null, 2)}`);
    console.log("-------------------------------");

    res.json({ success: true, message: "Notification logged to console (Simulation)" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
