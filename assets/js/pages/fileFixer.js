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
  "Other phone numbers",
];

// Column positions inside a fixed row.
const COL_NAME = 0;
const COL_DESCRIPTION = 3;
const COL_LOCATION = 8;
const COL_EMAIL = 9;
const COL_WEBSITE = 10;
const COL_OTHER_PHONES = 11;
const PHONE_SLOT_INDEXES = [1, 2, 4, 5, 6, 7];

// Excel refuses cells longer than 32,767 characters.
const EXCEL_MAX_CELL_LENGTH = 32000;

const FILE_FIXER_MODE_SAME_SHEETS = "sameSheets";
const FILE_FIXER_MODE_ONE_SHEET = "oneSheet";

let selectedFileFixerMode = FILE_FIXER_MODE_SAME_SHEETS;

const FILE_FIXER_MAIN_MODE_FIX = "fix";
const FILE_FIXER_MAIN_MODE_ORGANIZE = "organize";

const ORGANIZER_MODE_SEPARATE = "separate";
const ORGANIZER_MODE_ALL_IN_ONE = "allInOne";
const ORGANIZER_KEYWORDS_STORAGE_KEY = "fileFixerOrganizerCategories";

const FILE_FIXER_OUTPUT_SEPARATE = "separate";
const FILE_FIXER_OUTPUT_ONE_FILE = "oneFile";

let selectedFileFixerOutputMode = FILE_FIXER_OUTPUT_SEPARATE;

let selectedOrganizerMode = ORGANIZER_MODE_SEPARATE;

let selectedFileFixerMainMode = "";
let selectedOrganizeFilterFiles = [];

export function initFileFixerPage() {
  const fileInput = document.getElementById("fileFixerInput");
  const processBtn = document.getElementById("processFileFixerBtn");
  const clearFileFixerBtn = document.getElementById("clearFileFixerBtn");
  const fixMessedFileModeBtn = document.getElementById("fixMessedFileModeBtn");
  const organizeFilterModeBtn = document.getElementById("organizeFilterModeBtn");
  const organizeFilterInput = document.getElementById("organizeFilterInput");
  const processOrganizeFilterBtn = document.getElementById("processOrganizeFilterBtn");
  const clearOrganizeFilterBtn = document.getElementById("clearOrganizeFilterBtn");
  const fileFixerBackBtn = document.getElementById("fileFixerBackBtn");
  const organizeFilterBackBtn = document.getElementById("organizeFilterBackBtn");
  const fileFixerSeparateFilesOutputBtn = document.getElementById("fileFixerSeparateFilesOutputBtn");
  const fileFixerOneFileOutputBtn = document.getElementById("fileFixerOneFileOutputBtn");
  const organizerSeparateFilesModeBtn = document.getElementById("organizerSeparateFilesModeBtn");
  const organizerAllInOneModeBtn = document.getElementById("organizerAllInOneModeBtn");
  const sameSheetsModeBtn = document.getElementById("sameSheetsModeBtn");
  const oneSheetModeBtn = document.getElementById("oneSheetModeBtn");

  function updateOrganizerModeButtons() {
    organizerSeparateFilesModeBtn?.classList.toggle(
      "active",
      selectedOrganizerMode === ORGANIZER_MODE_SEPARATE
    );

    organizerAllInOneModeBtn?.classList.toggle(
      "active",
      selectedOrganizerMode === ORGANIZER_MODE_ALL_IN_ONE
    );
  }

  function updateFileFixerModeButtons() {
    sameSheetsModeBtn?.classList.toggle(
      "active",
      selectedFileFixerMode === FILE_FIXER_MODE_SAME_SHEETS
    );

    oneSheetModeBtn?.classList.toggle(
      "active",
      selectedFileFixerMode === FILE_FIXER_MODE_ONE_SHEET
    );
  }

  function updateFileFixerOutputButtons() {
    fileFixerSeparateFilesOutputBtn?.classList.toggle(
      "active",
      selectedFileFixerOutputMode === FILE_FIXER_OUTPUT_SEPARATE
    );

    fileFixerOneFileOutputBtn?.classList.toggle(
      "active",
      selectedFileFixerOutputMode === FILE_FIXER_OUTPUT_ONE_FILE
    );
  }

  fileInput?.addEventListener("change", handleFileFixerFileSelection);
  processBtn?.addEventListener("click", handleProcessFileFixerFiles);
  clearFileFixerBtn?.addEventListener("click", clearFileFixerFiles);

  fixMessedFileModeBtn?.addEventListener("click", () => {
    selectedFileFixerMainMode = FILE_FIXER_MAIN_MODE_FIX;
    updateMainFileFixerMode();
  });

  organizeFilterModeBtn?.addEventListener("click", () => {
    selectedFileFixerMainMode = FILE_FIXER_MAIN_MODE_ORGANIZE;
    updateMainFileFixerMode();
  });

  organizeFilterInput?.addEventListener("change", handleOrganizeFilterFileSelection);
  processOrganizeFilterBtn?.addEventListener("click", handleProcessOrganizeFilterFile);
  clearOrganizeFilterBtn?.addEventListener("click", clearOrganizeFilterFiles);

  fileFixerBackBtn?.addEventListener("click", () => {
    selectedFileFixerMainMode = "";
    updateMainFileFixerMode();
  });

  organizeFilterBackBtn?.addEventListener("click", () => {
    selectedFileFixerMainMode = "";
    updateMainFileFixerMode();
  });

  organizerSeparateFilesModeBtn?.addEventListener("click", () => {
    selectedOrganizerMode = ORGANIZER_MODE_SEPARATE;
    updateOrganizerModeButtons();
  });

  organizerAllInOneModeBtn?.addEventListener("click", () => {
    selectedOrganizerMode = ORGANIZER_MODE_ALL_IN_ONE;
    updateOrganizerModeButtons();
  });

  sameSheetsModeBtn?.addEventListener("click", () => {
    selectedFileFixerMode = FILE_FIXER_MODE_SAME_SHEETS;
    updateFileFixerModeButtons();
    clearFileFixerReport();
    clearFileFixerError();
  });

  oneSheetModeBtn?.addEventListener("click", () => {
    selectedFileFixerMode = FILE_FIXER_MODE_ONE_SHEET;
    updateFileFixerModeButtons();
    clearFileFixerReport();
    clearFileFixerError();
  });

  fileFixerSeparateFilesOutputBtn?.addEventListener("click", () => {
    selectedFileFixerOutputMode = FILE_FIXER_OUTPUT_SEPARATE;
    updateFileFixerOutputButtons();
    clearFileFixerReport();
  });

  fileFixerOneFileOutputBtn?.addEventListener("click", () => {
    selectedFileFixerOutputMode = FILE_FIXER_OUTPUT_ONE_FILE;
    updateFileFixerOutputButtons();
    clearFileFixerReport();
  });

  const addOrganizerSheetBtn = document.getElementById("addOrganizerSheetBtn");
  addOrganizerSheetBtn?.addEventListener("click", addOrganizerSheetCategory);

  updateOrganizerModeButtons();
  updateFileFixerModeButtons();
  updateFileFixerOutputButtons();
  renderOrganizerKeywords();
  updateMainFileFixerMode();
  renderSelectedFileFixerFiles();
  clearFileFixerError();
  clearFileFixerReport();
}

function updateMainFileFixerMode() {
  const isChoosingMode = selectedFileFixerMainMode === "";

  document.getElementById("fileFixerMainChooser")?.classList.toggle(
    "file-fixer-hidden",
    !isChoosingMode
  );

  document.getElementById("fixMessedFileModeBtn")?.classList.toggle(
    "active",
    selectedFileFixerMainMode === FILE_FIXER_MAIN_MODE_FIX
  );

  document.getElementById("organizeFilterModeBtn")?.classList.toggle(
    "active",
    selectedFileFixerMainMode === FILE_FIXER_MAIN_MODE_ORGANIZE
  );

  document.getElementById("fixMessedFileSection")?.classList.toggle(
    "file-fixer-hidden",
    selectedFileFixerMainMode !== FILE_FIXER_MAIN_MODE_FIX
  );

  document.getElementById("organizeFilterSection")?.classList.toggle(
    "file-fixer-hidden",
    selectedFileFixerMainMode !== FILE_FIXER_MAIN_MODE_ORGANIZE
  );

  clearFileFixerError();
  clearOrganizeFilterError();
  clearFileFixerReport();
}

/* ---------- ORGANIZER: FILE SELECTION ---------- */

function handleOrganizeFilterFileSelection(event) {
  const incomingFiles = Array.from(event.target.files || []);

  incomingFiles.forEach((file) => {
    const alreadyExists = selectedOrganizeFilterFiles.some(
      (existingFile) =>
        existingFile.name === file.name &&
        existingFile.size === file.size &&
        existingFile.lastModified === file.lastModified
    );

    if (!alreadyExists) {
      selectedOrganizeFilterFiles.push(file);
    }
  });

  event.target.value = "";

  renderSelectedOrganizeFilterFiles();
  clearOrganizeFilterError();
  clearFileFixerReport();
}

function renderSelectedOrganizeFilterFiles() {
  const selectedFileEl = document.getElementById("organizeFilterSelectedFile");
  if (!selectedFileEl) return;

  selectedFileEl.innerHTML = "";

  if (selectedOrganizeFilterFiles.length === 0) {
    return;
  }

  const listWrapper = document.createElement("div");
  listWrapper.className = "file-fixer-selected-files-list";

  selectedOrganizeFilterFiles.forEach((file, index) => {
    listWrapper.appendChild(
      buildSelectedFilePill(file, index, () => {
        selectedOrganizeFilterFiles = selectedOrganizeFilterFiles.filter(
          (_, fileIndex) => fileIndex !== index
        );

        renderSelectedOrganizeFilterFiles();
        clearOrganizeFilterError();
        clearFileFixerReport();
      })
    );
  });

  selectedFileEl.appendChild(listWrapper);
}

function clearOrganizeFilterError() {
  const errorEl = document.getElementById("organizeFilterErrorLabel");
  if (!errorEl) return;

  errorEl.innerHTML = "";
  errorEl.classList.remove("show");
}

function showOrganizeFilterError(message) {
  const errorEl = document.getElementById("organizeFilterErrorLabel");
  if (!errorEl) return;

  errorEl.innerHTML = message;
  errorEl.classList.add("show");
}

async function handleProcessOrganizeFilterFile() {
  clearOrganizeFilterError();
  clearFileFixerReport();

  if (selectedOrganizeFilterFiles.length === 0) {
    showOrganizeFilterError("Please upload at least one Excel or CSV file first.");
    return;
  }

  const invalidFiles = selectedOrganizeFilterFiles.filter(
    (file) => !isSupportedSpreadsheetFile(file.name)
  );

  if (invalidFiles.length > 0) {
    showOrganizeFilterError("Only Excel or CSV files are allowed.");
    return;
  }

  try {
    const fileWorkbookPairs = [];

    for (const file of selectedOrganizeFilterFiles) {
      const workbook = await readWorkbookFromFile(file);
      fileWorkbookPairs.push({ fileName: file.name, workbook });
    }

    if (selectedOrganizerMode === ORGANIZER_MODE_ALL_IN_ONE) {
      const combinedWorkbook = organizeMultipleWorkbooksByKeywords(fileWorkbookPairs);
      downloadWorkbook(combinedWorkbook, "ALL_ORGANIZED_FILES.xlsx");
      return;
    }

    fileWorkbookPairs.forEach(({ fileName, workbook }) => {
      const organizedWorkbook = organizeWorkbookByKeywords(workbook, fileName);
      downloadWorkbook(organizedWorkbook, buildOrganizedFileName(fileName));
    });
  } catch (error) {
    console.error("Organizer failed:", error);
    showOrganizeFilterError(
      `Could not organize the file.<br><br><strong>Real error:</strong> ${escapeHtml(error.message || error)}`
    );
  }
}

/* ---------- FIXER: FILE SELECTION ---------- */

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
    listWrapper.appendChild(
      buildSelectedFilePill(file, index, () => removeSelectedFileFixerFile(index))
    );
  });

  selectedFileEl.appendChild(listWrapper);
}

// One row in the "selected files" list: name (click to preview), Preview button, remove button.
function buildSelectedFilePill(file, index, onRemove) {
  const openPreview = async () => {
    try {
      await openFilePreview(file);
    } catch (error) {
      console.error("Preview failed:", error);
    }
  };

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
  fileName.addEventListener("click", openPreview);

  leftSide.appendChild(label);
  leftSide.appendChild(fileName);

  const rightSide = document.createElement("div");
  rightSide.className = "file-fixer-file-pill-actions";

  const previewBtn = document.createElement("button");
  previewBtn.type = "button";
  previewBtn.className = "file-fixer-small-action-btn";
  previewBtn.textContent = "Preview";
  previewBtn.addEventListener("click", openPreview);

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "file-fixer-small-remove-btn";
  removeBtn.textContent = "✕";
  removeBtn.title = "Remove file";
  removeBtn.addEventListener("click", onRemove);

  rightSide.appendChild(previewBtn);
  rightSide.appendChild(removeBtn);

  row.appendChild(leftSide);
  row.appendChild(rightSide);

  return row;
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

function clearFileFixerFiles() {
  const confirmed = confirm("Are you sure you want to clear all selected files?");
  if (!confirmed) return;

  selectedFileFixerFiles = [];

  const fileInput = document.getElementById("fileFixerInput");
  if (fileInput) {
    fileInput.value = "";
  }

  clearFileFixerError();
  clearFileFixerReport();
  renderSelectedFileFixerFiles();
}

/* ---------- FIXER: PROCESSING ---------- */

async function handleProcessFileFixerFiles() {
  clearFileFixerError();
  clearFileFixerReport();

  if (selectedFileFixerFiles.length === 0) {
    showFileFixerError("Please upload at least one Excel or CSV file first.");
    return;
  }

  const invalidExtensionFiles = selectedFileFixerFiles.filter(
    (file) => !isSupportedSpreadsheetFile(file.name)
  );

  if (invalidExtensionFiles.length > 0) {
    showFileFixerError(
      buildErrorListHtml(
        invalidExtensionFiles.map(
          (file) =>
            `File "<strong>${escapeHtml(file.name)}</strong>" is invalid because only Excel or CSV files are allowed.`
        )
      )
    );
    return;
  }

  const processBtn = document.getElementById("processFileFixerBtn");
  const originalBtnText = processBtn?.textContent;

  if (processBtn) {
    processBtn.disabled = true;
    processBtn.textContent = "Processing...";
  }

  // Let the browser repaint the button before the heavy work starts.
  await new Promise((resolve) => setTimeout(resolve, 30));

  try {
    const collectedFiles = [];

    for (const file of selectedFileFixerFiles) {
      const workbook = await readWorkbookFromFile(file);
      collectedFiles.push(collectFixedEntries(file, workbook));
    }

    latestFileFixerResults = buildFileFixerResults(
      collectedFiles,
      selectedFileFixerMode,
      selectedFileFixerOutputMode
    );

    latestFileFixerResults.forEach((result) => {
      downloadWorkbook(result.fixedWorkbook, result.fixedFileName);
    });

    renderFileFixerReport();
  } catch (error) {
    console.error("File Fixer processing failed:", error);

    showFileFixerError(
      `Could not process the file.<br><br>
      <strong>Real error:</strong> ${escapeHtml(error.message || error)}`
    );
  } finally {
    if (processBtn) {
      processBtn.disabled = false;
      processBtn.textContent = originalBtnText;
    }
  }
}

// Turns the collected rows into the final workbook(s), based on the two choices:
//   sheet layout: same sheets / one sheet
//   download:     separate files / one file
function buildFileFixerResults(collectedFiles, layoutMode, outputMode) {
  if (outputMode === FILE_FIXER_OUTPUT_SEPARATE) {
    return collectedFiles.map((collected) => {
      const built = buildFixedWorkbook(collected.entries, collected.sheetOrder, layoutMode);

      return {
        originalFileName: collected.file.name,
        fixedFileName: buildFixedFileName(collected.file.name),
        originalSizeBytes: collected.file.size,
        fixedWorkbook: built.workbook,
        finalRows: built.finalRows,
        duplicateRows: built.mergedRows,
        ...collected.stats,
      };
    });
  }

  // One file: everything is merged together, so the same company coming from
  // two different files ends up in one row.
  const allEntries = collectedFiles.flatMap((collected) => collected.entries);
  const sheetOrder = [...new Set(collectedFiles.flatMap((collected) => collected.sheetOrder))];
  const built = buildFixedWorkbook(allEntries, sheetOrder, layoutMode);

  const totals = sumStats(collectedFiles.map((collected) => collected.stats));

  return [
    {
      originalFileName: collectedFiles.map((collected) => collected.file.name).join(", "),
      fixedFileName: "ALL_FIXED_FILES.xlsx",
      originalSizeBytes: collectedFiles.reduce((sum, collected) => sum + collected.file.size, 0),
      fixedWorkbook: built.workbook,
      finalRows: built.finalRows,
      duplicateRows: built.mergedRows,
      ...totals,
    },
  ];
}

function sumStats(statsList) {
  const totals = createEmptyStats();

  statsList.forEach((stats) => {
    Object.keys(totals).forEach((key) => {
      totals[key] += stats[key] || 0;
    });
  });

  return totals;
}

function createEmptyStats() {
  return {
    totalRows: 0,
    filledRows: 0,
    emptyRows: 0,
    movedPhones: 0,
    movedEmails: 0,
    movedWebsites: 0,
  };
}

// Reads every sheet of one workbook and fixes every row on its own.
// Nothing is merged yet; merging happens in buildFixedWorkbook.
function collectFixedEntries(file, workbook) {
  const stats = createEmptyStats();
  const entries = [];
  const sheetOrder = [];

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return;

    sheetOrder.push(sheetName);

    const matrix = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      raw: true,
      blankrows: true,
    });

    getDataRows(matrix).forEach((rawRow) => {
      stats.totalRows++;

      const row = prepareRawRow(rawRow);

      if (isRowEmpty(row)) {
        stats.emptyRows++;
        return;
      }

      stats.filledRows++;

      const fixedRowResult = fixSingleRow(row);

      stats.movedPhones += fixedRowResult.movedPhones;
      stats.movedEmails += fixedRowResult.movedEmails;
      stats.movedWebsites += fixedRowResult.movedWebsites;

      entries.push({ sheetName, fixedRow: fixedRowResult.fixedRow });
    });
  });

  return { file, entries, sheetOrder, stats };
}

// Groups the fixed rows into sheets, merges duplicates by company name, and builds the workbook.
function buildFixedWorkbook(entries, sheetOrder, layoutMode) {
  const workbook = XLSX.utils.book_new();
  const rowsBySheet = new Map();

  if (layoutMode === FILE_FIXER_MODE_ONE_SHEET) {
    rowsBySheet.set("Fixed Companies", entries.map((entry) => [...entry.fixedRow]));
  } else {
    sheetOrder.forEach((sheetName) => rowsBySheet.set(sheetName, []));

    entries.forEach((entry) => {
      rowsBySheet.get(entry.sheetName).push([...entry.fixedRow]);
    });
  }

  let mergedRows = 0;
  let finalRows = 0;

  rowsBySheet.forEach((rows, sheetName) => {
    const uniqueRows = mergeRowsByCompanyName(rows);

    mergedRows += rows.length - uniqueRows.length;
    finalRows += uniqueRows.length;

    const sheetRows = [FIXED_HEADERS, ...uniqueRows.sort(sortFixedRows).map(limitCellLengths)];

    const fixedSheet = XLSX.utils.aoa_to_sheet(sheetRows);
    styleFixedHeaderRow(fixedSheet);
    fixedSheet["!cols"] = buildFixedColumnWidths();

    XLSX.utils.book_append_sheet(
      workbook,
      fixedSheet,
      getUniqueWorkbookSheetName(workbook, sheetName)
    );
  });

  return { workbook, mergedRows, finalRows };
}

/* ---------- MERGING ---------- */

// Same company name (ignoring case, spaces, accents and punctuation) => one row.
// Phones, descriptions, locations, emails and websites are combined without repeats.
function mergeRowsByCompanyName(rows) {
  const groupedRows = new Map();
  const rowsWithoutName = [];

  rows.forEach((row) => {
    const key = buildCompanyNameKey(row[COL_NAME]);

    if (!key) {
      rowsWithoutName.push(row);
      return;
    }

    const existingRow = groupedRows.get(key);

    if (!existingRow) {
      groupedRows.set(key, row);
      return;
    }

    mergePhoneCells(existingRow, row);
    mergeListCell(existingRow, row, COL_DESCRIPTION);
    mergeListCell(existingRow, row, COL_LOCATION);
    mergeListCell(existingRow, row, COL_EMAIL);
    mergeListCell(existingRow, row, COL_WEBSITE);
  });

  return [...groupedRows.values(), ...rowsWithoutName];
}

function buildCompanyNameKey(name) {
  return normalizeForKeywordSearch(name);
}

// Adds the values of newRow[columnIndex] to existingRow[columnIndex], separated by " | ", skipping repeats.
function mergeListCell(existingRow, newRow, columnIndex) {
  const existingParts = splitListCell(existingRow[columnIndex]);
  const seen = new Set(existingParts.map((part) => part.toLowerCase()));

  splitListCell(newRow[columnIndex]).forEach((part) => {
    const key = part.toLowerCase();
    if (seen.has(key)) return;

    seen.add(key);
    existingParts.push(part);
  });

  existingRow[columnIndex] = existingParts.join(" | ");
}

function splitListCell(value) {
  return normalizeValue(value)
    .split(" | ")
    .map(normalizeValue)
    .filter(Boolean);
}

function mergePhoneCells(existingRow, newRow) {
  const phones = getRowPhones(existingRow);

  getRowPhones(newRow).forEach((phone) => addUniquePhone(phones, phone));

  setRowPhones(existingRow, phones);
}

// All phones of a fixed row, in order: phone 1, phone 2, line 1-4, then "Other phone numbers".
function getRowPhones(row) {
  const phones = [];

  [...PHONE_SLOT_INDEXES, COL_OTHER_PHONES].forEach((index) => {
    extractPhonesFromText(row[index]).forEach((phone) => addUniquePhone(phones, phone));
  });

  return phones;
}

// First 6 phones go into the phone/line columns, the rest into "Other phone numbers".
function setRowPhones(row, phones) {
  PHONE_SLOT_INDEXES.forEach((index, position) => {
    row[index] = phones[position] || "";
  });

  row[COL_OTHER_PHONES] = phones.slice(PHONE_SLOT_INDEXES.length).join(" | ");
}

// Rows with a phone come first, then A → Z by company name.
function sortFixedRows(a, b) {
  const aHasPhone = normalizeValue(a[1]) !== "";
  const bHasPhone = normalizeValue(b[1]) !== "";

  if (aHasPhone !== bHasPhone) {
    return aHasPhone ? -1 : 1;
  }

  return normalizeValue(a[COL_NAME]).localeCompare(normalizeValue(b[COL_NAME]), undefined, {
    sensitivity: "base",
  });
}

function limitCellLengths(row) {
  return row.map((value) => {
    const text = normalizeValue(value);
    if (text.length <= EXCEL_MAX_CELL_LENGTH) return text;

    return `${text.slice(0, EXCEL_MAX_CELL_LENGTH)} …(cut, too long for Excel)`;
  });
}

/* ---------- FIXING ONE ROW ---------- */

function fixSingleRow(row) {
  const values = Array.isArray(row) ? row.map(normalizeValue) : [];

  const fixedRow = new Array(FIXED_HEADERS.length).fill("");

  const phones = [];
  const emails = [];
  const websites = [];
  const remainingText = [];

  values.forEach((value) => {
    if (!value) return;

    const extractedPhones = extractPhonesFromText(value);

    extractedPhones.forEach((phone) => {
      addUniquePhone(phones, phone);
    });

    let valueWithoutPhones = extractedPhones.length
      ? removeExtractedPhonesFromText(value, extractedPhones)
      : value;

    // What is left after removing phones is often junk like "0 ; 0" or "+" or "/1/2/3".
    if (extractedPhones.length && !/\p{L}/u.test(valueWithoutPhones)) {
      return;
    }

    valueWithoutPhones = cleanCellValue(valueWithoutPhones);
    if (!valueWithoutPhones) return;

    if (isEmail(valueWithoutPhones)) {
      addUnique(emails, valueWithoutPhones);
      return;
    }

    if (isWebsite(valueWithoutPhones)) {
      addUnique(websites, valueWithoutPhones);
      return;
    }

    remainingText.push(valueWithoutPhones);
  });

  fixedRow[COL_NAME] = pickName(values);
  fixedRow[COL_LOCATION] = pickLocation(remainingText, values);
  fixedRow[COL_DESCRIPTION] = buildDescription(
    remainingText,
    fixedRow[COL_NAME],
    fixedRow[COL_LOCATION]
  );
  fixedRow[COL_EMAIL] = emails.join(" | ");
  fixedRow[COL_WEBSITE] = websites.join(" | ");

  setRowPhones(fixedRow, phones);

  return {
    fixedRow,
    movedPhones: phones.length,
    movedEmails: emails.length,
    movedWebsites: websites.length,
  };
}

function pickName(values) {
  const cleanValues = values
    .map(normalizeValue)
    .filter(Boolean)
    .filter((value) => !isBadNameCandidate(value));

  return cleanValues[0] || "";
}

function isBadNameCandidate(value) {
  const text = normalizeValue(value);
  const lowerText = text.toLowerCase();

  if (!text) return true;

  if (isPhoneLike(text)) return true;
  if (isEmail(text)) return true;
  if (isWebsite(text)) return true;

  if (/^\d+$/.test(text)) return true;
  if (/^[\d\s+\-./()]+$/.test(text)) return true;

  const badWords = [
    "pending",
    "free",
    "corner",
    "no tent",
    "kids",
    "kids part",
    "reservations vendors",
    "boom club",
  ];

  return badWords.includes(lowerText);
}

const LOCATION_WORDS = [
  "lebanon",
  "beirut",
  "dbayeh",
  "jounieh",
  "tripoli",
  "saida",
  "zahle",
  "maten",
  "metn",
  "highway",
  "building",
  "floor",
  "street",
  "road",
  "p.o.box",
  "po box",
  "بيروت",
  "لبنان",
  "جبل",
  "شارع",
];

function pickLocation(remainingText, originalValues) {
  const originalLocation = normalizeValue(originalValues[7]);

  // Column H is only trusted if it contains real words (not "25-258" or a phone).
  if (
    originalLocation &&
    /\p{L}/u.test(originalLocation) &&
    !isPhoneLike(originalLocation) &&
    !isEmail(originalLocation) &&
    !isWebsite(originalLocation)
  ) {
    return originalLocation;
  }

  const locationCandidate = remainingText.find((value) => {
    if (isPhoneLike(value) || isEmail(value) || isWebsite(value)) return false;

    const text = value.toLowerCase();
    return LOCATION_WORDS.some((word) => text.includes(word));
  });

  return locationCandidate || "";
}

function buildDescription(remainingText, name, location) {
  const parts = [];

  remainingText
    .filter((value) => value !== name && value !== location)
    .filter((value) => !isPhoneLike(value))
    .forEach((value) => {
      splitListCell(value).forEach((part) => addUnique(parts, part));
    });

  return parts.join(" | ");
}

/* ---------- RAW ROW CLEANUP ---------- */

// Reads Excel normally; reads CSV as UTF-8 text so Arabic and leading zeros survive.
async function readWorkbookFromFile(file) {
  if (/\.csv$/i.test(file.name)) {
    const text = (await file.text()).replace(/^﻿/, "");
    return XLSX.read(text, { type: "string", raw: true });
  }

  const data = await readFileAsArrayBuffer(file);
  return XLSX.read(data, { type: "array" });
}

// Only skip the first row if it really looks like a header (no phone/email/website).
function getDataRows(matrix) {
  if (!matrix.length) return [];

  const firstRow = prepareRawRow(matrix[0]).filter(Boolean);
  const looksLikeData = firstRow.some(
    (value) => isEmail(value) || isWebsite(value) || extractPhonesFromText(value).length > 0
  );

  return looksLikeData ? matrix : matrix.slice(1);
}

// Fixes rows like ",,,,,,,,jan63s,,,,,,,,," where a whole line is stuck in one cell.
function prepareRawRow(row) {
  if (!Array.isArray(row)) return [];

  const cells = row.map(normalizeValue);
  const filledCells = cells.filter(Boolean);

  // Whole CSV line inside one cell -> split it back into real columns.
  if (filledCells.length === 1 && looksLikeJoinedLine(filledCells[0], true)) {
    return splitDelimitedLine(filledCells[0]);
  }

  // A normal row with one junk cell -> keep only the real values from that cell.
  return cells.map((cell) =>
    looksLikeJoinedLine(cell, false)
      ? splitDelimitedLine(cell).filter(Boolean).join(" | ")
      : cleanCellValue(cell)
  );
}

function looksLikeJoinedLine(text, isOnlyCell) {
  if (!text) return false;
  if (text.includes("\t") || /[,;]\s*[,;]/.test(text)) return true; // ",," or ";;"
  // A single cell with many commas is probably a full line (but "Hamra, Beirut" is not).
  return isOnlyCell && (text.match(/[,;]/g) || []).length >= 4;
}

function detectDelimiter(text) {
  const counts = { ",": 0, ";": 0, "\t": 0 };
  for (const ch of text) if (ch in counts) counts[ch]++;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

// CSV-aware split: keeps "Hamra, Beirut" together when it is inside quotes.
function splitDelimitedLine(text) {
  const delimiter = detectDelimiter(text);
  const parts = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === delimiter && !inQuotes) {
      parts.push(current);
      current = "";
      continue;
    }

    current += ch;
  }

  parts.push(current);
  return parts.map(cleanCellValue);
}

// Removes cells that are only punctuation, and trims stray commas/semicolons at the edges.
function cleanCellValue(value) {
  const text = normalizeValue(value);
  if (!text) return "";
  if (/^[\s,;|.\-_"'+/]+$/.test(text)) return "";
  return text.replace(/^[\s,;|]+|[\s,;|]+$/g, "").trim();
}

/* ---------- REPORT ---------- */

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
          <p><strong>Duplicate rows merged:</strong> ${result.duplicateRows}</p>
          <p><strong>Final companies:</strong> ${result.finalRows}</p>
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
        The system processed <strong>${selectedFileFixerFiles.length}</strong>
        ${selectedFileFixerFiles.length === 1 ? "file" : "files"}.
      </p>
      <p>
        Rows with the same company name were merged into one row: all their phone numbers
        were kept, and their descriptions were combined with " | ".
      </p>
    </div>

    <div class="file-fixer-report-grid">
      ${cardsHtml}
    </div>
  `;

  container.querySelectorAll("[data-download-fixed-index]").forEach((button) => {
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

function clearOrganizeFilterFiles() {
  const confirmed = confirm("Are you sure you want to clear all selected organizer files?");
  if (!confirmed) return;

  selectedOrganizeFilterFiles = [];

  const organizeFilterInput = document.getElementById("organizeFilterInput");
  if (organizeFilterInput) {
    organizeFilterInput.value = "";
  }

  renderSelectedOrganizeFilterFiles();
  clearOrganizeFilterError();
  clearFileFixerReport();
}

function showFileFixerError(message) {
  const errorEl = document.getElementById("fileFixerErrorLabel");
  if (!errorEl) return;

  errorEl.innerHTML = message;
  errorEl.classList.add("show");
}

async function convertLiveFileToStoredPreviewFile(file) {
  const workbook = await readWorkbookFromFile(file);

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

/* ---------- WORKBOOK HELPERS ---------- */

function buildFixedColumnWidths() {
  return [
    { wch: 32 }, // Name
    { wch: 18 }, // Phone 1
    { wch: 18 }, // Phone 2
    { wch: 50 }, // Description
    { wch: 18 }, // Line 1
    { wch: 18 }, // Line 2
    { wch: 18 }, // Line 3
    { wch: 18 }, // Line 4
    { wch: 40 }, // Location
    { wch: 32 }, // E-mail
    { wch: 32 }, // Website
    { wch: 30 }, // Other phone numbers
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
  return String(sheetName || "Sheet1")
    .replace(/[\\/?*[\]:]/g, "")
    .slice(0, 31) || "Sheet";
}

function buildFixedFileName(fileName) {
  const cleanName = String(fileName || "FixedFile.xlsx");

  if (/\.(xlsx|xls|xlsm|csv)$/i.test(cleanName)) {
    return cleanName.replace(/\.(xlsx|xls|xlsm|csv)$/i, "_FIXED.xlsx");
  }

  return `${cleanName}_FIXED.xlsx`;
}

function isSupportedSpreadsheetFile(fileName) {
  return /\.(xlsx|xls|xlsm|csv)$/i.test(String(fileName || ""));
}

function downloadWorkbook(workbook, fileName) {
  XLSX.writeFile(workbook, fileName);
}

function getUniqueWorkbookSheetName(workbook, sheetName) {
  const baseName = safeSheetName(sheetName || "Sheet");
  let finalName = baseName;
  let counter = 2;

  while (workbook.SheetNames.includes(finalName)) {
    finalName = `${baseName.slice(0, 27)}_${counter}`;
    counter++;
  }

  return finalName;
}

function buildErrorListHtml(messages) {
  return `
    <strong>Some uploaded files cannot be processed:</strong>
    <ul class="file-fixer-error-list">
      ${messages.map((message) => `<li>${message}</li>`).join("")}
    </ul>
  `;
}

/* ---------- VALUE HELPERS ---------- */

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
  return extractPhonesFromText(value).length > 0;
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

function addUniquePhone(list, value) {
  const cleanValue = normalizeValue(value);
  if (!cleanValue) return;

  const compareValue = normalizePhoneForCompare(cleanValue);

  const exists = list.some(
    (item) => normalizePhoneForCompare(item) === compareValue
  );

  if (!exists) {
    list.push(cleanValue);
  }
}

/* ---------- PHONE DETECTION ---------- */

// "P.O.Box 11-0391" or "B.P. 175523" are not phone numbers.
const PO_BOX_PATTERN = /\b(?:p\.?\s*o\.?\s*box|b\.\s*p\.?)\s*[:.]?\s*\d[\d\s\-/]*/gi;

// Lebanese phone: optional +961 / 00961, then 1-2 digit area/mobile code, then 3 + 3-4 digits.
// No trailing extension group: it used to swallow the start of the NEXT number
// ("961 1 325 736    1325 739" became one invalid 14-digit number and was lost).
const PHONE_PATTERN =
  /(?:\+?\s*961|00\s*961)?[\s.\-/()]*\d{1,2}[\s.\-/()]*\d{3}[\s.\-/()]*\d{3,4}/g;

const COMPACT_MOBILE_PATTERN = /\b(?:3|70|71|76|78|79|81)\d{6}\b/g;

function extractPhonesFromText(value) {
  let text = normalizeValue(value);
  if (!text) return [];

  if (isEmail(text) || isWebsite(text)) return [];

  text = text.replace(PO_BOX_PATTERN, " ");

  const results = [];

  (text.match(PHONE_PATTERN) || []).forEach((match) => {
    const normalized = normalizeLebanesePhone(match);
    if (normalized) addUniquePhone(results, normalized);
  });

  (text.match(COMPACT_MOBILE_PATTERN) || []).forEach((match) => {
    const normalized = normalizeLebanesePhone(match);
    if (normalized) addUniquePhone(results, normalized);
  });

  return results;
}

function normalizeLebanesePhone(value) {
  const text = normalizeValue(value);
  if (!text) return "";

  let digits = text.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("00961")) {
    digits = "961" + digits.slice(5);
  }

  if (digits.startsWith("961")) {
    const localPart = digits.slice(3);
    if (!isValidLebaneseLocalNumber(localPart)) return "";
    return formatLebanesePhone(localPart);
  }

  if (digits.startsWith("0")) {
    const localPart = digits.slice(1);
    if (!isValidLebaneseLocalNumber(localPart)) return "";
    return formatLebanesePhone(localPart);
  }

  if (/^(3|70|71|76|78|79|81)\d{6}$/.test(digits)) {
    return formatLebanesePhone(digits);
  }

  if (/^[1-9]\d{5,6}$/.test(digits)) {
    return formatLebanesePhone(digits);
  }

  return "";
}

function isValidLebaneseLocalNumber(localPart) {
  if (!/^\d+$/.test(localPart)) return false;

  if (localPart.length === 6 || localPart.length === 7) {
    return /^[1-9]/.test(localPart);
  }

  if (localPart.length === 8) {
    return /^(3|70|71|76|78|79|81)\d{6}$/.test(localPart);
  }

  return false;
}

function formatLebanesePhone(localPart) {
  return `+ 961 ${localPart}`;
}

function removeExtractedPhonesFromText(value, phones) {
  let text = normalizeValue(value);

  phones.forEach((phone) => {
    const digits = normalizePhoneForCompare(phone);
    if (!digits) return;

    const localDigits = digits.startsWith("961") ? digits.slice(3) : digits;

    // Longest forms first, so "01/325736" is removed as a whole instead of leaving a lonely "0".
    const possibleForms = [`00${digits}`, digits, `0${localDigits}`, localDigits];

    possibleForms.forEach((form) => {
      const loosePattern = form.split("").join("[\\s.\\-/()]*");
      text = text.replace(new RegExp(`\\+?\\s*${loosePattern}`, "g"), " ");
    });
  });

  return text.replace(/\s+/g, " ").trim();
}

/* ---------- ORGANIZER ---------- */

const DEFAULT_ORGANIZER_CATEGORIES = [
  { sheetName: "Fournisseur", keywords: ["fournisseur", "supplier"] },
  { sheetName: "Client", keywords: ["client", "old client", "old clients"] },
  { sheetName: "Ucmas", keywords: ["ucmas"] },
  { sheetName: "Acmas", keywords: ["acmas"] },
  { sheetName: "Kids Part", keywords: ["kids part", "kid part"] },
  { sheetName: "Colonie", keywords: ["colonie", "colony"] },
  { sheetName: "Event", keywords: ["event", "events"] },
  { sheetName: "Entertainment", keywords: ["entertainment"] },
  { sheetName: "Companies", keywords: ["company", "companies", "corporate"] },
  { sheetName: "Catering", keywords: ["catering"] },
  { sheetName: "Restaurant", keywords: ["restaurant", "resto"] },
  { sheetName: "Hotel", keywords: ["hotel", "resort"] },
  { sheetName: "Club", keywords: ["club", "night club", "nightclub"] },
  { sheetName: "Beach", keywords: ["beach"] },
  { sheetName: "Moniteur", keywords: ["moniteur"] },
  { sheetName: "Monitrice", keywords: ["monitrice"] },
  { sheetName: "Birthday", keywords: ["birthday", "anniversaire"] },
  { sheetName: "Festival", keywords: ["festival"] },
  { sheetName: "Family", keywords: ["pere", "père", "mere", "mère", "soeur", "sister", "father", "mother"] },
  { sheetName: "Schools", keywords: ["ecole", "école", "school", "schools", "sabis", "eastwood", "sagesse", "abts"] },
  { sheetName: "Municipality", keywords: ["municipality", "municipalities", "municipal"] },
  { sheetName: "Playground", keywords: ["playground"] },
  { sheetName: "PR", keywords: ["public relations", "press relations"] },
  { sheetName: "Mme", keywords: ["mme", "madame"] },
  { sheetName: "Mr", keywords: ["monsieur"] },
  { sheetName: "UN", keywords: ["united nations"] },
  { sheetName: "Mouvement", keywords: ["mouvement", "movement"] },
  { sheetName: "Charite", keywords: ["charite", "charity", "charité"] },
  { sheetName: "Marketing", keywords: ["marketing"] },
  { sheetName: "DJ Music", keywords: ["dj music", "music", "musique"] },
  { sheetName: "Equipment", keywords: ["equipment", "materiel", "matériel"] },
  { sheetName: "Immeuble Office", keywords: ["immeuble", "office", "bureau"] },
  { sheetName: "Inflatables", keywords: ["inflatable", "inflatables", "gonflable"] },
  { sheetName: "Lions", keywords: ["lions"] },
  { sheetName: "Mecanicien", keywords: ["mecanicien", "mécanicien", "mechanic"] },
  { sheetName: "Trip Adventure Rappel", keywords: ["trip", "sortie", "adventure", "rappel"] },
  { sheetName: "Elio", keywords: ["elio"] },
  { sheetName: "Kfarnabrakh", keywords: ["kfarnabrakh"] },
  { sheetName: "Army", keywords: ["lieutenant", "commandant", "colonel", "army", "armee", "armée"] },
  { sheetName: "Maison Home", keywords: ["maison", "home"] },
  { sheetName: "Church", keywords: ["church", "eglise", "église"] },
  { sheetName: "Character", keywords: ["character", "personnage"] },
  { sheetName: "Khayyat", keywords: ["khayyat"] },
  { sheetName: "Shows", keywords: ["show", "dog", "juggler", "breakdance", "stilts", "dancer", "danse"] },
  { sheetName: "Scout", keywords: ["scout"] },
  { sheetName: "Assistant", keywords: ["assistant"] },
  { sheetName: "Decoration", keywords: ["decoration", "décoration"] },
  { sheetName: "Universite", keywords: ["universite", "université", "university"] },
  { sheetName: "Artistics", keywords: ["artistics", "artist", "artiste"] },
  { sheetName: "Storium", keywords: ["storium"] },
  { sheetName: "Mall", keywords: ["mall"] },
  { sheetName: "Dance", keywords: ["dance", "danse"] },
  { sheetName: "Food Stands", keywords: ["food stand", "food stands", "pop corn", "popcorn", "cotton candy", "ice cream"] },
  { sheetName: "Kermes", keywords: ["kermes", "kermesse"] },
  { sheetName: "Bank", keywords: ["bank", "banque"] },
  { sheetName: "TV Show", keywords: ["tv show", "television", "télévision"] },
  { sheetName: "March", keywords: ["march", "mars"] },
  { sheetName: "August", keywords: ["august", "aout", "août"] },
];

let organizerCategories = loadOrganizerCategories();

function organizeWorkbookByKeywords(workbook, sourceFileName = "") {
  return organizeMultipleWorkbooksByKeywords([{ fileName: sourceFileName, workbook }]);
}

function organizeMultipleWorkbooksByKeywords(fileWorkbookPairs) {
  const organizedWorkbook = XLSX.utils.book_new();
  const groupedRows = new Map();

  organizerCategories.forEach((category) => {
    groupedRows.set(category.sheetName, []);
  });

  groupedRows.set("Uncategorized", []);

  fileWorkbookPairs.forEach(({ fileName, workbook }) => {
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) return;

      const matrix = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        raw: true,
        blankrows: false,
      });

      if (matrix.length === 0) return;

      const headers = matrix[0].map((header, index) => {
        const cleanHeader = normalizeValue(header);

        if (!cleanHeader) return `Column ${index + 1}`;

        if (extractPhonesFromText(cleanHeader).length > 0) {
          return `Column ${index + 1}`;
        }

        return cleanHeader;
      });

      const dataRows = matrix.slice(1);

      dataRows.forEach((row) => {
        if (isRowEmpty(row)) return;

        const normalizedRow = {};
        const phoneNumbers = [];

        headers.forEach((header, index) => {
          const value = row[index] ?? "";
          const phones = extractPhonesFromText(value);

          if (phones.length > 0) {
            phones.forEach((phone) => {
              addUniquePhone(phoneNumbers, phone);
            });

            normalizedRow[header] = removeExtractedPhonesFromText(value, phones);
          } else {
            normalizedRow[header] = value;
          }
        });

        normalizedRow["Phone Numbers"] = phoneNumbers.join(" | ");
        normalizedRow["Source File"] = fileName;
        normalizedRow["Source Sheet"] = sheetName;

        const matchedCategories = findMatchingOrganizerCategories(row, sheetName);

        if (matchedCategories.length === 0) {
          groupedRows.get("Uncategorized").push(normalizedRow);
          return;
        }

        matchedCategories.forEach((categoryName) => {
          groupedRows.get(categoryName).push(normalizedRow);
        });
      });
    });
  });

  groupedRows.forEach((rows, sheetName) => {
    if (rows.length === 0) return;

    const headers = collectOrganizerHeaders(rows);
    const sheet = createOrganizerSheet(rows, headers);

    XLSX.utils.book_append_sheet(
      organizedWorkbook,
      sheet,
      getUniqueWorkbookSheetName(organizedWorkbook, sheetName)
    );
  });

  return organizedWorkbook;
}

function findMatchingOrganizerCategories(row, sourceSheetName = "") {
  const rowText = normalizeForKeywordSearch(`${sourceSheetName} ${row.join(" ")}`);
  const matches = [];

  organizerCategories.forEach((category) => {
    const hasMatch = category.keywords.some((keyword) => {
      const normalizedKeyword = normalizeForKeywordSearch(keyword);
      if (!normalizedKeyword) return false;

      return rowText.includes(normalizedKeyword);
    });

    if (hasMatch) {
      matches.push(category.sheetName);
    }
  });

  return [...new Set(matches)];
}

function normalizeForKeywordSearch(value) {
  return normalizeValue(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function collectOrganizerHeaders(rows) {
  const headers = [];

  rows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (!headers.includes(key)) {
        headers.push(key);
      }
    });
  });

  const preferredHeaders = ["Phone Numbers", "Source File", "Source Sheet"];

  return [
    ...preferredHeaders.filter((header) => headers.includes(header)),
    ...headers.filter((header) => !preferredHeaders.includes(header)),
  ];
}

function createOrganizerSheet(rows, headers) {
  const normalizedRows = rows.map((row) => {
    const next = {};

    headers.forEach((header) => {
      next[header] = row[header] ?? "";
    });

    return next;
  });

  const sheet = XLSX.utils.json_to_sheet(normalizedRows, {
    header: headers,
  });

  styleOrganizerHeaderRow(sheet, headers);
  sheet["!cols"] = headers.map((header) => ({
    wch: Math.max(16, String(header).length + 3),
  }));

  return sheet;
}

function styleOrganizerHeaderRow(worksheet, headers) {
  headers.forEach((_, index) => {
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
    };
  });
}

function buildOrganizedFileName(fileName) {
  const cleanName = String(fileName || "OrganizedFile.xlsx");

  if (/\.(xlsx|xls|xlsm|csv)$/i.test(cleanName)) {
    return cleanName.replace(/\.(xlsx|xls|xlsm|csv)$/i, "_ORGANIZED.xlsx");
  }

  return `${cleanName}_ORGANIZED.xlsx`;
}

/* ---------- GENERAL HELPERS ---------- */

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

/* ---------- ORGANIZER KEYWORDS (saved in the browser) ---------- */

function loadOrganizerCategories() {
  try {
    const stored = localStorage.getItem(ORGANIZER_KEYWORDS_STORAGE_KEY);

    if (!stored) {
      return structuredClone(DEFAULT_ORGANIZER_CATEGORIES);
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return structuredClone(DEFAULT_ORGANIZER_CATEGORIES);
    }

    return parsed;
  } catch (error) {
    console.error("Could not load organizer keywords:", error);
    return structuredClone(DEFAULT_ORGANIZER_CATEGORIES);
  }
}

function saveOrganizerCategories() {
  try {
    localStorage.setItem(
      ORGANIZER_KEYWORDS_STORAGE_KEY,
      JSON.stringify(organizerCategories)
    );
  } catch (error) {
    console.error("Could not save organizer keywords:", error);
  }
}

function renderOrganizerKeywords() {
  const container = document.getElementById("organizerKeywordsContainer");
  if (!container) return;

  container.innerHTML = "";

  organizerCategories.forEach((category, categoryIndex) => {
    const card = document.createElement("div");
    card.className = "file-fixer-keyword-category-card";

    const titleRow = document.createElement("div");
    titleRow.className = "file-fixer-keyword-title-row";

    const title = document.createElement("h3");
    title.textContent = category.sheetName;

    const titleActions = document.createElement("div");
    titleActions.className = "file-fixer-keyword-title-actions";

    const editSheetBtn = document.createElement("button");
    editSheetBtn.type = "button";
    editSheetBtn.textContent = "Edit Title";
    editSheetBtn.addEventListener("click", () => {
      const newSheetName = prompt("Edit sheet title:", category.sheetName);
      const cleanSheetName = normalizeValue(newSheetName);

      if (!cleanSheetName) return;

      const alreadyExists = organizerCategories.some(
        (item, index) =>
          index !== categoryIndex &&
          item.sheetName.toLowerCase() === cleanSheetName.toLowerCase()
      );

      if (alreadyExists) {
        alert("This sheet title already exists.");
        return;
      }

      category.sheetName = cleanSheetName;
      saveOrganizerCategories();
      renderOrganizerKeywords();
    });

    const deleteSheetBtn = document.createElement("button");
    deleteSheetBtn.type = "button";
    deleteSheetBtn.textContent = "Delete Sheet";
    deleteSheetBtn.addEventListener("click", () => {
      const confirmed = confirm(
        `Delete the sheet "${category.sheetName}" and all its keywords?`
      );

      if (!confirmed) return;

      organizerCategories.splice(categoryIndex, 1);
      saveOrganizerCategories();
      renderOrganizerKeywords();
    });

    titleActions.appendChild(editSheetBtn);
    titleActions.appendChild(deleteSheetBtn);

    titleRow.appendChild(title);
    titleRow.appendChild(titleActions);

    const keywordList = document.createElement("div");
    keywordList.className = "file-fixer-keyword-list";

    category.keywords.forEach((keyword, keywordIndex) => {
      const chip = document.createElement("div");
      chip.className = "file-fixer-keyword-chip";

      const text = document.createElement("span");
      text.textContent = keyword;

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => {
        const newKeyword = prompt("Edit keyword:", keyword);
        if (!newKeyword) return;

        category.keywords[keywordIndex] = newKeyword.trim();
        saveOrganizerCategories();
        renderOrganizerKeywords();
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.textContent = "✕";
      deleteBtn.addEventListener("click", () => {
        const confirmed = confirm(`Delete keyword "${keyword}"?`);
        if (!confirmed) return;

        category.keywords.splice(keywordIndex, 1);
        saveOrganizerCategories();
        renderOrganizerKeywords();
      });

      chip.appendChild(text);
      chip.appendChild(editBtn);
      chip.appendChild(deleteBtn);

      keywordList.appendChild(chip);
    });

    const addRow = document.createElement("div");
    addRow.className = "file-fixer-keyword-add-row";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Add keyword to ${category.sheetName}`;

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.textContent = "Add";

    addBtn.addEventListener("click", () => {
      const newKeyword = normalizeValue(input.value);

      if (!newKeyword) return;

      const exists = category.keywords.some(
        (keyword) => keyword.toLowerCase() === newKeyword.toLowerCase()
      );

      if (exists) {
        alert("This keyword already exists in this category.");
        return;
      }

      category.keywords.push(newKeyword);
      input.value = "";

      saveOrganizerCategories();
      renderOrganizerKeywords();
    });

    addRow.appendChild(input);
    addRow.appendChild(addBtn);

    card.appendChild(titleRow);
    card.appendChild(keywordList);
    card.appendChild(addRow);

    container.appendChild(card);
  });
}

function addOrganizerSheetCategory() {
  const sheetNameInput = document.getElementById("newOrganizerSheetNameInput");
  const keywordsInput = document.getElementById("newOrganizerSheetKeywordsInput");

  const sheetName = normalizeValue(sheetNameInput?.value);
  const keywordsText = normalizeValue(keywordsInput?.value);

  if (!sheetName) {
    alert("Please enter a sheet title.");
    return;
  }

  if (!keywordsText) {
    alert("Please enter at least one keyword.");
    return;
  }

  const alreadyExists = organizerCategories.some(
    (category) => category.sheetName.toLowerCase() === sheetName.toLowerCase()
  );

  if (alreadyExists) {
    alert("This sheet title already exists.");
    return;
  }

  const keywords = keywordsText
    .split(",")
    .map((keyword) => normalizeValue(keyword))
    .filter(Boolean);

  organizerCategories.push({
    sheetName,
    keywords,
  });

  saveOrganizerCategories();
  renderOrganizerKeywords();

  sheetNameInput.value = "";
  keywordsInput.value = "";
}

// Used only by automated tests (ignored by the page).
export const __fileFixerTestApi = {
  collectFixedEntries,
  buildFileFixerResults,
  fixSingleRow,
  extractPhonesFromText,
  prepareRawRow,
};
