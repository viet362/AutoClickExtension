// AutoFlow - Popup Controller Script v1.1.0

document.addEventListener('DOMContentLoaded', () => {
  // Navigation & Header
  const tabs = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');
  const headerStatusDot = document.getElementById('headerStatusDot');
  const headerStatusText = document.getElementById('headerStatusText');

  // Scenarios Tab
  const scenarioSelect = document.getElementById('scenarioSelect');
  const btnRenameScenario = document.getElementById('btnRenameScenario');
  const btnChainScenarios = document.getElementById('btnChainScenarios');
  const btnExportScenario = document.getElementById('btnExportScenario');
  const btnNewScenario = document.getElementById('btnNewScenario');
  const btnDeleteScenario = document.getElementById('btnDeleteScenario');
  const btnStartRecord = document.getElementById('btnStartRecord');
  const stepsListContainer = document.getElementById('stepsListContainer');
  const stepsCountBadge = document.getElementById('stepsCountBadge');
  const btnAutoMapColumns = document.getElementById('btnAutoMapColumns');
  const btnAddWaitStep = document.getElementById('btnAddWaitStep');
  const btnAddManualStep = document.getElementById('btnAddManualStep');
  const bulkDelayBar = document.getElementById('bulkDelayBar');
  const bulkDelaySecInput = document.getElementById('bulkDelaySecInput');
  const btnApplyBulkDelay = document.getElementById('btnApplyBulkDelay');

  // Excel / Data Tab
  const chkFirstRowIsData = document.getElementById('chkFirstRowIsData');
  const excelDropzone = document.getElementById('excelDropzone');
  const excelFileInput = document.getElementById('excelFileInput');
  const btnBrowseFile = document.getElementById('btnBrowseFile');
  const excelFilesBar = document.getElementById('excelFilesBar');
  const excelFileSelect = document.getElementById('excelFileSelect');
  const btnUploadAnotherFile = document.getElementById('btnUploadAnotherFile');
  const btnDeleteSelectedFile = document.getElementById('btnDeleteSelectedFile');
  const btnChangeFile = document.getElementById('btnChangeFile');
  const compactDropzone = document.getElementById('compactDropzone');
  const tabData = document.getElementById('tab-data');
  const dataPreviewCard = document.getElementById('dataPreviewCard');
  const previewFileName = document.getElementById('previewFileName');
  const previewFileStats = document.getElementById('previewFileStats');
  const columnChipsContainer = document.getElementById('columnChipsContainer');
  const previewTableHead = document.getElementById('previewTableHead');
  const previewTableBody = document.getElementById('previewTableBody');
  const btnClearData = document.getElementById('btnClearData');
  const dataRowsBadge = document.getElementById('dataRowsBadge');
  const excelScopeText = document.getElementById('excelScopeText');
  const btnAttachToScenario = document.getElementById('btnAttachToScenario');
  const btnDetachFromScenario = document.getElementById('btnDetachFromScenario');

  // Runner Tab & Dashboard shortcuts
  const btnOpenDashboard = document.getElementById('btnOpenDashboard');
  const btnOpenDashboardFromRunner = document.getElementById('btnOpenDashboardFromRunner');
  const runnerScenarioName = document.getElementById('runnerScenarioName');
  const runnerDataInfo = document.getElementById('runnerDataInfo');
  const runStartRow = document.getElementById('runStartRow');
  const runStartRowInfo = document.getElementById('runStartRowInfo');
  const runRepeatCount = document.getElementById('runRepeatCount');
  const runExtraDelaySec = document.getElementById('runExtraDelaySec');
  const runSpeedSelect = document.getElementById('runSpeedSelect');
  const runErrorModeSelect = document.getElementById('runErrorModeSelect');
  const btnStartRunner = document.getElementById('btnStartRunner');
  const btnStopRunner = document.getElementById('btnStopRunner');
  const runProgressBox = document.getElementById('runProgressBox');
  const progressStatusText = document.getElementById('progressStatusText');
  const progressPctText = document.getElementById('progressPctText');
  const progressBarFill = document.getElementById('progressBarFill');
  const logsContainer = document.getElementById('logsContainer');
  const btnExportResults = document.getElementById('btnExportResults');
  const btnClearLogs = document.getElementById('btnClearLogs');

  // Chaining modal elements
  const chainScenariosModal = document.getElementById('chainScenariosModal');
  const btnChainModalClose = document.getElementById('btnChainModalClose');
  const btnChainModalCancel = document.getElementById('btnChainModalCancel');
  const btnChainModalConfirm = document.getElementById('btnChainModalConfirm');
  const chainScenariosList = document.getElementById('chainScenariosList');
  const chainNewNameInput = document.getElementById('chainNewNameInput');
  const chainWaitSecInput = document.getElementById('chainWaitSecInput');

  // Record Confirm Modal elements (Bảo vệ kịch bản cũ khi ghi)
  const recordConfirmModal = document.getElementById('recordConfirmModal');
  const btnRecordModalClose = document.getElementById('btnRecordModalClose');
  const btnRecordCancel = document.getElementById('btnRecordCancel');
  const recordTargetScenarioName = document.getElementById('recordTargetScenarioName');
  const recordTargetStepsCount = document.getElementById('recordTargetStepsCount');
  const recordNewScenarioNameInput = document.getElementById('recordNewScenarioNameInput');
  const btnRecordAsNew = document.getElementById('btnRecordAsNew');
  const btnRecordAppend = document.getElementById('btnRecordAppend');
  const btnRecordOverwrite = document.getElementById('btnRecordOverwrite');

  // Settings Tab
  const btnExportCurrentJson = document.getElementById('btnExportCurrentJson');
  const btnExportAllJson = document.getElementById('btnExportAllJson');
  const btnExportJson = document.getElementById('btnExportJson');
  const btnImportJson = document.getElementById('btnImportJson');
  const importJsonInput = document.getElementById('importJsonInput');
  const settingExportCurrentDesc = document.getElementById('settingExportCurrentDesc');

  // Edit Step Modal
  const editStepModal = document.getElementById('editStepModal');
  const btnModalClose = document.getElementById('btnModalClose');
  const btnModalCancel = document.getElementById('btnModalCancel');
  const btnModalSave = document.getElementById('btnModalSave');
  const modalStepDesc = document.getElementById('modalStepDesc');
  const modalSelectorGroup = document.getElementById('modalSelectorGroup');
  const modalStepSelector = document.getElementById('modalStepSelector');
  const modalTypeGroup = document.getElementById('modalTypeGroup');
  const radioColSource = document.getElementById('radioColSource');
  const radioCustomSource = document.getElementById('radioCustomSource');
  const colSelectWrap = document.getElementById('colSelectWrap');
  const modalColSelect = document.getElementById('modalColSelect');
  const customValueWrap = document.getElementById('customValueWrap');
  const modalCustomValue = document.getElementById('modalCustomValue');
  const modalClickTableGroup = document.getElementById('modalClickTableGroup');
  const radioRowKeyword = document.getElementById('radioRowKeyword');
  const radioRowIndex = document.getElementById('radioRowIndex');
  const radioRowDefault = document.getElementById('radioRowDefault');
  const rowKeywordWrap = document.getElementById('rowKeywordWrap');
  const modalRowKeyword = document.getElementById('modalRowKeyword');
  const rowIndexWrap = document.getElementById('rowIndexWrap');
  const modalRowIndex = document.getElementById('modalRowIndex');
  const modalStepDelay = document.getElementById('modalStepDelay');
  const modalTimeoutGroup = document.getElementById('modalTimeoutGroup');
  const modalStepTimeout = document.getElementById('modalStepTimeout');
  const modalStepOptional = document.getElementById('modalStepOptional');

  // App State
  let scenarios = {};
  let activeScenarioId = null;
  let dataset = [];
  let rawSheetRows = null; // Mảng 2 chiều gốc từ Excel để có thể bật/tắt "Dòng đầu tiên là dữ liệu" bất kỳ lúc nào
  let currentFileName = '';
  let excelFiles = {}; // Quản lý nhiều file Excel: { [id]: { id, name, dataset, rawSheetRows, rowCount, colCount, isFirstRowData, uploadedAt } }
  let activeExcelFileId = null;
  let editingStepIndex = null;
  let cachedWorkbook = null;

  // Quản lý Tab ID hiện tại đang mở Popup
  let currentActiveTabId = null;
  async function getCurrentActiveTab() {
    if (currentActiveTabId !== null) return { id: currentActiveTabId };
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) currentActiveTabId = tab.id;
      return tab || null;
    } catch (e) {
      return null;
    }
  }
  // Khởi động lấy Tab ID hiện tại ngay lập tức khi mở popup để lọc tin nhắn đa tab chính xác
  getCurrentActiveTab();

  // ============================================================
  // TIỆN ÍCH CHUNG
  // ============================================================
  function escapeHtml(text) {
    if (text == null) return '';
    return String(text).replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m]));
  }

  // Chuyển chỉ số cột 0-based sang tên cột chuẩn Excel: 0 -> A, 25 -> Z, 26 -> AA, 27 -> AB...
  function indexToColLetters(idx) {
    let n = idx + 1;
    let letters = '';
    while (n > 0) {
      const rem = (n - 1) % 26;
      letters = String.fromCharCode(65 + rem) + letters;
      n = Math.floor((n - 1) / 26);
    }
    return letters;
  }

  // Nhận diện thông minh xem dòng 1 của file là tiêu đề cột (header) hay là dữ liệu thực tế
  function detectFirstRowIsData(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return true;
    const first = rows[0].map((c) => String(c ?? '').trim()).filter(Boolean);
    if (first.length === 0) return true;

    // Nếu bất kỳ ô nào ở dòng 1 là con số thuần túy, mã thiết bị/đơn hàng có chữ số dài (ví dụ ORD-001, 236568-01...), ngày tháng, email
    const looksLikeDataValue = (val) =>
      /^\d+([.,]\d+)?$/.test(val) ||
      /[0-9]{2,}/.test(val) ||
      /_BYPT_|^ORD-|@|https?:\/\//i.test(val);

    if (first.some(looksLikeDataValue)) return true;

    // Nếu chỉ có 1 dòng duy nhất và không giống tiêu đề mẫu thì coi là dữ liệu
    if (rows.length === 1) return true;

    // Nếu dòng 1 toàn là chữ định danh cột (ví dụ: Ma_Don, Ten_Khach_Hang, Name, Phone...) và dòng 2 có số/dữ liệu
    const second = rows[1].map((c) => String(c ?? '').trim()).filter(Boolean);
    if (second.some(looksLikeDataValue)) return false;

    return false;
  }

  // Lấy danh sách tên cột hiển thị chính (loại bỏ các khóa alias phụ chỉ gồm 1-3 chữ cái in hoa như A, B, C khi đã có Cot_A, Cot_B)
  function getPrimaryHeaders(data) {
    if (!Array.isArray(data) || data.length === 0 || !data[0]) return [];
    const keys = Object.keys(data[0]);
    const hasCotPrefix = keys.some((k) => /^Cot_[A-Z]+$/.test(k));
    if (!hasCotPrefix) return keys;
    return keys.filter((k) => !(/^[A-Z]{1,3}$/.test(k) && keys.includes(`Cot_${k}`)));
  }

  function setHeaderStatus(mode, text) {
    if (!headerStatusDot || !headerStatusText) return;
    headerStatusText.textContent = text;
    if (mode === 'recording') {
      headerStatusDot.style.background = '#ef4444';
      headerStatusDot.style.boxShadow = '0 0 8px #ef4444';
    } else if (mode === 'running') {
      headerStatusDot.style.background = '#10b981';
      headerStatusDot.style.boxShadow = '0 0 8px #10b981';
    } else if (mode === 'paused' || mode === 'error') {
      headerStatusDot.style.background = '#f59e0b';
      headerStatusDot.style.boxShadow = '0 0 8px #f59e0b';
    } else {
      headerStatusDot.style.background = '#10b981';
      headerStatusDot.style.boxShadow = '0 0 8px #10b981';
    }
  }

  // ============================================================
  // 1. CHUYỂN TAB
  // ============================================================
  function switchTab(targetId) {
    tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === targetId));
    tabContents.forEach((tc) => tc.classList.toggle('active', tc.id === targetId));
    if (targetId === 'tab-runner') updateRunnerCard();
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // ============================================================
  // 2. NẠP & QUẢN LÝ KỊCH BẢN
  // ============================================================
  function loadState() {
    chrome.storage.local.get(
      ['scenarios', 'activeScenarioId', 'currentDataset', 'currentFileName', 'rawSheetRows', 'excelFirstRowIsData', 'excelFiles', 'activeExcelFileId', 'runnerPrefs', 'lastRunResults'],
      (res) => {
        scenarios = res.scenarios || {};
        activeScenarioId = res.activeScenarioId || Object.keys(scenarios)[0] || null;

        if (!activeScenarioId || !scenarios[activeScenarioId]) {
          const withSteps = Object.keys(scenarios).find((k) => scenarios[k].steps && scenarios[k].steps.length > 0);
          activeScenarioId = withSteps || Object.keys(scenarios)[0] || null;
        }

        excelFiles = res.excelFiles || {};
        activeExcelFileId = res.activeExcelFileId || null;

        dataset = Array.isArray(res.currentDataset) ? res.currentDataset : [];
        rawSheetRows = Array.isArray(res.rawSheetRows) ? res.rawSheetRows : null;
        currentFileName = res.currentFileName || '';

        // Tự động chuyển đổi dữ liệu file cũ sang thư viện nhiều file excelFiles nếu chưa có
        if (Object.keys(excelFiles).length === 0 && dataset.length > 0) {
          const fid = 'file_' + Date.now();
          excelFiles[fid] = {
            id: fid,
            name: currentFileName || 'data.xlsx',
            dataset,
            rawSheetRows,
            rowCount: dataset.length,
            colCount: getPrimaryHeaders(dataset).length,
            isFirstRowData: res.excelFirstRowIsData !== false,
            uploadedAt: Date.now()
          };
          activeExcelFileId = fid;
          chrome.storage.local.set({ excelFiles, activeExcelFileId });
        }

        if (chkFirstRowIsData && typeof res.excelFirstRowIsData === 'boolean') {
          chkFirstRowIsData.checked = res.excelFirstRowIsData;
        }

        if (res.runnerPrefs) {
          if (runSpeedSelect && res.runnerPrefs.speed) runSpeedSelect.value = String(res.runnerPrefs.speed);
          if (runErrorModeSelect && res.runnerPrefs.errorMode) runErrorModeSelect.value = res.runnerPrefs.errorMode;
          if (runStartRow && res.runnerPrefs.startRow) runStartRow.value = String(res.runnerPrefs.startRow);
          if (runExtraDelaySec && res.runnerPrefs.extraDelaySec !== undefined) {
            runExtraDelaySec.value = String(res.runnerPrefs.extraDelaySec);
          }
          if (runRepeatCount && res.runnerPrefs.repeatCount) {
            runRepeatCount.value = String(res.runnerPrefs.repeatCount);
          }
        }

        renderScenarioDropdown();
        renderStepsList();
        renderExcelFilesBar();
        checkScenarioAttachedData();
        updateRunnerCard();
        syncActiveTabStatus();
      }
    );
  }

  function saveScenarios() {
    return new Promise((resolve) => {
      chrome.storage.local.set({ scenarios, activeScenarioId }, () => {
        void chrome.runtime.lastError;
        resolve();
      });
    });
  }

  function checkScenarioAttachedData() {
    const sc = scenarios[activeScenarioId];
    if (sc && Array.isArray(sc.attachedDataset) && sc.attachedDataset.length > 0) {
      dataset = sc.attachedDataset;
      currentFileName = sc.attachedFileName || 'File riêng của kịch bản';
      showDataPreview(dataset, currentFileName);
      if (excelScopeText) {
        excelScopeText.textContent = `💾 File riêng của: "${sc.name}"`;
        excelScopeText.style.color = '#38bdf8';
      }
    } else {
      renderExcelFilesBar();
      if (excelScopeText) {
        excelScopeText.textContent = '🌐 File dùng chung cho mọi kịch bản';
        excelScopeText.style.color = '#10b981';
      }
      updateRunnerCard();
    }
  }

  // Gắn / Gỡ file Excel riêng cho kịch bản
  if (btnAttachToScenario) {
    btnAttachToScenario.addEventListener('click', () => {
      const sc = scenarios[activeScenarioId];
      if (!sc) return alert('Vui lòng chọn hoặc tạo kịch bản trước!');
      if (!dataset || dataset.length === 0) return alert('Chưa có file Excel nào được nạp!');
      sc.attachedDataset = dataset;
      sc.attachedFileName = currentFileName;
      saveScenarios();
      checkScenarioAttachedData();
      renderScenarioDropdown();
      updateRunnerCard();
      alert(`✅ Đã gắn riêng file "${currentFileName}" cho kịch bản "${sc.name}"!`);
    });
  }

  if (btnDetachFromScenario) {
    btnDetachFromScenario.addEventListener('click', () => {
      const sc = scenarios[activeScenarioId];
      if (!sc) return;
      delete sc.attachedDataset;
      delete sc.attachedFileName;
      saveScenarios();
      checkScenarioAttachedData();
      renderScenarioDropdown();
      updateRunnerCard();
      alert(`🌐 Đã chuyển kịch bản "${sc.name}" sang dùng file Excel dùng chung.`);
    });
  }

  // Mở trang Dashboard Đa Tab tập trung
  const openDashboard = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
  };
  btnOpenDashboard?.addEventListener('click', openDashboard);
  btnOpenDashboardFromRunner?.addEventListener('click', openDashboard);

  function renderScenarioDropdown() {
    scenarioSelect.innerHTML = '';
    const keys = Object.keys(scenarios);
    if (keys.length === 0) {
      const opt = document.createElement('option');
      opt.textContent = '(Chưa có kịch bản)';
      scenarioSelect.appendChild(opt);
      activeScenarioId = null;
      return;
    }

    keys.forEach((id) => {
      const opt = document.createElement('option');
      opt.value = id;
      const count = (scenarios[id].steps || []).length;
      const fileNote = scenarios[id].attachedFileName ? ' 📁' : '';
      opt.textContent = `${scenarios[id].name} (${count} bước)${fileNote}`;
      if (id === activeScenarioId) opt.selected = true;
      scenarioSelect.appendChild(opt);
    });
  }

  scenarioSelect.addEventListener('change', (e) => {
    activeScenarioId = e.target.value;
    chrome.storage.local.set({ activeScenarioId });
    renderStepsList();
    checkScenarioAttachedData();
    updateRunnerCard();
  });

  if (btnRenameScenario) {
    btnRenameScenario.addEventListener('click', () => {
      if (!activeScenarioId || !scenarios[activeScenarioId]) return;
      const currentName = scenarios[activeScenarioId].name;
      const newName = prompt('Nhập tên mới cho kịch bản:', currentName);
      if (!newName || !newName.trim() || newName.trim() === currentName) return;
      scenarios[activeScenarioId].name = newName.trim();
      saveScenarios();
      renderScenarioDropdown();
      updateRunnerCard();
    });
  }

  // Ghép kịch bản (Pipeline / Chain Scenarios)
  if (btnChainScenarios) {
    btnChainScenarios.addEventListener('click', () => {
      const keys = Object.keys(scenarios);
      if (keys.length < 2) {
        alert('Cần có ít nhất 2 kịch bản để có thể ghép thành một Quy trình liên hoàn!');
        return;
      }
      chainScenariosList.innerHTML = '';
      keys.forEach((id) => {
        const sc = scenarios[id];
        const stepCount = (sc.steps || []).length;
        const item = document.createElement('label');
        item.style.cssText = 'display: flex; align-items: center; gap: 8px; font-size: 13px; color: #f8fafc; padding: 6px 10px; background: #0f172a; border-radius: 4px; border: 1px solid #334155; cursor: pointer;';
        item.innerHTML = `
          <input type="checkbox" class="chain-chk" value="${id}" style="width: 16px; height: 16px; accent-color: #3b82f6;">
          <span style="font-weight: 600;">${escapeHtml(sc.name)}</span>
          <span style="font-size: 11px; color: #94a3b8; margin-left: auto;">(${stepCount} bước)</span>
        `;
        chainScenariosList.appendChild(item);
      });

      chainNewNameInput.value = `Quy trình liên hoàn ${keys.length + 1}`;
      chainScenariosModal.style.display = 'flex';
    });
  }

  btnChainModalClose?.addEventListener('click', () => { chainScenariosModal.style.display = 'none'; });
  btnChainModalCancel?.addEventListener('click', () => { chainScenariosModal.style.display = 'none'; });

  btnChainModalConfirm?.addEventListener('click', () => {
    const checked = Array.from(document.querySelectorAll('.chain-chk:checked')).map((el) => el.value);
    if (checked.length < 2) {
      alert('Vui lòng tích chọn ít nhất 2 kịch bản để ghép!');
      return;
    }

    const newName = chainNewNameInput.value.trim() || `Quy trình liên hoàn ${Date.now()}`;
    const waitSec = Math.max(0, parseFloat(chainWaitSecInput.value) || 0);

    const mergedSteps = [];
    checked.forEach((id, idx) => {
      const sc = scenarios[id];
      if (sc && Array.isArray(sc.steps)) {
        sc.steps.forEach((st) => {
          mergedSteps.push({
            ...st,
            id: `step_chain_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
          });
        });
      }
      if (waitSec > 0 && idx < checked.length - 1) {
        mergedSteps.push({
          id: `step_chain_wait_${Date.now()}_${idx}`,
          type: 'wait',
          selector: '',
          description: `Chuyển tiếp kịch bản (chờ ${waitSec}s)`,
          delay: Math.round(waitSec * 1000)
        });
      }
    });

    const newId = `scenario_pipeline_${Date.now()}`;
    scenarios[newId] = {
      id: newId,
      name: newName,
      createdAt: new Date().toISOString(),
      steps: mergedSteps
    };
    activeScenarioId = newId;
    saveScenarios();
    renderScenarioDropdown();
    renderStepsList();
    updateRunnerCard();
    chainScenariosModal.style.display = 'none';
    alert(`🎉 Đã tạo thành công "${newName}" với tổng cộng ${mergedSteps.length} bước!`);
  });

  btnNewScenario.addEventListener('click', () => {
    const name = prompt('Nhập tên kịch bản mới:', `Kịch bản ${Object.keys(scenarios).length + 1}`);
    if (!name || !name.trim()) return;
    const newId = `scenario_${Date.now()}`;
    scenarios[newId] = {
      id: newId,
      name: name.trim(),
      createdAt: new Date().toISOString(),
      steps: []
    };
    activeScenarioId = newId;
    saveScenarios();
    renderScenarioDropdown();
    renderStepsList();
    updateRunnerCard();
  });

  btnDeleteScenario.addEventListener('click', () => {
    if (!activeScenarioId || !scenarios[activeScenarioId]) return;
    if (confirm(`Bạn có chắc muốn xóa kịch bản "${scenarios[activeScenarioId].name}"?`)) {
      delete scenarios[activeScenarioId];
      activeScenarioId = Object.keys(scenarios)[0] || null;
      saveScenarios();
      renderScenarioDropdown();
      renderStepsList();
      updateRunnerCard();
    }
  });

  // ============================================================
  // 3. DANH SÁCH BƯỚC & TỰ ĐỘNG GÁN CỘT
  // ============================================================
  function renderStepsList() {
    stepsListContainer.innerHTML = '';
    const current = scenarios[activeScenarioId];
    if (!current || !Array.isArray(current.steps) || current.steps.length === 0) {
      stepsCountBadge.textContent = '0 bước';
      if (bulkDelayBar) bulkDelayBar.style.display = 'none';
      stepsListContainer.innerHTML = `
        <div style="text-align: center; padding: 24px 10px; color: #94a3b8; font-size: 12px;">
          Chưa có bước nào. Bấm <strong>"Bắt đầu ghi mẫu"</strong> để tự động ghi lại thao tác của bạn!
        </div>
      `;
      return;
    }

    if (bulkDelayBar) bulkDelayBar.style.display = 'flex';
    stepsCountBadge.textContent = `${current.steps.length} bước`;
    const headers = getPrimaryHeaders(dataset);

    current.steps.forEach((step, idx) => {
      const card = document.createElement('div');
      card.className = 'step-card';

      let icon = '🖱️';
      if (step.type === 'type') icon = '⌨️';
      else if (step.type === 'keypress') icon = '⏎';
      else if (step.type === 'wait') icon = '⏱️';

      const isMappedCol = step.type === 'type' && step.value && headers.includes(step.value.replace(/^\{+|\}+$/g, '').trim());
      const valBadge = step.type === 'type' && step.value
        ? `<span class="step-badge-tag" style="color: ${isMappedCol ? '#34d399' : '#6ee7b7'};">${isMappedCol ? '📊 Cột: ' : 'Giá trị: '}${escapeHtml(step.value)}</span>`
        : step.type === 'keypress' && step.key
          ? `<span class="step-badge-tag" style="color: #fcd34d;">Phím: ${escapeHtml(step.key)}</span>`
          : '';

      const optBadge = step.optional
        ? `<span class="step-badge-tag" style="color: #fbbf24;">Tùy chọn</span>`
        : '';

      const delaySec = Number(((Number(step.delay ?? 400)) / 1000).toFixed(2));

      card.innerHTML = `
        <div class="step-left">
          <div class="step-num">${idx + 1}</div>
          <div class="step-details">
            <span class="step-desc" title="${escapeHtml(step.selector || '')}">${icon} ${escapeHtml(step.description || step.selector || step.type)}</span>
            <div class="step-meta">
              <span class="step-badge-tag">${escapeHtml((step.type || 'click').toUpperCase())}</span>
              ${valBadge}
              ${optBadge}
              <label class="step-delay-inline" title="Chỉnh trực tiếp số giây chờ trước bước này">
                ⏱️ <input type="number" class="step-delay-input" data-idx="${idx}" min="0" max="300" step="0.5" value="${delaySec}">s
              </label>
            </div>
          </div>
        </div>
        <div class="step-actions">
          <button class="btn btn-secondary btn-xs btn-move-up" title="Di chuyển lên" data-idx="${idx}" ${idx === 0 ? 'disabled style="opacity:0.35;cursor:default;"' : ''}>↑</button>
          <button class="btn btn-secondary btn-xs btn-move-down" title="Di chuyển xuống" data-idx="${idx}" ${idx === current.steps.length - 1 ? 'disabled style="opacity:0.35;cursor:default;"' : ''}>↓</button>
          <button class="btn btn-secondary btn-xs btn-edit-step" title="Sửa bước" data-idx="${idx}">✏️</button>
          <button class="btn btn-danger-ghost btn-xs btn-del-step" title="Xóa bước" data-idx="${idx}">🗑️</button>
        </div>
      `;

      stepsListContainer.appendChild(card);
    });

    // Chỉnh trực tiếp số giây delay ngay trên thẻ bước
    document.querySelectorAll('.step-delay-input').forEach((inp) => {
      inp.addEventListener('change', () => {
        const i = parseInt(inp.dataset.idx, 10);
        if (!current.steps[i]) return;
        const sec = Math.max(0, parseFloat(inp.value) || 0);
        inp.value = String(Number(sec.toFixed(2)));
        current.steps[i].delay = Math.round(sec * 1000);
        if (current.steps[i].type === 'wait') {
          current.steps[i].description = `Chờ cố định ${Number(sec.toFixed(2))} giây`;
        }
        saveScenarios();
      });
    });

    document.querySelectorAll('.btn-move-up').forEach((btn) => {
      btn.onclick = () => {
        const i = parseInt(btn.dataset.idx, 10);
        if (i <= 0) return;
        const tmp = current.steps[i - 1];
        current.steps[i - 1] = current.steps[i];
        current.steps[i] = tmp;
        saveScenarios();
        renderStepsList();
      };
    });

    document.querySelectorAll('.btn-move-down').forEach((btn) => {
      btn.onclick = () => {
        const i = parseInt(btn.dataset.idx, 10);
        if (i >= current.steps.length - 1) return;
        const tmp = current.steps[i + 1];
        current.steps[i + 1] = current.steps[i];
        current.steps[i] = tmp;
        saveScenarios();
        renderStepsList();
      };
    });

    document.querySelectorAll('.btn-del-step').forEach((btn) => {
      btn.onclick = () => {
        const i = parseInt(btn.dataset.idx, 10);
        current.steps.splice(i, 1);
        saveScenarios();
        renderScenarioDropdown();
        renderStepsList();
        updateRunnerCard();
      };
    });

    document.querySelectorAll('.btn-edit-step').forEach((btn) => {
      btn.onclick = () => openEditModal(parseInt(btn.dataset.idx, 10));
    });
  }

  // Bỏ dấu tiếng Việt để so khớp tên cột thông minh
  function stripVietnamese(str) {
    return String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  if (btnAutoMapColumns) {
    btnAutoMapColumns.addEventListener('click', () => {
      const current = scenarios[activeScenarioId];
      if (!current || !Array.isArray(current.steps) || current.steps.length === 0) {
        alert('Kịch bản hiện tại chưa có bước nào!');
        return;
      }
      if (!dataset || dataset.length === 0) {
        alert('Vui lòng nạp file Excel / CSV ở tab "Excel / Dữ liệu" trước khi tự gán cột!');
        switchTab('tab-data');
        return;
      }

      const headers = getPrimaryHeaders(dataset);
      const typeSteps = current.steps.filter((s) => s.type === 'type');
      if (typeSteps.length === 0) {
        alert('Kịch bản này không có bước nhập liệu (TYPE) nào để gán cột Excel.');
        return;
      }

      let mappedCount = 0;
      const usedCols = new Set();

      typeSteps.forEach((step) => {
        const currentVal = String(step.value || '').trim();
        const cleanVal = currentVal.replace(/^\{+|\}+$/g, '').replace(/^\[+|\]+$/g, '').trim();

        // 1. Đã là tên cột hợp lệ
        if (headers.includes(cleanVal)) {
          step.value = cleanVal;
          usedCols.add(cleanVal);
          mappedCount++;
          return;
        }

        // 2. Giá trị gõ mẫu lúc ghi trùng khớp với một ô trong file Excel
        if (cleanVal) {
          for (const row of dataset.slice(0, 20)) {
            const matchedHeader = headers.find((h) => String(row[h] ?? '').trim().toLowerCase() === cleanVal.toLowerCase());
            if (matchedHeader) {
              step.value = matchedHeader;
              usedCols.add(matchedHeader);
              mappedCount++;
              return;
            }
          }
        }

        // 3. So khớp ngữ nghĩa giữa mô tả/selector của ô nhập và tên cột Excel
        const stepHint = stripVietnamese(`${step.description || ''} ${step.selector || ''}`);
        let bestCol = null;
        let bestScore = 0;

        headers.forEach((h) => {
          const colTokens = stripVietnamese(h).split(' ').filter((w) => w.length >= 2);
          if (colTokens.length === 0) return;
          const hits = colTokens.filter((tok) => stepHint.includes(tok)).length;
          const score = hits / colTokens.length;
          if (score > bestScore && score >= 0.5) {
            bestScore = score;
            bestCol = h;
          }
        });

        if (bestCol) {
          step.value = bestCol;
          usedCols.add(bestCol);
          mappedCount++;
        }
      });

      // 4. Nếu vẫn còn bước chưa gán và số bước type <= số cột, gán tuần tự theo các cột còn trống
      if (mappedCount === 0 && typeSteps.length <= headers.length) {
        typeSteps.forEach((step, idx) => {
          step.value = headers[idx];
          mappedCount++;
        });
      }

      saveScenarios();
      renderStepsList();
      alert(`🪄 Đã tự động gán cột Excel cho ${mappedCount}/${typeSteps.length} bước nhập liệu!`);
    });
  }

  // Đặt đồng loạt số giây delay cho tất cả các bước trong kịch bản
  function applyBulkDelaySeconds(secVal) {
    const current = scenarios[activeScenarioId];
    if (!current || !Array.isArray(current.steps) || current.steps.length === 0) return;
    const sec = Math.max(0, parseFloat(secVal) || 0);
    const ms = Math.round(sec * 1000);
    current.steps.forEach((step) => {
      step.delay = ms;
      if (step.type === 'wait') {
        step.description = `Chờ cố định ${Number(sec.toFixed(2))} giây`;
      }
    });
    if (bulkDelaySecInput) bulkDelaySecInput.value = String(Number(sec.toFixed(2)));
    saveScenarios();
    renderStepsList();
  }

  if (btnApplyBulkDelay) {
    btnApplyBulkDelay.addEventListener('click', () => {
      applyBulkDelaySeconds(bulkDelaySecInput ? bulkDelaySecInput.value : 1);
    });
  }

  document.querySelectorAll('.bulk-delay-presets .delay-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      applyBulkDelaySeconds(chip.dataset.sec);
    });
  });

  // Nút chèn nhanh 1 bước chờ (Wait step) tính theo giây
  if (btnAddWaitStep) {
    btnAddWaitStep.addEventListener('click', () => {
      if (!activeScenarioId || !scenarios[activeScenarioId]) {
        alert('Vui lòng tạo kịch bản trước khi thêm bước chờ!');
        return;
      }
      const rawSec = prompt('Nhập số giây muốn dừng chờ (ví dụ: 2 hoặc 1.5):', '2');
      if (rawSec === null) return;
      const sec = Math.max(0.1, parseFloat(rawSec.replace(',', '.')) || 2);
      scenarios[activeScenarioId].steps.push({
        id: `step_${Date.now()}`,
        type: 'wait',
        selector: '',
        description: `Chờ cố định ${Number(sec.toFixed(2))} giây`,
        delay: Math.round(sec * 1000)
      });
      saveScenarios();
      renderScenarioDropdown();
      renderStepsList();
      updateRunnerCard();
    });
  }

  // ============================================================
  // 4. MODAL CHỈNH SỬA BƯỚC
  // ============================================================
  function openEditModal(stepIndex) {
    editingStepIndex = stepIndex;
    const current = scenarios[activeScenarioId];
    if (!current || !current.steps[stepIndex]) return;
    const step = current.steps[stepIndex];

    modalStepDesc.value = step.description || '';
    if (modalStepSelector) modalStepSelector.value = step.selector || '';
    modalStepDelay.value = Number(((Number(step.delay ?? 400)) / 1000).toFixed(2));
    if (modalStepTimeout) modalStepTimeout.value = Math.round((Number(step.timeout) > 0 ? Number(step.timeout) : 30000) / 1000);
    if (modalStepOptional) modalStepOptional.checked = !!step.optional;

    if (modalSelectorGroup) modalSelectorGroup.style.display = step.type === 'wait' ? 'none' : 'flex';
    if (modalTimeoutGroup) modalTimeoutGroup.style.display = step.type === 'wait' ? 'none' : 'flex';

    // Reset hiển thị các nhóm
    modalTypeGroup.style.display = 'none';
    modalClickTableGroup.style.display = 'none';

    if (step.type === 'type') {
      modalTypeGroup.style.display = 'block';

      modalColSelect.innerHTML = '<option value="">-- Chọn cột Excel --</option>';
      const headers = getPrimaryHeaders(dataset);
      const cleanVal = String(step.value || '')
        .replace(/^\{+|\}+$/g, '')
        .replace(/^\[+|\]+$/g, '')
        .trim();

      let matchedCol = '';
      headers.forEach((h) => {
        const opt = document.createElement('option');
        opt.value = h;
        opt.textContent = `Cột: ${h}`;
        if (h === cleanVal) {
          opt.selected = true;
          matchedCol = h;
        }
        modalColSelect.appendChild(opt);
      });

      modalCustomValue.value = step.value || '';

      if (matchedCol || (!step.value && headers.length > 0)) {
        radioColSource.checked = true;
        colSelectWrap.style.display = 'block';
        customValueWrap.style.display = 'none';
      } else {
        radioCustomSource.checked = true;
        colSelectWrap.style.display = 'none';
        customValueWrap.style.display = 'block';
      }
    } else if (step.type === 'click') {
      modalClickTableGroup.style.display = 'block';
      modalRowKeyword.value = '';
      modalRowIndex.value = '1';

      if (step.selector && step.selector.includes('::-af-row(')) {
        const m = step.selector.match(/tr::-af-row\((?:["']?)(.+?)(?:["']?)\)/);
        radioRowKeyword.checked = true;
        rowKeywordWrap.style.display = 'block';
        rowIndexWrap.style.display = 'none';
        modalRowKeyword.value = m ? m[1] : '';
      } else if (step.selector && step.selector.includes('::-af-row-index(')) {
        const m = step.selector.match(/tr::-af-row-index\((\d+)\)/);
        radioRowIndex.checked = true;
        rowKeywordWrap.style.display = 'none';
        rowIndexWrap.style.display = 'block';
        modalRowIndex.value = m ? m[1] : '1';
      } else {
        radioRowDefault.checked = true;
        rowKeywordWrap.style.display = 'none';
        rowIndexWrap.style.display = 'none';
      }
    }

    editStepModal.style.display = 'flex';
  }

  radioColSource.addEventListener('change', () => {
    colSelectWrap.style.display = 'block';
    customValueWrap.style.display = 'none';
  });

  radioCustomSource.addEventListener('change', () => {
    colSelectWrap.style.display = 'none';
    customValueWrap.style.display = 'block';
  });

  radioRowKeyword.addEventListener('change', () => {
    rowKeywordWrap.style.display = 'block';
    rowIndexWrap.style.display = 'none';
  });

  radioRowIndex.addEventListener('change', () => {
    rowKeywordWrap.style.display = 'none';
    rowIndexWrap.style.display = 'block';
  });

  radioRowDefault.addEventListener('change', () => {
    rowKeywordWrap.style.display = 'none';
    rowIndexWrap.style.display = 'none';
  });

  document.querySelectorAll('.modal-delay-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      modalStepDelay.value = chip.dataset.sec;
    });
  });

  btnModalClose.addEventListener('click', () => { editStepModal.style.display = 'none'; });
  btnModalCancel.addEventListener('click', () => { editStepModal.style.display = 'none'; });

  btnModalSave.addEventListener('click', () => {
    if (editingStepIndex === null) return;
    const current = scenarios[activeScenarioId];
    if (!current || !current.steps[editingStepIndex]) return;
    const step = current.steps[editingStepIndex];

    const delaySec = Math.max(0, parseFloat(String(modalStepDelay.value).replace(',', '.')) || 0);
    step.delay = Math.round(delaySec * 1000);
    step.description = modalStepDesc.value.trim() || (step.type === 'wait' ? `Chờ cố định ${Number(delaySec.toFixed(2))} giây` : step.description);
    if (modalStepTimeout) {
      const sec = Math.max(1, parseInt(modalStepTimeout.value, 10) || 30);
      step.timeout = sec * 1000;
    }
    if (modalStepOptional) {
      step.optional = !!modalStepOptional.checked;
    }

    const editedSelector = modalStepSelector ? modalStepSelector.value.trim() : '';
    if (editedSelector) step.selector = editedSelector;

    if (step.type === 'click' && modalClickTableGroup.style.display !== 'none') {
      let subTag = 'button, i, a, [role="button"]';
      if (step.selector && step.selector.includes('tr::')) {
        const parts = step.selector.split(/\)\s+/);
        if (parts[1]) subTag = parts[1].trim();
      }

      if (radioRowKeyword.checked && modalRowKeyword.value.trim()) {
        const kw = modalRowKeyword.value.trim();
        step.selector = `tr::-af-row("${kw}") ${subTag}`;
        if (!modalStepDesc.value.trim()) step.description = `Click thao tác ở dòng "${kw}"`;
      } else if (radioRowIndex.checked && modalRowIndex.value.trim()) {
        const idx = Math.max(1, parseInt(modalRowIndex.value.trim(), 10) || 1);
        step.selector = `tr::-af-row-index(${idx}) ${subTag}`;
        if (!modalStepDesc.value.trim()) step.description = `Click thao tác ở dòng thứ ${idx}`;
      }
    } else if (step.type === 'type') {
      if (radioColSource.checked && modalColSelect.value) {
        step.value = modalColSelect.value;
      } else {
        const customVal = modalCustomValue.value.trim();
        const cleanCustom = customVal.replace(/^\{+|\}+$/g, '').replace(/^\[+|\]+$/g, '').trim();
        const headers = getPrimaryHeaders(dataset);
        step.value = headers.includes(cleanCustom) ? cleanCustom : customVal;
      }
    }

    saveScenarios();
    renderStepsList();
    editStepModal.style.display = 'none';
  });

  // Thêm bước thủ công rồi mở thẳng Modal chỉnh sửa
  btnAddManualStep.addEventListener('click', () => {
    if (!activeScenarioId || !scenarios[activeScenarioId]) {
      alert('Vui lòng tạo kịch bản trước khi thêm bước!');
      return;
    }
    const rawType = prompt('Chọn loại bước cần thêm (click, type, keypress, wait):', 'click');
    if (!rawType) return;
    const type = rawType.trim().toLowerCase();
    if (!['click', 'type', 'keypress', 'wait'].includes(type)) {
      alert('Loại bước không hợp lệ! Chỉ hỗ trợ: click, type, keypress, wait.');
      return;
    }

    const headers = getPrimaryHeaders(dataset);
    const defaultCol = headers[0] || 'Cot_A';
    const newStep = {
      id: `step_${Date.now()}`,
      type,
      selector: type === 'wait' ? '' : (type === 'type' ? 'input[type="text"], textarea' : 'button[type="submit"]'),
      value: type === 'type' ? defaultCol : '',
      key: type === 'keypress' ? 'Enter' : undefined,
      description: type === 'wait' ? 'Chờ cố định' : `Thao tác ${type}`,
      delay: type === 'wait' ? 1000 : 400
    };

    scenarios[activeScenarioId].steps.push(newStep);
    saveScenarios();
    renderScenarioDropdown();
    renderStepsList();
    updateRunnerCard();
    openEditModal(scenarios[activeScenarioId].steps.length - 1);
  });

  // ============================================================
  // 5. KIỂM TRA TAB & KHỞI ĐỘNG GHI MẪU
  // ============================================================
  async function ensureTabReady(tab) {
    if (!tab || !tab.id) {
      alert('Không tìm thấy tab trình duyệt hợp lệ!');
      return false;
    }

    const url = tab.url || '';
    if (url.startsWith('chrome://') || url.startsWith('edge://') || url.startsWith('about:') || url.startsWith('chrome-extension://') || url.startsWith(' https://chrome.google.com/webstore') || url.startsWith('https://chromewebstore.google.com')) {
      alert('Tiện ích không thể chạy trên trang hệ thống của trình duyệt.\nVui lòng mở một trang web thông thường!');
      return false;
    }

    if (url.startsWith('file://')) {
      const isAllowed = await new Promise((resolve) => {
        if (chrome.extension && chrome.extension.isAllowedFileSchemeAccess) {
          chrome.extension.isAllowedFileSchemeAccess(resolve);
        } else {
          resolve(true);
        }
      });

      if (!isAllowed) {
        alert(
          '⚠️ BẠN ĐANG MỞ FILE TỪ MÁY TÍNH (file://)\n\n' +
          'Để chạy trên file nội bộ:\n' +
          '1. Mở tab: chrome://extensions\n' +
          '2. Tìm "AutoFlow" -> bấm "Chi tiết" (Details)\n' +
          '3. Bật "Cho phép truy cập vào các tệp URL" (Allow access to file URLs)\n' +
          '4. Tải lại (F5 / Cmd+R) trang web rồi thử lại!'
        );
        return false;
      }
    }

    let isConnected = false;
    try {
      const res = await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tab.id, { action: 'PING' }, (response) => {
          if (chrome.runtime.lastError || !response) reject(chrome.runtime.lastError);
          else resolve(response);
        });
      });
      if (res && res.status === 'PONG') isConnected = true;
    } catch (e) {
      isConnected = false;
    }

    if (!isConnected) {
      try {
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id, allFrames: false },
          files: ['content/content.css']
        });
        await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: false },
          files: ['content/content.js']
        });
        await new Promise((r) => setTimeout(r, 250));

        const checkPing = await new Promise((resolve) => {
          chrome.tabs.sendMessage(tab.id, { action: 'PING' }, (response) => {
            if (chrome.runtime.lastError || !response) resolve(false);
            else resolve(true);
          });
        });

        if (!checkPing) {
          alert('⚠️ Vui lòng bấm F5 (hoặc Cmd+R) tải lại trang web một lần để kết nối với AutoFlow!');
          return false;
        }
      } catch (err) {
        console.error('Lỗi inject script:', err);
        alert('Không thể kết nối với trang web hiện tại.\n👉 Vui lòng bấm F5 (hoặc Cmd+R) tải lại trang web rồi thử lại!');
        return false;
      }
    }

    return true;
  }

  let isTabRecording = false;
  let isTabRunning = false;

  // Thông báo nổi không gây chặn luồng (Non-blocking Toast) để không làm đơ các tab đang chạy kịch bản
  let popupToastTimer = null;
  function showPopupToast(message, type = 'success', duration = 4000) {
    let toast = document.getElementById('afPopupToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'afPopupToast';
      toast.style.cssText = 'position: fixed; bottom: 14px; left: 14px; right: 14px; z-index: 99999; padding: 10px 14px; border-radius: 8px; font-size: 12.5px; font-weight: 600; line-height: 1.4; color: #fff; box-shadow: 0 10px 25px rgba(0,0,0,0.45); transition: opacity 0.2s ease, transform 0.2s ease; pointer-events: none; white-space: pre-line;';
      document.body.appendChild(toast);
    }
    toast.style.background = type === 'error'
      ? 'linear-gradient(135deg, #dc2626, #991b1b)'
      : 'linear-gradient(135deg, #059669, #047857)';
    toast.style.border = type === 'error' ? '1px solid #f87171' : '1px solid #34d399';
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    clearTimeout(popupToastTimer);
    popupToastTimer = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(6px)';
    }, duration);
  }

  // Helper: khởi động ghi vào một kịch bản với chế độ 'overwrite' hoặc 'append'
  function launchRecording(tab, scenarioId, scenarioName, mode = 'overwrite') {
    chrome.tabs.sendMessage(
      tab.id,
      {
        action: 'START_RECORDING',
        scenarioId,
        scenarioName,
        mode
      },
      () => {
        if (chrome.runtime.lastError) {
          alert('Lỗi khởi động ghi: ' + chrome.runtime.lastError.message);
          return;
        }
        window.close();
      }
    );
  }

  btnStartRecord.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (isTabRecording && tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'STOP_RECORDING', save: true }, () => {
        void chrome.runtime.lastError;
        isTabRecording = false;
        btnStartRecord.innerHTML = '<span class="record-dot"></span> Bắt đầu ghi mẫu';
        loadState();
      });
      return;
    }

    const ready = await ensureTabReady(tab);
    if (!ready) return;

    if (!activeScenarioId || !scenarios[activeScenarioId]) {
      const newId = `scenario_${Date.now()}`;
      scenarios[newId] = {
        id: newId,
        name: `Kịch bản ${Object.keys(scenarios).length + 1}`,
        createdAt: new Date().toISOString(),
        steps: []
      };
      activeScenarioId = newId;
      await saveScenarios();
      renderScenarioDropdown();
      renderStepsList();
      updateRunnerCard();
    }

    const current = scenarios[activeScenarioId];
    const stepsCount = (current && Array.isArray(current.steps)) ? current.steps.length : 0;

    // NẾU LỊCH SỬ ĐANG TRỐNG (0 BƯỚC) -> KHÔNG CẦN HỎI, GHI TRỰC TIẾP!
    if (stepsCount === 0) {
      launchRecording(tab, activeScenarioId, current?.name || 'Kịch bản hiện tại', 'overwrite');
      return;
    }

    // NẾU ĐÃ CÓ BƯỚC TRONG KỊCH BẢN (KHÔNG TRỐNG) -> MỞ MODAL XÁC NHẬN GHI ĐÈ / TẠO MỚI
    if (recordTargetScenarioName) recordTargetScenarioName.textContent = current.name;
    if (recordTargetStepsCount) recordTargetStepsCount.textContent = `${stepsCount}`;
    if (recordNewScenarioNameInput) recordNewScenarioNameInput.value = `${current.name} (Bản mới)`;
    if (recordConfirmModal) recordConfirmModal.style.display = 'flex';
  });

  // Xử lý nút: Tạo kịch bản mới (Khuyên dùng)
  if (btnRecordAsNew) {
    btnRecordAsNew.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const ready = await ensureTabReady(tab);
      if (!ready) return;

      const current = scenarios[activeScenarioId];
      const newName = (recordNewScenarioNameInput?.value || '').trim() || `${current ? current.name : 'Kịch bản'} (Bản mới)`;
      const newId = `scenario_${Date.now()}`;

      scenarios[newId] = {
        id: newId,
        name: newName,
        createdAt: new Date().toISOString(),
        steps: []
      };
      activeScenarioId = newId;
      await saveScenarios();
      renderScenarioDropdown();
      renderStepsList();
      updateRunnerCard();

      if (recordConfirmModal) recordConfirmModal.style.display = 'none';
      launchRecording(tab, newId, newName, 'overwrite');
    });
  }

  // Xử lý nút: Ghi nối tiếp vào kịch bản này
  if (btnRecordAppend) {
    btnRecordAppend.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const ready = await ensureTabReady(tab);
      if (!ready) return;

      const current = scenarios[activeScenarioId];
      if (recordConfirmModal) recordConfirmModal.style.display = 'none';
      launchRecording(tab, activeScenarioId, current?.name || 'Kịch bản hiện tại', 'append');
    });
  }

  // Xử lý nút: Ghi đè kịch bản này
  if (btnRecordOverwrite) {
    btnRecordOverwrite.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const ready = await ensureTabReady(tab);
      if (!ready) return;

      const current = scenarios[activeScenarioId];
      if (recordConfirmModal) recordConfirmModal.style.display = 'none';
      launchRecording(tab, activeScenarioId, current?.name || 'Kịch bản hiện tại', 'overwrite');
    });
  }

  // Đóng modal xác nhận
  if (btnRecordModalClose) {
    btnRecordModalClose.addEventListener('click', () => {
      if (recordConfirmModal) recordConfirmModal.style.display = 'none';
    });
  }
  if (btnRecordCancel) {
    btnRecordCancel.addEventListener('click', () => {
      if (recordConfirmModal) recordConfirmModal.style.display = 'none';
    });
  }
  if (recordConfirmModal) {
    recordConfirmModal.addEventListener('click', (e) => {
      if (e.target === recordConfirmModal) recordConfirmModal.style.display = 'none';
    });
  }

  // ============================================================
  // 6. XỬ LÝ FILE EXCEL / CSV
  // ============================================================
  btnBrowseFile.addEventListener('click', () => {
    excelFileInput.value = '';
    excelFileInput.click();
  });

  excelDropzone.addEventListener('click', (e) => {
    if (e.target !== btnBrowseFile) {
      excelFileInput.value = '';
      excelFileInput.click();
    }
  });

  if (compactDropzone) {
    compactDropzone.addEventListener('click', () => {
      excelFileInput.value = '';
      excelFileInput.click();
    });
  }

  // Hỗ trợ kéo thả trên toàn bộ khu vực Tab Dữ Liệu (cả khi đã có file hoặc chưa có file)
  const dropTargets = [excelDropzone, compactDropzone, dataPreviewCard, tabData].filter(Boolean);

  dropTargets.forEach((target) => {
    target.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      target.classList.add('dragover');
      if (dataPreviewCard) dataPreviewCard.classList.add('dragover');
      if (compactDropzone) compactDropzone.classList.add('dragover');
      if (excelDropzone) excelDropzone.classList.add('dragover');
    });

    target.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.relatedTarget && target.contains(e.relatedTarget)) return;
      target.classList.remove('dragover');
      if (dataPreviewCard) dataPreviewCard.classList.remove('dragover');
      if (compactDropzone) compactDropzone.classList.remove('dragover');
      if (excelDropzone) excelDropzone.classList.remove('dragover');
    });

    target.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropTargets.forEach((t) => t.classList.remove('dragover'));
      if (dataPreviewCard) dataPreviewCard.classList.remove('dragover');
      if (compactDropzone) compactDropzone.classList.remove('dragover');
      if (excelDropzone) excelDropzone.classList.remove('dragover');

      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    });
  });

  excelFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  });

  // Chuyển mảng 2 chiều rawRows thành danh sách đối tượng theo chế độ isFirstRowData
  function buildDatasetFromRawRows(rows, isFirstRowData) {
    if (!Array.isArray(rows) || rows.length === 0) return [];
    const validRows = rows.filter((r) => Array.isArray(r) && r.some((cell) => String(cell ?? '').trim() !== ''));
    if (validRows.length === 0) return [];

    const maxCols = Math.max(...validRows.map((r) => r.length));

    if (isFirstRowData) {
      const colHeaders = Array.from({ length: maxCols }, (_, c) => `Cot_${indexToColLetters(c)}`);
      return validRows.map((r) => {
        const rowObj = {};
        for (let c = 0; c < maxCols; c++) {
          const val = r[c] !== undefined && r[c] !== null ? String(r[c]).trim() : '';
          const letter = indexToColLetters(c);
          rowObj[colHeaders[c]] = val;
          rowObj[letter] = val; // Tương thích {A}, {B}
        }
        return rowObj;
      });
    }

    // Dòng 1 là tiêu đề cột (Header)
    const headerRow = validRows[0];
    const dataRows = validRows.slice(1);
    const colHeaders = Array.from({ length: maxCols }, (_, c) => {
      const rawH = headerRow[c] !== undefined && headerRow[c] !== null ? String(headerRow[c]).trim() : '';
      return rawH || `Cot_${indexToColLetters(c)}`;
    });

    return dataRows.map((r) => {
      const rowObj = {};
      for (let c = 0; c < maxCols; c++) {
        const val = r[c] !== undefined && r[c] !== null ? String(r[c]).trim() : '';
        rowObj[colHeaders[c]] = val;
      }
      return rowObj;
    });
  }

  // Đọc và nạp một hoặc nhiều file Excel/CSV cùng lúc
  function processFiles(files) {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files).filter((f) => /\.(xlsx|xls|csv)$/i.test(f.name));
    if (fileList.length === 0) {
      alert('Vui lòng chọn hoặc kéo thả file có định dạng .xlsx, .xls hoặc .csv!');
      return;
    }

    let processedCount = 0;
    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const wb = XLSX.read(data, { type: 'array' });
          cachedWorkbook = wb;
          const firstSheetName = wb.SheetNames[0];
          const worksheet = wb.Sheets[firstSheetName];
          const sheetRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

          const autoIsData = detectFirstRowIsData(sheetRows);
          const isFirstRowData = chkFirstRowIsData ? chkFirstRowIsData.checked : autoIsData;
          const ds = buildDatasetFromRawRows(sheetRows, isFirstRowData);

          if (ds.length > 0) {
            const fid = 'file_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
            excelFiles[fid] = {
              id: fid,
              name: file.name,
              dataset: ds,
              rawSheetRows: sheetRows,
              rowCount: ds.length,
              colCount: getPrimaryHeaders(ds).length,
              isFirstRowData,
              uploadedAt: Date.now()
            };
            activeExcelFileId = fid;
            currentFileName = file.name;
            dataset = ds;
            rawSheetRows = sheetRows;
          }
        } catch (err) {
          console.error(err);
          alert(`Lỗi khi đọc file "${file.name}": ` + err.message);
        } finally {
          processedCount++;
          if (processedCount === fileList.length) {
            chrome.storage.local.set({
              excelFiles,
              activeExcelFileId,
              currentDataset: dataset,
              rawSheetRows,
              currentFileName,
              excelFirstRowIsData: chkFirstRowIsData ? chkFirstRowIsData.checked : true
            });
            renderExcelFilesBar();
          }
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  function processFile(file) {
    if (file) processFiles([file]);
  }

  function applyExcelParsing(fileName = currentFileName) {
    if (!rawSheetRows && cachedWorkbook) {
      const firstSheetName = cachedWorkbook.SheetNames[0];
      const worksheet = cachedWorkbook.Sheets[firstSheetName];
      rawSheetRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    }
    if (!rawSheetRows) return;

    const isFirstRowData = chkFirstRowIsData ? chkFirstRowIsData.checked : true;
    dataset = buildDatasetFromRawRows(rawSheetRows, isFirstRowData);

    if (dataset.length === 0) {
      alert('File Excel không có dòng dữ liệu nào!');
      return;
    }

    currentFileName = fileName || currentFileName || 'data.xlsx';

    // Tạo fileId mới hoặc dùng activeExcelFileId nếu cùng tên file
    let fid = activeExcelFileId;
    if (!fid || !excelFiles[fid] || excelFiles[fid].name !== currentFileName) {
      fid = 'file_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    }

    excelFiles[fid] = {
      id: fid,
      name: currentFileName,
      dataset,
      rawSheetRows,
      rowCount: dataset.length,
      colCount: getPrimaryHeaders(dataset).length,
      isFirstRowData,
      uploadedAt: Date.now()
    };
    activeExcelFileId = fid;

    chrome.storage.local.set({
      excelFiles,
      activeExcelFileId,
      currentDataset: dataset,
      rawSheetRows,
      currentFileName,
      excelFirstRowIsData: isFirstRowData
    });

    renderExcelFilesBar();
  }

  function renderExcelFilesBar() {
    const fileIds = Object.keys(excelFiles);
    if (fileIds.length === 0) {
      if (excelFilesBar) excelFilesBar.style.display = 'none';
      if (dataPreviewCard) dataPreviewCard.style.display = 'none';
      if (excelDropzone) excelDropzone.style.display = 'block';
      if (dataRowsBadge) dataRowsBadge.style.display = 'none';
      dataset = [];
      currentFileName = '';
      rawSheetRows = null;
      renderStepsList();
      updateRunnerCard();
      return;
    }

    if (!activeExcelFileId || !excelFiles[activeExcelFileId]) {
      activeExcelFileId = fileIds[0];
    }

    if (excelFilesBar) {
      excelFilesBar.style.display = 'block';
      if (excelFileSelect) {
        excelFileSelect.innerHTML = fileIds.map((id) => {
          const f = excelFiles[id];
          const isSel = id === activeExcelFileId ? 'selected' : '';
          return `<option value="${escapeHtml(id)}" ${isSel}>📄 ${escapeHtml(f.name)} (${f.rowCount || f.dataset?.length || 0} dòng)</option>`;
        }).join('');
      }
    }

    const cur = excelFiles[activeExcelFileId];
    if (cur) {
      dataset = cur.dataset || [];
      currentFileName = cur.name || '';
      rawSheetRows = cur.rawSheetRows || null;
      if (chkFirstRowIsData && typeof cur.isFirstRowData === 'boolean') {
        chkFirstRowIsData.checked = cur.isFirstRowData;
      }
      showDataPreview(dataset, currentFileName);
      renderStepsList();
      updateRunnerCard();
    }
  }

  if (excelFileSelect) {
    excelFileSelect.addEventListener('change', (e) => {
      activeExcelFileId = e.target.value;
      const f = excelFiles[activeExcelFileId];
      if (f) {
        dataset = f.dataset || [];
        currentFileName = f.name || '';
        rawSheetRows = f.rawSheetRows || null;
        if (chkFirstRowIsData && typeof f.isFirstRowData === 'boolean') {
          chkFirstRowIsData.checked = f.isFirstRowData;
        }
        chrome.storage.local.set({
          activeExcelFileId,
          currentDataset: dataset,
          currentFileName,
          rawSheetRows,
          excelFirstRowIsData: f.isFirstRowData !== false
        });
        showDataPreview(dataset, currentFileName);
        renderStepsList();
        updateRunnerCard();
      }
    });
  }

  if (btnUploadAnotherFile) {
    btnUploadAnotherFile.addEventListener('click', () => {
      excelFileInput.value = '';
      excelFileInput.click();
    });
  }

  if (btnChangeFile) {
    btnChangeFile.addEventListener('click', () => {
      excelFileInput.value = '';
      excelFileInput.click();
    });
  }

  function deleteSelectedExcelFile() {
    if (!activeExcelFileId || !excelFiles[activeExcelFileId]) return;
    const nameToDelete = excelFiles[activeExcelFileId].name;
    if (!confirm(`Bạn có chắc muốn xóa file "${nameToDelete}" khỏi danh sách?`)) return;

    delete excelFiles[activeExcelFileId];
    const remainingIds = Object.keys(excelFiles);
    activeExcelFileId = remainingIds.length > 0 ? remainingIds[0] : null;

    if (activeExcelFileId && excelFiles[activeExcelFileId]) {
      const nextF = excelFiles[activeExcelFileId];
      dataset = nextF.dataset || [];
      currentFileName = nextF.name || '';
      rawSheetRows = nextF.rawSheetRows || null;
      chrome.storage.local.set({
        excelFiles,
        activeExcelFileId,
        currentDataset: dataset,
        currentFileName,
        rawSheetRows,
        excelFirstRowIsData: nextF.isFirstRowData !== false
      });
    } else {
      dataset = [];
      currentFileName = '';
      rawSheetRows = null;
      cachedWorkbook = null;
      excelFileInput.value = '';
      chrome.storage.local.remove(['currentDataset', 'rawSheetRows', 'currentFileName', 'activeExcelFileId']);
      chrome.storage.local.set({ excelFiles: {} });
    }
    renderExcelFilesBar();
  }

  if (btnDeleteSelectedFile) {
    btnDeleteSelectedFile.addEventListener('click', deleteSelectedExcelFile);
  }

  if (chkFirstRowIsData) {
    chkFirstRowIsData.addEventListener('change', () => {
      if (rawSheetRows || cachedWorkbook) {
        applyExcelParsing();
      }
    });
  }

  function showDataPreview(data, fileName) {
    dataPreviewCard.style.display = 'flex';
    excelDropzone.style.display = 'none';

    const headers = getPrimaryHeaders(data);
    previewFileName.textContent = fileName || 'Dữ liệu Excel';
    previewFileStats.textContent = `${data.length} dòng • ${headers.length} cột`;
    dataRowsBadge.style.display = 'inline-block';
    dataRowsBadge.textContent = `${data.length}`;

    columnChipsContainer.innerHTML = '';
    headers.forEach((h) => {
      // 1. Chip sao chép tên cột biến số (dùng gán vào bước kịch bản)
      const chip = document.createElement('span');
      chip.className = 'col-chip';
      chip.textContent = h;
      chip.title = `Bấm để sao chép tên biến [${h}] gán vào kịch bản`;
      chip.onclick = () => {
        navigator.clipboard.writeText(h);
        chip.style.borderColor = '#10b981';
        chip.textContent = `✓ Đã copy tên cột: ${h}`;
        setTimeout(() => {
          chip.textContent = h;
          chip.style.borderColor = '';
        }, 1200);
      };
      columnChipsContainer.appendChild(chip);

      // 2. Chip sao chép nhanh giá trị dữ liệu thật của dòng 1
      if (data.length > 0 && data[0][h] !== undefined && data[0][h] !== '') {
        const sampleVal = String(data[0][h]);
        const sampleChip = document.createElement('span');
        sampleChip.className = 'col-chip';
        sampleChip.style.background = 'rgba(16, 185, 129, 0.15)';
        sampleChip.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        sampleChip.style.color = '#34d399';
        sampleChip.textContent = `📋 Copy mẫu: ${sampleVal.length > 25 ? sampleVal.slice(0, 22) + '...' : sampleVal}`;
        sampleChip.title = `Bấm để sao chép giá trị thật của dòng đầu tiên: "${sampleVal}"`;
        sampleChip.onclick = () => {
          navigator.clipboard.writeText(sampleVal);
          sampleChip.textContent = `✓ Đã copy dữ liệu thật!`;
          setTimeout(() => {
            sampleChip.textContent = `📋 Copy mẫu: ${sampleVal.length > 25 ? sampleVal.slice(0, 22) + '...' : sampleVal}`;
          }, 1200);
        };
        columnChipsContainer.appendChild(sampleChip);
      }
    });

    previewTableHead.innerHTML = `<tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`;
    previewTableBody.innerHTML = '';
    data.slice(0, 5).forEach((row) => {
      const tr = document.createElement('tr');
      headers.forEach((h) => {
        const td = document.createElement('td');
        const cellVal = String(row[h] ?? '');
        td.textContent = cellVal;
        td.title = `Bấm để sao chép giá trị này: "${cellVal}"`;
        td.style.cursor = 'pointer';
        td.onclick = () => {
          navigator.clipboard.writeText(cellVal);
          const orig = td.textContent;
          td.style.color = '#10b981';
          td.style.fontWeight = 'bold';
          td.textContent = `✓ Đã copy`;
          setTimeout(() => {
            td.textContent = orig;
            td.style.color = '';
            td.style.fontWeight = '';
          }, 1000);
        };
        tr.appendChild(td);
      });
      previewTableBody.appendChild(tr);
    });
  }

  btnClearData.addEventListener('click', deleteSelectedExcelFile);

  // ============================================================
  // 7. TAB CHẠY TỰ ĐỘNG & BÁO CÁO KẾT QUẢ
  // ============================================================
  function saveRunnerPrefs() {
    const prefs = {
      speed: parseFloat(runSpeedSelect?.value) || 1,
      errorMode: runErrorModeSelect?.value || 'stop',
      startRow: Math.max(1, parseInt(runStartRow?.value, 10) || 1),
      extraDelaySec: Math.max(0, parseFloat(runExtraDelaySec?.value) || 0),
      repeatCount: Math.max(1, parseInt(runRepeatCount?.value, 10) || 1)
    };
    chrome.storage.local.set({ runnerPrefs: prefs });
    return prefs;
  }

  [runSpeedSelect, runErrorModeSelect, runStartRow, runExtraDelaySec, runRepeatCount].forEach((el) => {
    if (el) el.addEventListener('change', () => { saveRunnerPrefs(); updateRunnerCard(); });
  });

  function updateRunnerCard() {
    const current = scenarios[activeScenarioId];
    runnerScenarioName.textContent = current ? `${current.name} (${current.steps?.length || 0} bước)` : 'Chưa chọn kịch bản';
    const rep = Math.max(1, parseInt(runRepeatCount?.value, 10) || 1);
    const repText = rep > 1 ? ` • Lặp ${rep} lần` : '';
    runnerDataInfo.textContent = dataset.length > 0 ? `${currentFileName} (${dataset.length} dòng${repText})` : `Chưa nạp Excel (${rep > 1 ? `Lặp ${rep} lần` : 'Chạy 1 lần'})`;
    if (runStartRow && dataset.length > 0) {
      runStartRow.max = String(dataset.length);
      const start = Math.max(1, parseInt(runStartRow.value, 10) || 1);
      if (runStartRowInfo) {
        runStartRowInfo.textContent = start > 1 ? `(Chạy ${Math.max(0, dataset.length - start + 1)} dòng còn lại)` : `(Tổng ${dataset.length} dòng)`;
      }
    }
    if (settingExportCurrentDesc) {
      settingExportCurrentDesc.textContent = current
        ? `Tải riêng "${current.name}" (${current.steps?.length || 0} bước) về máy để gửi cho người khác.`
        : 'Tải riêng kịch bản hiện tại về máy để gửi cho người khác.';
    }
  }

  btnStartRunner.addEventListener('click', async () => {
    const current = scenarios[activeScenarioId];
    if (!current || !current.steps || current.steps.length === 0) {
      alert('Vui lòng chọn hoặc tạo kịch bản có ít nhất 1 bước trước khi chạy!');
      return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const ready = await ensureTabReady(tab);
    if (!ready) return;

    const prefs = saveRunnerPrefs();
    const startRow = prefs.startRow;
    const repeatCount = prefs.repeatCount || 1;
    if (dataset.length > 0 && startRow > dataset.length) {
      alert(`Dòng bắt đầu (${startRow}) lớn hơn tổng số dòng của file Excel (${dataset.length})!`);
      return;
    }

    const rowOffset = dataset.length > 0 ? Math.max(0, startRow - 1) : 0;
    const datasetToRun = dataset.length > 0 ? dataset.slice(rowOffset) : [{}];

    btnStartRunner.style.display = 'none';
    btnStopRunner.style.display = 'flex';
    runProgressBox.style.display = 'block';
    progressStatusText.textContent = `Bắt đầu từ dòng ${startRow} trên ${tab.title || 'trang web'}...`;
    progressPctText.textContent = '0%';
    progressBarFill.style.width = '0%';
    setHeaderStatus('running', 'Đang chạy');

    addLog(`▶️ Chạy "${current.name}" từ dòng ${startRow} (${datasetToRun.length} dòng${repeatCount > 1 ? ` • Lặp ${repeatCount} lần` : ''}).`, 'success');

    chrome.tabs.sendMessage(
      tab.id,
      {
        action: 'START_EXECUTION',
        scenario: current,
        dataset: datasetToRun,
        options: {
          speed: prefs.speed,
          errorMode: prefs.errorMode,
          rowOffset,
          extraDelaySec: prefs.extraDelaySec,
          repeatCount: repeatCount
        }
      },
      () => {
        if (chrome.runtime.lastError) {
          alert('⚠️ Không thể bắt đầu chạy: ' + chrome.runtime.lastError.message + '\nVui lòng bấm F5 tải lại trang web rồi thử lại!');
          btnStartRunner.style.display = 'flex';
          btnStopRunner.style.display = 'none';
          runProgressBox.style.display = 'none';
          setHeaderStatus('idle', 'Sẵn sàng');
        }
      }
    );
  });

  // Lắng nghe tiến độ & kết quả từ Content Script
  chrome.runtime.onMessage.addListener(async (msg, sender) => {
    if (!msg) return;

    if (!currentActiveTabId) {
      await getCurrentActiveTab();
    }

    const msgTabId = sender?.tab?.id ?? msg?.tabId ?? null;

    // NGUYÊN TẮC CỐT LÕI ĐA TAB:
    // Nếu thông điệp tiến độ/kết quả đến từ TAB KHÁC đang chạy ngầm (msgTabId !== currentActiveTabId):
    // Tuyệt đối KHÔNG chiếm quyền điều khiển, KHÔNG đổi nút và KHÔNG ghi đè tiến độ của tab hiện tại!
    if (msgTabId && currentActiveTabId && msgTabId !== currentActiveTabId) {
      return;
    }

    if (msg.action === 'EXECUTION_PROGRESS') {
      isTabRunning = true;
      btnStartRunner.style.display = 'none';
      btnStopRunner.style.display = 'flex';
      runProgressBox.style.display = 'block';

      const total = msg.runTotal || 1;
      const totalSteps = msg.totalSteps || 1;
      const repCount = msg.repeatCount || 1;
      const cycle = msg.cycle || 1;
      const cyclePct = ((msg.runIndex || 0) + ((msg.step || 1) - 1) / totalSteps) / total;
      const overallPct = Math.min(100, Math.round((((cycle - 1) + cyclePct) / repCount) * 100));
      progressPctText.textContent = `${overallPct}%`;
      progressBarFill.style.width = `${overallPct}%`;

      const cyclePrefix = repCount > 1 ? `[Vòng ${cycle}/${repCount}] ` : '';
      if (msg.hasError) {
        progressStatusText.textContent = `⚠️ Gặp lỗi ở Dòng ${msg.row} (xem thanh nổi trên trang)`;
        setHeaderStatus('error', 'Gặp lỗi');
      } else if (msg.isPaused) {
        progressStatusText.textContent = `⏸️ ${cyclePrefix}Tạm dừng tại Dòng ${msg.row}/${msg.totalRows}`;
        setHeaderStatus('paused', 'Tạm dừng');
      } else {
        progressStatusText.textContent = `${cyclePrefix}Đang chạy Dòng ${msg.row}/${msg.totalRows} • Bước ${msg.step}/${msg.totalSteps}`;
        setHeaderStatus('running', 'Đang chạy');
      }
    } else if (msg.action === 'EXECUTION_COMPLETED') {
      isTabRunning = false;
      btnStartRunner.style.display = 'flex';
      btnStopRunner.style.display = 'none';
      progressPctText.textContent = '100%';
      progressBarFill.style.width = '100%';
      setHeaderStatus('idle', 'Sẵn sàng');

      const s = msg.summary;
      if (s) {
        const repText = s.repeatCount > 1 ? ` (qua ${s.repeatCount} vòng lặp)` : '';
        progressStatusText.textContent = `Hoàn tất${repText}: ${s.success} thành công${s.failed ? `, ${s.failed} lỗi` : ''}`;
        addLog(
          `🏁 Kết thúc (${s.reason === 'completed' ? 'Hoàn tất' : 'Đã dừng'})${repText}: ${s.success} dòng thành công${s.failed ? `, ${s.failed} dòng lỗi` : ''}.`,
          s.failed ? 'error' : 'success'
        );
      } else {
        progressStatusText.textContent = 'Hoàn tất';
        addLog('Đã hoàn tất toàn bộ kịch bản!', 'success');
      }
    }
  });

  btnStopRunner.addEventListener('click', async () => {
    const tab = await getCurrentActiveTab();
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'STOP_EXECUTION' }, () => void chrome.runtime.lastError);
    }
    btnStartRunner.style.display = 'flex';
    btnStopRunner.style.display = 'none';
    progressStatusText.textContent = 'Đã dừng khẩn cấp';
    setHeaderStatus('idle', 'Sẵn sàng');
    addLog('⏹️ Đã dừng kịch bản tự động trên tab này.', 'error');
  });

  // Đồng bộ trạng thái nếu mở lại Popup khi tab đang chạy hoặc đang ghi
  async function syncActiveTabStatus() {
    try {
      const tab = await getCurrentActiveTab();
      if (!tab || !tab.id) return;
      currentActiveTabId = tab.id;

      chrome.tabs.sendMessage(tab.id, { action: 'GET_STATUS' }, (st) => {
        if (chrome.runtime.lastError || !st) {
          isTabRecording = false;
          isTabRunning = false;
          btnStartRunner.style.display = 'flex';
          btnStopRunner.style.display = 'none';
          runProgressBox.style.display = 'none';
          return;
        }

        if (st.isRecording) {
          isTabRecording = true;
          isTabRunning = false;
          setHeaderStatus('recording', `Đang ghi (${st.recordedCount} bước)`);
          btnStartRecord.innerHTML = `<span class="record-dot"></span> 💾 Dừng & Lưu (${st.recordedCount} bước)`;
          return;
        }

        isTabRecording = false;
        btnStartRecord.innerHTML = '<span class="record-dot"></span> Bắt đầu ghi mẫu';

        if (!st.isRunning) {
          isTabRunning = false;
          // Tab hiện tại đang rảnh (Idle), hiển thị nút Bắt đầu chạy bình thường
          btnStartRunner.style.display = 'flex';
          btnStopRunner.style.display = 'none';
          runProgressBox.style.display = 'none';

          // Kiểm tra xem có tab khác đang chạy ngầm không để hiển thị trạng thái chuẩn xác
          chrome.storage.local.get(['afActiveJobs'], (res) => {
            const jobs = res.afActiveJobs || {};
            const otherRunning = Object.keys(jobs).filter((id) => jobs[id].status === 'running' && Number(id) !== tab.id);
            if (otherRunning.length > 0) {
              setHeaderStatus('idle', `Sẵn sàng (${otherRunning.length} tab khác đang chạy ngầm)`);
            } else {
              setHeaderStatus('idle', 'Sẵn sàng');
            }
          });
          return;
        }

        if (st.isRunning) {
          isTabRunning = true;
          setHeaderStatus(st.hasError ? 'error' : st.isPaused ? 'paused' : 'running', st.isPaused ? 'Tạm dừng' : 'Đang chạy');
          btnStartRunner.style.display = 'none';
          btnStopRunner.style.display = 'flex';
          runProgressBox.style.display = 'block';
          const total = st.totalRows || 1;
          const repCount = st.repeatCount || 1;
          const cycle = st.currentCycle || 1;
          const cyclePct = (st.currentRunIndex || 0) / total;
          const pct = Math.min(100, Math.round((((cycle - 1) + cyclePct) / repCount) * 100));
          progressPctText.textContent = `${pct}%`;
          progressBarFill.style.width = `${pct}%`;
          const cyclePrefix = repCount > 1 ? `[Vòng ${cycle}/${repCount}] ` : '';
          progressStatusText.textContent = `${cyclePrefix}Đang chạy Dòng ${(st.rowOffset || 0) + (st.currentRunIndex || 0) + 1}/${(st.rowOffset || 0) + total}`;
        }
      });
    } catch (e) {}
  }

  // Xuất báo cáo Excel kết quả chạy
  if (btnExportResults) {
    btnExportResults.addEventListener('click', () => {
      chrome.storage.local.get(['lastRunResults'], (res) => {
        const summary = res.lastRunResults;
        if (!summary || !Array.isArray(summary.logs) || summary.logs.length === 0) {
          alert('Chưa có dữ liệu báo cáo của lần chạy nào!');
          return;
        }

        const reportRows = summary.logs.map((entry) => {
          const cleanData = {};
          const raw = entry.data || {};
          Object.keys(raw).forEach((k) => {
            if (!(/^[A-Z]{1,3}$/.test(k) && raw[`Cot_${k}`] !== undefined)) {
              cleanData[k] = raw[k];
            }
          });
          const rowObj = {};
          if (summary.repeatCount > 1 || entry.cycle > 1) {
            rowObj['Vong_Lap'] = entry.cycle || 1;
          }
          rowObj['Dong_Excel'] = entry.row;
          Object.assign(rowObj, cleanData);
          rowObj['Trang_Thai_AutoFlow'] = entry.status === 'success' ? 'Thành công' : 'Lỗi';
          rowObj['Chi_Tiet_Loi'] = entry.error || '';
          rowObj['Thoi_Gian'] = entry.time || '';
          return rowObj;
        });

        const ws = XLSX.utils.json_to_sheet(reportRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Ket_Qua_AutoFlow');
        XLSX.writeFile(wb, `autoflow_report_${Date.now()}.xlsx`);
      });
    });
  }

  function addLog(msg, type = 'info') {
    const emptyLog = logsContainer.querySelector('.log-empty');
    if (emptyLog) emptyLog.remove();

    const item = document.createElement('div');
    item.className = `log-item ${type}`;
    const time = new Date().toLocaleTimeString('vi-VN');
    item.textContent = `[${time}] ${msg}`;
    logsContainer.prepend(item);
  }

  btnClearLogs.addEventListener('click', () => {
    logsContainer.innerHTML = '<div class="log-item log-empty">Nhật ký đã được xóa.</div>';
  });

  // ============================================================
  // 8. CÀI ĐẶT: XUẤT / NHẬP KỊCH BẢN JSON (TỪNG KỊCH BẢN & BẢO VỆ DỮ LIỆU CŨ)
  // ============================================================

  // Tải file JSON xuống máy bằng Blob URL an toàn, không làm gián đoạn kịch bản đang chạy
  function triggerJsonDownload(dataObj, fileName) {
    const jsonStr = JSON.stringify(dataObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const dlAnchor = document.createElement('a');
    dlAnchor.style.display = 'none';
    dlAnchor.href = url;
    dlAnchor.download = fileName;
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    setTimeout(() => {
      dlAnchor.remove();
      URL.revokeObjectURL(url);
    }, 3000);
  }

  // Xuất 1 kịch bản đơn lẻ ra file JSON riêng
  function exportSingleScenario(scenario) {
    if (!scenario) {
      showPopupToast('⚠️ Vui lòng chọn kịch bản bạn muốn xuất!', 'error');
      return;
    }
    const cleanFileName = (scenario.name || 'kich_ban')
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\s+/g, '_')
      .trim();

    const singleData = {
      version: '1.2',
      format: 'autoflow_single_scenario',
      exportedAt: new Date().toISOString(),
      scenario: {
        id: scenario.id,
        name: scenario.name,
        createdAt: scenario.createdAt || new Date().toISOString(),
        updatedAt: scenario.updatedAt || new Date().toISOString(),
        steps: Array.isArray(scenario.steps) ? scenario.steps : [],
        attachedFileName: scenario.attachedFileName || null,
        attachedDataset: Array.isArray(scenario.attachedDataset) ? scenario.attachedDataset : undefined
      }
    };

    triggerJsonDownload(singleData, `autoflow_${cleanFileName}.json`);
    showPopupToast(`📤 Đã xuất kịch bản "${scenario.name}"!`);
  }

  // Xuất toàn bộ kịch bản ra 1 file JSON sao lưu
  function exportAllScenarios() {
    if (!scenarios || Object.keys(scenarios).length === 0) {
      showPopupToast('⚠️ Chưa có kịch bản nào để xuất!', 'error');
      return;
    }
    const bundleData = {
      version: '1.2',
      format: 'autoflow_bundle',
      exportedAt: new Date().toISOString(),
      total: Object.keys(scenarios).length,
      scenarios: scenarios
    };
    triggerJsonDownload(bundleData, `autoflow_all_scenarios_${Date.now()}.json`);
    showPopupToast(`📤 Đã xuất toàn bộ ${Object.keys(scenarios).length} kịch bản!`);
  }

  // Gắn sự kiện xuất kịch bản
  if (btnExportScenario) {
    btnExportScenario.addEventListener('click', () => {
      exportSingleScenario(scenarios[activeScenarioId]);
    });
  }

  if (btnExportCurrentJson) {
    btnExportCurrentJson.addEventListener('click', () => {
      exportSingleScenario(scenarios[activeScenarioId]);
    });
  }

  if (btnExportAllJson) {
    btnExportAllJson.addEventListener('click', exportAllScenarios);
  }
  if (btnExportJson) {
    btnExportJson.addEventListener('click', exportAllScenarios);
  }

  // Trích xuất danh sách kịch bản từ mọi định dạng JSON (file đơn lẻ, mảng, bundle, hoặc map)
  function extractScenariosFromImport(imported) {
    const list = [];
    if (!imported || typeof imported !== 'object') return list;

    // Định dạng 1: Mảng kịch bản [ { name, steps }, ... ]
    if (Array.isArray(imported)) {
      imported.forEach((item) => {
        if (item && typeof item === 'object' && Array.isArray(item.steps)) {
          list.push(item);
        }
      });
      return list;
    }

    // Định dạng 2: Gói kịch bản đơn có thuộc tính scenario { format: "autoflow_single_scenario", scenario: { ... } }
    if (imported.scenario && typeof imported.scenario === 'object' && Array.isArray(imported.scenario.steps)) {
      list.push(imported.scenario);
      return list;
    }

    // Định dạng 3: Gói bundle { scenarios: { ... } } hoặc { data: { ... } }
    if (imported.scenarios && typeof imported.scenarios === 'object') {
      return extractScenariosFromImport(imported.scenarios);
    }
    if (imported.data && typeof imported.data === 'object') {
      return extractScenariosFromImport(imported.data);
    }

    // Định dạng 4: Bản thân file JSON chính là 1 kịch bản đơn { name: "...", steps: [...] }
    if (Array.isArray(imported.steps)) {
      list.push(imported);
      return list;
    }

    // Định dạng 5: Bản đồ dictionary { [id]: { name, steps } }
    Object.values(imported).forEach((val) => {
      if (val && typeof val === 'object' && Array.isArray(val.steps)) {
        list.push(val);
      }
    });

    return list;
  }

  // Nhập kịch bản JSON (ĐẢM BẢO 100% KHÔNG LÀM MẤT HOẶC GHI ĐÈ KỊCH BẢN HIỆN TẠI)
  if (btnImportJson) {
    btnImportJson.addEventListener('click', () => importJsonInput.click());
  }

  if (importJsonInput) {
    importJsonInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const rawText = ev.target.result;
          let parsed;
          try {
            parsed = JSON.parse(rawText);
          } catch (pe) {
            throw new Error('Nội dung file không phải định dạng JSON hợp lệ.');
          }

          const extracted = extractScenariosFromImport(parsed);
          if (!extracted || extracted.length === 0) {
            throw new Error('Không tìm thấy kịch bản hợp lệ nào trong file JSON đã chọn.');
          }

          // Đồng bộ lại danh sách kịch bản mới nhất từ storage trước khi gộp để tránh ghi đè
          const latestStorage = await new Promise((resolve) => {
            chrome.storage.local.get(['scenarios', 'activeScenarioId'], (r) => resolve(r || {}));
          });
          if (latestStorage.scenarios && typeof latestStorage.scenarios === 'object') {
            scenarios = { ...latestStorage.scenarios, ...scenarios };
          }

          let addedCount = 0;
          let lastAddedId = null;
          const importedNames = [];

          // Tập hợp tên các kịch bản hiện có để chống trùng tên
          const existingNames = new Set(
            Object.values(scenarios).map((s) => (s && s.name ? s.name.trim().toLowerCase() : ''))
          );

          extracted.forEach((incoming, idx) => {
            const rawName = String(incoming.name || `Kịch bản nhập ${idx + 1}`).trim();
            let finalName = rawName;

            // Chống trùng tên: nếu tên đã tồn tại, tự động thêm hậu tố "(Đã nhập)" để phân biệt rõ
            if (existingNames.has(finalName.toLowerCase())) {
              let count = 1;
              finalName = `${rawName} (Đã nhập)`;
              while (existingNames.has(finalName.toLowerCase())) {
                count++;
                finalName = `${rawName} (Đã nhập ${count})`;
              }
            }
            existingNames.add(finalName.toLowerCase());

            // Chống trùng ID: Tuyệt đối KHÔNG dùng ID trùng với kịch bản đang có trên máy
            let finalId = incoming.id;
            if (!finalId || scenarios[finalId]) {
              finalId = `scenario_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
            }

            const validScenario = {
              id: finalId,
              name: finalName,
              createdAt: incoming.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              steps: Array.isArray(incoming.steps) ? incoming.steps : []
            };

            if (incoming.attachedFileName) validScenario.attachedFileName = incoming.attachedFileName;
            if (Array.isArray(incoming.attachedDataset)) validScenario.attachedDataset = incoming.attachedDataset;

            // NẠP VÀO DANH SÁCH - BẢO LƯU 100% CÁC KỊCH BẢN CŨ ĐANG CÓ
            scenarios[finalId] = validScenario;
            lastAddedId = finalId;
            addedCount++;
            importedNames.push(finalName);
          });

          // Nếu tab hiện tại KHÔNG đang chạy kịch bản thì mới chuyển sang kịch bản vừa nhập;
          // Nếu đang chạy kịch bản, giữ nguyên activeScenarioId và dữ liệu của kịch bản đang chạy để không làm gián đoạn!
          if (lastAddedId && !isTabRunning) {
            activeScenarioId = lastAddedId;
          }

          await saveScenarios();
          renderScenarioDropdown();
          if (!isTabRunning) {
            renderStepsList();
            checkScenarioAttachedData();
            updateRunnerCard();
          }

          const nameList = importedNames.slice(0, 4).map((n) => `• ${n}`).join('\n');
          const moreText = importedNames.length > 4 ? `\n... và ${importedNames.length - 4} kịch bản khác` : '';
          showPopupToast(`🎉 Đã nhập thêm ${addedCount} kịch bản (kịch bản đang có & đang chạy được giữ nguyên):\n${nameList}${moreText}`, 'success', 4500);
        } catch (err) {
          showPopupToast('⚠️ Lỗi khi nhập kịch bản: ' + err.message, 'error', 5000);
        } finally {
          importJsonInput.value = '';
        }
      };
      reader.readAsText(file);
    });
  }

  // Khởi động
  loadState();
});
