require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// חיבור ל-MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// הגדרת המודל (Mongoose)
const FormModel = mongoose.model(
  "ClientForm",
  new mongoose.Schema({
    data: Object,
    createdAt: { type: Date, default: Date.now },
  }),
);

// --- אתחול Gemini ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// שימוש במודל gpt-1.5-flash המהיר והמעולה למשימה זו
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// נתיבי שרת רגילים
app.get("/api/clients", async (req, res) => {
  try {
    const clients = await FormModel.find().sort({ createdAt: -1 });
    res.json({ success: true, clients });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

// --- פונקציית עזר: בניית הפרומפט המרכזי למערכת AI ---
function buildMasterPrompt(clientData) {
  const data = clientData;
  const tone = data.tone || "מקצועי";
  const lang = data.language || "עברית (רבים)";

  // רשימת הדפים שהלקוח בחר
  let pagesList = "";
  if (data.pages && Array.isArray(data.pages))
    pagesList = data.pages.join(", ");
  if (data.otherPages) pagesList += ` (בנוסף: ${data.otherPages})`;

  // בניית קונטקסט מלא מהנתונים
  let context = `
אתה מומחה קופירייט שבונה תוכן מלא לאתר אינטרנט חדש עבור העסק: "${data.businessName}". 
מטרת העסק: ${data.businessDescription}.קהל יעד: ${data.targetAudience}. ייחודיות: ${data.uniqueValue}.
טון כתיבה נדרש: ${tone}. שפת כתיבה: ${lang}. סגנון עיצוב/אווירה: ${data.designStyle}.
    `;

  // הנחיה לGemini כיצד לבנות את התוצאה
  context += `
משימה: צור תוכן שלם לאתר אינטרנט הכולל את הדפים הבאים: ${pagesList}.
הדרישה היא להחזיר את התוצאה אך ורק בתבנית JSON תקנית, נקייה, מסודרת וללא שום טקסט נוסף לפני או אחרי ה-JSON.

תבנית ה-JSON המדויקת שאתה חייב להחזיר:
[
  {
    "pageName": "שם הדף (למשל דף הבית)",
    "sections": [
      {
        "sectionTitle": "שם הסקשן (למשל באנר ראשי, על העסק, שירותים)",
        "content": "הטקסט המלא של הסקשן בצורה מסודרת"
      }
    ]
  }
]

הנחיות לכתיבת התוכן עצמו:
1. צור תוכן מקורי, שיווקי ומניע לפעולה, המבוסס על הנתונים של הלקוח.
2. אם יש נתונים חסרים (כמו שירותים/המלצות), צור תוכן כללי ומקצועי שמתאים לסוג העסק.
3. בדף הבית: צור באנר ראשי עם כותרת, תת-כותרת, פסקה על העסק, והנעה לפעולה.
4. בדפי שירותים/אודות: צור תוכן מעמיק וברור.
5. הקפד על התאמה מוחלטת לטון הכתיבה ולשפה שהלקוח בחר.
6. התוכן חייב להיות מוכן להעתקה-הדבקה עבור בניית האתר.
    `;

  return context;
}

// --- נתיב חדש: יצירת תוכן AI ללקוח ---
app.post("/api/generate-content/:id", async (req, res) => {
  try {
    // מציאת הלקוח ב-MongoDB לפי ה-ID
    const client = await FormModel.findById(req.params.id);
    if (!client)
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });

    console.log(`🧠 Generating AI content for: ${client.data.businessName}`);

    // בניית הפרומפט
    const prompt = buildMasterPrompt(client.data);

    // שליחה לGemini
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // ניקוי התגובה של Gemini (לפעמים הוא מוסיף ```json)
    let cleanedText = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // ניסיון להמיר את התוצאה ל-JSON
    let generatedContent;
    try {
      generatedContent = JSON.parse(cleanedText);
    } catch (e) {
      console.error("❌ Failed to parse Gemini JSON:", cleanedText);
      throw new Error(
        "Gemini did not return valid JSON. Response was: " + cleanedText,
      );
    }

    console.log("✅ Content generated successfully by Gemini!");
    res.json({ success: true, content: generatedContent });
  } catch (error) {
    console.error("❌ AI Generation error:", error);
    res
      .status(500)
      .json({ success: false, message: "שגיאת שרת פנימית ביצירת תוכן AI" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 GenieSite Server is running on port ${PORT}`),
);
