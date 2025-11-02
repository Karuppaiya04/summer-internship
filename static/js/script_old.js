// Global variables
let birthdays = [];
let deleteId = null;
let currentView = "table";
let currentFilter = "all";
let sortColumn = null;
let sortDirection = "asc";
let currentCalendarDate = new Date();
let selectedCalendarDay = null;

// Load birthdays when page loads
document.addEventListener("DOMContentLoaded", function () {
  loadBirthdays();
  loadUpcomingBirthdays();
  initializeParticles();
  initializeScrollButton();
  loadTheme();
  initializeSorting();
  initializeFilters();

  // Add search functionality
  document
    .getElementById("searchInput")
    .addEventListener("input", filterBirthdays);

  // Reset form when modal is closed
  const addModal = document.getElementById("addBirthdayModal");
  addModal.addEventListener("hidden.bs.modal", function () {
    resetForm();
  });

  // Check for birthdays today
  checkBirthdaysToday();

  // Auto-prompt for WhatsApp wishes
  autoSendBirthdayWishes();
});

// Load all birthdays
async function loadBirthdays() {
  try {
    showLoading(true);
    const response = await fetch("/api/birthdays");
    if (!response.ok) throw new Error("Failed to load birthdays");

    birthdays = await response.json();
    updateStatistics();
    displayBirthdays(birthdays);
    showLoading(false);
  } catch (error) {
    console.error("Error:", error);
    showToast("Failed to load birthdays", "error");
    showLoading(false);
  }
}

// Display birthdays in table
function displayBirthdays(data) {
  const tbody = document.getElementById("birthdaysTableBody");

  if (data.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center empty-state">
                    <i class="bi bi-inbox"></i>
                    <p>No birthdays added yet. Click "Add Birthday" to get started!</p>
                </td>
            </tr>
        `;
    return;
  }

  tbody.innerHTML = data
    .map((birthday) => {
      const daysUntil = birthday.days_until;
      let badgeClass = "badge-future";
      let badgeText = `${daysUntil} days`;

      if (daysUntil === 0) {
        badgeClass = "badge-today";
        badgeText = "Today! 🎉";
      } else if (daysUntil <= 7) {
        badgeClass = "badge-upcoming";
        badgeText = `${daysUntil} days`;
      }

      return `
            <tr class="fade-in">
                <td><strong>${escapeHtml(birthday.name)}</strong></td>
                <td>${formatDate(birthday.birth_date)}</td>
                <td>${birthday.age} years</td>
                <td><span class="badge ${badgeClass}">${badgeText}</span></td>
                <td>${escapeHtml(birthday.email || "-")}</td>
                <td>${escapeHtml(birthday.phone || "-")}</td>
                <td>
                    ${
                      daysUntil === 0 && birthday.phone
                        ? `<button class="btn btn-sm btn-success btn-action" onclick="openWhatsAppModal(${
                            birthday.id
                          }, '${escapeHtml(birthday.name)}', '${escapeHtml(
                            birthday.phone
                          )}', ${birthday.age})" title="Send WhatsApp wish">
                        <i class="bi bi-whatsapp"></i>
                    </button>`
                        : ""
                    }
                    <button class="btn btn-sm btn-primary btn-action" onclick="editBirthday(${
                      birthday.id
                    })">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger btn-action" onclick="deleteBirthday(${
                      birthday.id
                    })">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    })
    .join("");
}

// Load upcoming birthdays (next 30 days)
async function loadUpcomingBirthdays() {
  try {
    const response = await fetch("/api/birthdays/upcoming");
    if (!response.ok) throw new Error("Failed to load upcoming birthdays");

    const upcoming = await response.json();

    if (upcoming.length > 0) {
      const upcomingAlert = document.getElementById("upcomingAlert");
      const upcomingList = document.getElementById("upcomingList");

      upcomingList.innerHTML = upcoming
        .map(
          (birthday) => `
                <div class="upcoming-item">
                    <div>
                        <strong>${escapeHtml(
                          birthday.name
                        )}</strong> - ${formatDate(birthday.birth_date)}
                    </div>
                    <span class="badge ${
                      birthday.days_until === 0
                        ? "badge-today"
                        : "badge-upcoming"
                    }">
                        ${
                          birthday.days_until === 0
                            ? "Today! 🎉"
                            : `${birthday.days_until} days`
                        }
                    </span>
                </div>
            `
        )
        .join("");

      upcomingAlert.style.display = "block";
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Save birthday (add or update)
async function saveBirthday() {
  const id = document.getElementById("birthdayId").value;
  const name = document.getElementById("name").value;
  const birthDate = document.getElementById("birthDate").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;

  if (!name || !birthDate) {
    showError("Please fill in all required fields");
    return;
  }

  const data = { name, birth_date: birthDate, email, phone };

  try {
    let response;
    if (id) {
      // Update existing birthday
      response = await fetch(`/api/birthdays/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else {
      // Add new birthday
      response = await fetch("/api/birthdays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }

    if (!response.ok) throw new Error("Failed to save birthday");

    // Close modal
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("addBirthdayModal")
    );
    modal.hide();

    // Reload data
    await loadBirthdays();
    await loadUpcomingBirthdays();

    showSuccess(
      id ? "Birthday updated successfully" : "Birthday added successfully"
    );
  } catch (error) {
    console.error("Error:", error);
    showError("Failed to save birthday");
  }
}

// Edit birthday
function editBirthday(id) {
  const birthday = birthdays.find((b) => b.id === id);
  if (!birthday) return;

  document.getElementById("birthdayId").value = birthday.id;
  document.getElementById("name").value = birthday.name;
  document.getElementById("birthDate").value = birthday.birth_date;
  document.getElementById("email").value = birthday.email || "";
  document.getElementById("phone").value = birthday.phone || "";

  document.getElementById("modalTitle").textContent = "Edit Birthday";

  const modal = new bootstrap.Modal(
    document.getElementById("addBirthdayModal")
  );
  modal.show();
}

// Delete birthday
function deleteBirthday(id) {
  deleteId = id;
  const modal = new bootstrap.Modal(document.getElementById("deleteModal"));
  modal.show();
}

// Confirm delete
async function confirmDelete() {
  if (!deleteId) return;

  try {
    const response = await fetch(`/api/birthdays/${deleteId}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete birthday");

    // Close modal
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("deleteModal")
    );
    modal.hide();

    // Reload data
    await loadBirthdays();
    await loadUpcomingBirthdays();

    showToast("Birthday deleted successfully", "success");
  } catch (error) {
    console.error("Error:", error);
    showToast("Failed to delete birthday", "error");
  } finally {
    deleteId = null;
  }
}

// Filter birthdays by search
function filterBirthdays() {
  const filtered = getFilteredBirthdays();
  if (currentView === "table") {
    displayBirthdays(filtered);
  } else {
    displayBirthdayCards(filtered);
  }
}

// Reset form
function resetForm() {
  document.getElementById("birthdayForm").reset();
  document.getElementById("birthdayId").value = "";
  document.getElementById("modalTitle").textContent = "Add Birthday";
}

// Utility functions
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

function escapeHtml(text) {
  if (!text) return "";
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function showSuccess(message) {
  showToast(message, "success");
}

function showError(message) {
  showToast("Error: " + message, "error");
}

// Toast Notification System
function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `custom-toast ${type}`;

  const icon =
    type === "success" ? "check-circle-fill" : "exclamation-circle-fill";
  toast.innerHTML = `
    <i class="bi bi-${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideInRight 0.3s ease reverse";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Update Statistics
function updateStatistics() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayCount = birthdays.filter((b) => b.days_until === 0).length;
  const weekCount = birthdays.filter((b) => b.days_until <= 7).length;
  const monthCount = birthdays.filter((b) => {
    const birthDate = new Date(b.birth_date);
    return birthDate.getMonth() === today.getMonth();
  }).length;

  document.getElementById("totalCount").textContent = birthdays.length;
  document.getElementById("todayCount").textContent = todayCount;
  document.getElementById("upcomingCount").textContent = weekCount;
  document.getElementById("monthCount").textContent = monthCount;
}

// Check for Birthdays Today
function checkBirthdaysToday() {
  setTimeout(() => {
    const todayBirthdays = birthdays.filter((b) => b.days_until === 0);
    if (todayBirthdays.length > 0) {
      createConfetti();
      document.body.classList.add("celebration-mode");
      const names = todayBirthdays.map((b) => b.name).join(", ");
      showToast(`🎉 Happy Birthday to ${names}! 🎂`, "success");
    }
  }, 1000);
}

// Confetti Animation
function createConfetti() {
  const colors = [
    "#f093fb",
    "#f5576c",
    "#4facfe",
    "#00f2fe",
    "#43e97b",
    "#38f9d7",
  ];

  for (let i = 0; i < 50; i++) {
    setTimeout(() => {
      const confetti = document.createElement("div");
      confetti.className = "confetti";
      confetti.style.left = Math.random() * 100 + "%";
      confetti.style.background =
        colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = Math.random() * 2 + "s";
      confetti.style.width = confetti.style.height =
        Math.random() * 10 + 5 + "px";
      document.body.appendChild(confetti);

      setTimeout(() => confetti.remove(), 3000);
    }, i * 50);
  }
}

// Switch View (Table/Card/Calendar)
function switchView(view) {
  currentView = view;
  const tableView = document.getElementById("tableView");
  const cardView = document.getElementById("cardView");
  const calendarView = document.getElementById("calendarView");
  const buttons = document.querySelectorAll(".view-toggle button");

  buttons.forEach((btn) => btn.classList.remove("active"));
  event.target.closest("button").classList.add("active");

  // Hide all views
  tableView.style.display = "none";
  cardView.style.display = "none";
  calendarView.style.display = "none";

  // Show selected view
  if (view === "table") {
    tableView.style.display = "block";
  } else if (view === "card") {
    cardView.style.display = "grid";
    displayBirthdayCards(getFilteredBirthdays());
  } else if (view === "calendar") {
    calendarView.style.display = "block";
    renderCalendar();
  }
}

// Display Birthday Cards
function displayBirthdayCards(data) {
  const container = document.getElementById("cardView");

  if (data.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <i class="bi bi-inbox"></i>
        <p>No birthdays found!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = data
    .map((birthday) => {
      const daysUntil = birthday.days_until;
      let badgeClass = "badge-future";
      let badgeText = `${daysUntil} days`;

      if (daysUntil === 0) {
        badgeClass = "badge-today";
        badgeText = "Today! 🎉";
      } else if (daysUntil <= 7) {
        badgeClass = "badge-upcoming";
      }

      const initials = birthday.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2);

      return `
      <div class="birthday-card">
        <div class="card-avatar">${initials}</div>
        <h4 style="text-align: center; margin-bottom: 10px;">${escapeHtml(
          birthday.name
        )}</h4>
        <p style="text-align: center; color: #666; margin-bottom: 15px;">
          <i class="bi bi-cake2"></i> ${formatDate(birthday.birth_date)}
        </p>
        <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
          <span><strong>Age:</strong> ${birthday.age}</span>
          <span class="badge ${badgeClass}">${badgeText}</span>
        </div>
        ${
          birthday.email
            ? `<p style="color: #666; font-size: 14px;"><i class="bi bi-envelope"></i> ${escapeHtml(
                birthday.email
              )}</p>`
            : ""
        }
        ${
          birthday.phone
            ? `<p style="color: #666; font-size: 14px;"><i class="bi bi-phone"></i> ${escapeHtml(
                birthday.phone
              )}</p>`
            : ""
        }
        <div style="display: flex; gap: 10px; margin-top: 15px;">
          <button class="btn btn-sm btn-primary" style="flex: 1;" onclick="editBirthday(${
            birthday.id
          })">
            <i class="bi bi-pencil"></i> Edit
          </button>
          <button class="btn btn-sm btn-danger" style="flex: 1;" onclick="deleteBirthday(${
            birthday.id
          })">
            <i class="bi bi-trash"></i> Delete
          </button>
        </div>
      </div>
    `;
    })
    .join("");
}

// Initialize Filters
function initializeFilters() {
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      currentFilter = this.dataset.filter;
      const filtered = getFilteredBirthdays();
      if (currentView === "table") {
        displayBirthdays(filtered);
      } else {
        displayBirthdayCards(filtered);
      }
    });
  });
}

// Get Filtered Birthdays
function getFilteredBirthdays() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  let filtered = birthdays.filter((birthday) =>
    birthday.name.toLowerCase().includes(searchTerm)
  );

  if (currentFilter === "today") {
    filtered = filtered.filter((b) => b.days_until === 0);
  } else if (currentFilter === "week") {
    filtered = filtered.filter((b) => b.days_until <= 7);
  } else if (currentFilter === "month") {
    const today = new Date();
    filtered = filtered.filter((b) => {
      const birthDate = new Date(b.birth_date);
      return birthDate.getMonth() === today.getMonth();
    });
  }

  return filtered;
}

// Initialize Sorting
function initializeSorting() {
  document.querySelectorAll(".sortable").forEach((th) => {
    th.addEventListener("click", function () {
      const column = this.dataset.sort;

      if (sortColumn === column) {
        sortDirection = sortDirection === "asc" ? "desc" : "asc";
      } else {
        sortColumn = column;
        sortDirection = "asc";
      }

      document.querySelectorAll(".sortable").forEach((t) => {
        t.classList.remove("asc", "desc");
      });
      this.classList.add(sortDirection);

      sortBirthdays();
    });
  });
}

// Sort Birthdays
function sortBirthdays() {
  const sorted = [...birthdays].sort((a, b) => {
    let aVal, bVal;

    switch (sortColumn) {
      case "name":
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case "birthDate":
        aVal = new Date(a.birth_date);
        bVal = new Date(b.birth_date);
        break;
      case "age":
        aVal = a.age;
        bVal = b.age;
        break;
      case "daysUntil":
        aVal = a.days_until;
        bVal = b.days_until;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  displayBirthdays(sorted);
}

// Export to CSV
function exportToCSV() {
  const headers = ["Name", "Birth Date", "Age", "Days Until", "Email", "Phone"];
  const rows = birthdays.map((b) => [
    b.name,
    b.birth_date,
    b.age,
    b.days_until,
    b.email || "",
    b.phone || "",
  ]);

  let csv = headers.join(",") + "\n";
  rows.forEach((row) => {
    csv += row.map((val) => `"${val}"`).join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "birthdays.csv";
  a.click();
  window.URL.revokeObjectURL(url);

  showToast("Exported successfully!", "success");
}

// Dark Mode Toggle
function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  const icon = document.getElementById("themeIcon");

  if (document.body.classList.contains("dark-mode")) {
    icon.className = "bi bi-sun-fill";
    localStorage.setItem("theme", "dark");
  } else {
    icon.className = "bi bi-moon-stars-fill";
    localStorage.setItem("theme", "light");
  }
}

// Load Theme
function loadTheme() {
  const theme = localStorage.getItem("theme");
  const icon = document.getElementById("themeIcon");

  if (theme === "dark") {
    document.body.classList.add("dark-mode");
    icon.className = "bi bi-sun-fill";
  }
}

// Initialize Particles
function initializeParticles() {
  const container = document.getElementById("particles");

  for (let i = 0; i < 30; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.animationDelay = Math.random() * 15 + "s";
    particle.style.width = particle.style.height =
      Math.random() * 20 + 5 + "px";
    container.appendChild(particle);
  }
}

// Scroll to Top
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// Initialize Scroll Button
function initializeScrollButton() {
  const scrollBtn = document.querySelector(".scroll-to-top");

  window.addEventListener("scroll", () => {
    if (window.pageYOffset > 300) {
      scrollBtn.classList.add("visible");
    } else {
      scrollBtn.classList.remove("visible");
    }
  });
}

// Loading Overlay
function showLoading(show) {
  let overlay = document.querySelector(".loading-overlay");

  if (show) {
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "loading-overlay";
      overlay.innerHTML = '<div class="spinner-custom"></div>';
      document.body.appendChild(overlay);
    }
  } else {
    if (overlay) overlay.remove();
  }
}

// ==================== CALENDAR FUNCTIONS ====================

// Render Calendar
function renderCalendar() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  // Update month/year display
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
    "monthYear"
  ).textContent = `${monthNames[month]} ${year}`;

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Get previous month days
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  // Create calendar grid
  let calendarHTML = "";

  // Add day names header
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  calendarHTML += '<div class="calendar-header">';
  dayNames.forEach((day) => {
    calendarHTML += `<div class="calendar-day-name">${day}</div>`;
  });
  calendarHTML += "</div>";

  // Add days
  let dayCounter = 1;
  let nextMonthCounter = 1;

  // Calculate total cells (6 rows)
  const totalCells = 42;

  for (let i = 0; i < totalCells; i++) {
    let dayNumber, currentMonth, currentYear;
    let isOtherMonth = false;

    // Previous month days
    if (i < startingDayOfWeek) {
      dayNumber = prevMonthLastDay - startingDayOfWeek + i + 1;
      currentMonth = month - 1;
      currentYear = year;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear = year - 1;
      }
      isOtherMonth = true;
    }
    // Current month days
    else if (dayCounter <= daysInMonth) {
      dayNumber = dayCounter;
      currentMonth = month;
      currentYear = year;
      dayCounter++;
    }
    // Next month days
    else {
      dayNumber = nextMonthCounter;
      currentMonth = month + 1;
      currentYear = year;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear = year + 1;
      }
      nextMonthCounter++;
      isOtherMonth = true;
    }

    // Check if this day has birthdays
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      "0"
    )}-${String(dayNumber).padStart(2, "0")}`;
    const dayBirthdays = getBirthdaysForDate(currentMonth + 1, dayNumber);

    // Check if it's today
    const today = new Date();
    const isToday =
      today.getDate() === dayNumber &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear;

    // Check if selected
    const isSelected = selectedCalendarDay === dateStr;

    // Build CSS classes
    let classes = ["calendar-day"];
    if (isOtherMonth) classes.push("other-month");
    if (isToday) classes.push("today");
    if (dayBirthdays.length > 0) classes.push("has-birthday");
    if (isSelected) classes.push("selected");

    // Build birthday indicators
    let birthdayHTML = "";
    if (dayBirthdays.length > 0) {
      if (dayBirthdays.length === 1) {
        birthdayHTML = `<div class="birthday-indicator">
          <div class="birthday-name-small">${escapeHtml(
            dayBirthdays[0].name
          )}</div>
        </div>`;
      } else {
        birthdayHTML = `<div class="birthday-count">${dayBirthdays.length}</div>`;
      }
    }

    calendarHTML += `
      <div class="${classes.join(
        " "
      )}" data-date="${dateStr}" onclick="selectCalendarDay('${dateStr}')">
        <div class="calendar-day-number">${dayNumber}</div>
        ${birthdayHTML}
      </div>
    `;
  }

  document.getElementById("calendarGrid").innerHTML = calendarHTML;
}

// Get birthdays for a specific date (month and day)
function getBirthdaysForDate(month, day) {
  return birthdays.filter((b) => {
    const birthDate = new Date(b.birth_date);
    return birthDate.getMonth() + 1 === month && birthDate.getDate() === day;
  });
}

// Select a calendar day
function selectCalendarDay(dateStr) {
  selectedCalendarDay = dateStr;

  // Parse date
  const [year, month, day] = dateStr.split("-").map(Number);
  const dayBirthdays = getBirthdaysForDate(month, day);

  // Update calendar display
  renderCalendar();

  // Show birthday details
  if (dayBirthdays.length > 0) {
    showBirthdayDetails(dateStr, dayBirthdays);
  } else {
    document.getElementById("birthdayDetails").style.display = "none";
  }
}

// Show birthday details for selected day
function showBirthdayDetails(dateStr, dayBirthdays) {
  const detailsPanel = document.getElementById("birthdayDetails");
  const detailsList = document.getElementById("birthdayDetailsList");
  const selectedDateEl = document.getElementById("selectedDate");

  // Format date
  const date = new Date(dateStr);
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  selectedDateEl.textContent = date.toLocaleDateString("en-US", options);

  // Build birthday details HTML
  let html = "";
  dayBirthdays.forEach((birthday) => {
    const daysUntil = birthday.days_until;
    let badgeClass = "badge-future";
    let badgeText = `${daysUntil} days`;

    if (daysUntil === 0) {
      badgeClass = "badge-today";
      badgeText = "Today! 🎉";
    } else if (daysUntil <= 7) {
      badgeClass = "badge-upcoming";
    }

    html += `
      <div class="birthday-detail-item">
        <div class="birthday-detail-name">
          <i class="bi bi-person-circle"></i> ${escapeHtml(birthday.name)}
        </div>
        <div class="birthday-detail-info">
          <span><i class="bi bi-cake2"></i> Age: ${birthday.age}</span>
          <span class="badge ${badgeClass}">${badgeText}</span>
          ${
            birthday.email
              ? `<span><i class="bi bi-envelope"></i> ${escapeHtml(
                  birthday.email
                )}</span>`
              : ""
          }
          ${
            birthday.phone
              ? `<span><i class="bi bi-phone"></i> ${escapeHtml(
                  birthday.phone
                )}</span>`
              : ""
          }
        </div>
        <div class="birthday-detail-actions">
          <button class="btn btn-sm btn-primary" onclick="editBirthday(${
            birthday.id
          })">
            <i class="bi bi-pencil"></i> Edit
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteBirthday(${
            birthday.id
          })">
            <i class="bi bi-trash"></i> Delete
          </button>
        </div>
      </div>
    `;
  });

  detailsList.innerHTML = html;
  detailsPanel.style.display = "block";
}

// Navigate to previous month
function previousMonth() {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
  selectedCalendarDay = null;
  document.getElementById("birthdayDetails").style.display = "none";
  renderCalendar();
}

// Navigate to next month
function nextMonth() {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
  selectedCalendarDay = null;
  document.getElementById("birthdayDetails").style.display = "none";
  renderCalendar();
}

// ==================== WHATSAPP FUNCTIONS ====================

// Open WhatsApp Modal
function openWhatsAppModal(birthdayId, name, phone, age) {
  document.getElementById("whatsappBirthdayId").value = birthdayId;
  document.getElementById("whatsappPhone").value = phone;
  document.getElementById(
    "whatsappRecipient"
  ).textContent = `${name} (${phone})`;

  // Set default message with wishes, temple plans, and donation info
  const defaultMessage = `🎉🎂 Happy ${age}th Birthday, ${name}! 🎂🎉

✨ *Birthday Wishes:*
May God bless you with health, wealth, and happiness! Wishing you a day filled with joy and a year filled with success! May all your dreams and wishes come true. 🙏🎈

🛕 *Temple Visit Plan:*
On this special day, we plan to visit the temple to offer prayers for your long life and prosperity. Your blessings mean the world to us! 🕉️

💝 *Birthday Donation:*
In honor of your birthday, we will make a donation to schools and charitable trusts to help underprivileged children receive education and support. Your special day will bring smiles to many faces! 📚🏫

Have a wonderful birthday celebration! �🎁
With love and best wishes! 💐`;
  document.getElementById("whatsappMessage").value = defaultMessage;

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("whatsappModal"));
  modal.show();
}

// Send WhatsApp Message
async function sendWhatsAppMessage() {
  const birthdayId = document.getElementById("whatsappBirthdayId").value;
  const phone = document.getElementById("whatsappPhone").value;
  const message = document.getElementById("whatsappMessage").value;
  const recipient = document.getElementById("whatsappRecipient").textContent;

  try {
    // Get birthday details
    const birthday = birthdays.find((b) => b.id === parseInt(birthdayId));

    if (!birthday) {
      showToast("Birthday not found", "error");
      return;
    }

    const response = await fetch("/api/send-whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: phone,
        name: birthday.name,
        age: birthday.age,
        message: message,
      }),
    });

    const result = await response.json();

    if (result.success) {
      // Close modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("whatsappModal")
      );
      modal.hide();

      // Open WhatsApp in new tab - try multiple methods to avoid pop-up blocker
      const newWindow = window.open(result.url, "_blank");

      // Check if popup was blocked
      if (
        !newWindow ||
        newWindow.closed ||
        typeof newWindow.closed == "undefined"
      ) {
        // Popup blocked - show alert with link
        const shouldCopy = confirm(
          `Pop-up blocker prevented WhatsApp from opening!\n\n` +
            `Click OK to copy the link and open it manually.`
        );

        if (shouldCopy) {
          // Try to copy to clipboard
          navigator.clipboard
            .writeText(result.url)
            .then(() => {
              showToast("Link copied! Opening WhatsApp...", "success");
              window.location.href = result.url;
            })
            .catch(() => {
              // Fallback - just navigate
              window.location.href = result.url;
            });
        }
      } else {
        showToast(`WhatsApp message opened for ${birthday.name}`, "success");
      }
    } else {
      showToast("Failed to generate WhatsApp link", "error");
    }
  } catch (error) {
    console.error("Error:", error);
    showToast("Failed to send WhatsApp message", "error");
  }
}

// Send Bulk WhatsApp Messages to Today's Birthdays
async function sendBulkWhatsAppMessages() {
  try {
    showLoading(true);

    const response = await fetch("/api/send-whatsapp-bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();
    showLoading(false);

    if (result.success) {
      if (result.count === 0) {
        showToast("No birthdays today with phone numbers", "error");
        return;
      }

      // For multiple messages, open them sequentially with user clicks to avoid pop-up blocker
      if (result.count === 1) {
        // Single message - open directly
        const newWindow = window.open(result.messages[0].url, "_blank");

        if (
          !newWindow ||
          newWindow.closed ||
          typeof newWindow.closed == "undefined"
        ) {
          alert(
            "Please allow pop-ups for this site to send WhatsApp messages!"
          );
          window.location.href = result.messages[0].url;
        } else {
          showToast(
            `Opening WhatsApp for ${result.messages[0].name}!`,
            "success"
          );
        }
      } else {
        // Multiple messages - show a dialog to open them one by one
        showBulkWhatsAppDialog(result.messages);
      }
    } else {
      showToast("Failed to generate WhatsApp links", "error");
    }
  } catch (error) {
    console.error("Error:", error);
    showLoading(false);
    showToast("Failed to send bulk WhatsApp messages", "error");
  }
}

// Show bulk WhatsApp dialog - opens messages one by one
function showBulkWhatsAppDialog(messages) {
  let currentIndex = 0;

  // Show initial instruction
  alert(
    `🎉 Ready to send ${messages.length} birthday wishes!\n\n` +
      `✅ IMPORTANT: Please allow pop-ups for this site\n\n` +
      `How to allow pop-ups:\n` +
      `1. Look for the pop-up blocked icon in your address bar\n` +
      `2. Click it and select "Always allow pop-ups"\n` +
      `3. Reload if needed\n\n` +
      `Click OK to start sending messages one by one...`
  );

  function openNext() {
    if (currentIndex >= messages.length) {
      showToast(`✅ All ${messages.length} WhatsApp messages sent!`, "success");
      return;
    }

    const msg = messages[currentIndex];
    const remaining = messages.length - currentIndex;

    const shouldContinue = confirm(
      `📱 Send WhatsApp wish to ${msg.name}?\n\n` +
        `Message ${currentIndex + 1} of ${messages.length}\n` +
        `${remaining - 1} more to go after this.\n\n` +
        `Click OK to open WhatsApp`
    );

    if (shouldContinue) {
      // Open WhatsApp
      const newWindow = window.open(msg.url, "_blank");

      if (
        !newWindow ||
        newWindow.closed ||
        typeof newWindow.closed == "undefined"
      ) {
        // Popup blocked - offer alternatives
        const choice = confirm(
          `❌ Pop-up was blocked!\n\n` +
            `Please allow pop-ups, then:\n` +
            `• Click OK to try opening WhatsApp again\n` +
            `• Click Cancel to copy the link instead`
        );

        if (choice) {
          // Try again by navigating to the URL
          window.location.href = msg.url;
          return;
        } else {
          // Copy link to clipboard
          navigator.clipboard
            .writeText(msg.url)
            .then(() => {
              alert(
                `✅ Link copied for ${msg.name}!\n\nPaste it in your browser to open WhatsApp.`
              );
            })
            .catch(() => {
              alert(`Link: ${msg.url}\n\nCopy this link manually.`);
            });
        }
      }

      currentIndex++;

      // Small delay before next prompt
      setTimeout(() => {
        openNext();
      }, 800);
    } else {
      // User cancelled - ask if they want to skip or stop
      const skipOrStop = confirm(
        `Skip ${msg.name}?\n\n` +
          `• Click OK to skip and continue\n` +
          `• Click Cancel to stop sending`
      );

      if (skipOrStop) {
        currentIndex++;
        setTimeout(() => openNext(), 300);
      } else {
        showToast(
          `Stopped. Sent ${currentIndex} of ${messages.length} messages`,
          "info"
        );
      }
    }
  }

  // Start the process
  openNext();
}

// Auto-send WhatsApp wishes on page load (for today's birthdays)
function autoSendBirthdayWishes() {
  setTimeout(async () => {
    try {
      const response = await fetch("/api/birthdays/today");
      const todayBirthdays = await response.json();

      const birthdaysWithPhone = todayBirthdays.filter(
        (b) => b.phone && b.phone.trim() !== ""
      );

      if (birthdaysWithPhone.length > 0) {
        const names = birthdaysWithPhone.map((b) => b.name).join(", ");

        // Show notification with option to send wishes
        const shouldSend = confirm(
          `🎉 ${birthdaysWithPhone.length} birthday${
            birthdaysWithPhone.length > 1 ? "s" : ""
          } today: ${names}\n\n` +
            `Would you like to send WhatsApp birthday wishes?`
        );

        if (shouldSend) {
          sendBulkWhatsAppMessages();
        }
      }
    } catch (error) {
      console.error("Error checking today's birthdays:", error);
    }
  }, 2000); // Check after 2 seconds
}
