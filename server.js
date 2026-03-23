const express = require("express");
const cors = require("cors");

const app = express();

// מאפשר לשרת לקבל נתונים מהדפדפן
app.use(cors());
app.use(express.json());

// הנתיב שמקבל את נתוני הטופס
app.post("/api/submit-form", async (req, res) => {
  try {
    const clientData = req.body;
    console.log("✅ התקבלו נתונים חדשים עבור GenieSite!", clientData);

    // בהמשך כאן נוסיף את השמירה ל-MongoDB ואת הקריאה ל-AI

    res
      .status(200)
      .json({ success: true, message: "הנתונים התקבלו בשרת בהצלחה!" });
  } catch (error) {
    console.error("שגיאה:", error);
    res.status(500).json({ success: false, message: "שגיאת שרת פנימית" });
  }
});

// הגדרת הפורט שעליו השרת ירוץ בהוסטינגר
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 GenieSite Server is running on port ${PORT}`);
});
