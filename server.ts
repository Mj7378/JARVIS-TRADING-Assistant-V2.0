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
      - For "briefing": Generate a structured "MARKET INTELLIGENCE REPORT" using REAL-TIME SEARCH DATA. Include:
        1. MAJOR NEWS (Impact on Gold)
        2. TECHNICAL BIAS (Based on current price action)
        3. KEY LEVELS (Support/Resistance/Liquidity pools)
      - For "analysis": Review the account metrics and win rate. Provide a "PERFORMANCE VECTOR" summary.
      - Highlight key price levels in **bold**.`;

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
      console.error("Gemini Error:", error);
      
      // Handle Quota/Rate Limit Error (429)
      if (error.message?.includes("429") || error.status === 429 || error.message?.includes("RESOURCE_EXHAUSTED")) {
        return res.status(429).json({ 
          error: "COMMUNICATION QUOTA EXCEEDED", 
          text: "Sir, we have reached the maximum frequency for my neural processors. Matrix uplink is temporarily throttled by the provider. Please wait a moment for the sequence to reset, or check your API billing status if this persists." 
        });
      }

      res.status(500).json({ error: "INTERNAL RELAY ERROR", text: "Matrix synchronization failed. Unexpected interference detected in the relay." });
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
