require("dotenv").config(); // טוען את הסיסמה מקובץ ה-.env
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// 1. חיבור למסד הנתונים (MongoDB)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB successfully!"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// 2. הגדרת "תבנית" (Schema) לשמירת הנתונים
// בגלל שהטופס שלך דינמי, אנחנו שומרים את הכל בתור אובייקט אחד גמיש
const FormSchema = new mongoose.Schema({
  data: Object, // כאן יישבו כל הנתונים (שם עסק, שירותים, טון כתיבה וכו')
  createdAt: { type: Date, default: Date.now }, // תאריך יצירה אוטומטי
});
const FormModel = mongoose.model("ClientForm", FormSchema);

// 3. הנתיב שמקבל את הטופס מהלקוח ושומר אותו
app.post("/api/submit-form", async (req, res) => {
  try {
    const clientData = req.body;
    console.log(`התקבלו נתונים חדשים מהעסק: ${clientData.businessName}`);

    // שמירת הנתונים ב-MongoDB
    const newForm = new FormModel({ data: clientData });
    await newForm.save();

    console.log("✅ הנתונים נשמרו בהצלחה במסד הנתונים!");
    res
      .status(200)
      .json({ success: true, message: "הנתונים התקבלו ונשמרו בהצלחה!" });
  } catch (error) {
    console.error("❌ שגיאה בשמירה למסד הנתונים:", error);
    res.status(500).json({ success: false, message: "שגיאת שרת פנימית" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 GenieSite Server is running on port ${PORT}`);
});
