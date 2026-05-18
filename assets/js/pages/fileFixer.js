import { openFilePreview, openStoredFilesPreview } from "../previewModal.js";

let selectedFileFixerFiles = [];
let latestFileFixerResults = [];

const FIXED_HEADERS = [
  "Name",
  "Phone number -1-",
  "Phone number -2-",
  "Description",
  "Line number-1-",
  "Line number-2-",
  "Line number-3-",
  "Line number-4-",
  "Location",
  "E-mail",
  "Website",
];

const FILE_FIXER_MODE_SAME_SHEETS = "sameSheets";
const FILE_FIXER_MODE_ONE_SHEET = "oneSheet";

let selectedFileFixerMode = FILE_FIXER_MODE_SAME_SHEETS;

export function initFileFixerPage() {
  const fileInput = document.getElementById("fileFixerInput");
  const processBtn = document.getElementById("processFileFixerBtn");

  if (fileInput) {
    fileInput.addEventListener("change", handleFileFixerFileSelection);
  }

  if (processBtn) {
    processBtn.addEventListener("click", handleProcessFileFixerFiles);
  }

  const sameSheetsModeBtn = document.getElementById("sameSheetsModeBtn");
const oneSheetModeBtn = document.getElementById("oneSheetModeBtn");

if (sameSheetsModeBtn) {
  sameSheetsModeBtn.addEventListener("click", () => {
    selectedFileFixerMode = FILE_FIXER_MODE_SAME_SHEETS;
    updateFileFixerModeButtons();
    clearFileFixerReport();
    clearFileFixerError();
  });
}

if (oneSheetModeBtn) {
  oneSheetModeBtn.addEventListener("click", () => {
    selectedFileFixerMode = FILE_FIXER_MODE_ONE_SHEET;
    updateFileFixerModeButtons();
    clearFileFixerReport();
    clearFileFixerError();
  });
}

updateFileFixerModeButtons();

function updateFileFixerModeButtons() {
  const sameSheetsModeBtn = document.getElementById("sameSheetsModeBtn");
  const oneSheetModeBtn = document.getElementById("oneSheetModeBtn");

  sameSheetsModeBtn?.classList.toggle(
    "active",
    selectedFileFixerMode === FILE_FIXER_MODE_SAME_SHEETS
  );

  oneSheetModeBtn?.classList.toggle(
    "active",
    selectedFileFixerMode === FILE_FIXER_MODE_ONE_SHEET
  );
}

  renderSelectedFileFixerFiles();
  clearFileFixerError();
  clearFileFixerReport();
}

function handleFileFixerFileSelection(event) {
  const incomingFiles = Array.from(event.target.files || []);

  if (incomingFiles.length === 0) {
    return;
  }

  incomingFiles.forEach((file) => {
    const alreadyExists = selectedFileFixerFiles.some(
      (existingFile) =>
        existingFile.name === file.name &&
        existingFile.size === file.size &&
        existingFile.lastModified === file.lastModified
    );

    if (!alreadyExists) {
      selectedFileFixerFiles.push(file);
    }
  });

  event.target.value = "";

  clearFileFixerError();
  clearFileFixerReport();
  renderSelectedFileFixerFiles();
}

function renderSelectedFileFixerFiles() {
  const selectedFileEl = document.getElementById("fileFixerSelectedFiles");
  if (!selectedFileEl) return;

  selectedFileEl.innerHTML = "";

  if (selectedFileFixerFiles.length === 0) {
    return;
  }

  if (selectedFileFixerFiles.length > 1) {
    const previewAllBtn = document.createElement("button");
    previewAllBtn.type = "button";
    previewAllBtn.className = "file-fixer-preview-all-btn";
    previewAllBtn.textContent = "Preview All Files";
    previewAllBtn.addEventListener("click", async () => {
      try {
        const storedFiles = await Promise.all(
          selectedFileFixerFiles.map((file) => convertLiveFileToStoredPreviewFile(file))
        );

        openStoredFilesPreview(storedFiles, "Selected File Fixer Files Preview");
      } catch (error) {
        console.error("Preview all failed:", error);
      }
    });

    selectedFileEl.appendChild(previewAllBtn);
  }

  const listWrapper = document.createElement("div");
  listWrapper.className = "file-fixer-selected-files-list";

  selectedFileFixerFiles.forEach((file, index) => {
    const row = document.createElement("div");
    row.className = "file-fixer-file-pill";

    const leftSide = document.createElement("div");
    leftSide.className = "file-fixer-file-pill-left";

    const label = document.createElement("strong");
    label.textContent = `Selected file ${index + 1}: `;

    const fileName = document.createElement("span");
    fileName.textContent = file.name;
    fileName.className = "file-fixer-file-name";
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
    rightSide.className = "file-fixer-file-pill-actions";

    const previewBtn = document.createElement("button");
    previewBtn.type = "button";
    previewBtn.className = "file-fixer-small-action-btn";
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
    removeBtn.className = "file-fixer-small-remove-btn";
    removeBtn.textContent = "✕";
    removeBtn.title = "Remove file";
    removeBtn.addEventListener("click", () => {
      removeSelectedFileFixerFile(index);
    });

    rightSide.appendChild(previewBtn);
    rightSide.appendChild(removeBtn);

    row.appendChild(leftSide);
    row.appendChild(rightSide);
    listWrapper.appendChild(row);
  });

  selectedFileEl.appendChild(listWrapper);
}

function removeSelectedFileFixerFile(indexToRemove) {
  const file = selectedFileFixerFiles[indexToRemove];
  if (!file) return;

  const confirmed = confirm(`Are you sure you want to remove "${file.name}"?`);
  if (!confirmed) return;

  selectedFileFixerFiles = selectedFileFixerFiles.filter(
    (_, index) => index !== indexToRemove
  );

  clearFileFixerError();
  clearFileFixerReport();
  renderSelectedFileFixerFiles();
}

async function handleProcessFileFixerFiles() {
  clearFileFixerError();
  clearFileFixerReport();

  if (selectedFileFixerFiles.length === 0) {
    showFileFixerError("Please upload at least one .xlsx file first.");
    return;
  }

  const invalidExtensionFiles = selectedFileFixerFiles.filter(
    (file) => !file.name.toLowerCase().endsWith(".xlsx")
  );

  if (invalidExtensionFiles.length > 0) {
    showFileFixerError(
      buildErrorListHtml(
        invalidExtensionFiles.map(
          (file) =>
            `File "<strong>${escapeHtml(file.name)}</strong>" is invalid because only .xlsx files are allowed.`
        )
      )
    );
    return;
  }

  try {
    latestFileFixerResults = [];

    for (const file of selectedFileFixerFiles) {
      const fileData = await readFileAsArrayBuffer(file);
const workbook = XLSX.read(fileData, { type: "array" });
const fixedResult =
  selectedFileFixerMode === FILE_FIXER_MODE_ONE_SHEET
    ? fixWorkbookIntoOneSheet(file, workbook)
    : fixWorkbook(file, workbook);
          latestFileFixerResults.push(fixedResult);

      downloadWorkbook(fixedResult.fixedWorkbook, fixedResult.fixedFileName);
    }

    renderFileFixerReport();
} catch (error) {
  console.error("File Fixer processing failed:", error);

  showFileFixerError(
    `Could not process the file.<br><br>
    <strong>Real error:</strong> ${escapeHtml(error.message || error)}`
  );
}
}

function fixWorkbook(file, workbook) {
  const fixedWorkbook = XLSX.utils.book_new();

  let totalRows = 0;
  let filledRows = 0;
  let emptyRows = 0;
  let movedPhones = 0;
  let movedEmails = 0;
  let movedWebsites = 0;
  let duplicateRows = 0;

  const seenRows = new Set();

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return;

    const matrix = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      raw: true,
      blankrows: true,
    });

    if (matrix.length === 0) {
      const emptySheet = XLSX.utils.aoa_to_sheet([FIXED_HEADERS]);
      XLSX.utils.book_append_sheet(fixedWorkbook, emptySheet, safeSheetName(sheetName));
      return;
    }

const dataRows = matrix.slice(1);
const fixedRows = [FIXED_HEADERS];

const fixedRowResults = [];

dataRows.forEach((row) => {
  totalRows++;

  if (isRowEmpty(row)) {
    emptyRows++;
    return;
  }

  filledRows++;

  const fixedRowResult = fixSingleRow(row);
  fixedRowResults.push(fixedRowResult);

  movedPhones += fixedRowResult.movedPhones;
  movedEmails += fixedRowResult.movedEmails;
  movedWebsites += fixedRowResult.movedWebsites;
});

const mergedRows = mergeDuplicateCompanyRows(fixedRowResults);

duplicateRows += Math.max(fixedRowResults.length - mergedRows.length, 0);

mergedRows
  .sort(sortFixedRows)
  .forEach((fixedRow) => {
    fixedRows.push(fixedRow);
  });


const fixedSheet = XLSX.utils.aoa_to_sheet(fixedRows);
styleFixedHeaderRow(fixedSheet);
fixedSheet["!cols"] = buildFixedColumnWidths();

    XLSX.utils.book_append_sheet(fixedWorkbook, fixedSheet, safeSheetName(sheetName));
  });

  const fixedFileName = buildFixedFileName(file.name);

  return {
    originalFileName: file.name,
    fixedFileName,
    originalSizeBytes: file.size,
    fixedWorkbook,
    totalRows,
    filledRows,
    emptyRows,
    duplicateRows,
    movedPhones,
    movedEmails,
    movedWebsites,
  };
}


function fixWorkbookIntoOneSheet(file, workbook) {
  const fixedWorkbook = XLSX.utils.book_new();

  let totalRows = 0;
  let filledRows = 0;
  let emptyRows = 0;
  let movedPhones = 0;
  let movedEmails = 0;
  let movedWebsites = 0;
  let duplicateRows = 0;

  const allFixedRowResults = [];

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return;

    const matrix = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      raw: true,
      blankrows: true,
    });

    const dataRows = matrix.slice(1);

    dataRows.forEach((row) => {
      totalRows++;

      if (isRowEmpty(row)) {
        emptyRows++;
        return;
      }

      filledRows++;

      const fixedRowResult = fixSingleRow(row);
      allFixedRowResults.push(fixedRowResult);

      movedPhones += fixedRowResult.movedPhones;
      movedEmails += fixedRowResult.movedEmails;
      movedWebsites += fixedRowResult.movedWebsites;
    });
  });

  const mergedRows = mergeDuplicateCompanyRows(allFixedRowResults);

  duplicateRows = Math.max(allFixedRowResults.length - mergedRows.length, 0);

  const fixedRows = [FIXED_HEADERS];

  mergedRows
    .sort(sortFixedRows)
    .forEach((fixedRow) => {
      fixedRows.push(fixedRow);
    });

  const fixedSheet = XLSX.utils.aoa_to_sheet(fixedRows);
  styleFixedHeaderRow(fixedSheet);
  fixedSheet["!cols"] = buildFixedColumnWidths();

  XLSX.utils.book_append_sheet(fixedWorkbook, fixedSheet, "Fixed Companies");

  return {
    originalFileName: file.name,
    fixedFileName: buildFixedFileName(file.name),
    originalSizeBytes: file.size,
    fixedWorkbook,
    totalRows,
    filledRows,
    emptyRows,
    duplicateRows,
    movedPhones,
    movedEmails,
    movedWebsites,
  };
}

function mergeDuplicateCompanyRows(fixedRowResults) {
  const grouped = new Map();

  fixedRowResults.forEach((result) => {
    const row = result.fixedRow;
    const key = buildCompanyMergeKey(row);

    if (!key) {
      grouped.set(`unique_${grouped.size}_${Date.now()}_${Math.random()}`, row);
      return;
    }

    if (!grouped.has(key)) {
      grouped.set(key, [...row]);
      return;
    }

    const existingRow = grouped.get(key);

    mergeUniqueCell(existingRow, row, 1);  // Phone 1
    mergeUniqueCell(existingRow, row, 2);  // Phone 2
    mergeDescription(existingRow, row);
mergeUniqueCell(existingRow, row, 4);  // Line 1
mergeUniqueCell(existingRow, row, 5);  // Line 2
mergeUniqueCell(existingRow, row, 6);  // Line 3
mergeUniqueCell(existingRow, row, 7);  // Line 4
mergeUniqueCell(existingRow, row, 8);  // Location
    mergeUniqueCell(existingRow, row, 7);  // Location
    mergeDescription(existingRow, row);
    mergeUniqueCell(existingRow, row, 9);  // Email
    mergeUniqueCell(existingRow, row, 10); // Website
  });

  return [...grouped.values()];
}

function buildCompanyMergeKey(row) {
  const name = normalizeValue(row[0]).toLowerCase();
const location = normalizeValue(row[8]).toLowerCase();
  const email = normalizeValue(row[9]).toLowerCase();
  const website = normalizeValue(row[10]).toLowerCase();

  if (!name) return "";

  return [name, location, email, website].filter(Boolean).join("__");
}

function mergeUniqueCell(existingRow, newRow, columnIndex) {
  const existingValue = normalizeValue(existingRow[columnIndex]);
  const newValue = normalizeValue(newRow[columnIndex]);

  if (!newValue) return;

  if (!existingValue) {
    existingRow[columnIndex] = newValue;
    return;
  }

  const existingParts = existingValue
    .split(" | ")
    .map((item) => normalizeValue(item).toLowerCase());

  if (!existingParts.includes(newValue.toLowerCase())) {
    existingRow[columnIndex] = `${existingValue} | ${newValue}`;
  }
}

function mergeDescription(existingRow, newRow) {
const existingDescription = normalizeValue(existingRow[3]);
const newDescription = normalizeValue(newRow[3]);

  if (!newDescription) return;

  if (!existingDescription) {
existingRow[3] = newDescription;
    return;
  }

  const existingParts = existingDescription
    .split(" | ")
    .map((item) => normalizeValue(item).toLowerCase());

  const newParts = newDescription
    .split(" | ")
    .map(normalizeValue)
    .filter(Boolean);

  newParts.forEach((part) => {
    if (!existingParts.includes(part.toLowerCase())) {
existingRow[3] += ` | ${part}`;
    }
  });
}

function sortFixedRows(a, b) {
  const completenessA = getRowCompletenessScore(a);
  const completenessB = getRowCompletenessScore(b);

  if (completenessB !== completenessA) {
    return completenessB - completenessA;
  }

  return normalizeValue(a[0]).localeCompare(normalizeValue(b[0]), undefined, {
    sensitivity: "base",
  });
}

function getRowCompletenessScore(row) {
  return row.filter((value) => normalizeValue(value)).length;
}

function fixSingleRow(row) {
  const values = Array.isArray(row) ? row.map(normalizeValue) : [];

  const fixedRow = new Array(FIXED_HEADERS.length).fill("");

  const phones = [];
  const emails = [];
  const websites = [];
  const remainingText = [];

  values.forEach((value) => {
    if (!value) return;

    if (isEmail(value)) {
      addUnique(emails, value);
      return;
    }

    if (isWebsite(value)) {
      addUnique(websites, value);
      return;
    }

    if (isPhoneLike(value)) {
      addUnique(phones, cleanPhone(value));
      return;
    }

    remainingText.push(value);
  });

  fixedRow[0] = pickName(values, remainingText);

  fixedRow[1] = phones[0] || "";
  fixedRow[2] = phones[1] || "";
fixedRow[3] = buildDescription(remainingText, fixedRow[0], fixedRow[8]);

fixedRow[4] = phones[2] || "";
fixedRow[5] = phones[3] || "";
fixedRow[6] = phones[4] || "";
fixedRow[7] = phones[5] || "";

fixedRow[8] = pickLocation(remainingText, values);
fixedRow[9] = emails[0] || "";
fixedRow[10] = websites[0] || "";

  return {
    fixedRow,
    movedPhones: phones.length,
    movedEmails: emails.length,
    movedWebsites: websites.length,
  };
}

function pickName(values, remainingText) {
  const firstValue = normalizeValue(values[0]);

  if (
    firstValue &&
    !isPhoneLike(firstValue) &&
    !isEmail(firstValue) &&
    !isWebsite(firstValue)
  ) {
    return firstValue;
  }

  return remainingText[0] || "";
}

function pickLocation(remainingText, originalValues) {
  const originalLocation = normalizeValue(originalValues[7]);

  if (
    originalLocation &&
    !isPhoneLike(originalLocation) &&
    !isEmail(originalLocation) &&
    !isWebsite(originalLocation)
  ) {
    return originalLocation;
  }

  const locationCandidate = remainingText.find((value) => {
    if (isPhoneLike(value) || isEmail(value) || isWebsite(value)) return false;

    const text = value.toLowerCase();

    return (
      text.includes("lebanon") ||
      text.includes("beirut") ||
      text.includes("dbayeh") ||
      text.includes("jounieh") ||
      text.includes("tripoli") ||
      text.includes("saida") ||
      text.includes("zahle") ||
      text.includes("maten") ||
      text.includes("metn") ||
      text.includes("highway") ||
      text.includes("building") ||
      text.includes("floor") ||
      text.includes("street") ||
      text.includes("road") ||
      text.includes("p.o.box") ||
      text.includes("po box") ||
      text.includes("بيروت") ||
      text.includes("لبنان") ||
      text.includes("جبل") ||
      text.includes("شارع")
    );
  });

  return locationCandidate || "";
}

function buildDescription(remainingText, name, location) {
  return remainingText
    .filter((value) => value !== name && value !== location)
    .join(" | ");
}

function buildDuplicateKey(fixedRow) {
  const name = normalizeValue(fixedRow[0]).toLowerCase();
  const phone1 = normalizePhoneForCompare(fixedRow[1]);
  const phone2 = normalizePhoneForCompare(fixedRow[2]);
  const email = normalizeValue(fixedRow[9]).toLowerCase();

  const key = [name, phone1, phone2, email].filter(Boolean).join("__");

  return key;
}

function renderFileFixerReport() {
  const container = document.getElementById("fileFixerReportContainer");
  if (!container) return;

  const cardsHtml = latestFileFixerResults
    .map((result, index) => {
      return `
        <div class="file-fixer-report-card">
          <h3>${escapeHtml(result.fixedFileName)}</h3>

          <p><strong>Original file:</strong> ${escapeHtml(result.originalFileName)}</p>
          <p><strong>Total rows:</strong> ${result.totalRows}</p>
          <p><strong>Filled rows:</strong> ${result.filledRows}</p>
          <p><strong>Empty rows:</strong> ${result.emptyRows}</p>
          <p><strong>Possible duplicate rows:</strong> ${result.duplicateRows}</p>
          <p><strong>Detected phone values:</strong> ${result.movedPhones}</p>
          <p><strong>Detected emails:</strong> ${result.movedEmails}</p>
          <p><strong>Detected websites:</strong> ${result.movedWebsites}</p>
          <p><strong>Original size:</strong> ${formatBytes(result.originalSizeBytes)}</p>

          <button
            type="button"
            class="file-fixer-download-btn"
            data-download-fixed-index="${index}"
          >
            Download Again
          </button>
        </div>
      `;
    })
    .join("");

  container.innerHTML = `
    <div class="file-fixer-summary-box">
      <h2>File Fixer Report</h2>
      <p>
        The system processed <strong>${latestFileFixerResults.length}</strong>
        ${latestFileFixerResults.length === 1 ? "file" : "files"}.
      </p>
      <p>
        Each row was fixed independently. No row data was mixed with another row.
      </p>
    </div>

    <div class="file-fixer-report-grid">
      ${cardsHtml}
    </div>
  `;

  document.querySelectorAll("[data-download-fixed-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.downloadFixedIndex);
      const result = latestFileFixerResults[index];

      if (!result) return;

      downloadWorkbook(result.fixedWorkbook, result.fixedFileName);
    });
  });
}

function clearFileFixerReport() {
  const reportContainer = document.getElementById("fileFixerReportContainer");
  if (!reportContainer) return;

  reportContainer.innerHTML = "";
  latestFileFixerResults = [];
}

function clearFileFixerError() {
  const errorEl = document.getElementById("fileFixerErrorLabel");
  if (!errorEl) return;

  errorEl.innerHTML = "";
  errorEl.classList.remove("show");
}

function showFileFixerError(message) {
  const errorEl = document.getElementById("fileFixerErrorLabel");
  if (!errorEl) return;

  errorEl.innerHTML = message;
  errorEl.classList.add("show");
}

async function convertLiveFileToStoredPreviewFile(file) {
  const data = await readFileAsArrayBuffer(file);
  const workbook = XLSX.read(data, { type: "array" });

  return {
    name: file.name,
    sheets: workbook.SheetNames.map((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      return {
        sheetName,
        rows,
      };
    }),
  };
}

function buildFixedColumnWidths() {
  return [
    { wch: 32 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 28 },
    { wch: 55 },
    { wch: 32 },
    { wch: 32 },
  ];
}
function styleFixedHeaderRow(worksheet) {
  FIXED_HEADERS.forEach((_, index) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index });

    if (!worksheet[cellAddress]) return;

    worksheet[cellAddress].s = {
      fill: {
        patternType: "solid",
        fgColor: { rgb: "FFD966" },
      },
      font: {
        bold: true,
        color: { rgb: "000000" },
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
      border: {
        top: { style: "thin", color: { rgb: "999999" } },
        bottom: { style: "thin", color: { rgb: "999999" } },
        left: { style: "thin", color: { rgb: "999999" } },
        right: { style: "thin", color: { rgb: "999999" } },
      },
    };
  });
}

function safeSheetName(sheetName) {
  return String(sheetName || "Sheet1").slice(0, 31);
}

function buildFixedFileName(fileName) {
  const cleanName = String(fileName || "FixedFile.xlsx");

  if (cleanName.toLowerCase().endsWith(".xlsx")) {
    return cleanName.replace(/\.xlsx$/i, "_FIXED.xlsx");
  }

  return `${cleanName}_FIXED.xlsx`;
}

function downloadWorkbook(workbook, fileName) {
  XLSX.writeFile(workbook, fileName);
}

function buildErrorListHtml(messages) {
  return `
    <strong>Some uploaded files cannot be processed:</strong>
    <ul class="file-fixer-error-list">
      ${messages.map((message) => `<li>${message}</li>`).join("")}
    </ul>
  `;
}

function isRowEmpty(row) {
  return !Array.isArray(row) || row.every((value) => !normalizeValue(value));
}

function normalizeValue(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeValue(value));
}

function isWebsite(value) {
  const text = normalizeValue(value).toLowerCase();

  return (
    text.startsWith("http://") ||
    text.startsWith("https://") ||
    text.startsWith("www.") ||
    /^[a-z0-9-]+\.[a-z]{2,}(\/.*)?$/i.test(text)
  );
}

function isPhoneLike(value) {
  const text = normalizeValue(value);

  if (!text) return false;

  if (isEmail(text) || isWebsite(text)) return false;

  const digits = text.replace(/\D/g, "");

  return digits.length >= 6 && digits.length <= 15;
}

function cleanPhone(value) {
  return normalizeValue(value);
}

function normalizePhoneForCompare(value) {
  return normalizeValue(value).replace(/\D/g, "");
}

function addUnique(list, value) {
  const cleanValue = normalizeValue(value);

  if (!cleanValue) return;

  const exists = list.some(
    (item) => item.toLowerCase() === cleanValue.toLowerCase()
  );

  if (!exists) {
    list.push(cleanValue);
  }
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "Unknown";

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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