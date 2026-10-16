// AutoFlow - Popup Controller Script

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const tabs = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');
  const scenarioSelect = document.getElementById('scenarioSelect');
  const btnNewScenario = document.getElementById('btnNewScenario');
  const btnDeleteScenario = document.getElementById('btnDeleteScenario');
  const btnStartRecord = document.getElementById('btnStartRecord');
  const stepsListContainer = document.getElementById('stepsListContainer');
  const stepsCountBadge = document.getElementById('stepsCountBadge');
  const btnAddManualStep = document.getElementById('btnAddManualStep');

  // Excel / Data elements
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

  // Runner elements
  const runnerScenarioName = document.getElementById('runnerScenarioName');
  const runnerDataInfo = document.getElementById('runnerDataInfo');
  const runSpeedSelect = document.getElementById('runSpeedSelect');
  const btnStartRunner = document.getElementById('btnStartRunner');
  const btnStopRunner = document.getElementById('btnStopRunner');
  const runProgressBox = document.getElementById('runProgressBox');
  const progressStatusText = document.getElementById('progressStatusText');
  const progressPctText = document.getElementById('progressPctText');
  const progressBarFill = document.getElementById('progressBarFill');
  const logsContainer = document.getElementById('logsContainer');
  const btnClearLogs = document.getElementById('btnClearLogs');

  // Settings elements
  const btnExportJson = document.getElementById('btnExportJson');
  const btnImportJson = document.getElementById('btnImportJson');
  const importJsonInput = document.getElementById('importJsonInput');

  // Modal elements
  const editStepModal = document.getElementById('editStepModal');
  const btnModalClose = document.getElementById('btnModalClose');
  const btnModalCancel = document.getElementById('btnModalCancel');
  const btnModalSave = document.getElementById('btnModalSave');
  const modalStepDesc = document.getElementById('modalStepDesc');
  const modalTypeGroup = document.getElementById('modalTypeGroup');
  const radioColSource = document.getElementById('radioColSource');
  const radioCustomSource = document.getElementById('radioCustomSource');
  const colSelectWrap = document.getElementById('colSelectWrap');
  const modalColSelect = document.getElementById('modalColSelect');
  const customValueWrap = document.getElementById('customValueWrap');
  const modalCustomValue = document.getElementById('modalCustomValue');
  const modalStepDelay = document.getElementById('modalStepDelay');

  // Table row click elements in modal
  const modalClickTableGroup = document.getElementById('modalClickTableGroup');
  const radioRowKeyword = document.getElementById('radioRowKeyword');
  const radioRowIndex = document.getElementById('radioRowIndex');
  const radioRowDefault = document.getElementById('radioRowDefault');
  const rowKeywordWrap = document.getElementById('rowKeywordWrap');
  const modalRowKeyword = document.getElementById('modalRowKeyword');
  const rowIndexWrap = document.getElementById('rowIndexWrap');
  const modalRowIndex = document.getElementById('modalRowIndex');

  // Excel options
  const chkFirstRowIsData = document.getElementById('chkFirstRowIsData');
  const runStartRow = document.getElementById('runStartRow');
  let editingStepIndex = null;
  let cachedWorkbook = null;

  // App State
  let scenarios = {};
  let activeScenarioId = null;
  let dataset = [];
  let currentFileName = '';

  // 1. Tab Switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));

      tab.classList.add('active');
      const targetId = tab.dataset.tab;
      document.getElementById(targetId)?.classList.add('active');
      
      if (targetId === 'tab-runner') {
        updateRunnerCard();
      }
    });
  });

  // 2. Load Scenarios from Storage
  function loadScenarios() {
    chrome.storage.local.get(['scenarios', 'activeScenarioId', 'currentDataset', 'currentFileName'], (res) => {
      scenarios = res.scenarios || {};
      activeScenarioId = res.activeScenarioId || Object.keys(scenarios)[0];
      
      // Nếu kịch bản đang chọn bị trống bước nhưng có kịch bản khác có bước, tự động chọn kịch bản có bước
      if (!scenarios[activeScenarioId] || (scenarios[activeScenarioId].steps && scenarios[activeScenarioId].steps.length === 0)) {
        const withSteps = Object.keys(scenarios).find(k => scenarios[k].steps && scenarios[k].steps.length > 0);
        if (withSteps) activeScenarioId = withSteps;
      }

      // Tự động tối ưu kịch bản:
      // 1. Nếu có bước click "i" hoặc click bảng cũ, đổi thành tr::-af-row("Calibration") button
      // 2. Nếu có đúng 14 bước do ghi 2 lần, giữ lại 1 chu kỳ 7 bước chuẩn


      dataset = res.currentDataset || [];
      currentFileName = res.currentFileName || '';

      // Tự động kiểm tra file Excel: Nếu dòng 1 bị dùng làm tên cột (236568-01_BYPT_K_701)
      // thì bổ sung dòng 1 vào dataset để bắt đầu chạy từ dòng 1 thay vì dòng 2
      if (dataset.length > 0) {
        const headers = Object.keys(dataset[0]);
        const dataLikeHeader = headers.find(h => h && (h.startsWith('236568-') || h.includes('_BYPT_')));
        if (dataLikeHeader) {
          const hasFirstRow = dataset.some(row => row[dataLikeHeader] === dataLikeHeader || row['Cot_A'] === dataLikeHeader);
          if (!hasFirstRow) {
            const firstRowObj = { ...dataset[0] };
            firstRowObj[dataLikeHeader] = dataLikeHeader;
            firstRowObj['Cot_A'] = dataLikeHeader;
            dataset.unshift(firstRowObj);
            chrome.storage.local.set({ currentDataset: dataset });
          }
        }
      }

      renderScenarioDropdown();
      renderStepsList();
      if (dataset.length > 0) {
        showDataPreview(dataset, currentFileName);
      }
      updateRunnerCard();
    });
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

    keys.forEach(id => {
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

  // Tạo kịch bản mới
  btnNewScenario.addEventListener('click', () => {
    const name = prompt('Nhập tên kịch bản mới:', `Kịch bản ${Object.keys(scenarios).length + 1}`);
    if (!name) return;
    const newId = `scenario_${Date.now()}`;
    scenarios[newId] = {
      id: newId,
      name: name,
      createdAt: new Date().toISOString(),
      steps: []
    };
    activeScenarioId = newId;
    saveScenarios();
    renderScenarioDropdown();
    renderStepsList();
  });

  // Xóa kịch bản
  btnDeleteScenario.addEventListener('click', () => {
    if (!activeScenarioId || !scenarios[activeScenarioId]) return;
    if (confirm(`Bạn có chắc muốn xóa kịch bản "${scenarios[activeScenarioId].name}"?`)) {
      delete scenarios[activeScenarioId];
      activeScenarioId = Object.keys(scenarios)[0] || null;
      saveScenarios();
      renderScenarioDropdown();
      renderStepsList();
    }
  });

  function saveScenarios() {
    chrome.storage.local.set({ scenarios, activeScenarioId });
  }

  // 3. Render Steps List
  function renderStepsList() {
    stepsListContainer.innerHTML = '';
    const current = scenarios[activeScenarioId];
    if (!current || !current.steps || current.steps.length === 0) {
      stepsCountBadge.textContent = '0 bước';
      stepsListContainer.innerHTML = `
        <div style="text-align: center; padding: 24px 10px; color: #94a3b8; font-size: 12px;">
          Chưa có bước nào. Bấm <strong>"Bắt đầu ghi mẫu"</strong> để tự động ghi lại thao tác của bạn!
        </div>
      `;
      return;
    }

    stepsCountBadge.textContent = `${current.steps.length} bước`;

    current.steps.forEach((step, idx) => {
      const card = document.createElement('div');
      card.className = 'step-card';

      let icon = '🖱️';
      if (step.type === 'type') icon = '⌨️';
      if (step.type === 'keypress') icon = '⏎';

      card.innerHTML = `
        <div class="step-left">
          <div class="step-num">${idx + 1}</div>
          <div class="step-details">
            <span class="step-desc">${icon} ${escapeHtml(step.description || step.selector)}</span>
            <div class="step-meta">
              <span class="step-badge-tag">${step.type.toUpperCase()}</span>
              ${step.value ? `<span class="step-badge-tag" style="color: #6ee7b7;">Giá trị: ${escapeHtml(step.value)}</span>` : ''}
              <span>Chờ: ${step.delay || 400}ms</span>
            </div>
          </div>
        </div>
        <div class="step-actions">
          <button class="btn btn-secondary btn-xs btn-edit-step" title="Sửa bước" data-idx="${idx}">✏️</button>
          <button class="btn btn-danger-ghost btn-xs btn-del-step" title="Xóa bước" data-idx="${idx}">🗑️</button>
        </div>
      `;

      stepsListContainer.appendChild(card);
    });

    // Delete step listener
    document.querySelectorAll('.btn-del-step').forEach(btn => {
      btn.onclick = (e) => {
        const i = parseInt(btn.dataset.idx);
        current.steps.splice(i, 1);
        saveScenarios();
        renderStepsList();
      };
    });

    // Edit step listener: Mở modal trực quan không cần gõ ngoặc thủ công
    document.querySelectorAll('.btn-edit-step').forEach(btn => {
      btn.onclick = (e) => {
        const i = parseInt(btn.dataset.idx);
        openEditModal(i);
      };
    });
  }

  // --- MODAL CHỈNH SỬA BƯỚC ---
  function openEditModal(stepIndex) {
    editingStepIndex = stepIndex;
    const current = scenarios[activeScenarioId];
    if (!current || !current.steps[stepIndex]) return;
    const step = current.steps[stepIndex];

    modalStepDesc.value = step.description || '';
    modalStepDelay.value = step.delay || 400;

    if (step.type === 'type') {
      modalTypeGroup.style.display = 'block';

      // Nạp danh sách các cột từ file Excel đã tải
      modalColSelect.innerHTML = '<option value="">-- Chọn cột Excel --</option>';
      const headers = dataset.length > 0 ? Object.keys(dataset[0]) : [];

      // Làm sạch biến cũ nếu có ngoặc thừa: ví dụ {Ma_Don}, {{Ma_Don}}, [Ma_Don] -> Ma_Don
      const cleanVal = (step.value || '')
        .replace(/^\{+|\}+$/g, '')
        .replace(/^\[+|\]+$/g, '')
        .trim();

      let matchedCol = '';
      headers.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h;
        opt.textContent = `Cột: ${h}`;
        if (h === cleanVal || step.value === h || step.value === `{${h}}` || step.value === `{{${h}}}`) {
          opt.selected = true;
          matchedCol = h;
        }
        modalColSelect.appendChild(opt);
      });

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
      modalTypeGroup.style.display = 'none';

      // Kiểm tra xem selector hiện tại có định dạng ::-af-row hoặc ::-af-row-index không
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
      } else if (step.selector && (step.selector.includes('td') || step.description?.includes('bút chì') || step.description?.includes('dòng'))) {
        const descMatch = step.description?.match(/dòng ["']?([^"']+)["']?/);
        radioRowKeyword.checked = true;
        rowKeywordWrap.style.display = 'block';
        rowIndexWrap.style.display = 'none';
        modalRowKeyword.value = descMatch ? descMatch[1] : '';
      } else {
        radioRowDefault.checked = true;
        rowKeywordWrap.style.display = 'none';
        rowIndexWrap.style.display = 'none';
      }
    } else {
      modalClickTableGroup.style.display = 'none';
    }

    editStepModal.style.display = 'flex';
  }

  // Chuyển đổi radio trong modal
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

  // Đóng modal
  btnModalClose.addEventListener('click', () => editStepModal.style.display = 'none');
  btnModalCancel.addEventListener('click', () => editStepModal.style.display = 'none');

  // Lưu modal
  btnModalSave.addEventListener('click', () => {
    if (editingStepIndex === null) return;
    const current = scenarios[activeScenarioId];
    if (!current || !current.steps[editingStepIndex]) return;
    const step = current.steps[editingStepIndex];

    step.description = modalStepDesc.value.trim() || step.description;
    step.delay = parseInt(modalStepDelay.value) || 400;

    if (step.type === 'click' && modalClickTableGroup.style.display !== 'none') {
      let subTag = 'button, i, a, [role="button"]';
      if (step.selector && step.selector.includes('tr::')) {
        const parts = step.selector.split(/\)\s+/);
        if (parts[1]) subTag = parts[1].trim();
      }

      if (radioRowKeyword.checked && modalRowKeyword.value.trim()) {
        const kw = modalRowKeyword.value.trim();
        step.selector = `tr::-af-row("${kw}") ${subTag}`;
        step.description = `Click thao tác ở dòng "${kw}"`;
      } else if (radioRowIndex.checked && modalRowIndex.value.trim()) {
        const idx = parseInt(modalRowIndex.value.trim()) || 1;
        step.selector = `tr::-af-row-index(${idx}) ${subTag}`;
        step.description = `Click thao tác ở dòng thứ ${idx}`;
      }
    } else if (step.type === 'type') {
      if (radioColSource.checked && modalColSelect.value) {
        // Lưu trực tiếp tên cột nguyên bản, HOÀN TOÀN KHÔNG CÓ BẤT KỲ DẤU NGOẶC NÀO
        step.value = modalColSelect.value;
      } else {
        let customVal = modalCustomValue.value.trim();
        // Tự động bỏ sạch mọi dấu ngoặc nếu người dùng lỡ dán có ngoặc
        const cleanCustom = customVal.replace(/^\{+|\}+$/g, '').replace(/^\[+|\]+$/g, '').trim();
        const headers = dataset.length > 0 ? Object.keys(dataset[0]) : [];
        if (headers.includes(cleanCustom)) {
          step.value = cleanCustom;
        } else {
          step.value = customVal;
        }
      }
    }

    saveScenarios();
    renderStepsList();
    editStepModal.style.display = 'none';
  });

  // Thêm bước thủ công
  btnAddManualStep.addEventListener('click', () => {
    if (!activeScenarioId || !scenarios[activeScenarioId]) return;
    const type = prompt('Loại hành động (click, type, keypress):', 'click');
    if (!type) return;
    const selector = prompt('CSS Selector phần tử mục tiêu (ví dụ: #submit-btn):', 'button[type="submit"]');
    if (!selector) return;

    let value = '';
    if (type === 'type') {
      value = prompt('Nội dung cần nhập (ví dụ: {{Cot_A}}):', '{{Cot_A}}');
    }

    scenarios[activeScenarioId].steps.push({
      id: `step_${Date.now()}`,
      type: type,
      selector: selector,
      value: value,
      description: `Thao tác ${type} trên ${selector}`,
      delay: 500
    });
    saveScenarios();
    renderStepsList();
  });

  // Kiểm tra tính sẵn sàng của Tab trước khi Ghi hoặc Chạy
  async function ensureTabReady(tab) {
    if (!tab || !tab.id) {
      alert('Không tìm thấy tab trình duyệt hợp lệ!');
      return false;
    }

    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:') || tab.url.startsWith('chrome-extension://')) {
      alert('Tiện ích không thể chạy trên các trang cài đặt hệ thống của trình duyệt (chrome://).\nVui lòng mở một trang web thông thường!');
      return false;
    }

    // Kiểm tra quyền đối với file máy tính (file://)
    if (tab.url.startsWith('file://')) {
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
          'Trình duyệt Chrome mặc định chặn tiện ích chạy trên file máy tính. Để ghi được trên file này:\n\n' +
          '1. Mở tab: chrome://extensions\n' +
          '2. Tìm "AutoFlow", bấm nút "Chi tiết" (Details)\n' +
          '3. BẬT công tắc: "Cho phép truy cập vào các tệp URL" (Allow access to file URLs)\n' +
          '4. Tải lại (F5 hoặc Cmd+R) trang web của bạn rồi bấm Ghi lại!\n\n' +
          '💡 HOẶC: Bạn có thể test trực tiếp trên bất kỳ trang web online nào (như google.com, trang web công ty...) mà không cần cài đặt gì thêm.'
        );
        return false;
      }
    }

    // Kiểm tra kết nối với content script (nếu tab mở trước khi cài tiện ích thì tự động inject)
    let isConnected = false;
    try {
      const res = await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tab.id, { action: 'PING' }, (response) => {
          if (chrome.runtime.lastError || !response) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });
      if (res && res.status === 'PONG') isConnected = true;
    } catch (e) {
      isConnected = false;
    }

    if (!isConnected) {
      try {
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id, allFrames: true },
          files: ['content/content.css']
        });
        await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          files: ['content/content.js']
        });
        await new Promise(r => setTimeout(r, 300));

        const checkPing = await new Promise((resolve) => {
          chrome.tabs.sendMessage(tab.id, { action: 'PING' }, (response) => {
            if (chrome.runtime.lastError || !response) resolve(false);
            else resolve(true);
          });
        });

        if (!checkPing) {
          alert(
            '⚠️ TRANG WEB CẦN TẢI LẠI:\n\n' +
            'Tiện ích vừa được cập nhật mã nguồn nên tab trang web hiện tại chưa kịp nhận kết nối mới.\n\n' +
            '👉 Bạn chỉ cần bấm F5 (hoặc Cmd+R) trên tab trang web của bạn một lần là chạy được ngay!'
          );
          return false;
        }
      } catch (err) {
        console.error('Lỗi inject script:', err);
        alert(
          'Không thể kết nối với trang web hiện tại.\n\n' +
          '👉 Vui lòng bấm Tải lại (F5 hoặc Cmd+R) tab trang web đó một lần rồi thử lại!'
        );
        return false;
      }
    }

    return true;
  }

  // 4. Bắt đầu ghi hình (Record)
  btnStartRecord.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const ready = await ensureTabReady(tab);
    if (!ready) return;

    const scenarioName = scenarios[activeScenarioId]?.name || 'Kịch bản hiện tại';
    chrome.tabs.sendMessage(tab.id, { 
      action: 'START_RECORDING',
      scenarioId: activeScenarioId,
      scenarioName: scenarioName
    }, (res) => {
      if (chrome.runtime.lastError) {
        alert('Lỗi khởi động ghi: ' + chrome.runtime.lastError.message + '\nVui lòng tải lại (F5) tab trang web rồi bấm lại!');
        return;
      }
      // Đóng popup để người dùng thao tác trực tiếp trên trang web với Floating Bar
      window.close();
    });
  });

  // 5. Excel / CSV File Handling
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
    if (e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  });

  excelFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  });

  function parseWorkbook(workbook, isFirstRowData = true) {
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    let data = [];
    if (isFirstRowData) {
      // Dòng 1 là DỮ LIỆU: Đọc toàn bộ các dòng dưới dạng mảng 2 chiều
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      const validRows = rawRows.filter(r => r && r.some(cell => String(cell).trim() !== ''));
      if (validRows.length === 0) return [];

      const maxCols = Math.max(...validRows.map(r => r.length));
      const colHeaders = [];
      for (let c = 0; c < maxCols; c++) {
        const letter = String.fromCharCode(65 + c);
        colHeaders.push(`Cot_${letter}`);
      }

      data = validRows.map((r) => {
        const rowObj = {};
        for (let c = 0; c < maxCols; c++) {
          const val = r[c] !== undefined ? String(r[c]) : '';
          const colName = colHeaders[c];
          rowObj[colName] = val;
          const letter = String.fromCharCode(65 + c);
          rowObj[letter] = val;
          // Gán alias theo giá trị ô đầu tiên để tương thích kịch bản cũ
          if (validRows[0] && validRows[0][c]) {
            const aliasKey = String(validRows[0][c]).trim();
            if (aliasKey) rowObj[aliasKey] = val;
          }
        }
        return rowObj;
      });
    } else {
      data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    }
    return data;
  }

  function processFile(file) {
    currentFileName = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        cachedWorkbook = XLSX.read(data, { type: 'array' });
        applyExcelParsing();
      } catch (err) {
        console.error(err);
        alert('Lỗi khi đọc file Excel/CSV: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function applyExcelParsing() {
    if (!cachedWorkbook) return;
    const isFirstRowData = chkFirstRowIsData ? chkFirstRowIsData.checked : true;
    dataset = parseWorkbook(cachedWorkbook, isFirstRowData);

    if (dataset.length === 0) {
      alert('File Excel không có dữ liệu hoặc để trống!');
      return;
    }

    chrome.storage.local.set({ currentDataset: dataset, currentFileName });
    showDataPreview(dataset, currentFileName);
    updateRunnerCard();
  }

  if (chkFirstRowIsData) {
    chkFirstRowIsData.addEventListener('change', () => {
      if (cachedWorkbook) {
        applyExcelParsing();
      }
    });
  }

  function showDataPreview(data, fileName) {
    dataPreviewCard.style.display = 'flex';
    excelDropzone.style.display = 'none';

    const headers = Object.keys(data[0] || {});
    previewFileName.textContent = fileName || 'Dữ liệu Excel';
    previewFileStats.textContent = `${data.length} dòng • ${headers.length} cột`;
    dataRowsBadge.style.display = 'inline-block';
    dataRowsBadge.textContent = `${data.length}`;

    // Render Column Chips (Hiển thị và copy ĐÚNG TÊN CỘT NGUYÊN BẢN, 100% KHÔNG CÓ DẤU NGOẶC)
    columnChipsContainer.innerHTML = '';
    headers.forEach(h => {
      const chip = document.createElement('span');
      chip.className = 'col-chip';
      chip.textContent = h;
      chip.title = 'Bấm để sao chép tên cột này';
      chip.onclick = () => {
        navigator.clipboard.writeText(h);
        chip.style.borderColor = '#10b981';
        chip.textContent = `✓ Đã copy ${h}`;
        setTimeout(() => {
          chip.textContent = h;
          chip.style.borderColor = '';
        }, 1200);
      };
      columnChipsContainer.appendChild(chip);
    });

    // Render Preview Table (Top 5 rows)
    previewTableHead.innerHTML = `<tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`;
    previewTableBody.innerHTML = '';
    data.slice(0, 5).forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = headers.map(h => `<td>${escapeHtml(String(row[h] || ''))}</td>`).join('');
      previewTableBody.appendChild(tr);
    });
  }

  btnClearData.addEventListener('click', () => {
    dataset = [];
    currentFileName = '';
    cachedWorkbook = null;
    chrome.storage.local.remove(['currentDataset', 'currentFileName']);
    dataPreviewCard.style.display = 'none';
    excelDropzone.style.display = 'block';
    dataRowsBadge.style.display = 'none';
    updateRunnerCard();
  });

  // 6. Runner Tab
  function updateRunnerCard() {
    const current = scenarios[activeScenarioId];
    runnerScenarioName.textContent = current ? `${current.name} (${current.steps?.length || 0} bước)` : 'Chưa chọn kịch bản';
    runnerDataInfo.textContent = dataset.length > 0 ? `${currentFileName} (${dataset.length} dòng)` : 'Chưa nạp Excel (Chạy 1 lần)';
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

    const speed = parseFloat(runSpeedSelect.value) || 1;
    const startRow = Math.max(1, parseInt(runStartRow?.value) || 1);

    // Cắt dữ liệu theo dòng bắt đầu người dùng đã chọn
    let datasetToRun = dataset;
    if (startRow > 1 && dataset.length >= startRow) {
      datasetToRun = dataset.slice(startRow - 1);
    }

    // Hiển thị giao diện chạy
    btnStartRunner.style.display = 'none';
    btnStopRunner.style.display = 'flex';
    runProgressBox.style.display = 'block';
    progressStatusText.textContent = `Bắt đầu từ dòng ${startRow} trên ${tab.title || 'trang web'}...`;

    addLog(`Bắt đầu chạy kịch bản "${current.name}" từ dòng ${startRow} (${datasetToRun.length} lượt lặp).`, 'success');

    chrome.tabs.sendMessage(tab.id, {
      action: 'START_EXECUTION',
      scenario: current,
      dataset: datasetToRun,
      options: { speed, startRowIndex: startRow }
    }, (res) => {
      if (chrome.runtime.lastError) {
        console.error('Lỗi khởi động kịch bản:', chrome.runtime.lastError);
        alert(
          '⚠️ KHÔNG THỂ BẮT ĐẦU CHẠY:\n\n' +
          'Trang web chưa phản hồi kết nối (' + chrome.runtime.lastError.message + ').\n\n' +
          '👉 Vui lòng bấm F5 (hoặc Cmd+R) để tải lại trang web đó 1 lần rồi bấm Chạy lại!'
        );
        btnStartRunner.style.display = 'flex';
        btnStopRunner.style.display = 'none';
        runProgressBox.style.display = 'none';
      }
    });
  });

  // Lắng nghe khi content script chạy xong
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'EXECUTION_COMPLETED') {
      btnStartRunner.style.display = 'flex';
      btnStopRunner.style.display = 'none';
      progressStatusText.textContent = 'Hoàn tất';
      addLog('Đã hoàn tất toàn bộ kịch bản!', 'success');
    }
  });

  btnStopRunner.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'STOP_EXECUTION' });
    }
    btnStartRunner.style.display = 'flex';
    btnStopRunner.style.display = 'none';
    progressStatusText.textContent = 'Đã dừng khẩn cấp';
    addLog('Đã dừng kịch bản tự động.', 'error');
  });

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

  // 7. Settings: Export / Import JSON
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
        if (typeof imported !== 'object') throw new Error('File JSON không hợp lệ');
        scenarios = { ...scenarios, ...imported };
        activeScenarioId = Object.keys(imported)[0] || activeScenarioId;
        saveScenarios();
        renderScenarioDropdown();
        renderStepsList();
        alert('Nhập kịch bản từ file JSON thành công!');
      } catch (err) {
        alert('Lỗi nhập file JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }

  // Khởi động
  loadScenarios();
});
