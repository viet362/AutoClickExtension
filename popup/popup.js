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
  const dataPreviewCard = document.getElementById('dataPreviewCard');
  const previewFileName = document.getElementById('previewFileName');
  const previewFileStats = document.getElementById('previewFileStats');
  const columnChipsContainer = document.getElementById('columnChipsContainer');
  const previewTableHead = document.getElementById('previewTableHead');
  const previewTableBody = document.getElementById('previewTableBody');
  const btnClearData = document.getElementById('btnClearData');
  const dataRowsBadge = document.getElementById('dataRowsBadge');

  // Runner Tab
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

  // Settings Tab
  const btnExportJson = document.getElementById('btnExportJson');
  const btnImportJson = document.getElementById('btnImportJson');
  const importJsonInput = document.getElementById('importJsonInput');

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
  let editingStepIndex = null;
  let cachedWorkbook = null;

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
      ['scenarios', 'activeScenarioId', 'currentDataset', 'currentFileName', 'rawSheetRows', 'excelFirstRowIsData', 'runnerPrefs', 'lastRunResults'],
      (res) => {
        scenarios = res.scenarios || {};
        activeScenarioId = res.activeScenarioId || Object.keys(scenarios)[0] || null;

        if (!scenarios[activeScenarioId] || (scenarios[activeScenarioId].steps && scenarios[activeScenarioId].steps.length === 0)) {
          const withSteps = Object.keys(scenarios).find((k) => scenarios[k].steps && scenarios[k].steps.length > 0);
          if (withSteps) activeScenarioId = withSteps;
        }

        dataset = Array.isArray(res.currentDataset) ? res.currentDataset : [];
        rawSheetRows = Array.isArray(res.rawSheetRows) ? res.rawSheetRows : null;
        currentFileName = res.currentFileName || '';

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
        if (dataset.length > 0) {
          showDataPreview(dataset, currentFileName);
        }
        updateRunnerCard();
        syncActiveTabStatus();
      }
    );
  }

  function saveScenarios() {
    chrome.storage.local.set({ scenarios, activeScenarioId });
  }

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
      opt.textContent = `${scenarios[id].name} (${count} bước)`;
      if (id === activeScenarioId) opt.selected = true;
      scenarioSelect.appendChild(opt);
    });
  }

  scenarioSelect.addEventListener('change', (e) => {
    activeScenarioId = e.target.value;
    chrome.storage.local.set({ activeScenarioId });
    renderStepsList();
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

  btnStartRecord.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
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
      saveScenarios();
    }

    const scenarioName = scenarios[activeScenarioId]?.name || 'Kịch bản hiện tại';
    chrome.tabs.sendMessage(
      tab.id,
      {
        action: 'START_RECORDING',
        scenarioId: activeScenarioId,
        scenarioName
      },
      () => {
        if (chrome.runtime.lastError) {
          alert('Lỗi khởi động ghi: ' + chrome.runtime.lastError.message);
          return;
        }
        window.close();
      }
    );
  });

  // ============================================================
  // 6. XỬ LÝ FILE EXCEL / CSV
  // ============================================================
  btnBrowseFile.addEventListener('click', () => excelFileInput.click());
  excelDropzone.addEventListener('click', (e) => {
    if (e.target !== btnBrowseFile) excelFileInput.click();
  });

  excelDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    excelDropzone.classList.add('dragover');
  });

  excelDropzone.addEventListener('dragleave', () => {
    excelDropzone.classList.remove('dragover');
  });

  excelDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    excelDropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) processFile(e.dataTransfer.files[0]);
  });

  excelFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) processFile(e.target.files[0]);
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

  function processFile(file) {
    currentFileName = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        cachedWorkbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = cachedWorkbook.SheetNames[0];
        const worksheet = cachedWorkbook.Sheets[firstSheetName];
        rawSheetRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        // Tự động nhận diện xem dòng 1 là tiêu đề hay dữ liệu
        const autoIsData = detectFirstRowIsData(rawSheetRows);
        if (chkFirstRowIsData) chkFirstRowIsData.checked = autoIsData;

        applyExcelParsing();
      } catch (err) {
        console.error(err);
        alert('Lỗi khi đọc file Excel/CSV: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function applyExcelParsing() {
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

    chrome.storage.local.set({
      currentDataset: dataset,
      rawSheetRows,
      currentFileName,
      excelFirstRowIsData: isFirstRowData
    });
    showDataPreview(dataset, currentFileName);
    renderStepsList();
    updateRunnerCard();
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

  btnClearData.addEventListener('click', () => {
    dataset = [];
    rawSheetRows = null;
    currentFileName = '';
    cachedWorkbook = null;
    excelFileInput.value = '';
    chrome.storage.local.remove(['currentDataset', 'rawSheetRows', 'currentFileName']);
    dataPreviewCard.style.display = 'none';
    excelDropzone.style.display = 'block';
    dataRowsBadge.style.display = 'none';
    renderStepsList();
    updateRunnerCard();
  });

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
  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg) return;

    if (msg.action === 'EXECUTION_PROGRESS') {
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
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'STOP_EXECUTION' }, () => void chrome.runtime.lastError);
    }
    btnStartRunner.style.display = 'flex';
    btnStopRunner.style.display = 'none';
    progressStatusText.textContent = 'Đã dừng khẩn cấp';
    setHeaderStatus('idle', 'Sẵn sàng');
    addLog('⏹️ Đã dừng kịch bản tự động.', 'error');
  });

  // Đồng bộ trạng thái nếu mở lại Popup khi tab đang chạy hoặc đang ghi
  async function syncActiveTabStatus() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) return;
      chrome.tabs.sendMessage(tab.id, { action: 'GET_STATUS' }, (st) => {
        if (chrome.runtime.lastError || !st) return;
        if (st.isRecording) {
          setHeaderStatus('recording', `Đang ghi (${st.recordedCount})`);
        } else if (st.isRunning) {
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
  // 8. CÀI ĐẶT: XUẤT / NHẬP KỊCH BẢN JSON
  // ============================================================
  btnExportJson.addEventListener('click', () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(scenarios, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `autoflow_scenarios_${Date.now()}.json`);
    dlAnchor.click();
  });

  btnImportJson.addEventListener('click', () => importJsonInput.click());
  importJsonInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!imported || typeof imported !== 'object' || Array.isArray(imported)) {
          throw new Error('Cấu trúc file JSON không hợp lệ');
        }
        // Kiểm tra tính hợp lệ của từng kịch bản trước khi nhập
        const validEntries = {};
        Object.entries(imported).forEach(([id, sc]) => {
          if (sc && typeof sc === 'object' && Array.isArray(sc.steps)) {
            validEntries[id] = {
              id: sc.id || id,
              name: String(sc.name || id),
              createdAt: sc.createdAt || new Date().toISOString(),
              steps: sc.steps
            };
          }
        });
        if (Object.keys(validEntries).length === 0) {
          throw new Error('Không tìm thấy kịch bản hợp lệ trong file JSON');
        }
        scenarios = { ...scenarios, ...validEntries };
        activeScenarioId = Object.keys(validEntries)[0] || activeScenarioId;
        saveScenarios();
        renderScenarioDropdown();
        renderStepsList();
        updateRunnerCard();
        alert(`✅ Đã nhập thành công ${Object.keys(validEntries).length} kịch bản!`);
      } catch (err) {
        alert('Lỗi nhập file JSON: ' + err.message);
      } finally {
        importJsonInput.value = '';
      }
    };
    reader.readAsText(file);
  });

  // Khởi động
  loadState();
});
