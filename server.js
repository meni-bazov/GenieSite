const express = require("express");
const cors = require("cors");

// אתחול האפליקציה
const app = express();

// Middleware - מאפשר תקשורת בין ה-Frontend ל-Backend ומאפשר קריאת JSON
app.use(cors());
app.use(express.json());

// נתיב (Route) לקבלת נתוני הטופס מהלקוח
app.post("/api/submit-form", async (req, res) => {
  try {
    const clientData = req.body;

    console.log("✅ התקבלו נתונים חדשים מהלקוח:", clientData.businessName);
    console.log(clientData);

    // --- השלבים הבאים שנוסיף כאן: ---
    // 1. שמירת clientData במסד הנתונים
    // 2. קריאה ל-API של ה-AI עם פרומפט מובנה

    // שליחת תשובה חזרה לדפדפן של הלקוח
    res.status(200).json({
      success: true,
      message: "הנתונים התקבלו בהצלחה והועברו ל-GenieSite!",
    });
  } catch (error) {
    console.error("❌ שגיאה בשרת:", error);
    res.status(500).json({ success: false, message: "שגיאת שרת פנימית" });
  }
});

// הפעלת השרת
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 GenieSite Server is running on port ${PORT}`);
});
