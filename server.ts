import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Google GenAI if key is present
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log("Gemini API Client initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Gemini client:", error);
  }
} else {
  console.warn("GEMINI_API_KEY is not defined. Falling back to rule-based reminders.");
}

// ---------------------- API ROUTES ----------------------

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "healthy", hasGemini: !!ai });
});

// Write-up model-based monthly rent reminder
app.post("/api/reminders/generate-draft", async (req: Request, res: Response) => {
  const { tenantName, roomNumber, rentDue, electricityDue, otherDue, depositDetails, ledgerSummary } = req.body;

  const totalDue = (rentDue || 0) + (electricityDue || 0) + (otherDue || 0);

  if (!ai) {
    // Elegant system-generated fallback draft if Gemini is not set up
    const subject = `Monthly Rent & Utility Reminder - Room ${roomNumber}`;
    const body = `Dear ${tenantName},

This is a friendly reminder for your monthly charges for Room ${roomNumber}.

Summary of Dues:
- Monthly Rent: $${(rentDue || 0).toFixed(2)}
- Electricity Bill: $${(electricityDue || 0).toFixed(2)}
- Other Expenses / Dues: $${(otherDue || 0).toFixed(2)}
---------------------------------------------
Total Outstanding: $${totalDue.toFixed(2)}

Deposit Paid: $${(depositDetails?.amount || 0).toFixed(2)} (${depositDetails?.status || "Paid"})

Please process the payment at your earliest convenience. If you have already made the transfer, please share the transaction screen with us.

Best regards,
Property Management`;
    
    return res.json({
      subject,
      body,
      isAiGenerated: false
    });
  }

  try {
    const prompt = `You are a professional, polite, and exceptionally detail-oriented property manager. Write a personalized, clear monthly rent and utility reminder message for a tenant.

Tenant Name: ${tenantName}
Room/Apartment: ${roomNumber}
Rent Bill: $${(rentDue || 0).toFixed(2)}
Electricity Bill: $${(electricityDue || 0).toFixed(2)}
Other Charges/Dues: $${(otherDue || 0).toFixed(2)}
Total Outstanding: $${totalDue.toFixed(2)}
Security Deposit Record: $${(depositDetails?.amount || 0).toFixed(2)} (${depositDetails?.status || "Paid"})
Ledger Context: ${ledgerSummary || "Regular payment cycle"}

Requirements:
1. Provide a professional, warm, yet clear Subject Line and Body.
2. Clearly itemize the Rent, Electricity, and Other expenses.
3. Reference the Room Number prominently, indicating the lease deposit is safely recorded.
4. Keep the tone friendly, encouraging, and clear on how to state payment confirmation.
5. Format the response as JSON with strictly two keys: "subject" and "body". Provide only the raw JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const responseText = response.text || "";
    try {
      const parsed = JSON.parse(responseText.trim());
      return res.json({
        subject: parsed.subject || `Rent and Utility Bill Reminder - Room ${roomNumber}`,
        body: parsed.body || responseText,
        isAiGenerated: true
      });
    } catch {
      // If parsing fails, cleanly extract or send text
      return res.json({
        subject: `Rent and Utility Statement: Room ${roomNumber}`,
        body: responseText,
        isAiGenerated: true
      });
    }
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    res.status(500).json({ error: "Failed to generate reminder draft via AI.", details: error.message });
  }
});

// ----------------- VITE / STATIC ROUTING -----------------

async function serveApp() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Rent Management Server listening on http://localhost:${PORT}`);
  });
}

serveApp();
