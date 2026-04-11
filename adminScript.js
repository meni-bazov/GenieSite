document.addEventListener("DOMContentLoaded", () => {
  let clientsData = [];
  let activeClientIndex = null;
  let currentClientId = null;
  let currentAIContent = null;
  let currentView = "raw";
  let clientToDeleteIndex = null;

  const modal = document.getElementById("deleteModal");
  const modalNameEl = document.getElementById("modalClientName");

  async function fetchClients() {
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      if (data.success) {
        clientsData = data.clients;
        renderClientList();
      }
    } catch (err) {
      console.error(err);
    }
  }

  function renderClientList() {
    const listEl = document.getElementById("clientList");
    listEl.innerHTML = "";
    if (clientsData.length === 0) {
      listEl.innerHTML =
        '<li class="client-item text-muted" style="text-align:center;">אין טפסים עדיין</li>';
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
      li.className = `client-item ${index === activeClientIndex ? "active" : ""}`;

      let actionsHtml = "";
      if (index === activeClientIndex) {
        // הבדיקה אם יש תוכן אמיתי כדי להראות את כפתור השמירה
        const hasRealContent = currentAIContent && currentAIContent.length > 0;
        actionsHtml = `
                    <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-sm ${currentView === "raw" ? "btn-primary" : "btn-outline"}" style="flex:1; padding:0.4rem;" onclick="switchView('raw', event)"><i data-lucide="file-text" style="width:14px;height:14px;"></i> אפיון</button>
                            <button class="btn btn-sm ${currentView === "ai" ? "btn-primary" : "btn-outline"}" style="flex:1; padding:0.4rem;" onclick="switchView('ai', event)"><i data-lucide="sparkles" style="width:14px;height:14px;"></i> AI</button>
                        </div>
                        ${currentView === "ai" && hasRealContent ? `<button class="btn btn-sm btn-primary" style="background: #10b981; border-color: #10b981; width: 100%; padding:0.4rem;" onclick="saveEditedContent(event)"><i data-lucide="save" style="width:14px;height:14px;"></i> שמור עריכה</button>` : ""}
                    </div>
                `;
      }

      li.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; width: 100%;">
                    <div>
                        <span class="client-name">${businessName}</span>
                        <span class="client-date">${date}</span>
                    </div>
                    <button type="button" class="btn-icon remove-client-btn" title="מחק" style="opacity: 1; color: var(--danger);"><i data-lucide="trash-2" style="width:18px; height:18px;"></i></button>
                </div>
                ${actionsHtml}
            `;

      li.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        selectClient(index);
      });
      li.querySelector(".remove-client-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        openDeleteModal(index, businessName, li);
      });
      listEl.appendChild(li);
    });
    if (window.lucide) window.lucide.createIcons();
  }

  window.switchView = function (view, event) {
    if (event) event.stopPropagation();
    currentView = view;
    renderClientList();
    renderMainView();
  };

  function selectClient(index) {
    activeClientIndex = index;
    currentClientId = clientsData[index]._id;

    // התיקון הקריטי: בודק שזה לא רק מערך ריק, אלא שיש בו באמת תוכן
    currentAIContent =
      clientsData[index].aiContent && clientsData[index].aiContent.length > 0
        ? clientsData[index].aiContent
        : null;

    currentView = "raw";
    document.getElementById("welcomeState").style.display = "none";

    renderClientList();
    renderMainView();
  }

  function renderMainView() {
    const client = clientsData[activeClientIndex].data;
    document.getElementById("topbarTitle").innerText =
      client.businessName || "פרטי לקוח";

    if (currentView === "raw") {
      document.getElementById("rawPanel").style.display = "flex";
      document.getElementById("aiPanel").style.display = "none";
      renderRawData(client);
    } else {
      document.getElementById("rawPanel").style.display = "none";
      document.getElementById("aiPanel").style.display = "flex";

      // התיקון הקריטי 2: מציג את כפתור היצירה אם אין תוכן
      if (currentAIContent && currentAIContent.length > 0) {
        renderAITabs();
      } else {
        document.getElementById("aiTabs").style.display = "none";
        document.getElementById("aiContentDisplay").innerHTML = `
                    <div style="text-align:center; padding: 4rem;">
                        <i data-lucide="bot" style="width:64px; height:64px; color:var(--primary); margin-bottom:1rem;"></i>
                        <h3>עדיין לא נוצר תוכן ללקוח זה</h3>
                        <p style="color:var(--text-muted); margin-bottom: 2rem;">לחץ על הכפתור כדי לייצר טקסטים שיווקיים מושלמים.</p>
                        <button class="btn btn-primary" style="font-size:1.1rem; padding: 0.8rem 2rem;" onclick="generateAI(event)">✨ צור תוכן עם Gemini</button>
                    </div>
                `;
        if (window.lucide) window.lucide.createIcons();
      }
    }
  }

  window.generateAI = async function (e) {
    const btn = e.target.closest("button");
    btn.disabled = true;
    btn.innerHTML =
      '<i data-lucide="loader-2" class="lucide-spin"></i> מייצר (כ-30 שניות)...';
    if (window.lucide) window.lucide.createIcons();

    try {
      const res = await fetch(`/api/generate-content/${currentClientId}`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        currentAIContent = data.content;
        clientsData[activeClientIndex].aiContent = data.content;
        renderClientList();
        renderMainView();
      } else {
        alert("שגיאה: " + data.message);
      }
    } catch (err) {
      alert("שגיאת תקשורת.");
    }
  };

  window.saveEditedContent = async function (e) {
    if (e) e.stopPropagation();
    const btn = e.target.closest("button");
    const ogHtml = btn.innerHTML;
    btn.innerHTML =
      '<i data-lucide="loader-2" class="lucide-spin"></i> שומר...';
    if (window.lucide) window.lucide.createIcons();

    try {
      const res = await fetch(`/api/clients/${currentClientId}/ai-content`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: currentAIContent }),
      });
      const data = await res.json();
      if (data.success) {
        clientsData[activeClientIndex].aiContent = currentAIContent;
        btn.innerHTML = '<i data-lucide="check"></i> נשמר!';
        btn.style.background = "#059669";
        setTimeout(() => {
          btn.innerHTML = ogHtml;
          btn.style.background = "#10b981";
          if (window.lucide) window.lucide.createIcons();
        }, 2000);
      }
    } catch (err) {
      alert("שגיאת תקשורת");
      btn.innerHTML = ogHtml;
    }
  };

  function renderAITabs() {
    const tabsEl = document.getElementById("aiTabs");
    tabsEl.style.display = "flex";
    tabsEl.innerHTML = "";
    currentAIContent.forEach((page, index) => {
      const btn = document.createElement("button");
      btn.className = `ai-tab-btn ${index === 0 ? "active" : ""}`;
      btn.innerHTML = `<i data-lucide="file-text" style="width:16px; height:16px;"></i> ${page.pageName}`;
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".ai-tab-btn")
          .forEach((b, i) => b.classList.toggle("active", i === index));
        renderAIPageSections(index);
      });
      tabsEl.appendChild(btn);
    });
    renderAIPageSections(0);
  }

  function renderAIPageSections(pageIndex) {
    const contentEl = document.getElementById("aiContentDisplay");
    contentEl.innerHTML = "";
    const page = currentAIContent[pageIndex];

    page.sections.forEach((section, secIndex) => {
      const box = document.createElement("div");
      box.className = "ai-section-box";

      box.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <div style="font-weight:bold; font-size:1.1rem; color:var(--text-main);">${section.sectionTitle}</div>
                    <button type="button" class="btn-outline btn-copy" style="opacity:1; padding:0.3rem 0.8rem; border-radius:0.5rem; font-size:0.9rem; display:flex; align-items:center; gap:0.4rem; background:var(--bg-card);">
                        <i data-lucide="copy" style="width:16px; height:16px;"></i> העתק
                    </button>
                </div>
                <textarea class="ai-textarea" data-page="${pageIndex}" data-sec="${secIndex}">${section.content}</textarea>
            `;

      box.querySelector("textarea").addEventListener("input", (e) => {
        currentAIContent[pageIndex].sections[secIndex].content = e.target.value;
      });

      box.querySelector(".btn-copy").addEventListener("click", (e) => {
        const textToCopy = box.querySelector("textarea").value;
        copyToClipboard(textToCopy, e.target.closest("button"));
      });

      contentEl.appendChild(box);
    });
    if (window.lucide) window.lucide.createIcons();
  }

  async function copyToClipboard(text, btnElement) {
    try {
      await navigator.clipboard.writeText(text);
      const ogHtml = btnElement.innerHTML;
      btnElement.innerHTML = `<i data-lucide="check" style="width:16px;height:16px;color:white;"></i> הועתק!`;
      btnElement.style.background = "var(--primary)";
      btnElement.style.color = "white";
      if (window.lucide) window.lucide.createIcons();
      setTimeout(() => {
        btnElement.innerHTML = ogHtml;
        btnElement.style.background = "var(--bg-card)";
        btnElement.style.color = "var(--text-main)";
        if (window.lucide) window.lucide.createIcons();
      }, 1500);
    } catch (e) {
      alert("שגיאה בהעתקה");
    }
  }

  function renderRawData(client) {
    const val = (v) =>
      v
        ? `<span>${v}</span>`
        : '<span style="color:var(--text-muted); font-style:italic;">לא הוזן</span>';
    const line = (label, value) =>
      `<div class="data-line" style="margin-bottom:0.5rem;"><strong>${label}</strong> ${val(value)}</div>`;
    const listHtml = (arr, renderFn) =>
      !arr || !arr.length
        ? val("")
        : `<div style="display:flex; flex-direction:column; gap:0.5rem;">${arr.map(renderFn).join("")}</div>`;

    document.getElementById("clientRawData").innerHTML = `
          <h3 style="color:var(--primary); display:flex; gap:0.5rem;"><i data-lucide="info"></i> 1. כללי</h3>
          ${line("שם האתר", client.siteName || client.general?.siteName)} ${line("דומיין", client.domain)}
          <hr>
          <h3 style="color:var(--primary); display:flex; gap:0.5rem;"><i data-lucide="briefcase"></i> 2. על העסק</h3>
          ${line("תיאור", client.businessDescription)} ${line("קהל יעד", client.targetAudience)} ${line("ייחודיות", client.uniqueValue)}
          <hr>
          <h3 style="color:var(--primary); display:flex; gap:0.5rem;"><i data-lucide="package"></i> 3. שירותים</h3>
          ${listHtml(client.services, (s) => `<span><b>${s.name}:</b> ${s.description}</span>`)}
          <hr>
          <h3 style="color:var(--primary); display:flex; gap:0.5rem;"><i data-lucide="award"></i> 4. יתרונות</h3>
          ${listHtml(client.benefits, (b) => `<span><b>${b.title}:</b> ${b.description}</span>`)}
          <hr>
          <h3 style="color:var(--primary); display:flex; gap:0.5rem;"><i data-lucide="palette"></i> 5. סגנון</h3>
          ${line("טון", client.tone)} ${line("שפה", client.language)} ${line("עיצוב", client.designStyle)}
          <hr>
          <h3 style="color:var(--primary); display:flex; gap:0.5rem;"><i data-lucide="phone"></i> 6. קשר</h3>
          ${line("טלפון", client.phone)} ${line("כתובת", client.address)} ${line("מייל", client.email)}
          <hr>
          <h3 style="color:var(--primary); display:flex; gap:0.5rem;"><i data-lucide="message-square"></i> 7. המלצות</h3>
          ${listHtml(client.testimonials, (t) => `<span><b>${t.name}:</b> ${t.text}</span>`)}
          <hr>
          <h3 style="color:var(--primary); display:flex; gap:0.5rem;"><i data-lucide="search"></i> 8. עמודים</h3>
          ${line("מבוקשים", client.pages ? (Array.isArray(client.pages) ? client.pages.join(", ") : client.pages.selected?.join(", ")) : "")}
          ${line("נוספים", client.otherPages)}
        `;
    if (window.lucide) window.lucide.createIcons();
  }

  window.openDeleteModal = function (index, name, element) {
    clientToDeleteIndex = index;
    modalNameEl.innerText = name;
    modal.classList.add("open");
  };
  window.closeDeleteModal = function () {
    modal.classList.remove("open");
  };
  document
    .getElementById("confirmDeleteBtn")
    .addEventListener("click", async () => {
      closeDeleteModal();
      clientsData.splice(clientToDeleteIndex, 1);
      renderClientList();
      document.getElementById("welcomeState").style.display = "block";
      document.getElementById("rawPanel").style.display = "none";
      document.getElementById("aiPanel").style.display = "none";
    });

  fetchClients();
});
