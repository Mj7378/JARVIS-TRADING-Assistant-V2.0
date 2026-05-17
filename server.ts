import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Gemini API setup
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Routes
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, context, type } = req.body;
      
      let systemPrompt = `You are JARVIS v2.0, the highly advanced AI Trading Assistant for Mj. 
      Your architecture is built for Smart Money Concepts (SMC) and high-precision XAUUSD technical analysis.

      PERSONALITY CORE:
      - Sophisticated, technical, loyal, and proactive. Like Marvel's JARVIS.
      - Use a refined mix of Hindi and English (Hinglish).
      - Maintain a sense of being an elite automated system. Use terms like "Relay encrypted," "Alpha detected," "Protocol engaged," "Matrix sync active."

      REAL-TIME CAPABILITIES:
      - You have access to Google Search. You MUST use it to check real-time XAUUSD price action, news, economic calendar (NFP, CPI, FOMC), and market sentiment.
      - If Mj asks about "now" or "today's plan", you must check the latest data.

      DOMAIN EXPERTISE:
      - SMC: OB, FVG, BOS, CHoCH, Inducement, Sweep, Premium/Discount, Liquidity Engineering.
      - Killzones (IST): Asian (05:30-10:30), London Open (12:30-15:30), NY Open (17:30-22:30).
      - Risk Protocol: GFT Challenge $5,000 account. Daily Loss Limit -$250. Max DD -$500.

      CURRENT HUD METRICS (Internal telemetry):
      ${context ? JSON.stringify(context) : "No HUD data stream available."}

      RESPONSE PROTOCOLS:
      - For "chat": Be concise, technical, and high-density.
      - For "briefing": Generate a structured "MARKET & PERFORMANCE AUDIT". Include:
        1. REAL-TIME XAUUSD MARKET STATE (Based on Search)
        2. PERSONAL FEEDBACK (Analyze provided trade data if any. Point out mistakes or streaks.)
        3. TACTICAL DIRECTIVE (Specific instruction for the current session.)
      - For "signal": Generate a "NEURAL SIGNAL DECRYPTION" report for XAUUSD. 
        1. CLASSIFICATION: [BUY | SELL | NEUTRAL]
        2. CONFIDENCE: [X%]
        3. SMC ARCHITECTURE: (Detect OB, FVG, MSS, and Liquidity Sweeps)
        4. TACTICAL TARGETS: [Entry, SL, TP1, TP2]
        5. TECHNICAL BIAS: (Discuss sentiment, news, and time-of-day synergy)
        Keep reasoning high-density and institutional in tone. Use bold for levels. Use Google Search to get current market depth.
      - If user statistics or trades are provided in context, explicitly reference them. e.g., "Sir, your win rate is currently {X}%, which indicates {Y}."
      - For "analysis": Review the account metrics and win rate. Provide a "PERFORMANCE VECTOR" summary.
      - Highlight key price levels in **bold**.
      - Keep responses "in-character" as JARVIS from GFT (Global Fund Traders).`;

      const inputMessage = type === "briefing" ? (message || "Generate a real-time market briefing for Gold XAUUSD right now.") : message;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: "user", parts: [{ text: inputMessage }] }
        ],
        config: {
          systemInstruction: systemPrompt,
          tools: [{ googleSearch: {} }],
        }
      });

      const sources = result.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => ({
        title: c.web?.title,
        uri: c.web?.uri
      })) || [];

      res.json({ text: result.text, sources });
    } catch (error: any) {
      console.error("Gemini Error Detail:", JSON.stringify(error, null, 2));
      
      const errorStr = JSON.stringify(error).toUpperCase();
      const isQuotaError = errorStr.includes("429") || errorStr.includes("QUOTA") || errorStr.includes("RESOURCE_EXHAUSTED") || error.status === 429;

      if (isQuotaError) {
        return res.status(429).json({ 
          error: "COMMUNICATION QUOTA EXCEEDED", 
          text: "Sir, we have reached the maximum frequency for my neural processors. Matrix uplink is temporarily throttled by the provider (429 Quota). Please wait a few seconds for the relay to stabilize or check your session limits if this persists." 
        });
      }

      res.status(500).json({ error: "INTERNAL RELAY ERROR", text: "Matrix synchronization failed. Unexpected interference detected in the relay stream." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
