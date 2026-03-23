document.addEventListener("DOMContentLoaded", () => {
  // --- ניהול מצב לילה/יום ---
  const themeToggle = document.getElementById("themeToggle");
  const htmlElement = document.documentElement;
  const savedTheme = localStorage.getItem("genieTheme") || "light";

  htmlElement.setAttribute("data-theme", savedTheme);
  themeToggle.innerText = savedTheme === "dark" ? "☀️ מצב בהיר" : "🌙 מצב כהה";

  themeToggle.addEventListener("click", () => {
    const newTheme =
      htmlElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    htmlElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("genieTheme", newTheme);
    themeToggle.innerText = newTheme === "dark" ? "☀️ מצב בהיר" : "🌙 מצב כהה";
  });

  // --- פונקציית עזר להוספת שדות דינמיים ---
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

  // מחיקת שדות
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-item-btn")) {
      const itemToDrop = e.target.closest(".dynamic-item");
      itemToDrop.style.opacity = "0";
      setTimeout(() => itemToDrop.remove(), 300);
    }
  });
});
