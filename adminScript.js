document.addEventListener("DOMContentLoaded", () => {
  let clientsData = [];
  let clientToDeleteIndex = null;
  let clientToDeleteElement = null;

  const modal = document.getElementById("deleteModal");
  const modalNameEl = document.getElementById("modalClientName");

  // פונקציה למשיכת הלקוחות מהשרת
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

  // רינדור רשימת הלקוחות בתפריט הצד
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

      // לחיצה על השורה (מציגה פרטים)
      li.addEventListener("click", (e) => {
        // רק אם לא לחצו על כפתור המחיקה
        if (!e.target.classList.contains("remove-client-btn")) {
          selectClient(index, li);
        }
      });

      // לחיצה על כפתור המחיקה (פותחת מודל)
      li.querySelector(".remove-client-btn").addEventListener("click", (e) => {
        e.stopPropagation(); // מונע מהלחיצה לפתוח את פרטי הלקוח
        openDeleteModal(index, businessName, li);
      });

      listEl.appendChild(li);
    });
  }

  // בחירת לקוח והצגת הנתונים שלו
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

    const rawDataEl = document.getElementById("clientRawData");

    let pagesDisplay = "";
    if (client.pages && Array.isArray(client.pages)) {
      pagesDisplay = client.pages.join(", ");
    } else if (client.pages?.selected && Array.isArray(client.pages.selected)) {
      pagesDisplay = client.pages.selected.join(", ");
    }
    if (!pagesDisplay) pagesDisplay = val("");

    // הזרקת הנתונים למסך עם עיצוב משופר
    rawDataEl.innerHTML = `
            <h3>פרטים כלליים</h3>
            <p><strong>שם העסק:</strong> ${val(client.businessName || client.general?.businessName)}</p>
            <p><strong>דומיין:</strong> ${val(client.domain || client.general?.domain)}</p>
            <p><strong>סלוגן:</strong> ${val(client.slogan || client.general?.slogan)}</p>
            <hr style="border:0; border-top:1px solid var(--border-color); margin:15px 0;">
            
            <h3>על העסק</h3>
            <p><strong>תיאור:</strong> ${val(client.businessDescription || client.business?.businessDescription)}</p>
            <p><strong>קהל יעד:</strong> ${val(client.targetAudience || client.business?.targetAudience)}</p>
            <hr style="border:0; border-top:1px solid var(--border-color); margin:15px 0;">
            
            <h3>עמודים מבוקשים</h3>
            <p>${pagesDisplay}</p>
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
    // סימולציית מחיקה (בצד לקוח)
    // בהמשך כאן יתבצע החיבור ל-API של המחיקה בשרת!
    closeDeleteModal();
    clientToDeleteElement.style.opacity = "0";
    setTimeout(() => clientToDeleteElement.remove(), 300);
    clientsData.splice(clientToDeleteIndex, 1);

    // אם הלקוח המחוק היה פתוח, נסגור את התצוגה שלו
    if (clientToDeleteElement.classList.contains("active")) {
      document.getElementById("welcomeState").style.display = "block";
      document.getElementById("splitView").style.display = "none";
    }
  });

  // הפעלה ראשונית
  fetchClients();
});
