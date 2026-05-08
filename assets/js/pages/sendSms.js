import { openFilePreview, openStoredFilesPreview } from "../previewModal.js";
import { saveSendSmsHistory } from "../storage.js";
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

const SELECTABLE_SMS_MONTHS = REQUIRED_SHEETS.filter(
  (sheet) => sheet !== "not specified"
);

let selectedSmsFiles = [];
let latestSmsRows = [];
let selectedSmsMonths = new Set();
let selectedSmsRecipientKeys = new Set();

let smsDisplayFilterMonths = new Set();
let smsDisplaySearchText = "";

let smsDraftFilterMonths = new Set();
let smsDraftSearchText = "";

let smsFormDraft = {
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



export function initSendSmsPage() {
  const fileInput = document.getElementById("smsFileInput");
  const processBtn = document.getElementById("processSmsFileBtn");

  const sendNowFileInput = document.getElementById("sendNowFileInput");
  const processSendNowBtn = document.getElementById("processSendNowFileBtn");

  const modeChooser = document.getElementById("smsModeChooser");
  const schedulePanel = document.getElementById("smsSchedulePanel");
  const sendNowPanel = document.getElementById("smsSendNowPanel");

  const scheduleModeBtn = document.getElementById("smsScheduleModeBtn");
  const sendNowModeBtn = document.getElementById("smsSendNowModeBtn");

  const backToSmsModesBtn = document.getElementById("backToSmsModesBtn");
  const backToSmsModesFromNowBtn = document.getElementById("backToSmsModesFromNowBtn");

  if (fileInput) {
    fileInput.addEventListener("change", handleSmsFileSelection);
  }

  if (processBtn) {
    processBtn.addEventListener("click", handleProcessSmsFiles);
  }

  if (sendNowFileInput) {
  sendNowFileInput.addEventListener("change", handleSendNowFileSelection);
}

if (processSendNowBtn) {
  processSendNowBtn.addEventListener("click", handleProcessSendNowFiles);
}

  if (scheduleModeBtn) {
    scheduleModeBtn.addEventListener("click", () => {
      showSmsMode("schedule");
    });
  }

if (sendNowModeBtn) {
  sendNowModeBtn.addEventListener("click", () => {
    showSmsMode("sendNow");
    renderSelectedSendNowFiles();
    clearSendNowError();
    clearSendNowReport();
  });
}

  if (backToSmsModesBtn) {
    backToSmsModesBtn.addEventListener("click", () => {
      showSmsMode("chooser");
    });
  }

  if (backToSmsModesFromNowBtn) {
    backToSmsModesFromNowBtn.addEventListener("click", () => {
      showSmsMode("chooser");
    });
  }

  function showSmsMode(mode) {
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

  showSmsMode("chooser");

  renderSelectedSmsFiles();
  clearSmsError();
  clearSmsReport();
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
  listWrapper.className = "sms-selected-files-list";

  selectedSendNowFiles.forEach((file, index) => {
    const row = document.createElement("div");
    row.className = "sms-file-pill";

    const leftSide = document.createElement("div");
    leftSide.className = "sms-file-pill-left";

    const label = document.createElement("strong");
    label.textContent = `Selected file ${index + 1}: `;

    const fileName = document.createElement("span");
    fileName.textContent = file.name;
    fileName.className = "sms-file-name";
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
    rightSide.className = "sms-file-pill-actions";

    const previewBtn = document.createElement("button");
    previewBtn.type = "button";
    previewBtn.className = "sms-small-action-btn";
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
    removeBtn.className = "sms-small-remove-btn";
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
    SELECTABLE_SMS_MONTHS.forEach((sheetName) => {
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

      const birthdayMonthName = SELECTABLE_SMS_MONTHS[parsedDob.getMonth()];

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
              <div class="sms-report-card send-now-person-card ${
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
                  class="sms-toolbar-btn ${
                    isExcluded ? "sms-toolbar-btn-secondary" : ""
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
        <div class="empty-state sms-empty-selection-state">
          <strong>No people match this search.</strong>
          <p>Try another name, phone number, file name, or sheet name.</p>
        </div>
      `;

  container.innerHTML = `
    <div class="sms-summary-box">
      <h2>Send Right Now Report</h2>
      <p>
        The system scanned the uploaded file(s), detected phone numbers, and listed them below.
        Date of birth is ignored in this mode.
      </p>
      <p class="sms-summary-note">
        This action will be saved with the current date and current time.
      </p>
    </div>

    <div class="sms-filtered-summary-box">
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

    <div class="sms-demo-filter-box">
      <div class="sms-demo-filter-header">
        <div>
          <h3>Search the list</h3>
          <p>
            Search by name, phone number, file name, or sheet name. This only changes what you see below.
          </p>
        </div>

        <button type="button" id="sendNowClearSearchBtn" class="sms-toolbar-btn sms-toolbar-btn-secondary">
          Clear Search
        </button>
      </div>

      <div class="sms-demo-search-row">
        <label class="send-sms-label" for="sendNowSearchInput">
          Search
        </label>

        <input
          id="sendNowSearchInput"
          type="text"
          class="sms-demo-search-input"
          placeholder="Example: Mia, 96135, Book1, Sheet1..."
          value="${escapeHtml(sendNowSearchDraft)}"
        />
      </div>

      <div class="sms-demo-filter-actions">
        <button type="button" id="sendNowApplySearchBtn" class="sms-toolbar-btn">
          Apply Search
        </button>
      </div>

      <div class="sms-demo-filter-result">
        Showing <strong>${visibleRows.length}</strong> number(s) from
        <strong>${latestSendNowRows.length}</strong> detected number(s).
        Final recipients still remain <strong>${finalRows.length}</strong>.
      </div>
    </div>

    <div class="sms-report-grid send-now-people-grid">
      ${peopleHtml}
    </div>

    <div class="sms-form-box">
      <label class="send-sms-label" for="sendNowSmsTextArea">
        The text going to be sent is:
      </label>

      <textarea
        id="sendNowSmsTextArea"
        class="sms-textarea"
        placeholder="Write the SMS message here..."
      >${escapeHtml(sendNowMessageDraft)}</textarea>

      <button
        id="finalSendNowSmsBtn"
        type="button"
        title="Click to save this send-right-now SMS action into history."
      >
        Send Right Now
      </button>

      <div id="sendNowSendErrorLabel" class="sms-error-label sms-send-error-label"></div>
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

function attachSendNowSheetEvents() {
  document.querySelectorAll("[data-send-now-sheet]").forEach((button) => {
    button.addEventListener("click", () => {
      const sheet = normalizeSheetName(button.dataset.sendNowSheet || "");
      const counts = getSheetCounts(latestSendNowRows);

      if (!sheet || !SELECTABLE_SMS_MONTHS.includes(sheet)) return;
      if ((counts[sheet] || 0) === 0) return;

      collectSendNowMessageDraft();
      selectedSendNowSheet = sheet;
      excludedSendNowRecipientKeys = new Set();
      renderSendNowReport();
    });
  });
}

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
  const textarea = document.getElementById("sendNowSmsTextArea");
  if (!textarea) return;

  textarea.addEventListener("input", collectSendNowMessageDraft);
}

function attachFinalSendNowEvent() {
  const sendBtn = document.getElementById("finalSendNowSmsBtn");
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
      showSendNowInlineError("Please write the SMS message before sending.");
      return;
    }

    clearSendNowInlineError();

    const currentDateTime = getLebanonCurrentDateTimeLabels();

    const confirmed = confirm(
      `Are you sure you want to send this SMS right now to ${finalRows.length} people?`
    );

    if (!confirmed) return;

    const fromNumber = "+96170000000"; // replace later with your real connected number

    saveSendSmsHistory({
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

    alert("Send Right Now SMS action was saved in history successfully.");
  });
}

function collectSendNowMessageDraft() {
  const textarea = document.getElementById("sendNowSmsTextArea");
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





function handleSmsFileSelection(event) {
  const incomingFiles = Array.from(event.target.files || []);

  if (incomingFiles.length === 0) {
    return;
  }

  incomingFiles.forEach((file) => {
    const alreadyExists = selectedSmsFiles.some(
      (existingFile) =>
        existingFile.name === file.name &&
        existingFile.size === file.size &&
        existingFile.lastModified === file.lastModified
    );

    if (!alreadyExists) {
      selectedSmsFiles.push(file);
    }
  });

  event.target.value = "";

  clearSmsError();
  clearSmsReport();
  renderSelectedSmsFiles();
}

function renderSelectedSmsFiles() {
  const selectedFileEl = document.getElementById("smsSelectedFile");
  if (!selectedFileEl) return;

  selectedFileEl.innerHTML = "";

  if (selectedSmsFiles.length === 0) {
    return;
  }

  const listWrapper = document.createElement("div");
  listWrapper.className = "sms-selected-files-list";

  selectedSmsFiles.forEach((file, index) => {
    const row = document.createElement("div");
    row.className = "sms-file-pill";

    const leftSide = document.createElement("div");
    leftSide.className = "sms-file-pill-left";

    const label = document.createElement("strong");
    label.textContent = `Selected file ${index + 1}: `;

    const fileName = document.createElement("span");
    fileName.textContent = file.name;
    fileName.className = "sms-file-name";
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
    rightSide.className = "sms-file-pill-actions";

    const previewBtn = document.createElement("button");
    previewBtn.type = "button";
    previewBtn.className = "sms-small-action-btn";
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
    removeBtn.className = "sms-small-remove-btn";
    removeBtn.textContent = "✕";
    removeBtn.title = "Remove file";
    removeBtn.addEventListener("click", () => {
      removeSelectedSmsFile(index);
    });

    rightSide.appendChild(previewBtn);
    rightSide.appendChild(removeBtn);

    row.appendChild(leftSide);
    row.appendChild(rightSide);
    listWrapper.appendChild(row);
  });

  if (selectedSmsFiles.length > 1) {
    const previewAllBtn = document.createElement("button");
    previewAllBtn.type = "button";
    previewAllBtn.className = "sms-preview-all-btn";
    previewAllBtn.textContent = "Preview All Files";
    previewAllBtn.addEventListener("click", async () => {
      try {
        const storedFiles = await Promise.all(
          selectedSmsFiles.map((file) => convertLiveFileToStoredPreviewFile(file))
        );
        openStoredFilesPreview(storedFiles, "Selected SMS Files Preview");
      } catch (error) {
        console.error("Preview all failed:", error);
      }
    });

    selectedFileEl.appendChild(previewAllBtn);
  }

  selectedFileEl.appendChild(listWrapper);
}

function removeSelectedSmsFile(indexToRemove) {
  const file = selectedSmsFiles[indexToRemove];
  if (!file) return;

  const confirmed = confirm(`Are you sure you want to remove "${file.name}"?`);
  if (!confirmed) return;

  selectedSmsFiles = selectedSmsFiles.filter((_, index) => index !== indexToRemove);

  clearSmsError();
  clearSmsReport();
  renderSelectedSmsFiles();
}

function clearSmsError() {
  const errorEl = document.getElementById("smsErrorLabel");
  if (!errorEl) return;

  errorEl.innerHTML = "";
  errorEl.classList.remove("show");
}

function showSmsError(message) {
  const errorEl = document.getElementById("smsErrorLabel");
  if (!errorEl) return;

  errorEl.innerHTML = message;
  errorEl.classList.add("show");
}

function clearSmsReport() {
  const reportContainer = document.getElementById("smsReportContainer");
  if (!reportContainer) return;

  reportContainer.innerHTML = "";
latestSmsRows = [];
selectedSmsMonths = new Set();
selectedSmsRecipientKeys = new Set();
smsDisplayFilterMonths = new Set();
smsDisplaySearchText = "";

smsDraftFilterMonths = new Set();
smsDraftSearchText = "";

smsFormDraft = {
  hour: "19",
  minute: "00",
  message: "",
};
}

async function handleProcessSmsFiles() {
  clearSmsError();
  clearSmsReport();

  if (selectedSmsFiles.length === 0) {
    showSmsError("Please upload at least one .xlsx file first.");
    return;
  }

  const invalidExtensionFiles = selectedSmsFiles.filter(
    (file) => !file.name.toLowerCase().endsWith(".xlsx")
  );

  if (invalidExtensionFiles.length > 0) {
    showSmsError(
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

    for (const file of selectedSmsFiles) {
      const fileData = await readFileAsArrayBuffer(file);
      const workbook = XLSX.read(fileData, { type: "array" });

      fileProcessingResults.push({
        file,
        workbook,
        isGeneratedMonthlyWorkbook: isGeneratedMonthlySmsWorkbook(workbook),
      });
    }

    const mergedRows = extractSmsRowsFromAnyWorkbooks(
      fileProcessingResults.map((result) => ({
        fileName: result.file.name,
        workbook: result.workbook,
        isGeneratedMonthlyWorkbook: result.isGeneratedMonthlyWorkbook,
      }))
    );

    if (mergedRows.length === 0) {
      showSmsError(
        "No usable people were found. The system searched the uploaded file(s), but could not find enough valid rows containing a date of birth and phone number."
      );
      return;
    }

    latestSmsRows = mergedRows;
    initializeSelectedSmsMonths(mergedRows);
    initializeSelectedSmsRecipients(mergedRows);
    renderSmsReport(mergedRows, selectedSmsFiles.length);
  } catch (error) {
    console.error("Send SMS processing failed:", error);
    showSmsError(
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

function isGeneratedMonthlySmsWorkbook(workbook) {
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

function extractSmsRowsFromAnyWorkbooks(fileWorkbooks) {
  const rows = [];

  fileWorkbooks.forEach(({ fileName, workbook, isGeneratedMonthlyWorkbook }) => {
    if (isGeneratedMonthlyWorkbook) {
      const generatedRows = extractSmsRowsFromMultipleWorkbooks([
        {
          fileName,
          workbook,
        },
      ]);

      rows.push(...generatedRows);
      return;
    }

    const randomRows = extractSmsRowsFromRandomWorkbook(fileName, workbook);
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

function extractSmsRowsFromMultipleWorkbooks(fileWorkbooks) {
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

function extractSmsRowsFromRandomWorkbook(fileName, workbook) {
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

      const birthdayMonthName = SELECTABLE_SMS_MONTHS[parsedDob.getMonth()];

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

function initializeSelectedSmsMonths(rows) {
  const counts = getSheetCounts(rows);
  selectedSmsMonths = new Set();

  SELECTABLE_SMS_MONTHS.forEach((month) => {
    if ((counts[month] || 0) > 0) {
      selectedSmsMonths.add(month);
    }
  });
}


function initializeSelectedSmsRecipients(rows) {
  selectedSmsRecipientKeys = new Set();

  rows.forEach((row) => {
    if (!selectedSmsMonths.has(row.sheetName)) return;
    if (!row.phone) return;

    selectedSmsRecipientKeys.add(getSmsRecipientKey(row));
  });
}

function addMonthPeopleToSelection(month) {
  latestSmsRows.forEach((row) => {
    if (row.sheetName !== month) return;
    if (!row.phone) return;

    selectedSmsRecipientKeys.add(getSmsRecipientKey(row));
  });
}

function removeMonthPeopleFromSelection(month) {
  latestSmsRows.forEach((row) => {
    if (row.sheetName !== month) return;

    selectedSmsRecipientKeys.delete(getSmsRecipientKey(row));
  });
}

function getRowsInsideSelectedSmsMonths() {
  if (selectedSmsMonths.size === 0) {
    return [];
  }

  return latestSmsRows.filter((row) => selectedSmsMonths.has(row.sheetName));
}

function getSmsRecipientKey(row) {
  return `${row.sourceFileName || ""}__${row.sheetName || ""}__${
    row.rowNumber || ""
  }__${row.phone || ""}`;
}

function renderSmsReport(rows, filesCount = 1) {
  const container = document.getElementById("smsReportContainer");
  if (!container) return;

const groupedCounts = getSheetCounts(rows);
const selectedMonthRows = getRowsInsideSelectedSmsMonths();
const visibleRows = getVisibleSmsRowsForDemo();
const filteredRows = getFilteredSmsRows();
const filteredRecipients = getUniqueRecipients(filteredRows);
const notSelectedPeopleCount = Math.max(
  selectedMonthRows.length - filteredRows.length,
  0
);

  const countsHtml = REQUIRED_SHEETS.map((sheetName) => {
    const count = groupedCounts[sheetName] || 0;
    const isSelectable = SELECTABLE_SMS_MONTHS.includes(sheetName);
    const isSelected = selectedSmsMonths.has(sheetName);

    return `
      <button
        type="button"
        class="sms-month-count-box ${
          isSelectable ? "sms-month-selectable" : "sms-month-disabled"
        } ${isSelected ? "selected" : ""}"
        data-sms-month="${escapeHtml(sheetName)}"
        ${isSelectable ? "" : "disabled"}
        title="${
          isSelectable
            ? "Click to select or unselect this month"
            : "Not Specified is informational only and cannot be selected for SMS sending"
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
            const key = getSmsRecipientKey(row);
            const isSelectedPerson = selectedSmsRecipientKeys.has(key);

            return `
              <div class="sms-report-card scheduled-person-card ${
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
                  class="sms-toolbar-btn ${
                    isSelectedPerson ? "" : "sms-toolbar-btn-secondary"
                  }"
                  data-sms-recipient-key="${escapeHtml(key)}"
                >
                  ${isSelectedPerson ? "Selected" : "Select"}
                </button>
              </div>
            `;
          })
          .join("")
      : `
        <div class="empty-state sms-empty-selection-state">
<strong>No people match this filter.</strong>
<p>Select months above, change the demo filter, or search by another name, phone number, or date.</p>
        </div>
      `;

  container.innerHTML = `
    <div class="sms-summary-box">
      <h2>SMS Reminder Report</h2>
      <p>
        The system reviewed <strong>${rows.length}</strong> people with usable names and dates of birth
        from <strong>${filesCount}</strong> ${filesCount === 1 ? "file" : "files"}.
      </p>
<p class="sms-summary-note">
  The system supports generated monthly workbooks and random Excel files. If a random file is uploaded,
  the system scans the file, detects dates of birth and phone numbers, then groups people by birthday month automatically.
</p>
    </div>

    <div class="sms-month-selection-toolbar">
      <div class="sms-month-selection-info">
        <strong>Selected months:</strong> ${getSelectedMonthsText()}
      </div>

      <div class="sms-month-selection-actions">
        <button type="button" id="smsSelectAllMonthsBtn" class="sms-toolbar-btn">
          Select All Months
        </button>
        <button type="button" id="smsClearAllMonthsBtn" class="sms-toolbar-btn sms-toolbar-btn-secondary">
          Clear Selection
        </button>
      </div>
    </div>

    <div class="sms-month-count-grid">
      ${countsHtml}
    </div>

    <div class="sms-filtered-summary-box">
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
        Unique phone numbers that will receive SMS:
        <strong>${filteredRecipients.length}</strong>
      </p>
    </div>

<div class="sms-month-selection-toolbar sms-people-selection-toolbar">
  <div class="sms-month-selection-info">
    <strong>People selection:</strong>
    choose exactly who will receive the scheduled SMS inside the selected month(s).
  </div>

  <div class="sms-month-selection-actions">
    <button type="button" id="smsSelectAllPeopleBtn" class="sms-toolbar-btn">
      Select All People
    </button>
    <button type="button" id="smsClearAllPeopleBtn" class="sms-toolbar-btn sms-toolbar-btn-secondary">
      Clear All People
    </button>
  </div>
</div>

<div class="sms-demo-filter-box">
  <div class="sms-demo-filter-header">
    <div>
      <h3>Filter the demo list</h3>
      <p>
        This only changes what you see below. It does not remove people from the final SMS sending list.
      </p>
    </div>

    <button type="button" id="smsClearDemoFiltersBtn" class="sms-toolbar-btn sms-toolbar-btn-secondary">
      Clear Demo Filter
    </button>
  </div>

  <details class="sms-filter-dropdown" id="smsFilterDropdown">
    <summary>
      Filter by month
      <span>
        ${
          smsDraftFilterMonths.size === 0
            ? "All selected months"
            : [...smsDraftFilterMonths].map(toDisplaySheetName).join(", ")
        }
      </span>
    </summary>

    <div class="sms-filter-month-grid">
      ${SELECTABLE_SMS_MONTHS.map((month) => {
        const isChecked = smsDraftFilterMonths.has(month);

        return `
          <label class="sms-filter-month-option">
            <input
              type="checkbox"
              value="${escapeHtml(month)}"
              data-sms-demo-filter-month="${escapeHtml(month)}"
              ${isChecked ? "checked" : ""}
            />
            <span>${toDisplaySheetName(month)}</span>
          </label>
        `;
      }).join("")}
    </div>
  </details>

  <div class="sms-demo-search-row">
    <label class="send-sms-label" for="smsDemoSearchInput">
      Search by name, phone number, or date
    </label>

    <input
      id="smsDemoSearchInput"
      type="text"
      class="sms-demo-search-input"
      placeholder="Example: Mia, 96135, 08/02/2019, February..."
      value="${escapeHtml(smsDraftSearchText)}"
    />
  </div>

  <div class="sms-demo-filter-actions">
    <button type="button" id="smsApplyDemoFiltersBtn" class="sms-toolbar-btn">
      Apply Filter
    </button>
  </div>

  <div class="sms-demo-filter-result">
    Showing <strong>${visibleRows.length}</strong> person/people from
    <strong>${selectedMonthRows.length}</strong> people inside selected month(s).
    Final selected recipients still remain <strong>${filteredRows.length}</strong>.
  </div>
</div>

<div class="sms-report-grid">
  ${reportCardsHtml}
</div>

    <div class="sms-form-box">
      <label class="send-sms-label" for="smsHourInput">
        At what time do you wanna send this message?
      </label>

      <div class="sms-time-grid">
        <div>
          <label class="send-sms-small-label" for="smsHourInput">Hour</label>
          <input
            id="smsHourInput"
            type="number"
            min="0"
            max="23"
            placeholder="e.g. 9"
            value="${escapeHtml(smsFormDraft.hour)}"
          />
        </div>

        <div>
          <label class="send-sms-small-label" for="smsMinuteInput">Minute</label>
          <input
            id="smsMinuteInput"
            type="number"
            min="0"
            max="59"
            placeholder="e.g. 30"
            value="${escapeHtml(smsFormDraft.minute)}"
          />
        </div>
      </div>

      <label class="send-sms-label" for="smsTextArea">
        The text going to be sent is:
      </label>

      <textarea
        id="smsTextArea"
        class="sms-textarea"
        placeholder="Leave empty for now..."
      >${escapeHtml(smsFormDraft.message)}</textarea>

      <button
        id="finalSendSmsBtn"
        type="button"
        class="disabled-send-sms-btn"
        title="Click to save this SMS action into history."
      >
        Send SMS for Selected People
      </button>

      <div id="smsSendErrorLabel" class="sms-error-label sms-send-error-label"></div>
    </div>

    <p class="sms-disabled-note">
      SMS sending is disabled for now. Later, when enabled, it should ask:
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

  const sendButton = document.getElementById("finalSendSmsBtn");
  if (sendButton) {
    sendButton.addEventListener("click", () => {
      const isValidTime = validateSendTimeInputs();
      if (!isValidTime) return;

      const selectedRows = getFilteredSmsRows();
      if (selectedRows.length === 0) {
        showSendSmsInlineError(
          "Please select at least one person inside the selected month(s) before sending."
        );
        return;
      }

      const detailedRecipients = getDetailedRecipients(selectedRows);
      if (detailedRecipients.length === 0) {
        showSendSmsInlineError(
          "No valid phone numbers were found inside the selected people."
        );
        return;
      }

      clearSendSmsInlineError();

      const confirmed = confirm(
        `Are you sure you want to schedule SMS messages for ${selectedRows.length} selected person/people across ${selectedSmsMonths.size} month(s)?`
      );
      if (!confirmed) return;

      const smsTextArea = document.getElementById("smsTextArea");
      const messageText = smsTextArea ? smsTextArea.value.trim() : "";

      const hourInput = document.getElementById("smsHourInput");
      const minuteInput = document.getElementById("smsMinuteInput");

      const hour = hourInput ? hourInput.value.trim().padStart(2, "0") : "19";
      const minute = minuteInput ? minuteInput.value.trim().padStart(2, "0") : "00";

      const fromNumber = "+96170000000"; // replace later with your real connected number

      saveSendSmsHistory({
        mode: "scheduled",
        fileName:
          selectedSmsFiles.length === 1
            ? selectedSmsFiles[0].name
            : `${selectedSmsFiles.length} files merged`,
        selectedMonths: [...selectedSmsMonths].map(toDisplaySheetName),
        fromNumber,
        recipients: detailedRecipients,
        messageText,
        sendDateLabel: "One month before each selected birthday",
        sendTimeLabel: `${hour}:${minute}`,
      });

      alert("Scheduled SMS action was saved in history successfully.");
    });
  }
}

function attachMonthSelectionEvents() {
  document.querySelectorAll("[data-sms-month]").forEach((button) => {
    button.addEventListener("click", () => {
      const month = normalizeSheetName(button.dataset.smsMonth || "");
      if (!month || !SELECTABLE_SMS_MONTHS.includes(month)) return;

      collectSmsFormDraft();

      if (selectedSmsMonths.has(month)) {
        selectedSmsMonths.delete(month);
        removeMonthPeopleFromSelection(month);
      } else {
        selectedSmsMonths.add(month);
        addMonthPeopleToSelection(month);
      }

      renderSmsReport(latestSmsRows, selectedSmsFiles.length);
    });
  });
}

function attachToolbarEvents() {
  const selectAllBtn = document.getElementById("smsSelectAllMonthsBtn");
  const clearAllBtn = document.getElementById("smsClearAllMonthsBtn");

  if (selectAllBtn) {
    selectAllBtn.addEventListener("click", () => {
      collectSmsFormDraft();

      const counts = getSheetCounts(latestSmsRows);
      selectedSmsMonths = new Set();

      SELECTABLE_SMS_MONTHS.forEach((month) => {
        if ((counts[month] || 0) > 0) {
          selectedSmsMonths.add(month);
        }
      });

      initializeSelectedSmsRecipients(latestSmsRows);
      renderSmsReport(latestSmsRows, selectedSmsFiles.length);
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      collectSmsFormDraft();
      selectedSmsMonths = new Set();
      selectedSmsRecipientKeys = new Set();
      renderSmsReport(latestSmsRows, selectedSmsFiles.length);
    });
  }
}

function attachPeopleToolbarEvents() {
  const selectAllPeopleBtn = document.getElementById("smsSelectAllPeopleBtn");
  const clearAllPeopleBtn = document.getElementById("smsClearAllPeopleBtn");

  if (selectAllPeopleBtn) {
    selectAllPeopleBtn.addEventListener("click", () => {
      collectSmsFormDraft();

      getRowsInsideSelectedSmsMonths().forEach((row) => {
        if (!row.phone) return;
        selectedSmsRecipientKeys.add(getSmsRecipientKey(row));
      });

      renderSmsReport(latestSmsRows, selectedSmsFiles.length);
    });
  }

  if (clearAllPeopleBtn) {
    clearAllPeopleBtn.addEventListener("click", () => {
      collectSmsFormDraft();

      getRowsInsideSelectedSmsMonths().forEach((row) => {
        selectedSmsRecipientKeys.delete(getSmsRecipientKey(row));
      });

      renderSmsReport(latestSmsRows, selectedSmsFiles.length);
    });
  }
}

function attachRecipientSelectionEvents() {
  document.querySelectorAll("[data-sms-recipient-key]").forEach((button) => {
    button.addEventListener("click", () => {
      collectSmsFormDraft();

      const key = button.dataset.smsRecipientKey || "";
      if (!key) return;

      if (selectedSmsRecipientKeys.has(key)) {
        selectedSmsRecipientKeys.delete(key);
      } else {
        selectedSmsRecipientKeys.add(key);
      }

      renderSmsReport(latestSmsRows, selectedSmsFiles.length);
    });
  });
}

function attachDemoFilterEvents() {
  document.querySelectorAll("[data-sms-demo-filter-month]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      collectSmsFormDraft();

      const month = normalizeSheetName(checkbox.dataset.smsDemoFilterMonth || "");
      if (!month || !SELECTABLE_SMS_MONTHS.includes(month)) return;

      if (checkbox.checked) {
        smsDraftFilterMonths.add(month);
      } else {
        smsDraftFilterMonths.delete(month);
      }

      updateFilterDropdownLabel();
    });
  });

  const searchInput = document.getElementById("smsDemoSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      collectSmsFormDraft();
      smsDraftSearchText = searchInput.value || "";
    });
  }

  const applyFiltersBtn = document.getElementById("smsApplyDemoFiltersBtn");
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener("click", () => {
      collectSmsFormDraft();

      smsDisplayFilterMonths = new Set(smsDraftFilterMonths);
      smsDisplaySearchText = smsDraftSearchText;

      renderSmsReport(latestSmsRows, selectedSmsFiles.length);
    });
  }

  const clearFiltersBtn = document.getElementById("smsClearDemoFiltersBtn");
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      collectSmsFormDraft();

      smsDisplayFilterMonths = new Set();
      smsDisplaySearchText = "";

      smsDraftFilterMonths = new Set();
      smsDraftSearchText = "";

      renderSmsReport(latestSmsRows, selectedSmsFiles.length);
    });
  }
}

function updateFilterDropdownLabel() {
  const dropdown = document.getElementById("smsFilterDropdown");
  if (!dropdown) return;

  const summaryLabel = dropdown.querySelector("summary span");
  if (!summaryLabel) return;

  summaryLabel.textContent =
    smsDraftFilterMonths.size === 0
      ? "All selected months"
      : [...smsDraftFilterMonths].map(toDisplaySheetName).join(", ");
}

function getVisibleSmsRowsForDemo() {
  let rows = getRowsInsideSelectedSmsMonths();

  if (smsDisplayFilterMonths.size > 0) {
    rows = rows.filter((row) => smsDisplayFilterMonths.has(row.sheetName));
  }

  const search = normalizeValue(smsDisplaySearchText).toLowerCase();

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
  const hourInput = document.getElementById("smsHourInput");
  const minuteInput = document.getElementById("smsMinuteInput");

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
  const hourInput = document.getElementById("smsHourInput");
  const minuteInput = document.getElementById("smsMinuteInput");
  const smsTextArea = document.getElementById("smsTextArea");

  if (hourInput) {
    hourInput.addEventListener("input", collectSmsFormDraft);
  }

  if (minuteInput) {
    minuteInput.addEventListener("input", collectSmsFormDraft);
  }

  if (smsTextArea) {
    smsTextArea.addEventListener("input", collectSmsFormDraft);
  }
}

function collectSmsFormDraft() {
  const hourInput = document.getElementById("smsHourInput");
  const minuteInput = document.getElementById("smsMinuteInput");
  const smsTextArea = document.getElementById("smsTextArea");

  smsFormDraft = {
    hour: hourInput ? hourInput.value : smsFormDraft.hour,
    minute: minuteInput ? minuteInput.value : smsFormDraft.minute,
    message: smsTextArea ? smsTextArea.value : smsFormDraft.message,
  };
}

function validateSendTimeInputs() {
  collectSmsFormDraft();

  const hourInput = document.getElementById("smsHourInput");
  const minuteInput = document.getElementById("smsMinuteInput");
  const sendErrorLabel = document.getElementById("smsSendErrorLabel");

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
    sendErrorLabel.textContent = `Send SMS is blocked: ${errors.join(" ")}`;
    sendErrorLabel.classList.add("show");
    return false;
  }

  sendErrorLabel.textContent = "";
  sendErrorLabel.classList.remove("show");
  return true;
}

function showSendSmsInlineError(message) {
  const sendErrorLabel = document.getElementById("smsSendErrorLabel");
  if (!sendErrorLabel) return;

  sendErrorLabel.textContent = message;
  sendErrorLabel.classList.add("show");
}

function clearSendSmsInlineError() {
  const sendErrorLabel = document.getElementById("smsSendErrorLabel");
  if (!sendErrorLabel) return;

  sendErrorLabel.textContent = "";
  sendErrorLabel.classList.remove("show");
}

function getFilteredSmsRows() {
  if (selectedSmsMonths.size === 0) {
    return [];
  }

  return latestSmsRows.filter((row) => {
    if (!selectedSmsMonths.has(row.sheetName)) return false;
    if (!row.phone) return false;

    return selectedSmsRecipientKeys.has(getSmsRecipientKey(row));
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
  if (selectedSmsMonths.size === 0) {
    return "None";
  }

  return [...selectedSmsMonths].map(toDisplaySheetName).join(", ");
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
    <ul class="sms-error-list">
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