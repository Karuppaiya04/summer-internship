// Global Variables
let allBirthdays = [];
let currentView = "table";
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let birthdayModal, whatsappModal;

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
  birthdayModal = new bootstrap.Modal(document.getElementById("birthdayModal"));
  whatsappModal = new bootstrap.Modal(document.getElementById("whatsappModal"));

  loadBirthdays();

  // Search functionality
  document
    .getElementById("searchInput")
    .addEventListener("input", function (e) {
      filterBirthdays(e.target.value);
    });
});

// Load all birthdays
async function loadBirthdays() {
  try {
    const response = await fetch("/api/birthdays");
    if (!response.ok) throw new Error("Failed to load birthdays");

    allBirthdays = await response.json();
    updateStats();
    renderBirthdays(allBirthdays);

    document.getElementById("loadingState").style.display = "none";

    if (allBirthdays.length === 0) {
      document.getElementById("emptyState").style.display = "block";
      document.getElementById("birthdaysList").style.display = "none";
    } else {
      document.getElementById("emptyState").style.display = "none";
      document.getElementById("birthdaysList").style.display = "block";
    }
  } catch (error) {
    console.error("Error loading birthdays:", error);
    showToast("Failed to load birthdays", "error");
    document.getElementById("loadingState").innerHTML =
      '<p style="color: #e74c3c;">Failed to load birthdays. Please refresh the page.</p>';
  }
}

// Update statistics
function updateStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayBirthdays = allBirthdays.filter((b) => {
    const birthDate = new Date(b.birth_date);
    return (
      birthDate.getMonth() === today.getMonth() &&
      birthDate.getDate() === today.getDate()
    );
  });

  const monthBirthdays = allBirthdays.filter((b) => {
    const birthDate = new Date(b.birth_date);
    return birthDate.getMonth() === today.getMonth();
  });

  const weekBirthdays = allBirthdays.filter((b) => {
    const birthDate = new Date(b.birth_date);
    const nextBirthday = new Date(
      today.getFullYear(),
      birthDate.getMonth(),
      birthDate.getDate()
    );
    if (nextBirthday < today) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    const diffTime = nextBirthday - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  document.getElementById("totalCount").textContent = allBirthdays.length;
  document.getElementById("monthCount").textContent = monthBirthdays.length;
  document.getElementById("todayCount").textContent = todayBirthdays.length;
  document.getElementById("weekCount").textContent = weekBirthdays.length;
}

// Render birthdays list
function renderBirthdays(birthdays) {
  const container = document.getElementById("birthdaysList");

  if (birthdays.length === 0) {
    container.innerHTML =
      '<div class="empty-state"><div class="empty-state-icon"><i class="bi bi-search"></i></div><h3>No results found</h3><p>Try a different search term</p></div>';
    return;
  }

  // Sort birthdays
  const sortedBirthdays = [...birthdays].sort((a, b) => {
    return getNextBirthday(a.birth_date) - getNextBirthday(b.birth_date);
  });

  container.innerHTML = sortedBirthdays
    .map((birthday) => {
      const badge = getBirthdayBadge(birthday.birth_date);
      const daysUntil = getDaysUntilBirthday(birthday.birth_date);
      const initial = birthday.name.charAt(0).toUpperCase();
      const age = calculateAge(birthday.birth_date);

      return `
            <div class="birthday-card">
                <div class="birthday-avatar">${initial}</div>
                <div class="birthday-info">
                    <h3>${birthday.name} ${badge}</h3>
                    <div class="birthday-details">
                        <i class="bi bi-calendar3"></i> ${formatDate(
                          birthday.birth_date
                        )}
                        ${daysUntil !== null ? ` • ${daysUntil}` : ""}
                        ${age !== null ? ` • ${age} years old` : ""}
                        ${
                          birthday.phone
                            ? `<br><i class="bi bi-phone"></i> ${birthday.phone}`
                            : ""
                        }
                        ${
                          birthday.email
                            ? `<br><i class="bi bi-envelope"></i> ${birthday.email}`
                            : ""
                        }
                    </div>
                </div>
                <div class="birthday-actions">
                    ${
                      birthday.phone
                        ? `<button class="action-btn whatsapp" onclick="openWhatsAppModal(${birthday.id}, '${birthday.name}', '${birthday.phone}')" title="Send WhatsApp"><i class="bi bi-whatsapp"></i></button>`
                        : ""
                    }
                    <button class="action-btn" onclick="editBirthday(${
                      birthday.id
                    })" title="Edit"><i class="bi bi-pencil"></i></button>
                    <button class="action-btn delete" onclick="deleteBirthday(${
                      birthday.id
                    })" title="Delete"><i class="bi bi-trash"></i></button>
                </div>
            </div>
        `;
    })
    .join("");
}

// Get birthday badge
function getBirthdayBadge(birthDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const birth = new Date(birthDate);

  if (
    birth.getMonth() === today.getMonth() &&
    birth.getDate() === today.getDate()
  ) {
    return '<span class="birthday-badge badge-today">🎉 Today</span>';
  }

  const daysUntil = getDaysUntilBirthdayNumber(birthDate);
  if (daysUntil <= 7) {
    return '<span class="birthday-badge badge-soon">Coming Soon</span>';
  }

  return "";
}

// Get days until birthday
function getDaysUntilBirthday(birthDate) {
  const daysUntil = getDaysUntilBirthdayNumber(birthDate);

  if (daysUntil === 0) return "Today!";
  if (daysUntil === 1) return "Tomorrow";
  if (daysUntil <= 7) return `In ${daysUntil} days`;
  return null;
}

function getDaysUntilBirthdayNumber(birthDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const birth = new Date(birthDate);
  const nextBirthday = new Date(
    today.getFullYear(),
    birth.getMonth(),
    birth.getDate()
  );

  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }

  const diffTime = nextBirthday - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getNextBirthday(birthDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const birth = new Date(birthDate);
  const nextBirthday = new Date(
    today.getFullYear(),
    birth.getMonth(),
    birth.getDate()
  );

  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }

  return nextBirthday;
}

// Calculate age
function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age > 0 ? age : null;
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { month: "long", day: "numeric", year: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

// Filter birthdays
function filterBirthdays(searchTerm) {
  const filtered = allBirthdays.filter((birthday) => {
    return (
      birthday.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (birthday.email &&
        birthday.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (birthday.phone && birthday.phone.includes(searchTerm))
    );
  });

  renderBirthdays(filtered);
}

// Switch view
function switchView(view) {
  currentView = view;

  document
    .getElementById("tableViewBtn")
    .classList.toggle("active", view === "table");
  document
    .getElementById("calendarViewBtn")
    .classList.toggle("active", view === "calendar");

  if (view === "table") {
    document.getElementById("tableView").style.display = "block";
    document.getElementById("calendarView").style.display = "none";
    renderBirthdays(allBirthdays);
  } else {
    document.getElementById("tableView").style.display = "none";
    document.getElementById("calendarView").style.display = "block";
    renderCalendar();
  }
}

// Render calendar
function renderCalendar() {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  document.getElementById(
    "calendarMonth"
  ).textContent = `${monthNames[currentMonth]} ${currentYear}`;

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = new Date();

  let calendarHTML = "";

  // Day headers
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  dayNames.forEach((day) => {
    calendarHTML += `<div style="text-align: center; font-weight: 600; color: #7f8c8d; padding: 8px;">${day}</div>`;
  });

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    calendarHTML += "<div></div>";
  }

  // Days
  for (let day = 1; day <= daysInMonth; day++) {
    const hasBirthday = allBirthdays.some((b) => {
      const birthDate = new Date(b.birth_date);
      return (
        birthDate.getMonth() === currentMonth && birthDate.getDate() === day
      );
    });

    const isToday =
      today.getDate() === day &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear;

    let className = "calendar-day";
    if (isToday) className += " today";
    else if (hasBirthday) className += " has-birthday";

    calendarHTML += `<div class="${className}" onclick="showDayBirthdays(${day})">${day}</div>`;
  }

  document.getElementById("calendarGrid").innerHTML = calendarHTML;
}

function previousMonth() {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar();
}

function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar();
}

function showDayBirthdays(day) {
  const dayBirthdays = allBirthdays.filter((b) => {
    const birthDate = new Date(b.birth_date);
    return birthDate.getMonth() === currentMonth && birthDate.getDate() === day;
  });

  const detailsDiv = document.getElementById("birthdayDetails");

  if (dayBirthdays.length === 0) {
    detailsDiv.style.display = "none";
    return;
  }

  detailsDiv.style.display = "block";
  detailsDiv.innerHTML = `
        <h4 style="margin-bottom: 16px; color: #2c3e50;">Birthdays on ${
          currentMonth + 1
        }/${day}</h4>
        ${dayBirthdays
          .map(
            (b) => `
            <div class="birthday-card">
                <div class="birthday-avatar">${b.name
                  .charAt(0)
                  .toUpperCase()}</div>
                <div class="birthday-info">
                    <h3>${b.name}</h3>
                    <div class="birthday-details">
                        ${
                          b.phone
                            ? `<i class="bi bi-phone"></i> ${b.phone}`
                            : ""
                        }
                        ${
                          b.email
                            ? `<br><i class="bi bi-envelope"></i> ${b.email}`
                            : ""
                        }
                    </div>
                </div>
                <div class="birthday-actions">
                    ${
                      b.phone
                        ? `<button class="action-btn whatsapp" onclick="openWhatsAppModal(${b.id}, '${b.name}', '${b.phone}')"><i class="bi bi-whatsapp"></i></button>`
                        : ""
                    }
                    <button class="action-btn" onclick="editBirthday(${
                      b.id
                    })"><i class="bi bi-pencil"></i></button>
                </div>
            </div>
        `
          )
          .join("")}
    `;
}

// Open add modal
function openAddModal() {
  document.getElementById("modalTitle").textContent = "Add Birthday";
  document.getElementById("birthdayForm").reset();
  document.getElementById("birthdayId").value = "";
  birthdayModal.show();
}

// Edit birthday
async function editBirthday(id) {
  const birthday = allBirthdays.find((b) => b.id === id);
  if (!birthday) return;

  document.getElementById("modalTitle").textContent = "Edit Birthday";
  document.getElementById("birthdayId").value = birthday.id;
  document.getElementById("name").value = birthday.name;
  document.getElementById("birthDate").value = birthday.birth_date;
  document.getElementById("email").value = birthday.email || "";
  document.getElementById("phone").value = birthday.phone || "";

  birthdayModal.show();
}

// Save birthday
async function saveBirthday() {
  const id = document.getElementById("birthdayId").value;
  const data = {
    name: document.getElementById("name").value,
    birth_date: document.getElementById("birthDate").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
  };

  try {
    const url = id ? `/api/birthdays/${id}` : "/api/birthdays";
    const method = id ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Failed to save birthday");

    birthdayModal.hide();
    showToast(
      id ? "Birthday updated successfully" : "Birthday added successfully",
      "success"
    );
    await loadBirthdays();
  } catch (error) {
    console.error("Error saving birthday:", error);
    showToast("Failed to save birthday", "error");
  }
}

// Delete birthday
async function deleteBirthday(id) {
  if (!confirm("Are you sure you want to delete this birthday?")) return;

  try {
    const response = await fetch(`/api/birthdays/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Failed to delete birthday");

    showToast("Birthday deleted successfully", "success");
    await loadBirthdays();
  } catch (error) {
    console.error("Error deleting birthday:", error);
    showToast("Failed to delete birthday", "error");
  }
}

// WhatsApp functionality
function openWhatsAppModal(id, name, phone) {
  document.getElementById("whatsappBirthdayId").value = id;
  document.getElementById("whatsappPhone").value = phone;
  document.getElementById(
    "whatsappRecipient"
  ).textContent = `${name} (${phone})`;

  const defaultMessage = `🎉 Happy Birthday ${name}! 🎂

Wishing you a wonderful day filled with joy and blessings!

May this year bring you:
✨ Good health and happiness
🙏 Peace and prosperity
💖 Love and success

Would love to celebrate with you at the temple and contribute to educational trusts and charitable causes in your honor.

Have a blessed birthday! 🎊`;

  document.getElementById("whatsappMessage").value = defaultMessage;
  whatsappModal.show();
}

function sendWhatsAppMessage() {
  const phone = document.getElementById("whatsappPhone").value;
  let message = document.getElementById("whatsappMessage").value;
  const name = document
    .getElementById("whatsappRecipient")
    .textContent.split("(")[0]
    .trim();

  if (!message.trim()) {
    message = `🎉 Happy Birthday ${name}! 🎂\n\nWishing you a wonderful day filled with joy and blessings!\n\nMay this year bring you:\n✨ Good health and happiness\n🙏 Peace and prosperity\n💖 Love and success\n\nWould love to celebrate with you at the temple and contribute to educational trusts and charitable causes in your honor.\n\nHave a blessed birthday! 🎊`;
  }

  const cleanPhone = phone.replace(/\D/g, "");
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  // Check if popup was blocked
  const popup = window.open(url, "_blank");

  if (!popup || popup.closed || typeof popup.closed === "undefined") {
    showToast(
      "Please allow popups for this site to send WhatsApp messages",
      "error"
    );
    // Try again with user interaction
    setTimeout(() => {
      if (
        confirm("Pop-up was blocked. Click OK to open WhatsApp in a new tab.")
      ) {
        window.open(url, "_blank");
      }
    }, 100);
  } else {
    showToast("Opening WhatsApp...", "success");
  }

  whatsappModal.hide();
}

// Send bulk WhatsApp messages
async function sendBulkWhatsAppMessages() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayBirthdays = allBirthdays.filter((b) => {
    const birthDate = new Date(b.birth_date);
    return (
      birthDate.getMonth() === today.getMonth() &&
      birthDate.getDate() === today.getDate() &&
      b.phone
    );
  });

  if (todayBirthdays.length === 0) {
    showToast("No birthdays with phone numbers today", "error");
    return;
  }

  if (
    !confirm(
      `Send birthday wishes to ${todayBirthdays.length} person(s) via WhatsApp?`
    )
  ) {
    return;
  }

  showToast(`Sending ${todayBirthdays.length} message(s)...`, "success");

  // Send messages with delay to avoid popup blocker
  for (let i = 0; i < todayBirthdays.length; i++) {
    setTimeout(() => {
      const birthday = todayBirthdays[i];
      const message = `🎉 Happy Birthday ${birthday.name}! 🎂\n\nWishing you a wonderful day filled with joy and blessings!\n\nMay this year bring you:\n✨ Good health and happiness\n🙏 Peace and prosperity\n💖 Love and success\n\nWould love to celebrate with you at the temple and contribute to educational trusts and charitable causes in your honor.\n\nHave a blessed birthday! 🎊`;
      const cleanPhone = birthday.phone.replace(/\D/g, "");
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        message
      )}`;
      window.open(url, "_blank");
    }, i * 2000); // 2 second delay between each message
  }
}

// Export data
function exportData() {
  if (allBirthdays.length === 0) {
    showToast("No data to export", "error");
    return;
  }

  const csvContent = [
    ["Name", "Birth Date", "Email", "Phone"],
    ...allBirthdays.map((b) => [
      b.name,
      b.birth_date,
      b.email || "",
      b.phone || "",
    ]),
  ]
    .map((row) => row.join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `birthdays_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);

  showToast("Data exported successfully", "success");
}

// Show toast notification
function showToast(message, type = "success") {
  const toastContainer = document.getElementById("toastContainer");
  const toastId = "toast-" + Date.now();

  const toast = document.createElement("div");
  toast.id = toastId;
  toast.className = `custom-toast toast-${type}`;
  toast.innerHTML = `
        <div class="toast-icon">
            <i class="bi bi-${
              type === "success" ? "check-circle" : "exclamation-circle"
            }"></i>
        </div>
        <div style="flex: 1;">
            <strong>${type === "success" ? "Success" : "Error"}</strong>
            <p style="margin: 0; color: #5a6c7d; font-size: 14px;">${message}</p>
        </div>
    `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideOut 0.3s ease-in";
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}
