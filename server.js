require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(__dirname));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB successfully!"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const FormSchema = new mongoose.Schema({
  data: Object,
  createdAt: { type: Date, default: Date.now },
});
const FormModel = mongoose.model("ClientForm", FormSchema);

// נתיב קבלת טופס מלקוח (מה שעשינו עד עכשיו)
app.post("/api/submit-form", async (req, res) => {
  try {
    const clientData = req.body;
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

// --- חדש: נתיב למשיכת כל הלקוחות עבור פאנל המנהל ---
app.get("/api/clients", async (req, res) => {
  try {
    // מביא את כל הטפסים ומסדר אותם מהחדש ביותר לישן ביותר
    const clients = await FormModel.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, clients: clients });
  } catch (error) {
    console.error("❌ שגיאה במשיכת נתונים:", error);
    res.status(500).json({ success: false, message: "שגיאת שרת" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
