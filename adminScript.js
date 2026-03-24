document.addEventListener("DOMContentLoaded", () => {
  // --- 1. ניהול מצב תצוגה (Dark Mode) ---
  if (window.lucide) window.lucide.createIcons();
  const themeToggle = document.getElementById("themeToggleAdmin");
  const htmlElement = document.documentElement;
  const themeIcon = document.getElementById("themeIcon");

  const savedTheme = localStorage.getItem("genieTheme") || "light";
  htmlElement.setAttribute("data-theme", savedTheme);
  if (themeIcon)
    themeIcon.setAttribute(
      "data-lucide",
      savedTheme === "dark" ? "sun" : "moon",
    );
  if (window.lucide) window.lucide.createIcons();

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const newTheme =
        htmlElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      htmlElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("genieTheme", newTheme);
      if (themeIcon)
        themeIcon.setAttribute(
          "data-lucide",
          newTheme === "dark" ? "sun" : "moon",
        );
      if (window.lucide) window.lucide.createIcons();
    });
  }

  // --- 2. משתנים ופונקציות מערכת ---
  let clientsData = [];
  let currentClientId = null;
  let currentAIContent = null;
  let clientToDeleteIndex = null;
  let clientToDeleteElement = null;

  const modal = document.getElementById("deleteModal");
  const modalNameEl = document.getElementById("modalClientName");

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
        '<li class="client-item text-muted" style="justify-content:center;">שגיאה בתקשורת מול השרת</li>';
    }
  }

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

  // --- 3. הצגת כל הנתונים של הלקוח ---
  function selectClient(index, liElement) {
    document
      .querySelectorAll(".client-item")
      .forEach((el) => el.classList.remove("active"));
    liElement.classList.add("active");

    currentClientId = clientsData[index]._id;
    currentAIContent = null;

    const client = clientsData[index].data;
    document.getElementById("welcomeState").style.display = "none";
    document.getElementById("splitView").style.display = "block";
    document.getElementById("topbarTitle").innerText =
      client.businessName || "פרטי לקוח";

    resetAIOutputPanel();

    // פונקציות עזר לסידור השורות
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

    // החזרת כל הנתונים במלואם
    rawDataEl.innerHTML = `
          <h3 style="color:var(--primary); margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;"><i data-lucide="info" style="width:18px;height:18px;"></i> 1. פרטים כלליים</h3>
          ${line("שם האתר", client.siteName || client.general?.siteName)}
          ${line("דומיין", client.domain || client.general?.domain)}
          ${line("סלוגן", client.slogan || client.general?.slogan)}
          <hr style="border-top:1px solid var(--border-color); margin:1.5rem 0;">
          
          <h3 style="color:var(--primary); margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;"><i data-lucide="briefcase" style="width:18px;height:18px;"></i> 2. על העסק</h3>
          ${line("תיאור העסק", client.businessDescription || client.business?.businessDescription)}
          ${line("קהל יעד", client.targetAudience || client.business?.targetAudience)}
          ${line("הייחודיות", client.uniqueValue || client.business?.uniqueValue)}
          <hr style="border-top:1px solid var(--border-color); margin:1.5rem 0;">
          
          <h3 style="color:var(--primary); margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;"><i data-lucide="package" style="width:18px;height:18px;"></i> 3. שירותים / מוצרים</h3>
          ${listHtml(client.services, (s) => `<span><b>${s.name}:</b> ${s.description}</span>`)}
          <hr style="border-top:1px solid var(--border-color); margin:1.5rem 0;">

          <h3 style="color:var(--primary); margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;"><i data-lucide="award" style="width:18px;height:18px;"></i> 4. יתרונות העסק</h3>
          ${listHtml(client.benefits, (b) => `<span><b>${b.title}:</b> ${b.description}</span>`)}
          <hr style="border-top:1px solid var(--border-color); margin:1.5rem 0;">
          
          <h3 style="color:var(--primary); margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;"><i data-lucide="palette" style="width:18px;height:18px;"></i> 5. סגנון והשראה</h3>
          ${line("טון כתיבה", client.tone || client.style?.tone)}
          ${line("אורך טקסטים", client.contentLength || client.style?.contentLength)}
          ${line("שפת האתר", client.language || client.style?.language)}
          ${line("סגנון עיצוב", client.designStyle || client.inspiration?.designStyle)}
          <hr style="border-top:1px solid var(--border-color); margin:1.5rem 0;">

          <h3 style="color:var(--primary); margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;"><i data-lucide="phone-call" style="width:18px;height:18px;"></i> 6. פרטי התקשרות ורשתות</h3>
          ${line("טלפון", client.phone || client.contact?.phone)}
          ${line('דוא"ל', client.email || client.contact?.email)}
          ${line("כתובת", client.address || client.contact?.address)}
          ${line("פייסבוק", client.facebook || client.social?.facebook)}
          ${line("אינסטגרם", client.instagram || client.social?.instagram)}
          <hr style="border-top:1px solid var(--border-color); margin:1.5rem 0;">

          <h3 style="color:var(--primary); margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;"><i data-lucide="message-square-quote" style="width:18px;height:18px;"></i> 7. המלצות</h3>
          ${listHtml(client.testimonials, (t) => `<span><b>${t.name}:</b> ${t.text}</span>`)}
          <hr style="border-top:1px solid var(--border-color); margin:1.5rem 0;">

          <h3 style="color:var(--primary); margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;"><i data-lucide="search" style="width:18px;height:18px;"></i> 8. SEO ועמודים</h3>
          ${line("עמודים מבוקשים", client.pages ? (Array.isArray(client.pages) ? client.pages.join(", ") : client.pages.selected?.join(", ")) : "")}
          ${line("עמודים נוספים", client.otherPages)}
          <hr style="border-top:1px solid var(--border-color); margin:1.5rem 0;">

          <h3 style="color:var(--primary); margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;"><i data-lucide="file-text" style="width:18px;height:18px;"></i> 9. הערות נוספות</h3>
          ${line("הערות", client.extraNotes)}
        `;
    if (window.lucide) window.lucide.createIcons();
  }

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

  // --- 4. לוגיקה ליצירת תוכן AI עם Gemini ---
  const generateBtn = document.getElementById("generateContentBtn");
  if (generateBtn) {
    generateBtn.addEventListener("click", async () => {
      if (!currentClientId) return alert("אנא בחר לקוח קודם");

      const btnText = document.getElementById("btnText");
      generateBtn.disabled = true;
      btnText.innerText = "חושב ומייצר (Gemini)...";
      resetAIOutputPanel();
      document.getElementById("aiContentDisplay").innerHTML = `
                <div class="empty-state" style="padding:4rem 2rem;">
                    <i data-lucide="loader-2" class="lucide-spin text-primary" style="width: 48px; height: 48px; margin-bottom:1rem;"></i>
                    <h3>מייצר תוכן עם Gemini</h3>
                    <p style="max-width:300px; margin:0 auto;">אנא המתן. המערכת קוראת את האפיון, בונה פרומפט שיווקי ופונה ל-AI...</p>
                </div>
            `;
      if (window.lucide) window.lucide.createIcons();

      try {
        const response = await fetch(
          `/api/generate-content/${currentClientId}`,
          { method: "POST" },
        );
        const result = await response.json();

        if (result.success) {
          currentAIContent = result.content;
          renderAIContent();
        } else {
          alert("שגיאה ביצירת התוכן: " + result.message);
          resetAIOutputPanel();
        }
      } catch (error) {
        console.error("AI Fetch Error:", error);
        alert(
          "שגיאה! השרת כנראה קרס כי מפתח ה-GEMINI_API_KEY חסר בהגדרות הוסטינגר. אנא הוסף אותו ב-Environment Variables.",
        );
        resetAIOutputPanel();
      } finally {
        generateBtn.disabled = false;
        btnText.innerText = "צור תוכן מחדש (AI)";
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  // --- 5. רינדור הלשוניות של ה-AI ---
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

    currentAIContent.forEach((page, index) => {
      const btn = document.createElement("button");
      btn.className = `ai-tab-btn ${index === 0 ? "active" : ""}`;
      btn.innerHTML = `<i data-lucide="file-text" style="width:16px; height:16px;"></i> ${page.pageName}`;
      btn.addEventListener("click", () => selectAIPage(index));
      tabsEl.appendChild(btn);
    });

    renderAIPageSections(0);
    if (window.lucide) window.lucide.createIcons();
  }

  function selectAIPage(index) {
    document.querySelectorAll(".ai-tab-btn").forEach((btn, i) => {
      btn.classList.toggle("active", i === index);
    });
    renderAIPageSections(index);
  }

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

      sectionBox.innerHTML = `
                <div class="ai-section-title">${section.sectionTitle}</div>
                <div class="ai-section-content">${section.content}</div>
                <button type="button" class="btn-icon btn-copy" title="העתק טקסט">
                    <i data-lucide="copy" style="width:18px; height:18px;"></i>
                </button>
            `;

      sectionBox.querySelector(".btn-copy").addEventListener("click", () => {
        copyToClipboard(section.content, sectionBox.querySelector(".btn-copy"));
      });

      contentEl.appendChild(sectionBox);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  async function copyToClipboard(text, btnElement) {
    try {
      await navigator.clipboard.writeText(text);
      const originalHtml = btnElement.innerHTML;
      btnElement.innerHTML = `<i data-lucide="check" style="width:18px;height:18px;color:white;"></i>`;
      btnElement.style.background = "var(--accent)";
      btnElement.style.borderColor = "var(--accent)";
      btnElement.style.opacity = "1";
      if (window.lucide) window.lucide.createIcons();

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

  // --- 6. מחיקה ---
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

  fetchClients();
});
