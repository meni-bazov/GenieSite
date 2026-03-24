document.addEventListener("DOMContentLoaded", () => {
  let clientsData = [];
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
          '<li class="client-item text-center">שגיאה בטעינת הנתונים</li>';
      }
    } catch (err) {
      console.error("Error fetching clients:", err);
      listEl.innerHTML =
        '<li class="client-item text-center">שגיאה בתקשורת מול השרת</li>';
    }
  }

  // יצירת רשימת תפריט הצד
  function renderClientList() {
    const listEl = document.getElementById("clientList");
    listEl.innerHTML = "";

    if (clientsData.length === 0) {
      listEl.innerHTML =
        '<li class="client-item text-center">אין לקוחות עדיין במערכת</li>';
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
                <div class="client-info">
                    <span class="client-name">${businessName}</span>
                    <span class="client-date">${date}</span>
                </div>
                <button type="button" class="btn-icon remove-client-btn" title="מחק לקוח">🗑️</button>
            `;

      li.addEventListener("click", (e) => {
        if (!e.target.classList.contains("remove-client-btn")) {
          selectClient(index, li);
        }
      });

      li.querySelector(".remove-client-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        openDeleteModal(index, businessName, li);
      });

      listEl.appendChild(li);
    });
  }

  // בחירת לקוח והצגת הנתונים שלו (הגרסה המלאה!)
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
        ? v
        : '<span style="color:var(--text-muted); font-style:italic;">לא הוזן</span>';

    // שליפת הנתונים מכל סעיפי הטופס
    const siteName = client.siteName || client.general?.siteName;
    const domain = client.domain || client.general?.domain;
    const slogan = client.slogan || client.general?.slogan;

    const bizDesc =
      client.businessDescription || client.business?.businessDescription;
    const audience = client.targetAudience || client.business?.targetAudience;
    const uniqueVal = client.uniqueValue || client.business?.uniqueValue;

    const tone = client.tone || client.style?.tone;
    const length = client.contentLength || client.style?.contentLength;
    const lang = client.language || client.style?.language;

    const refSites =
      client.referenceSites || client.inspiration?.referenceSites;
    const designStyle = client.designStyle || client.inspiration?.designStyle;

    const brandColors = client.brandColors || client.branding?.brandColors;
    const prefFont = client.preferredFont || client.branding?.preferredFont;

    const phone = client.phone || client.contact?.phone;
    const email = client.email || client.contact?.email;
    const address = client.address || client.contact?.address;
    const hours = client.hours || client.contact?.hours;

    const facebook = client.facebook || client.social?.facebook;
    const instagram = client.instagram || client.social?.instagram;

    const seoKw = client.seoKeywords || client.seo?.keywords;
    const seoArea = client.serviceArea || client.seo?.serviceArea;
    const extra = client.extraNotes;

    // בניית רשימת השירותים
    let servicesHtml = "";
    if (client.services && client.services.length > 0) {
      servicesHtml = client.services
        .map((s) => `<li><strong>${s.name}</strong>: ${s.description}</li>`)
        .join("");
    } else {
      servicesHtml = val("");
    }

    // בניית רשימת היתרונות
    let benefitsHtml = "";
    if (client.benefits && client.benefits.length > 0) {
      benefitsHtml = client.benefits
        .map((b) => `<li><strong>${b.title}</strong>: ${b.description}</li>`)
        .join("");
    } else {
      benefitsHtml = val("");
    }

    // בניית המלצות
    let testimonialsHtml = "";
    if (client.testimonials && Array.isArray(client.testimonials)) {
      testimonialsHtml = client.testimonials
        .map((t) => `<li><strong>${t.name}</strong>: ${t.text}</li>`)
        .join("");
    } else if (
      typeof client.testimonials === "string" &&
      client.testimonials.trim() !== ""
    ) {
      testimonialsHtml = client.testimonials;
    } else {
      testimonialsHtml = val("");
    }

    // טיפול בעמודים מבוקשים
    let pagesDisplay = "";
    if (client.pages && Array.isArray(client.pages)) {
      pagesDisplay = client.pages.join(", ");
    } else if (client.pages?.selected && Array.isArray(client.pages.selected)) {
      pagesDisplay = client.pages.selected.join(", ");
    }
    const otherPages = client.otherPages || client.pages?.otherPages;
    if (otherPages) pagesDisplay += ` (נוספים: ${otherPages})`;
    if (!pagesDisplay) pagesDisplay = val("");

    // הזרקת הנתונים המלאים למסך
    const rawDataEl = document.getElementById("clientRawData");
    rawDataEl.innerHTML = `
          <h3>1. פרטים כלליים</h3>
          <p><strong>שם האתר:</strong> ${val(siteName)}</p>
          <p><strong>דומיין:</strong> ${val(domain)}</p>
          <p><strong>סלוגן:</strong> ${val(slogan)}</p>
          <hr style="border:0; border-top:1px solid var(--border-color); margin:15px 0;">
          
          <h3>2. על העסק</h3>
          <p><strong>תיאור:</strong> ${val(bizDesc)}</p>
          <p><strong>קהל יעד:</strong> ${val(audience)}</p>
          <p><strong>ייחודיות:</strong> ${val(uniqueVal)}</p>
          <hr style="border:0; border-top:1px solid var(--border-color); margin:15px 0;">
          
          <h3>3. שירותים / מוצרים</h3>
          <ul>${servicesHtml}</ul>
          <hr style="border:0; border-top:1px solid var(--border-color); margin:15px 0;">

          <h3>4. יתרונות (Benefits)</h3>
          <ul>${benefitsHtml}</ul>
          <hr style="border:0; border-top:1px solid var(--border-color); margin:15px 0;">

          <h3>5. טון, סגנון והשראה</h3>
          <p><strong>טון:</strong> ${val(tone)} | <strong>אורך:</strong> ${val(length)} | <strong>שפה:</strong> ${val(lang)}</p>
          <p><strong>אתרי השראה:</strong> ${val(refSites)}</p>
          <p><strong>סגנון עיצוב:</strong> ${val(designStyle)}</p>
          <p><strong>צבעים:</strong> ${val(brandColors)} | <strong>פונט:</strong> ${val(prefFont)}</p>
          <hr style="border:0; border-top:1px solid var(--border-color); margin:15px 0;">

          <h3>6. פרטי התקשרות ורשתות</h3>
          <p><strong>טלפון:</strong> ${val(phone)} | <strong>דוא"ל:</strong> ${val(email)}</p>
          <p><strong>כתובת:</strong> ${val(address)} | <strong>שעות:</strong> ${val(hours)}</p>
          <p><strong>רשתות:</strong> FB: ${val(facebook)} | IG: ${val(instagram)}</p>
          <hr style="border:0; border-top:1px solid var(--border-color); margin:15px 0;">

          <h3>7. המלצות (Testimonials)</h3>
          <ul>${testimonialsHtml}</ul>
          <hr style="border:0; border-top:1px solid var(--border-color); margin:15px 0;">

          <h3>8. SEO ועמודים</h3>
          <p><strong>מילות מפתח:</strong> ${val(seoKw)}</p>
          <p><strong>אזור שירות:</strong> ${val(seoArea)}</p>
          <p><strong>עמודים מבוקשים:</strong> ${pagesDisplay}</p>
          <hr style="border:0; border-top:1px solid var(--border-color); margin:15px 0;">

          <h3>9. הערות נוספות</h3>
          <p>${val(extra)}</p>
        `;
  }

  // פונקציות המודל (מחיקה)
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

    // חזרה למסך הריק אם הלקוח המחוק היה פתוח
    if (clientToDeleteElement.classList.contains("active")) {
      document.getElementById("welcomeState").style.display = "flex";
      document.getElementById("splitView").style.display = "none";
    }
  });

  // הפעלה ראשונית
  fetchClients();
});
