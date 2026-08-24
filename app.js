const LIBRARY_STORAGE_KEY = "pte-core-writing-email-library-v2";
const SETTINGS_STORAGE_KEY = "pte-core-writing-email-settings-v2";

const DEFAULT_SETTINGS = {
  selectedEntryId: "",
  practiceMode: "show",
  liveCompare: true,
  answersByEntryId: {}
};

const seedLibrary = normalizeLibrary(window.PTE_EMAIL_LIBRARY || { entries: [] });

const elements = {
  statusBar: document.getElementById("statusBar"),
  libraryMeta: document.getElementById("libraryMeta"),
  entryList: document.getElementById("entryList"),
  newEntryButton: document.getElementById("newEntryButton"),
  duplicateEntryButton: document.getElementById("duplicateEntryButton"),
  deleteEntryButton: document.getElementById("deleteEntryButton"),
  exportLibraryButton: document.getElementById("exportLibraryButton"),
  importLibraryButton: document.getElementById("importLibraryButton"),
  importLibraryInput: document.getElementById("importLibraryInput"),
  restoreSeedButton: document.getElementById("restoreSeedButton"),
  promptTitleInput: document.getElementById("promptTitleInput"),
  promptNotesInput: document.getElementById("promptNotesInput"),
  promptImageInput: document.getElementById("promptImageInput"),
  imageDropzone: document.getElementById("imageDropzone"),
  removeImageButton: document.getElementById("removeImageButton"),
  clearAnswerButton: document.getElementById("clearAnswerButton"),
  runCompareButton: document.getElementById("runCompareButton"),
  liveCompareToggle: document.getElementById("liveCompareToggle"),
  toggleEditorButton: document.getElementById("toggleEditorButton"),
  closeEditorButton: document.getElementById("closeEditorButton"),
  saveSampleButton: document.getElementById("saveSampleButton"),
  sampleTextInput: document.getElementById("sampleTextInput"),
  userAnswerInput: document.getElementById("userAnswerInput"),
  promptTitleDisplay: document.getElementById("promptTitleDisplay"),
  promptNotesDisplay: document.getElementById("promptNotesDisplay"),
  promptImage: document.getElementById("promptImage"),
  promptImageEmpty: document.getElementById("promptImageEmpty"),
  modeIndicator: document.getElementById("modeIndicator"),
  sampleVisibilityTag: document.getElementById("sampleVisibilityTag"),
  samplePreviewVisible: document.getElementById("samplePreviewVisible"),
  samplePreviewHidden: document.getElementById("samplePreviewHidden"),
  wordCountStats: document.getElementById("wordCountStats"),
  diffOutput: document.getElementById("diffOutput"),
  differenceTableBody: document.getElementById("differenceTableBody"),
  differenceCount: document.getElementById("differenceCount"),
  expectedWordCount: document.getElementById("expectedWordCount"),
  actualWordCount: document.getElementById("actualWordCount"),
  matchedWordCount: document.getElementById("matchedWordCount"),
  replacedWordCount: document.getElementById("replacedWordCount"),
  missingWordCount: document.getElementById("missingWordCount"),
  extraWordCount: document.getElementById("extraWordCount"),
  editorModalBackdrop: document.getElementById("editorModalBackdrop"),
  editorEntryLabel: document.getElementById("editorEntryLabel")
};

let library = loadLibrary();
let settings = loadSettings();
let statusTimeoutId = null;

initialize();

function initialize() {
  ensureSelectedEntry();
  bindEvents();
  hydrateControlsFromSettings();
  renderAll();

  if (!seedLibrary.entries.length) {
    flashStatus("没有读取到文件版题库。你仍然可以手动新建或导入题库 JSON。", "warning", 5000);
  }
}

function bindEvents() {
  elements.promptTitleInput.addEventListener("input", (event) => {
    updateCurrentEntry({ title: event.target.value });
  });

  elements.promptNotesInput.addEventListener("input", (event) => {
    updateCurrentEntry({ notes: event.target.value });
  });

  elements.promptImageInput.addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    await applyImageFileToCurrentEntry(file);
    event.target.value = "";
  });

  elements.removeImageButton.addEventListener("click", () => {
    const entry = getCurrentEntry();
    if (!entry || (!entry.promptImage && !entry.promptImageDataUrl)) {
      flashStatus("当前题目没有可移除的图片。");
      return;
    }

    updateCurrentEntry({
      promptImage: "",
      promptImageDataUrl: ""
    });
    renderPromptImage();
    flashStatus("当前题图已移除。", "success");
  });

  document.querySelectorAll('input[name="practiceMode"]').forEach((radio) => {
    radio.addEventListener("change", (event) => {
      if (!event.target.checked) {
        return;
      }

      settings.practiceMode = event.target.value;
      persistSettings();
      renderSampleVisibility();
      flashStatus(
        settings.practiceMode === "show" ? "已切换到显示例文模式。" : "已切换到不显示例文模式。",
        "success"
      );
    });
  });

  elements.liveCompareToggle.addEventListener("change", (event) => {
    settings.liveCompare = event.target.checked;
    persistSettings();
    if (settings.liveCompare) {
      updateComparison();
    }
  });

  elements.runCompareButton.addEventListener("click", () => {
    updateComparison();
    flashStatus("已重新生成逐词对比结果。", "success");
  });

  elements.userAnswerInput.addEventListener("input", (event) => {
    const entry = getCurrentEntry();
    if (!entry) {
      return;
    }

    settings.answersByEntryId[entry.id] = event.target.value;
    persistSettings();
    updateWordCountTag();
    if (settings.liveCompare) {
      updateComparison();
    }
  });

  elements.sampleTextInput.addEventListener("input", (event) => {
    updateCurrentEntry({ sampleText: event.target.value }, { silent: true });
    renderSampleVisibility();
    if (settings.liveCompare) {
      updateComparison();
    }
  });

  elements.toggleEditorButton.addEventListener("click", openEditorModal);
  elements.closeEditorButton.addEventListener("click", closeEditorModal);
  elements.saveSampleButton.addEventListener("click", () => {
    persistLibrary();
    renderSampleVisibility();
    updateComparison();
    closeEditorModal();
    flashStatus("当前例文已保存。", "success");
  });

  elements.clearAnswerButton.addEventListener("click", () => {
    const entry = getCurrentEntry();
    if (!entry) {
      return;
    }

    settings.answersByEntryId[entry.id] = "";
    persistSettings();
    elements.userAnswerInput.value = "";
    updateWordCountTag();
    updateComparison();
    flashStatus("本题输入已清空。", "success");
  });

  elements.newEntryButton.addEventListener("click", () => {
    const newEntry = createBlankEntry(library.entries.length + 1);
    library.entries.unshift(newEntry);
    settings.selectedEntryId = newEntry.id;
    persistLibrary();
    persistSettings();
    renderAll();
    flashStatus("已新增一个空白题目。", "success");
  });

  elements.duplicateEntryButton.addEventListener("click", () => {
    const entry = getCurrentEntry();
    if (!entry) {
      return;
    }

    const duplicate = {
      ...cloneData(entry),
      id: buildEntryId(),
      title: `${entry.title || "未命名题目"} - 副本`
    };

    const currentIndex = library.entries.findIndex((item) => item.id === entry.id);
    library.entries.splice(currentIndex + 1, 0, duplicate);
    settings.selectedEntryId = duplicate.id;
    persistLibrary();
    persistSettings();
    renderAll();
    flashStatus("已复制当前题目。", "success");
  });

  elements.deleteEntryButton.addEventListener("click", () => {
    const entry = getCurrentEntry();
    if (!entry) {
      return;
    }

    const shouldDelete = window.confirm(`确定删除「${entry.title || entry.id}」吗？这会移除该题的本地工作副本。`);
    if (!shouldDelete) {
      return;
    }

    library.entries = library.entries.filter((item) => item.id !== entry.id);
    delete settings.answersByEntryId[entry.id];
    ensureAtLeastOneEntry();
    ensureSelectedEntry();
    persistLibrary();
    persistSettings();
    closeEditorModal();
    renderAll();
    flashStatus("当前题目已删除。", "success");
  });

  elements.exportLibraryButton.addEventListener("click", () => {
    const exportPayload = cloneData({
      version: 1,
      sourceFile: library.sourceFile || seedLibrary.sourceFile || "",
      entryCount: library.entries.length,
      entries: library.entries
    });

    downloadTextFile(
      `pte-writing-email-library-${buildDateStamp()}.json`,
      JSON.stringify(exportPayload, null, 2)
    );
    flashStatus("当前题库已导出为 JSON。", "success");
  });

  elements.importLibraryButton.addEventListener("click", () => {
    elements.importLibraryInput.click();
  });

  elements.importLibraryInput.addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      library = normalizeLibrary(parsed);
      ensureAtLeastOneEntry();
      settings.answersByEntryId = {};
      settings.selectedEntryId = library.entries[0].id;
      persistLibrary();
      persistSettings();
      closeEditorModal();
      renderAll();
      flashStatus(`题库已从 ${file.name} 导入。`, "success");
    } catch (error) {
      flashStatus("导入失败：JSON 格式不正确或结构不符合要求。", "warning", 4200);
    } finally {
      event.target.value = "";
    }
  });

  elements.restoreSeedButton.addEventListener("click", () => {
    const shouldRestore = window.confirm("确定恢复到当前文件夹里的原始 13 题题库吗？你的浏览器本地修改会被覆盖。");
    if (!shouldRestore) {
      return;
    }

    library = normalizeLibrary(seedLibrary);
    ensureAtLeastOneEntry();
    settings.answersByEntryId = {};
    settings.selectedEntryId = library.entries[0]?.id || "";
    persistLibrary();
    persistSettings();
    closeEditorModal();
    renderAll();
    flashStatus("已恢复为文件版题库。", "success");
  });

  elements.editorModalBackdrop.addEventListener("click", (event) => {
    if (event.target === elements.editorModalBackdrop) {
      closeEditorModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.editorModalBackdrop.hidden) {
      closeEditorModal();
    }
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    elements.imageDropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.imageDropzone.classList.add("drag-active");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    elements.imageDropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.imageDropzone.classList.remove("drag-active");
    });
  });

  elements.imageDropzone.addEventListener("drop", async (event) => {
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    if (!file) {
      return;
    }

    await applyImageFileToCurrentEntry(file);
  });
}

function renderAll() {
  ensureSelectedEntry();
  renderLibraryMeta();
  renderEntryList();
  hydrateEntryEditor();
  renderPromptMeta();
  renderPromptImage();
  renderSampleVisibility();
  updateWordCountTag();
  updateComparison();
}

function renderLibraryMeta() {
  const sourceCount = seedLibrary.entries.length;
  const workingCount = library.entries.length;
  const sourceLabel = seedLibrary.sourceFile ? `文件源：${seedLibrary.sourceFile}` : "文件源：未加载";
  elements.libraryMeta.textContent = `${sourceLabel} | 文件版 ${sourceCount} 题 | 当前工作副本 ${workingCount} 题`;
}

function renderEntryList() {
  elements.entryList.innerHTML = "";

  if (!library.entries.length) {
    const empty = document.createElement("div");
    empty.className = "entry-empty";
    empty.textContent = "当前没有题目。点击“新增题目”或“导入题库 JSON”。";
    elements.entryList.appendChild(empty);
    return;
  }

  library.entries.forEach((entry, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `entry-card ${entry.id === settings.selectedEntryId ? "active" : ""}`;
    button.addEventListener("click", () => {
      settings.selectedEntryId = entry.id;
      persistSettings();
      closeEditorModal();
      renderAll();
    });

    const title = document.createElement("strong");
    title.textContent = `${String(index + 1).padStart(2, "0")} · ${entry.title || "未命名题目"}`;

    const snippet = document.createElement("span");
    snippet.textContent = entry.notes?.trim() || getFirstLine(entry.sampleText) || "暂无备注";

    button.appendChild(title);
    button.appendChild(snippet);
    elements.entryList.appendChild(button);
  });
}

function hydrateEntryEditor() {
  const entry = getCurrentEntry();
  if (!entry) {
    elements.promptTitleInput.value = "";
    elements.promptNotesInput.value = "";
    elements.sampleTextInput.value = "";
    elements.userAnswerInput.value = "";
    elements.editorEntryLabel.textContent = "当前题目";
    return;
  }

  elements.promptTitleInput.value = entry.title || "";
  elements.promptNotesInput.value = entry.notes || "";
  elements.sampleTextInput.value = entry.sampleText || "";
  elements.userAnswerInput.value = settings.answersByEntryId[entry.id] || "";
  elements.editorEntryLabel.textContent = entry.title || entry.id;
}

function hydrateControlsFromSettings() {
  elements.liveCompareToggle.checked = settings.liveCompare;
  document.querySelectorAll('input[name="practiceMode"]').forEach((radio) => {
    radio.checked = radio.value === settings.practiceMode;
  });
}

function renderPromptMeta() {
  const entry = getCurrentEntry();

  if (!entry) {
    elements.promptTitleDisplay.textContent = "未命名题目";
    elements.promptNotesDisplay.textContent = "选择左侧题目后即可开始。";
    return;
  }

  elements.promptTitleDisplay.textContent = entry.title?.trim() || "未命名题目";
  elements.promptNotesDisplay.textContent = entry.notes?.trim() || "当前题目没有备注。";
}

function renderPromptImage() {
  const entry = getCurrentEntry();
  const imageSrc = resolvePromptImage(entry);

  if (imageSrc) {
    elements.promptImage.src = imageSrc;
    elements.promptImage.hidden = false;
    elements.promptImageEmpty.hidden = true;
  } else {
    elements.promptImage.removeAttribute("src");
    elements.promptImage.hidden = true;
    elements.promptImageEmpty.hidden = false;
  }
}

function renderSampleVisibility() {
  const entry = getCurrentEntry();
  const hasSample = Boolean(entry?.sampleText?.trim());
  const sampleText = hasSample
    ? entry.sampleText.trim()
    : "当前题目还没有例文。点击“编辑当前例文”即可补充。";

  elements.modeIndicator.textContent = settings.practiceMode === "show" ? "显示例文模式" : "不显示例文模式";
  elements.sampleVisibilityTag.textContent = settings.practiceMode === "show" ? "当前可见" : "当前隐藏";

  elements.samplePreviewVisible.textContent = sampleText;
  elements.samplePreviewVisible.classList.toggle("empty-preview", !hasSample);

  if (settings.practiceMode === "show") {
    elements.samplePreviewVisible.hidden = false;
    elements.samplePreviewHidden.hidden = true;
  } else {
    elements.samplePreviewVisible.hidden = true;
    elements.samplePreviewHidden.hidden = false;
    elements.samplePreviewHidden.classList.toggle("empty-preview", !hasSample);
    elements.samplePreviewHidden.textContent = hasSample
      ? "当前为“不显示例文”模式。系统仍会用后台保存的例文做逐词对比。"
      : "当前为“不显示例文”模式，但你还没有录入例文。先到编辑器里添加底稿，系统才能对比。";
  }
}

function updateWordCountTag() {
  const entry = getCurrentEntry();
  const answer = entry ? settings.answersByEntryId[entry.id] || "" : "";
  const typedTokens = tokenizeWords(answer);
  elements.wordCountStats.textContent = `${typedTokens.length} words`;
}

function updateComparison() {
  const entry = getCurrentEntry();
  const sampleText = entry?.sampleText || "";
  const userAnswer = entry ? settings.answersByEntryId[entry.id] || "" : "";
  const expectedTokens = tokenizeWords(sampleText);
  const actualTokens = tokenizeWords(userAnswer);

  elements.expectedWordCount.textContent = String(expectedTokens.length);
  elements.actualWordCount.textContent = String(actualTokens.length);

  if (!expectedTokens.length) {
    elements.matchedWordCount.textContent = "0";
    elements.replacedWordCount.textContent = "0";
    elements.missingWordCount.textContent = "0";
    elements.extraWordCount.textContent = actualTokens.length ? String(actualTokens.length) : "0";

    renderDiffPlaceholder(
      actualTokens.length
        ? "你已经开始输入了，但当前题目还没有标准例文可供对比。先录入例文底稿。"
        : "先在“编辑当前例文”里录入标准例文，然后系统就会按单词逐个对比。"
    );
    renderDifferenceTable([]);
    return;
  }

  const operations = diffWords(expectedTokens, actualTokens);
  const stats = buildStats(operations);
  const differences = buildDifferences(operations);

  elements.matchedWordCount.textContent = String(stats.matched);
  elements.replacedWordCount.textContent = String(stats.replaced);
  elements.missingWordCount.textContent = String(stats.missing);
  elements.extraWordCount.textContent = String(stats.extra);

  renderDiffOutput(operations, actualTokens.length);
  renderDifferenceTable(differences);
}

function renderDiffPlaceholder(message) {
  elements.diffOutput.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "diff-placeholder";
  wrapper.innerHTML = `
    <strong>等待对比内容</strong>
    <span>${message}</span>
  `;

  elements.diffOutput.appendChild(wrapper);
}

function renderDiffOutput(operations, actualCount) {
  elements.diffOutput.innerHTML = "";

  if (!actualCount) {
    renderDiffPlaceholder("例文已加载。现在可以开始输入，你一打字系统就会自动发现漏词、错词和多写的词。");
    return;
  }

  const referenceTokens = [];
  const actualTokens = [];

  operations.forEach((operation) => {
    switch (operation.type) {
      case "equal":
        referenceTokens.push(createToken("equal", operation.expected));
        actualTokens.push(createToken("equal", operation.actual));
        break;
      case "replace":
        referenceTokens.push(createToken("replace-expected", operation.expected));
        actualTokens.push(createToken("replace-actual", operation.actual));
        break;
      case "delete":
        referenceTokens.push(createToken("missing", operation.expected));
        actualTokens.push(createToken("gap", "∅"));
        break;
      case "insert":
        referenceTokens.push(createToken("gap", "∅"));
        actualTokens.push(createToken("extra", operation.actual));
        break;
      default:
        break;
    }
  });

  elements.diffOutput.appendChild(createDiffBlock("参考例文", referenceTokens));
  elements.diffOutput.appendChild(createDiffBlock("你的输入", actualTokens));
}

function renderDifferenceTable(differences) {
  elements.differenceCount.textContent = `${differences.length} 项`;
  elements.differenceTableBody.innerHTML = "";

  if (!differences.length) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="4" class="table-empty">当前没有差异，说明你的输入和例文逐词一致。</td>';
    elements.differenceTableBody.appendChild(row);
    return;
  }

  differences.forEach((difference) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${difference.position}</td>
      <td>${difference.typeLabel}</td>
      <td>${escapeHtml(difference.expected)}</td>
      <td>${escapeHtml(difference.actual)}</td>
    `;
    elements.differenceTableBody.appendChild(row);
  });
}

function createDiffBlock(title, tokens) {
  const section = document.createElement("section");
  section.className = "diff-block";

  const heading = document.createElement("h3");
  heading.textContent = title;
  section.appendChild(heading);

  const tokenCloud = document.createElement("div");
  tokenCloud.className = "token-cloud";
  tokens.forEach((token) => tokenCloud.appendChild(token));
  section.appendChild(tokenCloud);

  return section;
}

function createToken(className, text) {
  const span = document.createElement("span");
  span.className = `token ${className}`;
  span.textContent = text;
  return span;
}

function openEditorModal() {
  const entry = getCurrentEntry();
  if (!entry) {
    flashStatus("当前没有可编辑的题目。", "warning");
    return;
  }

  elements.editorEntryLabel.textContent = entry.title || entry.id;
  elements.sampleTextInput.value = entry.sampleText || "";
  elements.editorModalBackdrop.hidden = false;
  document.body.style.overflow = "hidden";
  elements.sampleTextInput.focus();
}

function closeEditorModal() {
  elements.editorModalBackdrop.hidden = true;
  document.body.style.overflow = "";
}

async function applyImageFileToCurrentEntry(file) {
  if (!file.type.startsWith("image/")) {
    flashStatus("上传失败：请选择图片文件。", "warning");
    return;
  }

  const dataUrl = await readFileAsDataUrl(file);
  updateCurrentEntry({
    promptImageDataUrl: dataUrl
  });
  renderPromptImage();
  flashStatus(`当前题图已更新：${file.name}`, "success");
}

function updateCurrentEntry(patch, options = {}) {
  const entry = getCurrentEntry();
  if (!entry) {
    return;
  }

  Object.assign(entry, patch);
  persistLibrary();

  if (!options.silent) {
    renderEntryList();
    renderPromptMeta();
    renderSampleVisibility();
    updateComparison();
  }
}

function resolvePromptImage(entry) {
  if (!entry) {
    return "";
  }

  return entry.promptImageDataUrl || entry.promptImage || "";
}

function loadLibrary() {
  try {
    const raw = localStorage.getItem(LIBRARY_STORAGE_KEY);
    if (!raw) {
      const initial = normalizeLibrary(seedLibrary);
      ensureAtLeastOneEntry(initial);
      return initial;
    }

    const parsed = JSON.parse(raw);
    const normalized = normalizeLibrary(parsed);
    ensureAtLeastOneEntry(normalized);
    return normalized;
  } catch (error) {
    const fallback = normalizeLibrary(seedLibrary);
    ensureAtLeastOneEntry(fallback);
    return fallback;
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_SETTINGS };
    }

    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      answersByEntryId: parsed.answersByEntryId || {}
    };
  } catch (error) {
    return { ...DEFAULT_SETTINGS };
  }
}

function persistLibrary() {
  library.entryCount = library.entries.length;

  try {
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(library));
  } catch (error) {
    flashStatus("题库存储失败。通常是因为图片过大，建议导出 JSON 备份并适当压缩图片。", "warning", 4500);
  }
}

function persistSettings() {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    flashStatus("练习记录保存失败。刷新后当前输入可能丢失。", "warning", 4200);
  }
}

function ensureSelectedEntry() {
  const hasSelectedEntry = library.entries.some((entry) => entry.id === settings.selectedEntryId);
  if (hasSelectedEntry) {
    return;
  }

  settings.selectedEntryId = library.entries[0]?.id || "";
  persistSettings();
}

function ensureAtLeastOneEntry(targetLibrary = library) {
  if (targetLibrary.entries.length) {
    return;
  }

  targetLibrary.entries.push(createBlankEntry(1));
}

function getCurrentEntry() {
  return library.entries.find((entry) => entry.id === settings.selectedEntryId) || null;
}

function normalizeLibrary(source) {
  const rawEntries = Array.isArray(source)
    ? source
    : Array.isArray(source?.entries)
      ? source.entries
      : [];

  const normalizedEntries = rawEntries.map((entry, index) => normalizeEntry(entry, index));

  return {
    version: Number(source?.version) || 1,
    sourceFile: typeof source?.sourceFile === "string" ? source.sourceFile : "",
    entryCount: normalizedEntries.length,
    entries: normalizedEntries
  };
}

function normalizeEntry(entry, index) {
  return {
    id: sanitizeId(entry?.id) || `email-${String(index + 1).padStart(2, "0")}`,
    title: typeof entry?.title === "string" ? entry.title : `Email ${String(index + 1).padStart(2, "0")}`,
    notes: typeof entry?.notes === "string" ? entry.notes : "",
    promptImage: typeof entry?.promptImage === "string" ? entry.promptImage : "",
    promptImageDataUrl: typeof entry?.promptImageDataUrl === "string" ? entry.promptImageDataUrl : "",
    sampleText: typeof entry?.sampleText === "string" ? entry.sampleText : ""
  };
}

function createBlankEntry(order) {
  return {
    id: buildEntryId(),
    title: `Email ${String(order).padStart(2, "0")}`,
    notes: "",
    promptImage: "",
    promptImageDataUrl: "",
    sampleText: ""
  };
}

function sanitizeId(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase().replace(/[^a-z0-9-_]+/g, "-");
}

function buildEntryId() {
  return `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildDateStamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function tokenizeWords(text) {
  const matches = text.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g);
  return matches ? matches : [];
}

function diffWords(expectedTokens, actualTokens) {
  const rowCount = expectedTokens.length + 1;
  const columnCount = actualTokens.length + 1;
  const lcsMatrix = Array.from({ length: rowCount }, () => Array(columnCount).fill(0));

  for (let i = expectedTokens.length - 1; i >= 0; i -= 1) {
    for (let j = actualTokens.length - 1; j >= 0; j -= 1) {
      if (normalizeToken(expectedTokens[i]) === normalizeToken(actualTokens[j])) {
        lcsMatrix[i][j] = lcsMatrix[i + 1][j + 1] + 1;
      } else {
        lcsMatrix[i][j] = Math.max(lcsMatrix[i + 1][j], lcsMatrix[i][j + 1]);
      }
    }
  }

  const operations = [];
  let i = 0;
  let j = 0;

  while (i < expectedTokens.length && j < actualTokens.length) {
    if (normalizeToken(expectedTokens[i]) === normalizeToken(actualTokens[j])) {
      operations.push({
        type: "equal",
        expected: expectedTokens[i],
        actual: actualTokens[j]
      });
      i += 1;
      j += 1;
      continue;
    }

    if (lcsMatrix[i + 1][j] >= lcsMatrix[i][j + 1]) {
      operations.push({
        type: "delete",
        expected: expectedTokens[i]
      });
      i += 1;
    } else {
      operations.push({
        type: "insert",
        actual: actualTokens[j]
      });
      j += 1;
    }
  }

  while (i < expectedTokens.length) {
    operations.push({
      type: "delete",
      expected: expectedTokens[i]
    });
    i += 1;
  }

  while (j < actualTokens.length) {
    operations.push({
      type: "insert",
      actual: actualTokens[j]
    });
    j += 1;
  }

  return collapseAdjacentReplacements(operations);
}

function normalizeToken(token) {
  return token.toLowerCase();
}

function collapseAdjacentReplacements(operations) {
  const collapsed = [];
  let index = 0;

  while (index < operations.length) {
    const current = operations[index];
    const next = operations[index + 1];

    if (current && next && current.type === "delete" && next.type === "insert") {
      collapsed.push({
        type: "replace",
        expected: current.expected,
        actual: next.actual
      });
      index += 2;
      continue;
    }

    if (current && next && current.type === "insert" && next.type === "delete") {
      collapsed.push({
        type: "replace",
        expected: next.expected,
        actual: current.actual
      });
      index += 2;
      continue;
    }

    collapsed.push(current);
    index += 1;
  }

  return collapsed;
}

function buildStats(operations) {
  const stats = {
    matched: 0,
    replaced: 0,
    missing: 0,
    extra: 0
  };

  operations.forEach((operation) => {
    if (operation.type === "equal") {
      stats.matched += 1;
    } else if (operation.type === "replace") {
      stats.replaced += 1;
    } else if (operation.type === "delete") {
      stats.missing += 1;
    } else if (operation.type === "insert") {
      stats.extra += 1;
    }
  });

  return stats;
}

function buildDifferences(operations) {
  const differences = [];
  let expectedPosition = 0;
  let actualPosition = 0;

  operations.forEach((operation) => {
    if (operation.type === "equal") {
      expectedPosition += 1;
      actualPosition += 1;
      return;
    }

    if (operation.type === "replace") {
      expectedPosition += 1;
      actualPosition += 1;
      differences.push({
        position: `参考 ${expectedPosition} / 输入 ${actualPosition}`,
        typeLabel: "替换/拼写",
        expected: operation.expected,
        actual: operation.actual
      });
      return;
    }

    if (operation.type === "delete") {
      expectedPosition += 1;
      differences.push({
        position: `参考 ${expectedPosition}`,
        typeLabel: "漏写",
        expected: operation.expected,
        actual: "—"
      });
      return;
    }

    if (operation.type === "insert") {
      actualPosition += 1;
      differences.push({
        position: `输入 ${actualPosition}`,
        typeLabel: "多写",
        expected: "—",
        actual: operation.actual
      });
    }
  });

  return differences;
}

function getFirstLine(text) {
  return (text || "").split("\n").find((line) => line.trim()) || "";
}

function flashStatus(message, tone = "", duration = 2600) {
  elements.statusBar.textContent = message;
  elements.statusBar.className = "status-bar";

  if (tone) {
    elements.statusBar.classList.add(tone);
  }

  window.clearTimeout(statusTimeoutId);
  statusTimeoutId = window.setTimeout(() => {
    elements.statusBar.textContent = "";
    elements.statusBar.className = "status-bar";
  }, duration);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
