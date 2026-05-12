import { openFilePreview, openStoredFilesPreview } from "../previewModal.js";
import { saveSendWhatsAppHistory } from "../storage.js";
import { buildCleanPersonRow } from "../utils.js";


const REQUIRED_SHEETS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
  "not specified",
];

const SELECTABLE_WhatsApp_MONTHS = REQUIRED_SHEETS.filter(
  (sheet) => sheet !== "not specified"
);

let selectedWhatsAppFiles = [];
let latestWhatsAppRows = [];
let selectedWhatsAppMonths = new Set();
let selectedWhatsAppRecipientKeys = new Set();

let WhatsAppDisplayFilterMonths = new Set();
let WhatsAppDisplaySearchText = "";

let WhatsAppDraftFilterMonths = new Set();
let WhatsAppDraftSearchText = "";

let WhatsAppFormDraft = {
  hour: "19",
  minute: "00",
  message: "",
};



let selectedSendNowFiles = [];
let latestSendNowRows = [];
let excludedSendNowRecipientKeys = new Set();
let sendNowMessageDraft = "";

let sendNowSearchDraft = "";
let sendNowAppliedSearch = "";



export function initSendWhatsAppPage() {
  const fileInput = document.getElementById("WhatsAppFileInput");
  const processBtn = document.getElementById("processWhatsAppFileBtn");

  const sendNowFileInput = document.getElementById("sendNowFileInput");
  const processSendNowBtn = document.getElementById("processSendNowFileBtn");

  const modeChooser = document.getElementById("WhatsAppModeChooser");
  const schedulePanel = document.getElementById("WhatsAppSchedulePanel");
  const sendNowPanel = document.getElementById("WhatsAppSendNowPanel");

  const scheduleModeBtn = document.getElementById("WhatsAppScheduleModeBtn");
  const sendNowModeBtn = document.getElementById("WhatsAppSendNowModeBtn");

  const backToWhatsAppModesBtn = document.getElementById("backToWhatsAppModesBtn");
  const backToWhatsAppModesFromNowBtn = document.getElementById("backToWhatsAppModesFromNowBtn");

  if (fileInput) {
    fileInput.addEventListener("change", handleWhatsAppFileSelection);
  }

  if (processBtn) {
    processBtn.addEventListener("click", handleProcessWhatsAppFiles);
  }

  if (sendNowFileInput) {
  sendNowFileInput.addEventListener("change", handleSendNowFileSelection);
}

if (processSendNowBtn) {
  processSendNowBtn.addEventListener("click", handleProcessSendNowFiles);
}

  if (scheduleModeBtn) {
    scheduleModeBtn.addEventListener("click", () => {
      showWhatsAppMode("schedule");
    });
  }

if (sendNowModeBtn) {
  sendNowModeBtn.addEventListener("click", () => {
    showWhatsAppMode("sendNow");
    renderSelectedSendNowFiles();
    clearSendNowError();
    clearSendNowReport();
  });
}

  if (backToWhatsAppModesBtn) {
    backToWhatsAppModesBtn.addEventListener("click", () => {
      showWhatsAppMode("chooser");
    });
  }

  if (backToWhatsAppModesFromNowBtn) {
    backToWhatsAppModesFromNowBtn.addEventListener("click", () => {
      showWhatsAppMode("chooser");
    });
  }

  function showWhatsAppMode(mode) {
    if (modeChooser) modeChooser.classList.add("hidden");
    if (schedulePanel) schedulePanel.classList.add("hidden");
    if (sendNowPanel) sendNowPanel.classList.add("hidden");

    if (mode === "schedule" && schedulePanel) {
      schedulePanel.classList.remove("hidden");
      return;
    }

    if (mode === "sendNow" && sendNowPanel) {
      sendNowPanel.classList.remove("hidden");
      return;
    }

    if (modeChooser) {
      modeChooser.classList.remove("hidden");
    }
  }

  showWhatsAppMode("chooser");

  renderSelectedWhatsAppFiles();
  clearWhatsAppError();
  clearWhatsAppReport();
}


function handleSendNowFileSelection(event) {
  const incomingFiles = Array.from(event.target.files || []);

  if (incomingFiles.length === 0) {
    return;
  }

  incomingFiles.forEach((file) => {
    const alreadyExists = selectedSendNowFiles.some(
      (existingFile) =>
        existingFile.name === file.name &&
        existingFile.size === file.size &&
        existingFile.lastModified === file.lastModified
    );

    if (!alreadyExists) {
      selectedSendNowFiles.push(file);
    }
  });

  event.target.value = "";

  clearSendNowError();
  clearSendNowReport();
  renderSelectedSendNowFiles();
}

function renderSelectedSendNowFiles() {
  const selectedFileEl = document.getElementById("sendNowSelectedFile");
  if (!selectedFileEl) return;

  selectedFileEl.innerHTML = "";

  if (selectedSendNowFiles.length === 0) {
    return;
  }

  const listWrapper = document.createElement("div");
  listWrapper.className = "WhatsApp-selected-files-list";

  selectedSendNowFiles.forEach((file, index) => {
    const row = document.createElement("div");
    row.className = "WhatsApp-file-pill";

    const leftSide = document.createElement("div");
    leftSide.className = "WhatsApp-file-pill-left";

    const label = document.createElement("strong");
    label.textContent = `Selected file ${index + 1}: `;

    const fileName = document.createElement("span");
    fileName.textContent = file.name;
    fileName.className = "WhatsApp-file-name";
    fileName.title = "Click to preview this file";
    fileName.addEventListener("click", async () => {
      try {
        await openFilePreview(file);
      } catch (error) {
        console.error("Preview failed:", error);
      }
    });

    leftSide.appendChild(label);
    leftSide.appendChild(fileName);

    const rightSide = document.createElement("div");
    rightSide.className = "WhatsApp-file-pill-actions";

    const previewBtn = document.createElement("button");
    previewBtn.type = "button";
    previewBtn.className = "WhatsApp-small-action-btn";
    previewBtn.textContent = "Preview";
    previewBtn.addEventListener("click", async () => {
      try {
        await openFilePreview(file);
      } catch (error) {
        console.error("Preview failed:", error);
      }
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "WhatsApp-small-remove-btn";
    removeBtn.textContent = "✕";
    removeBtn.title = "Remove file";
    removeBtn.addEventListener("click", () => {
      removeSelectedSendNowFile(index);
    });

    rightSide.appendChild(previewBtn);
    rightSide.appendChild(removeBtn);

    row.appendChild(leftSide);
    row.appendChild(rightSide);
    listWrapper.appendChild(row);
  });

  selectedFileEl.appendChild(listWrapper);
}

function removeSelectedSendNowFile(indexToRemove) {
  const file = selectedSendNowFiles[indexToRemove];
  if (!file) return;

  const confirmed = confirm(`Are you sure you want to remove "${file.name}"?`);
  if (!confirmed) return;

  selectedSendNowFiles = selectedSendNowFiles.filter(
    (_, index) => index !== indexToRemove
  );

  clearSendNowError();
  clearSendNowReport();
  renderSelectedSendNowFiles();
}

function clearSendNowError() {
  const errorEl = document.getElementById("sendNowErrorLabel");
  if (!errorEl) return;

  errorEl.innerHTML = "";
  errorEl.classList.remove("show");
}

function showSendNowError(message) {
  const errorEl = document.getElementById("sendNowErrorLabel");
  if (!errorEl) return;

  errorEl.innerHTML = message;
  errorEl.classList.add("show");
}

function clearSendNowReport() {
  const reportContainer = document.getElementById("sendNowReportContainer");
  if (!reportContainer) return;

reportContainer.innerHTML = "";
latestSendNowRows = [];
excludedSendNowRecipientKeys = new Set();
sendNowMessageDraft = "";
sendNowSearchDraft = "";
sendNowAppliedSearch = "";
}

async function handleProcessSendNowFiles() {
  clearSendNowError();
  clearSendNowReport();

  if (selectedSendNowFiles.length === 0) {
    showSendNowError("Please upload at least one .xlsx file first.");
    return;
  }

  const invalidExtensionFiles = selectedSendNowFiles.filter(
    (file) => !file.name.toLowerCase().endsWith(".xlsx")
  );

  if (invalidExtensionFiles.length > 0) {
    showSendNowError(
      buildErrorListHtml([
        ...invalidExtensionFiles.map(
          (file) =>
            `File "<strong>${escapeHtml(
              file.name
            )}</strong>" is invalid because only .xlsx files are allowed.`
        ),
      ])
    );
    return;
  }

  try {
    const allRows = [];

    for (const file of selectedSendNowFiles) {
      const fileData = await readFileAsArrayBuffer(file);
      const workbook = XLSX.read(fileData, { type: "array" });

      allRows.push(...extractSendNowPhoneRowsFromAnyWorkbook(file.name, workbook));
    }

    latestSendNowRows = removeDuplicateSendNowRows(allRows);

    if (latestSendNowRows.length === 0) {
      showSendNowError(
        "No usable phone numbers were found. The system searched the uploaded file(s), but could not detect valid phone numbers."
      );
      return;
    }

    excludedSendNowRecipientKeys = new Set();
    renderSendNowReport();
  } catch (error) {
    console.error("Send Right Now processing failed:", error);
    showSendNowError(
      "Could not process the uploaded Excel file(s). Please make sure all selected files are valid .xlsx workbooks."
    );
  }
}
function extractSendNowRowsFromAnyWorkbooks(fileWorkbooks) {
  const rows = [];

  fileWorkbooks.forEach(({ fileName, workbook, isGeneratedMonthlyWorkbook }) => {
    if (isGeneratedMonthlyWorkbook) {
      const generatedRows = extractSendNowRowsFromMultipleWorkbooks([
        {
          fileName,
          workbook,
        },
      ]);

      rows.push(...generatedRows);
      return;
    }

    const randomRows = extractSendNowRowsFromRandomWorkbook(fileName, workbook);
    rows.push(...randomRows);
  });

  rows.sort((a, b) => {
    const sheetCompare = a.sheetName.localeCompare(b.sheetName);
    if (sheetCompare !== 0) return sheetCompare;

    const nameCompare = a.name.localeCompare(b.name);
    if (nameCompare !== 0) return nameCompare;

    return a.phone.localeCompare(b.phone);
  });

  return rows;
}

function extractSendNowRowsFromMultipleWorkbooks(fileWorkbooks) {
  const rows = [];

  fileWorkbooks.forEach(({ fileName, workbook }) => {
    SELECTABLE_WhatsApp_MONTHS.forEach((sheetName) => {
      const actualSheetName = workbook.SheetNames.find(
        (name) => normalizeSheetName(name) === sheetName
      );

      if (!actualSheetName) return;

      const worksheet = workbook.Sheets[actualSheetName];
const sheetRows = XLSX.utils.sheet_to_json(worksheet, { defval: ""});
      sheetRows.forEach((person, index) => {
        const name = getNameValue(person) || "Unknown";
        const dobRaw = getDobValue(person);
        const phone = getPhoneValue(person);

        if (!phone) return;

        rows.push({
          name,
          phone,
          originalDobLabel: dobRaw ? String(dobRaw) : "",
          originalDobWeekday: "",
          reminderDateLabel: "",
          reminderDateWeekday: "",
          sheetName,
          sourceFileName: fileName,
          rowNumber: index + 2,
          sortDate: new Date(),
        });
      });
    });
  });

  rows.sort((a, b) => {
    const sheetCompare = a.sheetName.localeCompare(b.sheetName);
    if (sheetCompare !== 0) return sheetCompare;

    const nameCompare = a.name.localeCompare(b.name);
    if (nameCompare !== 0) return nameCompare;

    return a.phone.localeCompare(b.phone);
  });

  return rows;
}

function extractSendNowRowsFromRandomWorkbook(fileName, workbook) {
  const rows = [];

  if (!workbook || !Array.isArray(workbook.SheetNames)) {
    return rows;
  }

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return;

    const sheetRows = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
      raw: true,
    });

    sheetRows.forEach((person, index) => {
      const normalizedPerson = {
        ...person,
        __sourceSheetName: sheetName,
      };

      const cleanResult = buildCleanPersonRow(normalizedPerson);
      const cleanedRow = cleanResult?.cleanedRow || {};

      const name = normalizeValue(cleanedRow.Name) || "Unknown";
      const dobRaw = cleanedRow["Date of Birth"];
      const phone = getFirstCleanPhoneFromCleanedRow(cleanedRow);

      if (!dobRaw || !phone) {
        return;
      }

      const parsedDob = parseDobFlexible(dobRaw);
      if (!parsedDob) {
        return;
      }

      const birthdayMonthName = SELECTABLE_WhatsApp_MONTHS[parsedDob.getMonth()];

      rows.push({
        name,
        phone,
        originalDobLabel: formatDateDDMMYYYY(parsedDob),
        originalDobWeekday: getWeekdayName(parsedDob),
        reminderDateLabel: "",
        reminderDateWeekday: "",
        sheetName: birthdayMonthName,
        sourceFileName: fileName,
        sourceSheetName: sheetName,
        rowNumber: index + 2,
        sortDate: parsedDob,
      });
    });
  });

  return rows;
}

function extractSendNowPhoneRowsFromAnyWorkbook(fileName, workbook) {
  const rows = [];

  if (!workbook || !Array.isArray(workbook.SheetNames)) {
    return rows;
  }

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return;

    const sheetRows = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
      raw: true,
    });

    sheetRows.forEach((person, index) => {
      const normalizedPerson = {
        ...person,
        __sourceSheetName: sheetName,
      };

      const cleanResult = buildCleanPersonRow(normalizedPerson);
      const cleanedRow = cleanResult?.cleanedRow || {};

      const name = normalizeValue(cleanedRow.Name) || "Unknown";
      const phones = getAllCleanPhonesFromCleanedRow(cleanedRow);

      phones.forEach((phone, phoneIndex) => {
        rows.push({
          name,
          phone,
          sourceFileName: fileName,
          sourceSheetName: sheetName,
          rowNumber: index + 2,
          phoneIndex: phoneIndex + 1,
          originalDobLabel: cleanedRow["Date of Birth"] || "",
          sheetName: "send right now",
          sortDate: new Date(),
        });
      });
    });
  });

  return rows;
}

function getAllCleanPhonesFromCleanedRow(cleanedRow) {
  return Object.keys(cleanedRow || {})
    .filter((key) => String(key || "").startsWith("Phone Number "))
    .map((key) => normalizeValue(cleanedRow[key]))
    .filter(Boolean);
}

function removeDuplicateSendNowRows(rows) {
  const seen = new Set();

  return rows.filter((row) => {
    const key = `${normalizeValue(row.phone)}__${normalizeValue(row.name)}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function renderSendNowReport() {
  const container = document.getElementById("sendNowReportContainer");
  if (!container) return;

  const visibleRows = getVisibleSendNowRows();
  const finalRows = getSendNowFinalRows();

  const peopleHtml =
    visibleRows.length > 0
      ? visibleRows
          .map((row) => {
            const key = getSendNowRecipientKey(row);
            const isExcluded = excludedSendNowRecipientKeys.has(key);

            return `
              <div class="WhatsApp-report-card send-now-person-card ${
                isExcluded ? "send-now-excluded" : ""
              }">
                <div>
                  <h3>${escapeHtml(row.name)}</h3>
                  <p><strong>Phone:</strong> ${escapeHtml(row.phone)}</p>
                  ${
                    row.originalDobLabel
                      ? `<p><strong>DOB detected:</strong> ${escapeHtml(row.originalDobLabel)}</p>`
                      : ""
                  }
                  <p><strong>Source file:</strong> ${escapeHtml(row.sourceFileName)}</p>
                  ${
                    row.sourceSheetName
                      ? `<p><strong>Original sheet:</strong> ${escapeHtml(row.sourceSheetName)}</p>`
                      : ""
                  }
                  <p><strong>Original row:</strong> ${escapeHtml(row.rowNumber)}</p>
                </div>

                <button
                  type="button"
                  class="WhatsApp-toolbar-btn ${
                    isExcluded ? "WhatsApp-toolbar-btn-secondary" : ""
                  }"
                  data-send-now-recipient-key="${escapeHtml(key)}"
                >
                  ${isExcluded ? "Include again" : "Remove"}
                </button>
              </div>
            `;
          })
          .join("")
      : `
        <div class="empty-state WhatsApp-empty-selection-state">
          <strong>No people match this search.</strong>
          <p>Try another name, phone number, file name, or sheet name.</p>
        </div>
      `;

  container.innerHTML = `
    <div class="WhatsApp-summary-box">
      <h2>Send Right Now Report</h2>
      <p>
        The system scanned the uploaded file(s), detected phone numbers, and listed them below.
        Date of birth is ignored in this mode.
      </p>
      <p class="WhatsApp-summary-note">
        This action will be saved with the current date and current time.
      </p>
    </div>

    <div class="WhatsApp-filtered-summary-box">
      <p>
        Total detected numbers:
        <strong>${latestSendNowRows.length}</strong>
      </p>
      <p>
        Removed people:
        <strong>${excludedSendNowRecipientKeys.size}</strong>
      </p>
      <p>
        Final recipients:
        <strong>${finalRows.length}</strong>
      </p>
    </div>

    <div class="WhatsApp-demo-filter-box">
      <div class="WhatsApp-demo-filter-header">
        <div>
          <h3>Search the list</h3>
          <p>
            Search by name, phone number, file name, or sheet name. This only changes what you see below.
          </p>
        </div>

        <button type="button" id="sendNowClearSearchBtn" class="WhatsApp-toolbar-btn WhatsApp-toolbar-btn-secondary">
          Clear Search
        </button>
      </div>

      <div class="WhatsApp-demo-search-row">
        <label class="send-WhatsApp-label" for="sendNowSearchInput">
          Search
        </label>

        <input
          id="sendNowSearchInput"
          type="text"
          class="WhatsApp-demo-search-input"
          placeholder="Example: Mia, 96135, Book1, Sheet1..."
          value="${escapeHtml(sendNowSearchDraft)}"
        />
      </div>

      <div class="WhatsApp-demo-filter-actions">
        <button type="button" id="sendNowApplySearchBtn" class="WhatsApp-toolbar-btn">
          Apply Search
        </button>
      </div>

      <div class="WhatsApp-demo-filter-result">
        Showing <strong>${visibleRows.length}</strong> number(s) from
        <strong>${latestSendNowRows.length}</strong> detected number(s).
        Final recipients still remain <strong>${finalRows.length}</strong>.
      </div>
    </div>

    <div class="WhatsApp-report-grid send-now-people-grid">
      ${peopleHtml}
    </div>

    <div class="WhatsApp-form-box">
      <label class="send-WhatsApp-label" for="sendNowWhatsAppTextArea">
        The text going to be sent is:
      </label>

      <textarea
        id="sendNowWhatsAppTextArea"
        class="WhatsApp-textarea"
        placeholder="Write the WhatsApp message here..."
      >${escapeHtml(sendNowMessageDraft)}</textarea>

      <button
        id="finalSendNowWhatsAppBtn"
        type="button"
        title="Click to save this send-right-now WhatsApp action into history."
      >
        Send Right Now
      </button>

      <div id="sendNowSendErrorLabel" class="WhatsApp-error-label WhatsApp-send-error-label"></div>
    </div>
  `;

  attachSendNowSearchEvents();
  attachSendNowExcludeEvents();
  attachSendNowMessageEvent();
  attachFinalSendNowEvent();
}

function attachSendNowSearchEvents() {
  const searchInput = document.getElementById("sendNowSearchInput");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      collectSendNowMessageDraft();
      sendNowSearchDraft = searchInput.value || "";
    });
  }

  const applyBtn = document.getElementById("sendNowApplySearchBtn");
  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      collectSendNowMessageDraft();
      sendNowAppliedSearch = sendNowSearchDraft;
      renderSendNowReport();
    });
  }

  const clearBtn = document.getElementById("sendNowClearSearchBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      collectSendNowMessageDraft();
      sendNowSearchDraft = "";
      sendNowAppliedSearch = "";
      renderSendNowReport();
    });
  }
}

function getVisibleSendNowRows() {
  const search = normalizeValue(sendNowAppliedSearch).toLowerCase();

  if (!search) {
    return latestSendNowRows;
  }

  return latestSendNowRows.filter((row) => {
    const searchableText = [
      row.name,
      row.phone,
      row.sourceFileName,
      row.sourceSheetName,
      row.originalDobLabel,
      row.rowNumber,
    ]
      .map((value) => normalizeValue(value).toLowerCase())
      .join(" ");

    return searchableText.includes(search);
  });
}

// function attachSendNowSheetEvents() {
//   document.querySelectorAll("[data-send-now-sheet]").forEach((button) => {
//     button.addEventListener("click", () => {
//       const sheet = normalizeSheetName(button.dataset.sendNowSheet || "");
//       const counts = getSheetCounts(latestSendNowRows);

//       if (!sheet || !SELECTABLE_WhatsApp_MONTHS.includes(sheet)) return;
//       if ((counts[sheet] || 0) === 0) return;

//       collectSendNowMessageDraft();
//       selectedSendNowSheet = sheet;
//       excludedSendNowRecipientKeys = new Set();
//       renderSendNowReport();
//     });
//   });
// }

function attachSendNowExcludeEvents() {
  document.querySelectorAll("[data-send-now-recipient-key]").forEach((button) => {
    button.addEventListener("click", () => {
      collectSendNowMessageDraft();

      const key = button.dataset.sendNowRecipientKey || "";
      if (!key) return;

      if (excludedSendNowRecipientKeys.has(key)) {
        excludedSendNowRecipientKeys.delete(key);
      } else {
        excludedSendNowRecipientKeys.add(key);
      }

      renderSendNowReport();
    });
  });
}

function attachSendNowMessageEvent() {
  const textarea = document.getElementById("sendNowWhatsAppTextArea");
  if (!textarea) return;

  textarea.addEventListener("input", collectSendNowMessageDraft);
}

function attachFinalSendNowEvent() {
  const sendBtn = document.getElementById("finalSendNowWhatsAppBtn");
  if (!sendBtn) return;

  sendBtn.addEventListener("click", () => {
    collectSendNowMessageDraft();

    const finalRows = getSendNowFinalRows();

    if (finalRows.length === 0) {
      showSendNowInlineError(
        "No recipients are selected. Please include at least one person."
      );
      return;
    }

    if (!sendNowMessageDraft.trim()) {
      showSendNowInlineError("Please write the WhatsApp message before sending.");
      return;
    }

    clearSendNowInlineError();

    const currentDateTime = getLebanonCurrentDateTimeLabels();

    const confirmed = confirm(
      `Are you sure you want to send this WhatsApp message right now to ${finalRows.length} people?`
    );

    if (!confirmed) return;

    const fromNumber = "+96170000000"; // replace later with your real connected number

    saveSendWhatsAppHistory({
      mode: "sendNow",
      fileName:
        selectedSendNowFiles.length === 1
          ? selectedSendNowFiles[0].name
          : `${selectedSendNowFiles.length} files merged`,
      selectedMonths: ["Send Right Now"],
      fromNumber,
      recipients: getDetailedRecipients(finalRows),
      messageText: sendNowMessageDraft.trim(),
      sendDateLabel: currentDateTime.dateLabel,
      sendTimeLabel: currentDateTime.timeLabel,
    });

    alert("Send Right Now WhatsApp action was saved in history successfully.");
  });
}

function collectSendNowMessageDraft() {
  const textarea = document.getElementById("sendNowWhatsAppTextArea");
  sendNowMessageDraft = textarea ? textarea.value : sendNowMessageDraft;
}

function getSendNowSelectedSheetRows() {
  return latestSendNowRows;
}

function getSendNowFinalRows() {
  return latestSendNowRows.filter(
    (row) => !excludedSendNowRecipientKeys.has(getSendNowRecipientKey(row))
  );
}

function getSendNowRecipientKey(row) {
  return `${row.sourceFileName || ""}__${row.sourceSheetName || ""}__${
    row.rowNumber || ""
  }__${row.phoneIndex || ""}__${row.phone || ""}`;
}

function showSendNowInlineError(message) {
  const errorEl = document.getElementById("sendNowSendErrorLabel");
  if (!errorEl) return;

  errorEl.textContent = message;
  errorEl.classList.add("show");
}

function clearSendNowInlineError() {
  const errorEl = document.getElementById("sendNowSendErrorLabel");
  if (!errorEl) return;

  errorEl.textContent = "";
  errorEl.classList.remove("show");
}

function getLebanonCurrentDateTimeLabels() {
  const now = new Date();

  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Beirut",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(now);

  const timeLabel = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Beirut",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  return {
    dateLabel,
    timeLabel: `${timeLabel} Lebanon time`,
  };
}

function getLebanonTodayDateLabel() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Beirut",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}





function handleWhatsAppFileSelection(event) {
  const incomingFiles = Array.from(event.target.files || []);

  if (incomingFiles.length === 0) {
    return;
  }

  incomingFiles.forEach((file) => {
    const alreadyExists = selectedWhatsAppFiles.some(
      (existingFile) =>
        existingFile.name === file.name &&
        existingFile.size === file.size &&
        existingFile.lastModified === file.lastModified
    );

    if (!alreadyExists) {
      selectedWhatsAppFiles.push(file);
    }
  });

  event.target.value = "";

  clearWhatsAppError();
  clearWhatsAppReport();
  renderSelectedWhatsAppFiles();
}

function renderSelectedWhatsAppFiles() {
  const selectedFileEl = document.getElementById("WhatsAppSelectedFile");
  if (!selectedFileEl) return;

  selectedFileEl.innerHTML = "";

  if (selectedWhatsAppFiles.length === 0) {
    return;
  }

  const listWrapper = document.createElement("div");
  listWrapper.className = "WhatsApp-selected-files-list";

  selectedWhatsAppFiles.forEach((file, index) => {
    const row = document.createElement("div");
    row.className = "WhatsApp-file-pill";

    const leftSide = document.createElement("div");
    leftSide.className = "WhatsApp-file-pill-left";

    const label = document.createElement("strong");
    label.textContent = `Selected file ${index + 1}: `;

    const fileName = document.createElement("span");
    fileName.textContent = file.name;
    fileName.className = "WhatsApp-file-name";
    fileName.title = "Click to preview this file";
    fileName.addEventListener("click", async () => {
      try {
        await openFilePreview(file);
      } catch (error) {
        console.error("Preview failed:", error);
      }
    });

    leftSide.appendChild(label);
    leftSide.appendChild(fileName);

    const rightSide = document.createElement("div");
    rightSide.className = "WhatsApp-file-pill-actions";

    const previewBtn = document.createElement("button");
    previewBtn.type = "button";
    previewBtn.className = "WhatsApp-small-action-btn";
    previewBtn.textContent = "Preview";
    previewBtn.addEventListener("click", async () => {
      try {
        await openFilePreview(file);
      } catch (error) {
        console.error("Preview failed:", error);
      }
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "WhatsApp-small-remove-btn";
    removeBtn.textContent = "✕";
    removeBtn.title = "Remove file";
    removeBtn.addEventListener("click", () => {
      removeSelectedWhatsAppFile(index);
    });

    rightSide.appendChild(previewBtn);
    rightSide.appendChild(removeBtn);

    row.appendChild(leftSide);
    row.appendChild(rightSide);
    listWrapper.appendChild(row);
  });

  if (selectedWhatsAppFiles.length > 1) {
    const previewAllBtn = document.createElement("button");
    previewAllBtn.type = "button";
    previewAllBtn.className = "WhatsApp-preview-all-btn";
    previewAllBtn.textContent = "Preview All Files";
    previewAllBtn.addEventListener("click", async () => {
      try {
        const storedFiles = await Promise.all(
          selectedWhatsAppFiles.map((file) => convertLiveFileToStoredPreviewFile(file))
        );
        openStoredFilesPreview(storedFiles, "Selected WhatsApp Files Preview");
      } catch (error) {
        console.error("Preview all failed:", error);
      }
    });

    selectedFileEl.appendChild(previewAllBtn);
  }

  selectedFileEl.appendChild(listWrapper);
}

function removeSelectedWhatsAppFile(indexToRemove) {
  const file = selectedWhatsAppFiles[indexToRemove];
  if (!file) return;

  const confirmed = confirm(`Are you sure you want to remove "${file.name}"?`);
  if (!confirmed) return;

  selectedWhatsAppFiles = selectedWhatsAppFiles.filter((_, index) => index !== indexToRemove);

  clearWhatsAppError();
  clearWhatsAppReport();
  renderSelectedWhatsAppFiles();
}

function clearWhatsAppError() {
  const errorEl = document.getElementById("WhatsAppErrorLabel");
  if (!errorEl) return;

  errorEl.innerHTML = "";
  errorEl.classList.remove("show");
}

function showWhatsAppError(message) {
  const errorEl = document.getElementById("WhatsAppErrorLabel");
  if (!errorEl) return;

  errorEl.innerHTML = message;
  errorEl.classList.add("show");
}

function clearWhatsAppReport() {
  const reportContainer = document.getElementById("WhatsAppReportContainer");
  if (!reportContainer) return;

  reportContainer.innerHTML = "";
latestWhatsAppRows = [];
selectedWhatsAppMonths = new Set();
selectedWhatsAppRecipientKeys = new Set();
WhatsAppDisplayFilterMonths = new Set();
WhatsAppDisplaySearchText = "";

WhatsAppDraftFilterMonths = new Set();
WhatsAppDraftSearchText = "";

WhatsAppFormDraft = {
  hour: "19",
  minute: "00",
  message: "",
};
}

async function handleProcessWhatsAppFiles() {
  clearWhatsAppError();
  clearWhatsAppReport();

  if (selectedWhatsAppFiles.length === 0) {
    showWhatsAppError("Please upload at least one .xlsx file first.");
    return;
  }

  const invalidExtensionFiles = selectedWhatsAppFiles.filter(
    (file) => !file.name.toLowerCase().endsWith(".xlsx")
  );

  if (invalidExtensionFiles.length > 0) {
    showWhatsAppError(
      buildErrorListHtml([
        ...invalidExtensionFiles.map(
          (file) =>
            `File "<strong>${escapeHtml(
              file.name
            )}</strong>" is invalid because only .xlsx files are allowed.`
        ),
      ])
    );
    return;
  }

  try {
    const fileProcessingResults = [];

    for (const file of selectedWhatsAppFiles) {
      const fileData = await readFileAsArrayBuffer(file);
      const workbook = XLSX.read(fileData, { type: "array" });

      fileProcessingResults.push({
        file,
        workbook,
        isGeneratedMonthlyWorkbook: isGeneratedMonthlyWhatsAppWorkbook(workbook),
      });
    }

    const mergedRows = extractWhatsAppRowsFromAnyWorkbooks(
      fileProcessingResults.map((result) => ({
        fileName: result.file.name,
        workbook: result.workbook,
        isGeneratedMonthlyWorkbook: result.isGeneratedMonthlyWorkbook,
      }))
    );

    if (mergedRows.length === 0) {
      showWhatsAppError(
        "No usable people were found. The system searched the uploaded file(s), but could not find enough valid rows containing a date of birth and phone number."
      );
      return;
    }

    latestWhatsAppRows = mergedRows;
    initializeSelectedWhatsAppMonths(mergedRows);
    initializeSelectedWhatsAppRecipients(mergedRows);
    renderWhatsAppReport(mergedRows, selectedWhatsAppFiles.length);
  } catch (error) {
    console.error("Send WhatsApp processing failed:", error);
    showWhatsAppError(
      "Could not process the uploaded Excel file(s). Please make sure all selected files are valid .xlsx workbooks."
    );
  }
}

function validateWorkbookStructure(workbook, fileName = "Unknown file") {
  const originalSheetNames = Array.isArray(workbook?.SheetNames)
    ? workbook.SheetNames
    : [];

  const normalizedSheetNames = originalSheetNames.map(normalizeSheetName);
  const uniqueSheets = [...new Set(normalizedSheetNames)];

  const missingSheets = REQUIRED_SHEETS.filter(
    (requiredSheet) => !uniqueSheets.includes(requiredSheet)
  );

  if (missingSheets.length > 0) {
    return {
      isValid: false,
      message:
        `File "<strong>${escapeHtml(
          fileName
        )}</strong>" cannot be submitted because it does not contain all required sheets.<br>` +
        `Missing sheet(s): <strong>${missingSheets.join(", ")}</strong>.<br>` +
        `Required sheets are: January, February, March, April, May, June, July, August, September, October, November, December, Not Specified.`,
    };
  }

  if (uniqueSheets.length !== 13) {
    return {
      isValid: false,
      message:
        `File "<strong>${escapeHtml(
          fileName
        )}</strong>" cannot be submitted because it must contain exactly 13 sheets: January to December and Not Specified.`,
    };
  }

  const extraSheets = uniqueSheets.filter(
    (sheet) => !REQUIRED_SHEETS.includes(sheet)
  );

  if (extraSheets.length > 0) {
    return {
      isValid: false,
      message:
        `File "<strong>${escapeHtml(
          fileName
        )}</strong>" cannot be submitted because it contains unexpected sheet(s): <strong>${extraSheets.join(
          ", "
        )}</strong>.`,
    };
  }

  return {
    isValid: true,
    message: "",
  };
}

function isGeneratedMonthlyWhatsAppWorkbook(workbook) {
  const originalSheetNames = Array.isArray(workbook?.SheetNames)
    ? workbook.SheetNames
    : [];

  const normalizedSheetNames = originalSheetNames.map(normalizeSheetName);
  const uniqueSheets = [...new Set(normalizedSheetNames)];

  const hasAllRequiredSheets = REQUIRED_SHEETS.every((requiredSheet) =>
    uniqueSheets.includes(requiredSheet)
  );

  const hasOnlyRequiredSheets = uniqueSheets.every((sheet) =>
    REQUIRED_SHEETS.includes(sheet)
  );

  return hasAllRequiredSheets && hasOnlyRequiredSheets;
}

function extractWhatsAppRowsFromAnyWorkbooks(fileWorkbooks) {
  const rows = [];

  fileWorkbooks.forEach(({ fileName, workbook, isGeneratedMonthlyWorkbook }) => {
    if (isGeneratedMonthlyWorkbook) {
      const generatedRows = extractWhatsAppRowsFromMultipleWorkbooks([
        {
          fileName,
          workbook,
        },
      ]);

      rows.push(...generatedRows);
      return;
    }

    const randomRows = extractWhatsAppRowsFromRandomWorkbook(fileName, workbook);
    rows.push(...randomRows);
  });

  rows.sort((a, b) => {
    const dateCompare = a.sortDate - b.sortDate;
    if (dateCompare !== 0) return dateCompare;

    const nameCompare = a.name.localeCompare(b.name);
    if (nameCompare !== 0) return nameCompare;

    return a.sourceFileName.localeCompare(b.sourceFileName);
  });

  return rows;
}

function extractWhatsAppRowsFromMultipleWorkbooks(fileWorkbooks) {
  const rows = [];
  const currentYear = new Date().getFullYear();

  fileWorkbooks.forEach(({ fileName, workbook }) => {
    REQUIRED_SHEETS.forEach((requiredSheetName) => {
      const actualSheetName = workbook.SheetNames.find(
        (sheetName) => normalizeSheetName(sheetName) === requiredSheetName
      );

      if (!actualSheetName) {
        return;
      }

      const worksheet = workbook.Sheets[actualSheetName];
const sheetRows = XLSX.utils.sheet_to_json(worksheet, { defval: ""});
      sheetRows.forEach((person, index) => {
        const name = getNameValue(person);
        const dobRaw = getDobValue(person);
        const phone = getPhoneValue(person);

        const isMissingPhoneOrDob = !dobRaw || !phone;
        const isNotSpecifiedSheet = requiredSheetName === "not specified";

        if (isNotSpecifiedSheet) {
          rows.push({
            name: name || "Unknown",
            phone: phone || "",
            originalDobLabel: dobRaw || "Missing DOB",
            originalDobWeekday: "",
            reminderDateLabel: "",
            reminderDateWeekday: "",
            sheetName: "not specified",
            sourceFileName: fileName,
            rowNumber: index + 2,
            sortDate: new Date(9999, 0, 1),
          });

          return;
        }

        if (!name && !isMissingPhoneOrDob) {
          return;
        }

        if (isMissingPhoneOrDob) {
          rows.push({
            name: name || "Unknown",
            phone: phone || "",
            originalDobLabel: dobRaw || "Missing DOB",
            originalDobWeekday: "",
            reminderDateLabel: "",
            reminderDateWeekday: "",
            sheetName: "not specified",
            sourceFileName: fileName,
            rowNumber: index + 2,
            sortDate: new Date(9999, 0, 1),
          });

          return;
        }

        const parsedDob = parseDobFlexible(dobRaw);
        if (!parsedDob) {
          rows.push({
            name: name || "Unknown",
            phone: phone || "",
            originalDobLabel: dobRaw || "Invalid DOB",
            originalDobWeekday: "",
            reminderDateLabel: "",
            reminderDateWeekday: "",
            sheetName: "not specified",
            sourceFileName: fileName,
            rowNumber: index + 2,
            sortDate: new Date(9999, 0, 1),
          });

          return;
        }

        const originalDobLabel = formatDateDDMMYYYY(parsedDob);
        const originalDobWeekday = getWeekdayName(parsedDob);

        const reminderDate = getReminderDateThirtyDaysBefore(
          parsedDob.getDate(),
          parsedDob.getMonth() + 1,
          currentYear
        );

        rows.push({
          name,
          phone,
          originalDobLabel,
          originalDobWeekday,
          reminderDateLabel: formatDateDDMMYYYY(reminderDate),
          reminderDateWeekday: getWeekdayName(reminderDate),
          sheetName: requiredSheetName,
          sourceFileName: fileName,
          rowNumber: index + 2,
          sortDate: reminderDate,
        });
      });
    });
  });

  rows.sort((a, b) => {
    const dateCompare = a.sortDate - b.sortDate;
    if (dateCompare !== 0) return dateCompare;

    const nameCompare = a.name.localeCompare(b.name);
    if (nameCompare !== 0) return nameCompare;

    return a.sourceFileName.localeCompare(b.sourceFileName);
  });

  return rows;
}

function extractWhatsAppRowsFromRandomWorkbook(fileName, workbook) {
  const rows = [];
  const currentYear = new Date().getFullYear();

  if (!workbook || !Array.isArray(workbook.SheetNames)) {
    return rows;
  }

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return;

    const sheetRows = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
      raw: true,
    });

    sheetRows.forEach((person, index) => {
      const normalizedPerson = {
        ...person,
        __sourceSheetName: sheetName,
      };

      const cleanResult = buildCleanPersonRow(normalizedPerson);
      const cleanedRow = cleanResult?.cleanedRow || {};

      const name = normalizeValue(cleanedRow.Name);
      const dobRaw = cleanedRow["Date of Birth"];
      const phone = getFirstCleanPhoneFromCleanedRow(cleanedRow);

      if (!dobRaw || !phone) {
        return;
      }

      const parsedDob = parseDobFlexible(dobRaw);
      if (!parsedDob) {
        return;
      }

      const originalDobLabel = formatDateDDMMYYYY(parsedDob);
      const originalDobWeekday = getWeekdayName(parsedDob);

      const birthdayMonthName = SELECTABLE_WhatsApp_MONTHS[parsedDob.getMonth()];

      const reminderDate = getReminderDateThirtyDaysBefore(
        parsedDob.getDate(),
        parsedDob.getMonth() + 1,
        currentYear
      );

      rows.push({
        name: name || "Unknown",
        phone,
        originalDobLabel,
        originalDobWeekday,
        reminderDateLabel: formatDateDDMMYYYY(reminderDate),
        reminderDateWeekday: getWeekdayName(reminderDate),
        sheetName: birthdayMonthName,
        sourceFileName: fileName,
        sourceSheetName: sheetName,
        rowNumber: index + 2,
        sortDate: reminderDate,
      });
    });
  });

  return rows;
}

function initializeSelectedWhatsAppMonths(rows) {
  const counts = getSheetCounts(rows);
  selectedWhatsAppMonths = new Set();

  SELECTABLE_WhatsApp_MONTHS.forEach((month) => {
    if ((counts[month] || 0) > 0) {
      selectedWhatsAppMonths.add(month);
    }
  });
}


function initializeSelectedWhatsAppRecipients(rows) {
  selectedWhatsAppRecipientKeys = new Set();

  rows.forEach((row) => {
    if (!selectedWhatsAppMonths.has(row.sheetName)) return;
    if (!row.phone) return;

    selectedWhatsAppRecipientKeys.add(getWhatsAppRecipientKey(row));
  });
}

function addMonthPeopleToSelection(month) {
  latestWhatsAppRows.forEach((row) => {
    if (row.sheetName !== month) return;
    if (!row.phone) return;

    selectedWhatsAppRecipientKeys.add(getWhatsAppRecipientKey(row));
  });
}

function removeMonthPeopleFromSelection(month) {
  latestWhatsAppRows.forEach((row) => {
    if (row.sheetName !== month) return;

    selectedWhatsAppRecipientKeys.delete(getWhatsAppRecipientKey(row));
  });
}

function getRowsInsideSelectedWhatsAppMonths() {
  if (selectedWhatsAppMonths.size === 0) {
    return [];
  }

  return latestWhatsAppRows.filter((row) => selectedWhatsAppMonths.has(row.sheetName));
}

function getWhatsAppRecipientKey(row) {
  return `${row.sourceFileName || ""}__${row.sheetName || ""}__${
    row.rowNumber || ""
  }__${row.phone || ""}`;
}

function renderWhatsAppReport(rows, filesCount = 1) {
  const container = document.getElementById("WhatsAppReportContainer");
  if (!container) return;

const groupedCounts = getSheetCounts(rows);
const selectedMonthRows = getRowsInsideSelectedWhatsAppMonths();
const visibleRows = getVisibleWhatsAppRowsForDemo();
const filteredRows = getFilteredWhatsAppRows();
const filteredRecipients = getUniqueRecipients(filteredRows);
const notSelectedPeopleCount = Math.max(
  selectedMonthRows.length - filteredRows.length,
  0
);

  const countsHtml = REQUIRED_SHEETS.map((sheetName) => {
    const count = groupedCounts[sheetName] || 0;
    const isSelectable = SELECTABLE_WhatsApp_MONTHS.includes(sheetName);
    const isSelected = selectedWhatsAppMonths.has(sheetName);

    return `
      <button
        type="button"
        class="WhatsApp-month-count-box ${
          isSelectable ? "WhatsApp-month-selectable" : "WhatsApp-month-disabled"
        } ${isSelected ? "selected" : ""}"
        data-WhatsApp-month="${escapeHtml(sheetName)}"
        ${isSelectable ? "" : "disabled"}
        title="${
          isSelectable
            ? "Click to select or unselect this month"
            : "Not Specified is informational only and cannot be selected for WhatsApp sending"
        }"
      >
        <strong>${toDisplaySheetName(sheetName)}</strong>
        <span>${count} ${count === 1 ? "person" : "people"}</span>
        ${
          isSelectable
            ? `<small>${isSelected ? "Selected for sending" : "Not selected"}</small>`
            : `<small>Informational only</small>`
        }
      </button>
    `;
  }).join("");

const reportCardsHtml =
    visibleRows.length > 0
      ? visibleRows
          .map((row) => {
            const key = getWhatsAppRecipientKey(row);
            const isSelectedPerson = selectedWhatsAppRecipientKeys.has(key);

            return `
              <div class="WhatsApp-report-card scheduled-person-card ${
                isSelectedPerson ? "" : "scheduled-person-not-selected"
              }">
                <div>
                  <h3>${escapeHtml(row.name)}</h3>
                  <p><strong>Phone:</strong> ${escapeHtml(row.phone || "No phone")}</p>
<p><strong>Source file:</strong> ${escapeHtml(row.sourceFileName)}</p>
${
  row.sourceSheetName
    ? `<p><strong>Original sheet:</strong> ${escapeHtml(row.sourceSheetName)}</p>`
    : ""
}                  <p><strong>Sheet:</strong> ${escapeHtml(
                    toDisplaySheetName(row.sheetName)
                  )}</p>
                  <p>
                    <strong>Date of birth:</strong>
                    ${escapeHtml(row.originalDobWeekday)} - ${escapeHtml(
              row.originalDobLabel
            )}
                  </p>
                  <p>
                    <strong>Will send reminder in:</strong>
                    ${escapeHtml(row.reminderDateWeekday)} - ${escapeHtml(
              row.reminderDateLabel
            )}
                  </p>
                </div>

                <button
                  type="button"
                  class="WhatsApp-toolbar-btn ${
                    isSelectedPerson ? "" : "WhatsApp-toolbar-btn-secondary"
                  }"
                  data-WhatsApp-recipient-key="${escapeHtml(key)}"
                >
                  ${isSelectedPerson ? "Selected" : "Select"}
                </button>
              </div>
            `;
          })
          .join("")
      : `
        <div class="empty-state WhatsApp-empty-selection-state">
<strong>No people match this filter.</strong>
<p>Select months above, change the demo filter, or search by another name, phone number, or date.</p>
        </div>
      `;

  container.innerHTML = `
    <div class="WhatsApp-summary-box">
      <h2>WhatsApp Reminder Report</h2>
      <p>
        The system reviewed <strong>${rows.length}</strong> people with usable names and dates of birth
        from <strong>${filesCount}</strong> ${filesCount === 1 ? "file" : "files"}.
      </p>
<p class="WhatsApp-summary-note">
  The system supports generated monthly workbooks and random Excel files. If a random file is uploaded,
  the system scans the file, detects dates of birth and phone numbers, then groups people by birthday month automatically.
</p>
    </div>

    <div class="WhatsApp-month-selection-toolbar">
      <div class="WhatsApp-month-selection-info">
        <strong>Selected months:</strong> ${getSelectedMonthsText()}
      </div>

      <div class="WhatsApp-month-selection-actions">
        <button type="button" id="WhatsAppSelectAllMonthsBtn" class="WhatsApp-toolbar-btn">
          Select All Months
        </button>
        <button type="button" id="WhatsAppClearAllMonthsBtn" class="WhatsApp-toolbar-btn WhatsApp-toolbar-btn-secondary">
          Clear Selection
        </button>
      </div>
    </div>

    <div class="WhatsApp-month-count-grid">
      ${countsHtml}
    </div>

    <div class="WhatsApp-filtered-summary-box">
      <p>
        People inside selected month(s):
        <strong>${selectedMonthRows.length}</strong>
      </p>
      <p>
        Selected people:
        <strong>${filteredRows.length}</strong>
      </p>
      <p>
        Not selected people:
        <strong>${notSelectedPeopleCount}</strong>
      </p>
      <p>
        Unique phone numbers that will receive WhatsApp:
        <strong>${filteredRecipients.length}</strong>
      </p>
    </div>

<div class="WhatsApp-month-selection-toolbar WhatsApp-people-selection-toolbar">
  <div class="WhatsApp-month-selection-info">
    <strong>People selection:</strong>
    choose exactly who will receive the scheduled WhatsApp inside the selected month(s).
  </div>

  <div class="WhatsApp-month-selection-actions">
    <button type="button" id="WhatsAppSelectAllPeopleBtn" class="WhatsApp-toolbar-btn">
      Select All People
    </button>
    <button type="button" id="WhatsAppClearAllPeopleBtn" class="WhatsApp-toolbar-btn WhatsApp-toolbar-btn-secondary">
      Clear All People
    </button>
  </div>
</div>

<div class="WhatsApp-demo-filter-box">
  <div class="WhatsApp-demo-filter-header">
    <div>
      <h3>Filter the demo list</h3>
      <p>
        This only changes what you see below. It does not remove people from the final WhatsApp sending list.
      </p>
    </div>

    <button type="button" id="WhatsAppClearDemoFiltersBtn" class="WhatsApp-toolbar-btn WhatsApp-toolbar-btn-secondary">
      Clear Demo Filter
    </button>
  </div>

  <details class="WhatsApp-filter-dropdown" id="WhatsAppFilterDropdown">
    <summary>
      Filter by month
      <span>
        ${
          WhatsAppDraftFilterMonths.size === 0
            ? "All selected months"
            : [...WhatsAppDraftFilterMonths].map(toDisplaySheetName).join(", ")
        }
      </span>
    </summary>

    <div class="WhatsApp-filter-month-grid">
      ${SELECTABLE_WhatsApp_MONTHS.map((month) => {
        const isChecked = WhatsAppDraftFilterMonths.has(month);

        return `
          <label class="WhatsApp-filter-month-option">
            <input
              type="checkbox"
              value="${escapeHtml(month)}"
              data-WhatsApp-demo-filter-month="${escapeHtml(month)}"
              ${isChecked ? "checked" : ""}
            />
            <span>${toDisplaySheetName(month)}</span>
          </label>
        `;
      }).join("")}
    </div>
  </details>

  <div class="WhatsApp-demo-search-row">
    <label class="send-WhatsApp-label" for="WhatsAppDemoSearchInput">
      Search by name, phone number, or date
    </label>

    <input
      id="WhatsAppDemoSearchInput"
      type="text"
      class="WhatsApp-demo-search-input"
      placeholder="Example: Mia, 96135, 08/02/2019, February..."
      value="${escapeHtml(WhatsAppDraftSearchText)}"
    />
  </div>

  <div class="WhatsApp-demo-filter-actions">
    <button type="button" id="WhatsAppApplyDemoFiltersBtn" class="WhatsApp-toolbar-btn">
      Apply Filter
    </button>
  </div>

  <div class="WhatsApp-demo-filter-result">
    Showing <strong>${visibleRows.length}</strong> person/people from
    <strong>${selectedMonthRows.length}</strong> people inside selected month(s).
    Final selected recipients still remain <strong>${filteredRows.length}</strong>.
  </div>
</div>

<div class="WhatsApp-report-grid">
  ${reportCardsHtml}
</div>

    <div class="WhatsApp-form-box">
      <label class="send-WhatsApp-label" for="WhatsAppHourInput">
        At what time do you wanna send this message?
      </label>

      <div class="WhatsApp-time-grid">
        <div>
          <label class="send-WhatsApp-small-label" for="WhatsAppHourInput">Hour</label>
          <input
            id="WhatsAppHourInput"
            type="number"
            min="0"
            max="23"
            placeholder="e.g. 9"
            value="${escapeHtml(WhatsAppFormDraft.hour)}"
          />
        </div>

        <div>
          <label class="send-WhatsApp-small-label" for="WhatsAppMinuteInput">Minute</label>
          <input
            id="WhatsAppMinuteInput"
            type="number"
            min="0"
            max="59"
            placeholder="e.g. 30"
            value="${escapeHtml(WhatsAppFormDraft.minute)}"
          />
        </div>
      </div>

      <label class="send-WhatsApp-label" for="WhatsAppTextArea">
        The text going to be sent is:
      </label>

      <textarea
        id="WhatsAppTextArea"
        class="WhatsApp-textarea"
        placeholder="Leave empty for now..."
      >${escapeHtml(WhatsAppFormDraft.message)}</textarea>

      <button
        id="finalSendWhatsAppBtn"
        type="button"
        class="disabled-send-WhatsApp-btn"
        title="Click to save this WhatsApp action into history."
      >
        Send WhatsApp for Selected People
      </button>

      <div id="WhatsAppSendErrorLabel" class="WhatsApp-error-label WhatsApp-send-error-label"></div>
    </div>

    <p class="WhatsApp-disabled-note">
      WhatsApp sending is disabled for now. Later, when enabled, it should ask:
      “Are you sure?”
    </p>
  `;

attachMonthSelectionEvents();
attachToolbarEvents();
attachPeopleToolbarEvents();
attachRecipientSelectionEvents();
attachDemoFilterEvents();
attachTimeValidationEvents();
  attachFormDraftEvents();
  validateSendTimeInputs();

  const sendButton = document.getElementById("finalSendWhatsAppBtn");
  if (sendButton) {
    sendButton.addEventListener("click", () => {
      const isValidTime = validateSendTimeInputs();
      if (!isValidTime) return;

      const selectedRows = getFilteredWhatsAppRows();
      if (selectedRows.length === 0) {
        showSendWhatsAppInlineError(
          "Please select at least one person inside the selected month(s) before sending."
        );
        return;
      }

      const detailedRecipients = getDetailedRecipients(selectedRows);
      if (detailedRecipients.length === 0) {
        showSendWhatsAppInlineError(
          "No valid phone numbers were found inside the selected people."
        );
        return;
      }

      clearSendWhatsAppInlineError();

      const confirmed = confirm(
        `Are you sure you want to schedule WhatsApp messages for ${selectedRows.length} selected person/people across ${selectedWhatsAppMonths.size} month(s)?`
      );
      if (!confirmed) return;

      const WhatsAppTextArea = document.getElementById("WhatsAppTextArea");
      const messageText = WhatsAppTextArea ? WhatsAppTextArea.value.trim() : "";

      const hourInput = document.getElementById("WhatsAppHourInput");
      const minuteInput = document.getElementById("WhatsAppMinuteInput");

      const hour = hourInput ? hourInput.value.trim().padStart(2, "0") : "19";
      const minute = minuteInput ? minuteInput.value.trim().padStart(2, "0") : "00";

      const fromNumber = "+96170000000"; // replace later with your real connected number

      saveSendWhatsAppHistory({
        mode: "scheduled",
        fileName:
          selectedWhatsAppFiles.length === 1
            ? selectedWhatsAppFiles[0].name
            : `${selectedWhatsAppFiles.length} files merged`,
        selectedMonths: [...selectedWhatsAppMonths].map(toDisplaySheetName),
        fromNumber,
        recipients: detailedRecipients,
        messageText,
        sendDateLabel: "One month before each selected birthday",
        sendTimeLabel: `${hour}:${minute}`,
      });

      alert("Scheduled WhatsApp action was saved in history successfully.");
    });
  }
}

function attachMonthSelectionEvents() {
  document.querySelectorAll("[data-WhatsApp-month]").forEach((button) => {
    button.addEventListener("click", () => {
      const month = normalizeSheetName(button.dataset.WhatsAppMonth || "");
      if (!month || !SELECTABLE_WhatsApp_MONTHS.includes(month)) return;

      collectWhatsAppFormDraft();

      if (selectedWhatsAppMonths.has(month)) {
        selectedWhatsAppMonths.delete(month);
        removeMonthPeopleFromSelection(month);
      } else {
        selectedWhatsAppMonths.add(month);
        addMonthPeopleToSelection(month);
      }

      renderWhatsAppReport(latestWhatsAppRows, selectedWhatsAppFiles.length);
    });
  });
}

function attachToolbarEvents() {
  const selectAllBtn = document.getElementById("WhatsAppSelectAllMonthsBtn");
  const clearAllBtn = document.getElementById("WhatsAppClearAllMonthsBtn");

  if (selectAllBtn) {
    selectAllBtn.addEventListener("click", () => {
      collectWhatsAppFormDraft();

      const counts = getSheetCounts(latestWhatsAppRows);
      selectedWhatsAppMonths = new Set();

      SELECTABLE_WhatsApp_MONTHS.forEach((month) => {
        if ((counts[month] || 0) > 0) {
          selectedWhatsAppMonths.add(month);
        }
      });

      initializeSelectedWhatsAppRecipients(latestWhatsAppRows);
      renderWhatsAppReport(latestWhatsAppRows, selectedWhatsAppFiles.length);
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      collectWhatsAppFormDraft();
      selectedWhatsAppMonths = new Set();
      selectedWhatsAppRecipientKeys = new Set();
      renderWhatsAppReport(latestWhatsAppRows, selectedWhatsAppFiles.length);
    });
  }
}

function attachPeopleToolbarEvents() {
  const selectAllPeopleBtn = document.getElementById("WhatsAppSelectAllPeopleBtn");
  const clearAllPeopleBtn = document.getElementById("WhatsAppClearAllPeopleBtn");

  if (selectAllPeopleBtn) {
    selectAllPeopleBtn.addEventListener("click", () => {
      collectWhatsAppFormDraft();

      getRowsInsideSelectedWhatsAppMonths().forEach((row) => {
        if (!row.phone) return;
        selectedWhatsAppRecipientKeys.add(getWhatsAppRecipientKey(row));
      });

      renderWhatsAppReport(latestWhatsAppRows, selectedWhatsAppFiles.length);
    });
  }

  if (clearAllPeopleBtn) {
    clearAllPeopleBtn.addEventListener("click", () => {
      collectWhatsAppFormDraft();

      getRowsInsideSelectedWhatsAppMonths().forEach((row) => {
        selectedWhatsAppRecipientKeys.delete(getWhatsAppRecipientKey(row));
      });

      renderWhatsAppReport(latestWhatsAppRows, selectedWhatsAppFiles.length);
    });
  }
}

function attachRecipientSelectionEvents() {
  document.querySelectorAll("[data-WhatsApp-recipient-key]").forEach((button) => {
    button.addEventListener("click", () => {
      collectWhatsAppFormDraft();

      const key = button.dataset.WhatsAppRecipientKey || "";
      if (!key) return;

      if (selectedWhatsAppRecipientKeys.has(key)) {
        selectedWhatsAppRecipientKeys.delete(key);
      } else {
        selectedWhatsAppRecipientKeys.add(key);
      }

      renderWhatsAppReport(latestWhatsAppRows, selectedWhatsAppFiles.length);
    });
  });
}

function attachDemoFilterEvents() {
  document.querySelectorAll("[data-WhatsApp-demo-filter-month]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      collectWhatsAppFormDraft();

      const month = normalizeSheetName(checkbox.dataset.WhatsAppDemoFilterMonth || "");
      if (!month || !SELECTABLE_WhatsApp_MONTHS.includes(month)) return;

      if (checkbox.checked) {
        WhatsAppDraftFilterMonths.add(month);
      } else {
        WhatsAppDraftFilterMonths.delete(month);
      }

      updateFilterDropdownLabel();
    });
  });

  const searchInput = document.getElementById("WhatsAppDemoSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      collectWhatsAppFormDraft();
      WhatsAppDraftSearchText = searchInput.value || "";
    });
  }

  const applyFiltersBtn = document.getElementById("WhatsAppApplyDemoFiltersBtn");
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener("click", () => {
      collectWhatsAppFormDraft();

      WhatsAppDisplayFilterMonths = new Set(WhatsAppDraftFilterMonths);
      WhatsAppDisplaySearchText = WhatsAppDraftSearchText;

      renderWhatsAppReport(latestWhatsAppRows, selectedWhatsAppFiles.length);
    });
  }

  const clearFiltersBtn = document.getElementById("WhatsAppClearDemoFiltersBtn");
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      collectWhatsAppFormDraft();

      WhatsAppDisplayFilterMonths = new Set();
      WhatsAppDisplaySearchText = "";

      WhatsAppDraftFilterMonths = new Set();
      WhatsAppDraftSearchText = "";

      renderWhatsAppReport(latestWhatsAppRows, selectedWhatsAppFiles.length);
    });
  }
}

function updateFilterDropdownLabel() {
  const dropdown = document.getElementById("WhatsAppFilterDropdown");
  if (!dropdown) return;

  const summaryLabel = dropdown.querySelector("summary span");
  if (!summaryLabel) return;

  summaryLabel.textContent =
    WhatsAppDraftFilterMonths.size === 0
      ? "All selected months"
      : [...WhatsAppDraftFilterMonths].map(toDisplaySheetName).join(", ");
}

function getVisibleWhatsAppRowsForDemo() {
  let rows = getRowsInsideSelectedWhatsAppMonths();

  if (WhatsAppDisplayFilterMonths.size > 0) {
    rows = rows.filter((row) => WhatsAppDisplayFilterMonths.has(row.sheetName));
  }

  const search = normalizeValue(WhatsAppDisplaySearchText).toLowerCase();

  if (search) {
    rows = rows.filter((row) => {
      const searchableText = [
        row.name,
        row.phone,
        row.originalDobLabel,
        row.originalDobWeekday,
        row.reminderDateLabel,
        row.reminderDateWeekday,
        row.sheetName,
        toDisplaySheetName(row.sheetName || ""),
        row.sourceFileName,
      ]
        .map((value) => normalizeValue(value).toLowerCase())
        .join(" ");

      return searchableText.includes(search);
    });
  }

  return rows;
}

function attachTimeValidationEvents() {
  const hourInput = document.getElementById("WhatsAppHourInput");
  const minuteInput = document.getElementById("WhatsAppMinuteInput");

  if (hourInput) {
    hourInput.addEventListener("input", validateSendTimeInputs);
    hourInput.addEventListener("blur", validateSendTimeInputs);
  }

  if (minuteInput) {
    minuteInput.addEventListener("input", validateSendTimeInputs);
    minuteInput.addEventListener("blur", validateSendTimeInputs);
  }
}

function attachFormDraftEvents() {
  const hourInput = document.getElementById("WhatsAppHourInput");
  const minuteInput = document.getElementById("WhatsAppMinuteInput");
  const WhatsAppTextArea = document.getElementById("WhatsAppTextArea");

  if (hourInput) {
    hourInput.addEventListener("input", collectWhatsAppFormDraft);
  }

  if (minuteInput) {
    minuteInput.addEventListener("input", collectWhatsAppFormDraft);
  }

  if (WhatsAppTextArea) {
    WhatsAppTextArea.addEventListener("input", collectWhatsAppFormDraft);
  }
}

function collectWhatsAppFormDraft() {
  const hourInput = document.getElementById("WhatsAppHourInput");
  const minuteInput = document.getElementById("WhatsAppMinuteInput");
  const WhatsAppTextArea = document.getElementById("WhatsAppTextArea");

  WhatsAppFormDraft = {
    hour: hourInput ? hourInput.value : WhatsAppFormDraft.hour,
    minute: minuteInput ? minuteInput.value : WhatsAppFormDraft.minute,
    message: WhatsAppTextArea ? WhatsAppTextArea.value : WhatsAppFormDraft.message,
  };
}

function validateSendTimeInputs() {
  collectWhatsAppFormDraft();

  const hourInput = document.getElementById("WhatsAppHourInput");
  const minuteInput = document.getElementById("WhatsAppMinuteInput");
  const sendErrorLabel = document.getElementById("WhatsAppSendErrorLabel");

  if (!hourInput || !minuteInput || !sendErrorLabel) {
    return false;
  }

  const hourRaw = hourInput.value.trim();
  const minuteRaw = minuteInput.value.trim();

  const errors = [];

  if (hourRaw === "") {
    errors.push("Hour is required.");
  } else if (!isWholeNumber(hourRaw)) {
    errors.push("Hour must be a valid whole number.");
  } else {
    const hour = Number(hourRaw);
    if (hour < 0 || hour > 23) {
      errors.push("Hour must be between 0 and 23.");
    }
  }

  if (minuteRaw === "") {
    errors.push("Minute is required.");
  } else if (!isWholeNumber(minuteRaw)) {
    errors.push("Minute must be a valid whole number.");
  } else {
    const minute = Number(minuteRaw);
    if (minute < 0 || minute > 59) {
      errors.push("Minute must be between 0 and 59.");
    }
  }

  if (errors.length > 0) {
    sendErrorLabel.textContent = `Send WhatsApp is blocked: ${errors.join(" ")}`;
    sendErrorLabel.classList.add("show");
    return false;
  }

  sendErrorLabel.textContent = "";
  sendErrorLabel.classList.remove("show");
  return true;
}

function showSendWhatsAppInlineError(message) {
  const sendErrorLabel = document.getElementById("WhatsAppSendErrorLabel");
  if (!sendErrorLabel) return;

  sendErrorLabel.textContent = message;
  sendErrorLabel.classList.add("show");
}

function clearSendWhatsAppInlineError() {
  const sendErrorLabel = document.getElementById("WhatsAppSendErrorLabel");
  if (!sendErrorLabel) return;

  sendErrorLabel.textContent = "";
  sendErrorLabel.classList.remove("show");
}

function getFilteredWhatsAppRows() {
  if (selectedWhatsAppMonths.size === 0) {
    return [];
  }

  return latestWhatsAppRows.filter((row) => {
    if (!selectedWhatsAppMonths.has(row.sheetName)) return false;
    if (!row.phone) return false;

    return selectedWhatsAppRecipientKeys.has(getWhatsAppRecipientKey(row));
  });
}

function getDetailedRecipients(rows) {
  return rows
    .map((row) => ({
      name: row.name || "Unknown",
      phone: normalizeValue(row.phone),
      month: toDisplaySheetName(row.sheetName || ""),
      dateOfBirth: row.originalDobLabel || "",
      reminderDate: row.reminderDateLabel || "",
      sourceFileName: row.sourceFileName || "",
    }))
    .filter((recipient) => recipient.phone);
}

function getUniqueRecipients(rows) {
  return [...new Set(rows.map((row) => normalizeValue(row.phone)).filter(Boolean))];
}

function getSelectedMonthsText() {
  if (selectedWhatsAppMonths.size === 0) {
    return "None";
  }

  return [...selectedWhatsAppMonths].map(toDisplaySheetName).join(", ");
}

function isWholeNumber(value) {
  return /^\d+$/.test(value);
}

function getSheetCounts(rows) {
  const counts = {};

  REQUIRED_SHEETS.forEach((sheet) => {
    counts[sheet] = 0;
  });

  rows.forEach((row) => {
    const normalized = String(row.sheetName || "").trim().toLowerCase();

    if (Object.prototype.hasOwnProperty.call(counts, normalized)) {
      counts[normalized]++;
    }
  });

  return counts;
}

function toDisplaySheetName(sheetName) {
  if (sheetName === "not specified") return "Not Specified";
  return sheetName.charAt(0).toUpperCase() + sheetName.slice(1);
}

async function convertLiveFileToStoredPreviewFile(file) {
  const data = await readFileAsArrayBuffer(file);
  const workbook = XLSX.read(data, { type: "array" });

  return {
    name: file.name,
    sheets: workbook.SheetNames.map((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(worksheet, { defval: ""});
      return {
        sheetName,
        rows,
      };
    }),
  };
}

function buildErrorListHtml(messages) {
  return `
    <strong>Some uploaded files cannot be processed:</strong>
    <ul class="WhatsApp-error-list">
      ${messages.map((message) => `<li>${message}</li>`).join("")}
    </ul>
  `;
}

function getFirstCleanPhoneFromCleanedRow(cleanedRow) {
  const phoneKey = Object.keys(cleanedRow || {}).find((key) =>
    String(key || "").startsWith("Phone Number ")
  );

  if (!phoneKey) {
    return "";
  }

  return normalizeValue(cleanedRow[phoneKey]);
}

function getNameValue(person) {
  return normalizeValue(
    person["Name"] ||
      person["name"] ||
      person["Full Name"] ||
      person["full name"]
  );
}

function getPhoneValue(person) {
  const directValue = normalizeValue(
    person["Phone Number 1"] ||
      person["Phone number 1"] ||
      person["phone number 1"] ||
      person["Phone Number"] ||
      person["Phone number"] ||
      person["phone number"] ||
      person["Phone"] ||
      person["phone"] ||
      person["Phone num"]
  );

  if (directValue) return directValue;

  const dynamicPhoneKey = Object.keys(person || {}).find((key) =>
    String(key || "").trim().toLowerCase().startsWith("phone number")
  );

  if (dynamicPhoneKey) {
    return normalizeValue(person[dynamicPhoneKey]);
  }

  return "";
}

function getDobValue(person) {
  return (
    person["date of Birth"] ??
    person["Date of Birth"] ??
    person["DOB"] ??
    person["date of birth"] ??
    person["Dob"] ??
    person["dob"] ??
    ""
  );
}

function parseDobFlexible(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (typeof value === "number") {
    const excelDate = XLSX.SSF.parse_date_code(value);
    if (!excelDate) return null;

    return new Date(excelDate.y, excelDate.m - 1, excelDate.d);
  }

  const text = String(value).trim();
  if (!text) return null;

  const slashParts = text.split("/");
  if (slashParts.length === 3) {
    const day = parseInt(slashParts[0], 10);
    const month = parseInt(slashParts[1], 10);
    const year = parseInt(slashParts[2], 10);

    if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
      const date = new Date(year, month - 1, day);

      if (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      ) {
        return date;
      }
    }
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function getReminderDateThirtyDaysBefore(day, month, currentYear) {
  const birthdayInCurrentYear = new Date(currentYear, month - 1, day);

  if (
    birthdayInCurrentYear.getFullYear() !== currentYear ||
    birthdayInCurrentYear.getMonth() !== month - 1 ||
    birthdayInCurrentYear.getDate() !== day
  ) {
    const fallback = getClampedBirthdayForCurrentYear(day, month, currentYear);
    fallback.setDate(fallback.getDate() - 30);
    return fallback;
  }

  birthdayInCurrentYear.setDate(birthdayInCurrentYear.getDate() - 30);
  return birthdayInCurrentYear;
}

function getClampedBirthdayForCurrentYear(day, month, year) {
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const safeDay = Math.min(day, lastDayOfMonth);
  return new Date(year, month - 1, safeDay);
}

function getWeekdayName(date) {
  return date.toLocaleDateString(undefined, { weekday: "long" });
}

function normalizeSheetName(name) {
  return String(name || "").trim().toLowerCase();
}

function normalizeValue(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function formatDateDDMMYYYY(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (event) {
      resolve(new Uint8Array(event.target.result));
    };

    reader.onerror = function () {
      reject(new Error(`Failed to read file: ${file.name}`));
    };

    reader.readAsArrayBuffer(file);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}