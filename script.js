document.addEventListener("DOMContentLoaded", () => {
  // --- 1. ניהול מצב לילה/יום ---
  const themeToggle = document.getElementById("themeToggle");
  const htmlElement = document.documentElement;
  const savedTheme = localStorage.getItem("genieTheme") || "light";

  htmlElement.setAttribute("data-theme", savedTheme);
  if (themeToggle) {
    themeToggle.innerText =
      savedTheme === "dark" ? "☀️ מצב בהיר" : "🌙 מצב כהה";

    themeToggle.addEventListener("click", () => {
      const newTheme =
        htmlElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      htmlElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("genieTheme", newTheme);
      themeToggle.innerText =
        newTheme === "dark" ? "☀️ מצב בהיר" : "🌙 מצב כהה";
    });
  }

  // --- 2. פונקציית עזר להוספת שדות דינמיים ---
  function appendDynamicItem(wrapperId, htmlContent) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;
    const newItem = document.createElement("div");
    newItem.className = "dynamic-item";
    newItem.innerHTML = htmlContent;
    newItem.style.opacity = "0";
    wrapper.appendChild(newItem);
    setTimeout(() => (newItem.style.opacity = "1"), 10);
  }

  // הוספת שירות
  const addServiceBtn = document.getElementById("addServiceBtn");
  if (addServiceBtn) {
    addServiceBtn.addEventListener("click", () => {
      const content = `
        <div class="item-actions">
          <button type="button" class="btn-icon remove-item-btn" title="מחק">🗑️</button>
        </div>
        <div class="row row-cols-2">
          <div class="form-group">
            <label>שם שירות / מוצר</label>
            <input type="text" name="serviceName[]" class="form-control" placeholder="לדוגמה: בניית אתרי תדמית" />
          </div>
          <div class="form-group">
            <label>תיאור קצר</label>
            <input type="text" name="serviceDescription[]" class="form-control" placeholder="תיאור קצר של השירות או המוצר" />
          </div>
        </div>
      `;
      appendDynamicItem("servicesWrapper", content);
    });
  }

  // הוספת יתרון
  const addBenefitBtn = document.getElementById("addBenefitBtn");
  if (addBenefitBtn) {
    addBenefitBtn.addEventListener("click", () => {
      const content = `
        <div class="item-actions">
          <button type="button" class="btn-icon remove-item-btn" title="מחק">🗑️</button>
        </div>
        <div class="row row-cols-2">
          <div class="form-group">
            <label>כותרת היתרון</label>
            <input type="text" name="benefitTitle[]" class="form-control" placeholder="לדוגמה: שירות מהיר" />
          </div>
          <div class="form-group">
            <label>תיאור קצר</label>
            <input type="text" name="benefitDescription[]" class="form-control" placeholder="לדוגמה: מענה מהיר וליווי אישי..." />
          </div>
        </div>
      `;
      appendDynamicItem("benefitsWrapper", content);
    });
  }

  // הוספת המלצה
  const addTestimonialBtn = document.getElementById("addTestimonialBtn");
  if (addTestimonialBtn) {
    addTestimonialBtn.addEventListener("click", () => {
      const content = `
        <div class="item-actions">
          <button type="button" class="btn-icon remove-item-btn" title="מחק">🗑️</button>
        </div>
        <div class="row">
          <div class="form-group">
            <label>שם הממליץ</label>
            <input type="text" name="testimonialName[]" class="form-control" placeholder="לדוגמה: ישראל ישראלי" />
          </div>
          <div class="form-group">
            <label>ההמלצה עצמה</label>
            <textarea name="testimonialText[]" class="form-control" rows="2" placeholder="מה הלקוח כתב?"></textarea>
          </div>
        </div>
      `;
      appendDynamicItem("testimonialsWrapper", content);
    });
  }

  // מחיקת שדות (האזנה לכל כפתורי הפח)
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-item-btn")) {
      const itemToDrop = e.target.closest(".dynamic-item");
      itemToDrop.style.opacity = "0";
      setTimeout(() => itemToDrop.remove(), 300);
    }
  });

  // --- 3. איסוף כל הנתונים מהטופס לאובייקט אחד ---
  function collectFormData(formElement) {
    const formData = new FormData(formElement);

    // איסוף השדות הרגילים
    const data = {
      businessName: formData.get("businessName"),
      siteName: formData.get("siteName"),
      domain: formData.get("domain"),
      slogan: formData.get("slogan"),
      businessDescription: formData.get("businessDescription"),
      targetAudience: formData.get("targetAudience"),
      uniqueValue: formData.get("uniqueValue"),
      tone: formData.get("tone"),
      contentLength: formData.get("contentLength"),
      language: formData.get("language"),
      referenceSites: formData.get("referenceSites"),
      designStyle: formData.get("designStyle"),
      brandColors: formData.get("brandColors"),
      preferredFont: formData.get("preferredFont"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      address: formData.get("address"),
      hours: formData.get("hours"),
      facebook: formData.get("facebook"),
      instagram: formData.get("instagram"),
      linkedin: formData.get("linkedin"),
      tiktok: formData.get("tiktok"),
      youtube: formData.get("youtube"),
      seoKeywords: formData.get("seoKeywords"),
      serviceArea: formData.get("serviceArea"),
      pages: formData.getAll("pages[]"),
      otherPages: formData.get("otherPages"),
      extraNotes: formData.get("extraNotes"),

      // הכנת מערכים לשדות הדינמיים
      services: [],
      benefits: [],
      testimonials: [],
    };

    // איסוף שירותים
    const serviceNames = formData.getAll("serviceName[]");
    const serviceDescs = formData.getAll("serviceDescription[]");
    for (let i = 0; i < serviceNames.length; i++) {
      if (serviceNames[i] && serviceNames[i].trim() !== "") {
        data.services.push({
          name: serviceNames[i],
          description: serviceDescs[i],
        });
      }
    }

    // איסוף יתרונות
    const benefitTitles = formData.getAll("benefitTitle[]");
    const benefitDescs = formData.getAll("benefitDescription[]");
    for (let i = 0; i < benefitTitles.length; i++) {
      if (benefitTitles[i] && benefitTitles[i].trim() !== "") {
        data.benefits.push({
          title: benefitTitles[i],
          description: benefitDescs[i],
        });
      }
    }

    // איסוף המלצות
    const testNames = formData.getAll("testimonialName[]");
    const testTexts = formData.getAll("testimonialText[]");
    for (let i = 0; i < testNames.length; i++) {
      if (testNames[i] && testNames[i].trim() !== "") {
        data.testimonials.push({ name: testNames[i], text: testTexts[i] });
      }
    }

    return data;
  }

  // --- 4. שליחת הטופס לשרת ---
  const clientForm = document.getElementById("clientForm");
  if (clientForm) {
    clientForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      // שימוש בפונקציה שאוספת את הנתונים
      const data = collectFormData(event.target);

      // שינוי כפתור השליחה כדי שהלקוח יראה שזה טוען
      const submitBtn = event.target.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerText;
      submitBtn.innerText = "שולח נתונים... ⏳";
      submitBtn.disabled = true;

      try {
        // שליחת הנתונים לנתיב ה-API בשרת שלנו
        const response = await fetch("/api/submit-form", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
          alert("✨ מעולה! הנתונים נשלחו ונשמרו בהצלחה במערכת GenieSite.");
          // אפשר לאפס את הטופס אחרי שליחה מוצלחת
          event.target.reset();
        } else {
          alert("שגיאה: " + result.message);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("הייתה בעיה בתקשורת מול השרת. אנא נסה שוב.");
      } finally {
        // החזרת הכפתור למצב רגיל
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
      }
    });
  }
});
