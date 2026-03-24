document.addEventListener("DOMContentLoaded", () => {
  let clientsData = [];
  let currentClientId = null;
  let currentAIContent = null; // ישמור את תוצר ה-AI של הלקוח הנוכחי

  let clientToDeleteIndex = null;
  let clientToDeleteElement = null;

  const modal = document.getElementById("deleteModal");
  const modalNameEl = document.getElementById("modalClientName");

  // משיכת לקוחות מהשרת
  async function fetchClients() {
    const listEl = document.getElementById("clientList");
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      if (data.success) {
        clientsData = data.clients;
        renderClientList();
      } else {
        listEl.innerHTML =
          '<li class="client-item text-muted" style="justify-content:center;">שגיאה בטעינת הנתונים</li>';
      }
    } catch (err) {
      listEl.innerHTML =
        '<li class="client-item text-muted" style="justify-content:center;">שגיאה בתקשורת</li>';
    }
  }

  // יצירת רשימת תפריט הצד
  function renderClientList() {
    const listEl = document.getElementById("clientList");
    listEl.innerHTML = "";
    if (clientsData.length === 0) {
      listEl.innerHTML =
        '<li class="client-item text-muted" style="justify-content:center;">אין טפסים עדיין</li>';
      return;
    }
    clientsData.forEach((client, index) => {
      const date = new Date(client.createdAt).toLocaleDateString("he-IL", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const businessName =
        client.data?.businessName ||
        client.data?.general?.businessName ||
        "עסק ללא שם";
      const li = document.createElement("li");
      li.className = "client-item";
      li.innerHTML = `<div><span class="client-name">${businessName}</span><span class="client-date">${date}</span></div>
                <button type="button" class="btn-icon remove-client-btn" title="מחק"><i data-lucide="trash-2" style="width:18px; height:18px;"></i></button>`;
      li.addEventListener("click", (e) => {
        if (!e.target.closest(".remove-client-btn")) selectClient(index, li);
      });
      li.querySelector(".remove-client-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        openDeleteModal(index, businessName, li);
      });
      listEl.appendChild(li);
    });
    if (window.lucide) window.lucide.createIcons();
  }

  // בחירת לקוח והצגת הנתונים שלו
  function selectClient(index, liElement) {
    document
      .querySelectorAll(".client-item")
      .forEach((el) => el.classList.remove("active"));
    liElement.classList.add("active");

    currentClientId = clientsData[index]._id; // שמירת ה-ID של הלקוח הנבחר
    currentAIContent = null; // איפוס תוכן ה-AI קודם

    const client = clientsData[index].data;
    document.getElementById("welcomeState").style.display = "none";
    document.getElementById("splitView").style.display = "block";
    document.getElementById("topbarTitle").innerText =
      client.businessName || "פרטי לקוח";

    // איפוס פאנל ה-AI למצב ריק
    resetAIOutputPanel();

    // הזרקת הנתונים בצורה מרווחת (שורה-שורה)
    const val = (v) =>
      v
        ? `<span>${v}</span>`
        : '<span style="color:var(--text-muted); font-style:italic; background:transparent; border:none; padding:0;">לא הוזן</span>';
    const line = (label, value) =>
      `<div class="data-line"><strong>${label}</strong> ${val(value)}</div>`;
    const listHtml = (arr, renderFn) => {
      if (!arr || arr.length === 0)
        return `<div class="data-line">${val("")}</div>`;
      return `<div class="data-line" style="gap:0.5rem;">${arr.map(renderFn).join("")}</div>`;
    };

    const rawDataEl = document.getElementById("clientRawData");
    rawDataEl.innerHTML = `
          <h3 style="color:var(--primary); margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;"><i data-lucide="info" style="width:18px;height:18px;"></i> פרטים כלליים</h3>
          ${line("שם האתר", client.siteName)} ${line("דומיין", client.domain)} ${line("סלוגן", client.slogan)} <hr>
          <h3 style="color:var(--primary); margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;"><i data-lucide="briefcase" style="width:18px;height:18px;"></i> על העסק</h3>
          ${line("תיאור העסק", client.businessDescription)} ${line("קהל יעד", client.targetAudience)} ${line("הייחודיות", client.uniqueValue)} <hr>
          <h3 style="color:var(--primary); margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;"><i data-lucide="package" style="width:18px;height:18px;"></i> שירותים / מוצרים</h3>
          ${listHtml(client.services, (s) => `<span><b>${s.name}:</b> ${s.description}</span>`)} <hr>
          <h3 style="color:var(--primary); margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;"><i data-lucide="palette" style="width:18px;height:18px;"></i> סגנון והשראה</h3>
          ${line("טון כתיבה", client.tone)} ${line("שפת האתר", client.language)} ${line("סגנון עיצוב", client.designStyle)} <hr>
          <h3 style="color:var(--primary); margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;"><i data-lucide="search" style="width:18px;height:18px;"></i> SEO ועמודים</h3>
          ${line("עמודים מבוקשים", client.pages ? client.pages.join(", ") : "")}
        `;
    if (window.lucide) window.lucide.createIcons();
  }

  // איפוס פאנל ה-AI למצב התחלתי
  function resetAIOutputPanel() {
    document.getElementById("aiTabs").style.display = "none";
    document.getElementById("aiTabs").innerHTML = "";
    document.getElementById("aiContentDisplay").innerHTML = `
            <div class="empty-state" style="padding:4rem 2rem;">
              <i data-lucide="brain-circuit" style="width: 48px; height: 48px; color: var(--text-muted); opacity:0.5; margin-bottom:1rem;"></i>
              <h3>התוכן השיווקי שלך מחכה</h3>
              <p style="max-width:300px; margin:0 auto;">לחץ על הכפתור "צור תוכן" כדי לשלוח את הנתונים ל-AI ולקבל טקסטים שלמים ומסודרים לפי דפים וסקשנים.</p>
            </div>
        `;
    document.getElementById("aiContentDisplay").classList.add("panel-body");
    document.getElementById("aiContentDisplay").style.padding = "1.5rem";
    if (window.lucide) window.lucide.createIcons();
  }

  // --- לוגיקה ליצירת תוכן AI עם Gemini ---
  const generateBtn = document.getElementById("generateContentBtn");
  if (generateBtn) {
    generateBtn.addEventListener("click", async () => {
      if (!currentClientId) return alert("אנא בחר לקוח קודם");

      // מצב טעינה
      const btnText = document.getElementById("btnText");
      generateBtn.disabled = true;
      btnText.innerText = "חושב ומייצר (Gemini)...";
      resetAIOutputPanel();
      document.getElementById("aiContentDisplay").innerHTML = `
                <div class="empty-state" style="padding:4rem 2rem;">
                    <i data-lucide="loader-2" class="lucide-spin text-primary" style="width: 48px; height: 48px; margin-bottom:1rem;"></i>
                    <h3>מייצר תוכן עם Gemini</h3>
                    <p style="max-width:300px; margin:0 auto;">אנא המתן כ-30 שניות. אנחנו אוספים את הנתונים, בונים פרומפט שיווקי וקוראים ל-AI. זה שווה את זה!</p>
                </div>
            `;
      if (window.lucide) window.lucide.createIcons();

      try {
        // קריאה לנתיב השרת החדש שלנו
        const response = await fetch(
          `/api/generate-content/${currentClientId}`,
          { method: "POST" },
        );
        const result = await response.json();

        if (result.success) {
          currentAIContent = result.content; // שמירת ה-JSON שחזר מ-Gemini
          renderAIContent(); // רינדור הלשוניות והתוכן
        } else {
          alert("שגיאה ביצירת התוכן: " + result.message);
          resetAIOutputPanel();
        }
      } catch (error) {
        console.error("AI Fetch Error:", error);
        alert("הייתה בעיה בתקשורת מול השרת. אנא נסה שוב.");
        resetAIOutputPanel();
      } finally {
        // סיום מצב טעינה
        generateBtn.disabled = false;
        btnText.innerText = "צור תוכן מחדש (AI)";
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  // --- רינדור תוכן ה-AI (לשוניות וסקשנים) ---
  function renderAIContent() {
    if (
      !currentAIContent ||
      !Array.isArray(currentAIContent) ||
      currentAIContent.length === 0
    )
      return;

    const tabsEl = document.getElementById("aiTabs");
    const contentEl = document.getElementById("aiContentDisplay");

    tabsEl.innerHTML = "";
    tabsEl.style.display = "flex";
    contentEl.innerHTML = "";

    // יצירת הלשוניות (Tabs)
    currentAIContent.forEach((page, index) => {
      const btn = document.createElement("button");
      btn.className = `ai-tab-btn ${index === 0 ? "active" : ""}`;
      btn.innerHTML = `<i data-lucide="file-text" style="width:16px; height:16px;"></i> ${page.pageName}`;
      btn.addEventListener("click", () => selectAIPage(index));
      tabsEl.appendChild(btn);
    });

    // הצגת הדף הראשון כברירת מחדל
    renderAIPageSections(0);
    if (window.lucide) window.lucide.createIcons();
  }

  // החלפת לשונית AI
  function selectAIPage(index) {
    document.querySelectorAll(".ai-tab-btn").forEach((btn, i) => {
      btn.classList.toggle("active", i === index);
    });
    renderAIPageSections(index);
  }

  // רינדור הסקשנים בתוך דף AI נבחר
  function renderAIPageSections(index) {
    const contentEl = document.getElementById("aiContentDisplay");
    contentEl.innerHTML = "";
    contentEl.classList.add("panel-body");
    contentEl.style.padding = "1.5rem";

    const page = currentAIContent[index];
    if (!page || !page.sections) return;

    page.sections.forEach((section) => {
      const sectionBox = document.createElement("div");
      sectionBox.className = "ai-section-box";

      // המבנה שביקשת: כותרת, תוכן pre-line, וכפתור העתקה
      sectionBox.innerHTML = `
                <div class="ai-section-title">${section.sectionTitle}</div>
                <div class="ai-section-content">${section.content}</div>
                <button type="button" class="btn-icon btn-copy" title="העתק טקסט">
                    <i data-lucide="copy" style="width:18px; height:18px;"></i>
                </div>
            `;

      // חיבור פונקציית ההעתקה
      sectionBox.querySelector(".btn-copy").addEventListener("click", () => {
        copyToClipboard(section.content, sectionBox.querySelector(".btn-copy"));
      });

      contentEl.appendChild(sectionBox);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  // --- פונקציית העתקה היוקרתית ---
  async function copyToClipboard(text, btnElement) {
    try {
      await navigator.clipboard.writeText(text);

      // שינוי האייקון ל-V כדי לתת אינדיקציה חזותית
      const originalHtml = btnElement.innerHTML;
      btnElement.innerHTML = `<i data-lucide="check" style="width:18px;height:18px;color:white;"></i>`;
      btnElement.style.background = "var(--accent)";
      btnElement.style.borderColor = "var(--accent)";
      btnElement.style.opacity = "1";

      if (window.lucide) window.lucide.createIcons();

      // חזרה למצב הרגיל אחרי שניה וחצי
      setTimeout(() => {
        btnElement.innerHTML = originalHtml;
        btnElement.style.background = "transparent";
        btnElement.style.borderColor = "var(--border-color)";
        btnElement.style.opacity = "0.6";
        if (window.lucide) window.lucide.createIcons();
      }, 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("לא הצלחנו להעתיק את הטקסט. אנא העתק ידנית.");
    }
  }

  // --- פונקציות המודל והמחיקה (ללא שינוי) ---
  function openDeleteModal(index, name, element) {
    clientToDeleteIndex = index;
    clientToDeleteElement = element;
    modalNameEl.innerText = name;
    modal.classList.add("open");
  }
  window.closeDeleteModal = function () {
    modal.classList.remove("open");
  };
  document.getElementById("confirmDeleteBtn").addEventListener("click", () => {
    closeDeleteModal();
    clientToDeleteElement.style.opacity = "0";
    setTimeout(() => clientToDeleteElement.remove(), 300);
    clientsData.splice(clientToDeleteIndex, 1);
    if (clientToDeleteElement.classList.contains("active")) {
      document.getElementById("welcomeState").style.display = "flex";
      document.getElementById("splitView").style.display = "none";
    }
  });

  // הפעלה ראשונית
  fetchClients();
});
