document.addEventListener("DOMContentLoaded", () => {
  let clientsData = [];
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
        '<li class="client-item text-muted" style="justify-content:center;">שגיאה בתקשורת</li>';
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
      li.innerHTML = `
                <div>
                    <span class="client-name">${businessName}</span>
                    <span class="client-date">${date}</span>
                </div>
                <button type="button" class="btn-icon remove-client-btn" title="מחק"><i data-lucide="trash-2" style="width:18px; height:18px;"></i></button>
            `;

      li.addEventListener("click", (e) => {
        if (!e.target.closest(".remove-client-btn")) selectClient(index, li);
      });

      li.querySelector(".remove-client-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        openDeleteModal(index, businessName, li);
      });

      listEl.appendChild(li);
    });

    // רענון אייקונים של Lucide
    if (window.lucide) window.lucide.createIcons();
  }

  function selectClient(index, liElement) {
    document
      .querySelectorAll(".client-item")
      .forEach((el) => el.classList.remove("active"));
    liElement.classList.add("active");

    const client = clientsData[index].data;

    document.getElementById("welcomeState").style.display = "none";
    document.getElementById("splitView").style.display = "block";
    document.getElementById("topbarTitle").innerText =
      client.businessName || client.general?.businessName || "פרטי לקוח";

    const val = (v) =>
      v
        ? `<span>${v}</span>`
        : '<span style="color:var(--text-muted); font-style:italic; background:transparent; border:none; padding:0;">לא הוזן</span>';
    const line = (label, value) =>
      `<div class="data-line"><strong>${label}</strong> ${val(value)}</div>`;

    // בניית רשימות
    const listHtml = (arr, renderFn) => {
      if (!arr || arr.length === 0) return line("", "");
      return `<div class="data-line" style="gap:0.5rem;">${arr.map(renderFn).join("")}</div>`;
    };

    const rawDataEl = document.getElementById("clientRawData");
    rawDataEl.innerHTML = `
          <h3 style="color:var(--primary); margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;"><i data-lucide="info" style="width:18px;height:18px;"></i> פרטים כלליים</h3>
          ${line("שם האתר", client.siteName)}
          ${line("דומיין", client.domain)}
          ${line("סלוגן", client.slogan)}
          <hr>
          
          <h3 style="color:var(--primary); margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;"><i data-lucide="briefcase" style="width:18px;height:18px;"></i> על העסק</h3>
          ${line("תיאור העסק", client.businessDescription)}
          ${line("קהל יעד", client.targetAudience)}
          ${line("הייחודיות של העסק", client.uniqueValue)}
          <hr>
          
          <h3 style="color:var(--primary); margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;"><i data-lucide="package" style="width:18px;height:18px;"></i> שירותים / מוצרים</h3>
          ${listHtml(client.services, (s) => `<span><b>${s.name}:</b> ${s.description}</span>`)}
          <hr>

          <h3 style="color:var(--primary); margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;"><i data-lucide="award" style="width:18px;height:18px;"></i> יתרונות העסק</h3>
          ${listHtml(client.benefits, (b) => `<span><b>${b.title}:</b> ${b.description}</span>`)}
          <hr>

          <h3 style="color:var(--primary); margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;"><i data-lucide="palette" style="width:18px;height:18px;"></i> סגנון והשראה</h3>
          ${line("טון כתיבה", client.tone)}
          ${line("אורך טקסטים", client.contentLength)}
          ${line("שפת האתר", client.language)}
          ${line("אתרי השראה", client.referenceSites)}
          ${line("סגנון עיצוב", client.designStyle)}
          ${line("צבעי מותג", client.brandColors)}
          ${line("פונט מועדף", client.preferredFont)}
          <hr>

          <h3 style="color:var(--primary); margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;"><i data-lucide="phone-call" style="width:18px;height:18px;"></i> פרטי התקשרות ורשתות</h3>
          ${line("טלפון", client.phone)}
          ${line('דוא"ל', client.email)}
          ${line("כתובת", client.address)}
          ${line("שעות פעילות", client.hours)}
          ${line("פייסבוק", client.facebook)}
          ${line("אינסטגרם", client.instagram)}
          <hr>

          <h3 style="color:var(--primary); margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;"><i data-lucide="message-square-quote" style="width:18px;height:18px;"></i> המלצות</h3>
          ${listHtml(client.testimonials, (t) => `<span><b>${t.name}:</b> ${t.text}</span>`)}
          <hr>

          <h3 style="color:var(--primary); margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;"><i data-lucide="search" style="width:18px;height:18px;"></i> SEO ועמודים</h3>
          ${line("מילות מפתח", client.seoKeywords)}
          ${line("אזורי שירות", client.serviceArea)}
          ${line("עמודים מבוקשים", client.pages ? client.pages.join(", ") : "")}
          ${line("עמודים נוספים", client.otherPages)}
          <hr>

          <h3 style="color:var(--primary); margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;"><i data-lucide="file-text" style="width:18px;height:18px;"></i> הערות נוספות</h3>
          ${line("הערות", client.extraNotes)}
        `;

    if (window.lucide) window.lucide.createIcons();
  }

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
