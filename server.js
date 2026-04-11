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

// תיקון: הגדרה בטוחה יותר למבנה הנתונים שתמנע קריסות בשמירה
const FormSchema = new mongoose.Schema({
  data: Object,
  aiContent: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now },
});
const FormModel =
  mongoose.models.ClientForm || mongoose.model("ClientForm", FormSchema);

// --- 1. נתיב קבלת טופס מלקוח ---
app.post("/api/submit-form", async (req, res) => {
  try {
    const clientData = req.body;
    console.log("התקבלו נתונים חדשים מהטופס!");

    const newForm = new FormModel({ data: clientData });
    await newForm.save();

    res
      .status(200)
      .json({ success: true, message: "הנתונים התקבלו ונשמרו בהצלחה!" });
  } catch (error) {
    console.error("❌ שגיאה בשמירה למסד הנתונים:", error);
    // עכשיו השרת יחזיר לך לדפדפן את השגיאה המדויקת באנגלית כדי שנדע מה קרה!
    res.status(500).json({
      success: false,
      message: error.message || "שגיאה לא ידועה במסד הנתונים",
    });
  }
});

// --- 2. נתיב משיכת הלקוחות לאדמין ---
app.get("/api/clients", async (req, res) => {
  try {
    const clients = await FormModel.find().sort({ createdAt: -1 });
    res.json({ success: true, clients });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

// פונקציית הפרומפט
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

  return `
אתה מומחה קופירייט שבונה תוכן מלא לאתר אינטרנט חדש עבור העסק: "${data.businessName}". 
מטרת העסק: ${data.businessDescription}. קהל יעד: ${data.targetAudience}. ייחודיות: ${data.uniqueValue}.
טון כתיבה נדרש: ${tone}. שפת כתיבה: ${lang}. 
משימה: צור תוכן שלם לאתר אינטרנט הכולל את הדפים הבאים: ${pagesList}.

החזר את התשובה אך ורק במבנה המדויק הבא של מערך (Array) של אובייקטים ב-JSON:
[
  {
    "pageName": "שם הדף",
    "sections": [
      {
        "sectionTitle": "שם הסקשן",
        "content": "התוכן המלא כאן"
      }
    ]
  }
]
`;
}

// --- 3. נתיב יצירת תוכן AI עם Gemini ---
app.post("/api/generate-content/:id", async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY)
      return res
        .status(500)
        .json({ success: false, message: "חסר מפתח GEMINI_API_KEY" });
    const client = await FormModel.findById(req.params.id);
    if (!client)
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const result = await model.generateContent(buildMasterPrompt(client.data));
    const generatedContent = JSON.parse(result.response.text());

    client.aiContent = generatedContent;
    await client.save();

    res.json({ success: true, content: generatedContent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- 4. נתיב שמירת עריכות ידניות מהאדמין ---
app.put("/api/clients/:id/ai-content", async (req, res) => {
  try {
    const client = await FormModel.findById(req.params.id);
    if (!client) return res.status(404).json({ success: false });

    client.aiContent = req.body.content;
    await client.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 GenieSite Server is running on port ${PORT}`),
);
