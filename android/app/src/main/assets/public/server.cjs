var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_genai = require("@google/genai");
var import_vite = require("vite");
import_dotenv.default.config();
var app = (0, import_express.default)();
app.use(import_express.default.json());
var PORT = 3e3;
var apiKey = process.env.GEMINI_API_KEY;
var ai = null;
if (apiKey) {
  try {
    ai = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    console.log("Gemini API Client initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Gemini client:", error);
  }
} else {
  console.warn("GEMINI_API_KEY is not defined. Falling back to rule-based reminders.");
}
app.get("/api/health", (_req, res) => {
  res.json({ status: "healthy", hasGemini: !!ai });
});
app.post("/api/reminders/generate-draft", async (req, res) => {
  const { tenantName, roomNumber, rentDue, electricityDue, otherDue, depositDetails, ledgerSummary } = req.body;
  const totalDue = (rentDue || 0) + (electricityDue || 0) + (otherDue || 0);
  if (!ai) {
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
        responseMimeType: "application/json"
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
      return res.json({
        subject: `Rent and Utility Statement: Room ${roomNumber}`,
        body: responseText,
        isAiGenerated: true
      });
    }
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    res.status(500).json({ error: "Failed to generate reminder draft via AI.", details: error.message });
  }
});
async function serveApp() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode...");
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode...");
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Rent Management Server listening on http://localhost:${PORT}`);
  });
}
serveApp();
//# sourceMappingURL=server.cjs.map
