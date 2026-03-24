require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB error:", err));

const FormModel = mongoose.model(
  "ClientForm",
  new mongoose.Schema({
    data: Object,
    createdAt: { type: Date, default: Date.now },
  }),
);

app.get("/api/clients", async (req, res) => {
  try {
    const clients = await FormModel.find().sort({ createdAt: -1 });
    res.json({ success: true, clients });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

function buildMasterPrompt(clientData) {
  const data = clientData;
  const tone = data.tone || "מקצועי";
  const lang = data.language || "עברית (רבים)";

  let pagesList = "";
  if (data.pages && Array.isArray(data.pages))
    pagesList = data.pages.join(", ");
  else if (data.pages && data.pages.selected)
    pagesList = data.pages.selected.join(", ");
  if (data.otherPages) pagesList += ` (בנוסף: ${data.otherPages})`;

  let context = `
אתה מומחה קופירייט שבונה תוכן מלא לאתר אינטרנט חדש עבור העסק: "${data.businessName}". 
מטרת העסק: ${data.businessDescription}. קהל יעד: ${data.targetAudience}. ייחודיות: ${data.uniqueValue}.
טון כתיבה נדרש: ${tone}. שפת כתיבה: ${lang}. 
משימה: צור תוכן שלם לאתר אינטרנט הכולל את הדפים הבאים: ${pagesList}.

החזר את התשובה אך ורק במבנה המדויק הבא של מערך (Array) של אובייקטים ב-JSON:
[
  {
    "pageName": "שם הדף (לדוגמה: דף הבית)",
    "sections": [
      {
        "sectionTitle": "שם הסקשן (לדוגמה: באנר ראשי)",
        "content": "התוכן המלא כאן"
      }
    ]
  }
]
`;
  return context;
}

app.post("/api/generate-content/:id", async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "חסר מפתח GEMINI_API_KEY בהגדרות השרת בהוסטינגר.",
      });
    }

    const client = await FormModel.findById(req.params.id);
    if (!client)
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });

    console.log(`🧠 Generating AI content for: ${client.data.businessName}`);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // שינוי קריטי למודל החדש והפעיל של גוגל:
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = buildMasterPrompt(client.data);
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const generatedContent = JSON.parse(responseText);

    console.log("✅ Content generated successfully by Gemini!");
    res.json({ success: true, content: generatedContent });
  } catch (error) {
    console.error("❌ AI Generation error:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "שגיאת שרת פנימית" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 GenieSite Server is running on port ${PORT}`),
);
