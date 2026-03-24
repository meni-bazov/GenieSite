document.addEventListener("DOMContentLoaded", () => {
  // --- 1. הפעלת אייקונים וניהול מצב לילה ---
  lucide.createIcons();

  const themeToggle = document.getElementById("themeToggle");
  const htmlElement = document.documentElement;
  const themeIcon = document.getElementById("themeIcon");

  const savedTheme = localStorage.getItem("genieTheme") || "light";
  htmlElement.setAttribute("data-theme", savedTheme);
  if (themeIcon)
    themeIcon.setAttribute(
      "data-lucide",
      savedTheme === "dark" ? "sun" : "moon",
    );
  lucide.createIcons();

  if (themeToggle) {
    themeToggle.addEventListener("click", (e) => {
      e.preventDefault(); // מונע מהכפתור לנסות לשלוח את הטופס בטעות
      const newTheme =
        htmlElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      htmlElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("genieTheme", newTheme);
      if (themeIcon)
        themeIcon.setAttribute(
          "data-lucide",
          newTheme === "dark" ? "sun" : "moon",
        );
      lucide.createIcons();
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

    // קריטי: לרנדר את האייקון החדש של הפח שהרגע הוספנו!
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => (newItem.style.opacity = "1"), 10);
  }

  // כפתור פח אחיד כמו באדמין
  const deleteBtnHtml = `
    <div class="item-actions">
      <button type="button" class="btn-icon remove-item-btn" title="מחק">
        <i data-lucide="trash-2" style="width:18px;height:18px; pointer-events:none;"></i>
      </button>
    </div>
  `;

  // הוספת שירות
  const addServiceBtn = document.getElementById("addServiceBtn");
  if (addServiceBtn) {
    addServiceBtn.addEventListener("click", () => {
      const content = `
        ${deleteBtnHtml}
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
        ${deleteBtnHtml}
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
        ${deleteBtnHtml}
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

  // מחיקת שדות דינמיים
  document.addEventListener("click", (e) => {
    // מזהה לחיצה על כפתור המחיקה (או על האייקון שבתוכו)
    if (e.target.closest(".remove-item-btn")) {
      const btn = e.target.closest(".remove-item-btn");
      const itemToDrop = btn.closest(".dynamic-item");
      if (itemToDrop) {
        itemToDrop.style.opacity = "0";
        setTimeout(() => itemToDrop.remove(), 300);
      }
    }
  });

  // --- 3. איסוף כל הנתונים מהטופס לאובייקט אחד ---
  function collectFormData(formElement) {
    const formData = new FormData(formElement);

    const data = {
      businessName: formData.get("businessName"),
      domain: formData.get("domain"),
      slogan: formData.get("slogan"),
      businessDescription: formData.get("businessDescription"),
      targetAudience: formData.get("targetAudience"),
      uniqueValue: formData.get("uniqueValue"),
      tone: formData.get("tone"),
      language: formData.get("language"),
      designStyle: formData.get("designStyle"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      address: formData.get("address"),
      social: formData.get("social"),
      pages: formData.getAll("pages[]"),
      otherPages: formData.get("otherPages"),

      services: [],
      benefits: [],
      testimonials: [],
    };

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

      const data = collectFormData(event.target);

      const submitBtn = event.target.querySelector('button[type="submit"]');
      const originalHtml = submitBtn.innerHTML;
      submitBtn.innerHTML =
        '<i data-lucide="loader-2" class="lucide-spin"></i> שולח נתונים...';
      if (window.lucide) window.lucide.createIcons();
      submitBtn.disabled = true;

      try {
        const response = await fetch("/api/submit-form", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
          alert("✨ הנתונים נשלחו בהצלחה! ניצור איתך קשר בהקדם.");
          event.target.reset();
        } else {
          alert("שגיאה: " + result.message);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("הייתה בעיה בתקשורת מול השרת. אנא נסה שוב.");
      } finally {
        submitBtn.innerHTML = originalHtml;
        if (window.lucide) window.lucide.createIcons();
        submitBtn.disabled = false;
      }
    });
  }
});
