require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// הפקודה הזו אומרת לשרת להציג את קובץ ה-index.html ועיצוב ה-CSS למי שנכנס לאתר
app.use(express.static(__dirname));

// חיבור למסד הנתונים (MongoDB)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB successfully!"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// הגדרת "תבנית" לשמירת הנתונים
const FormSchema = new mongoose.Schema({
  data: Object,
  createdAt: { type: Date, default: Date.now },
});
const FormModel = mongoose.model("ClientForm", FormSchema);

// הנתיב שמקבל את הטופס מהלקוח ושומר אותו
app.post("/api/submit-form", async (req, res) => {
  try {
    const clientData = req.body;
    console.log("התקבלו נתונים חדשים!");

    // שמירת הנתונים ב-MongoDB
    const newForm = new FormModel({ data: clientData });
    await newForm.save();

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
  console.log(`🚀 Server is running on port ${PORT}`);
});
