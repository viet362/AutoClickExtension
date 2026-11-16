// AutoFlow - In-Page Content Script (Recording & Execution Engine) v1.1.0

(function () {
  'use strict';

  // Chỉ hoạt động ở khung chính (iframe không được hỗ trợ ghi/chạy)
  if (window !== window.top) return;

  // Tránh inject trùng trong cùng một isolated world (listener cũ vẫn còn sống và hoạt động bình thường)
  if (window.__AUTOFLOW_INJECTED__) return;
  window.__AUTOFLOW_INJECTED__ = true;

  // Xóa Floating Bar / Toast "mồ côi" do phiên bản extension cũ để lại (sau khi reload extension)
  document.getElementById('autoflow-floating-bar')?.remove();
  document.getElementById('autoflow-toast')?.remove();

  // ============================================================
  // TIỆN ÍCH CHUNG
  // ============================================================
  const sleep = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));
  const norm = (s) => String(s ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  const STALE_STATE_MS = 30 * 60 * 1000; // Trạng thái ghi/chạy cũ hơn 30 phút sẽ bị bỏ qua

  function isContextValid() {
    try { return !!(chrome.runtime && chrome.runtime.id); } catch (e) { return false; }
  }

  function storageGet(keys) {
    return new Promise((resolve) => {
      if (!isContextValid()) return resolve({});
      try {
        chrome.storage.local.get(keys, (res) => {
          void chrome.runtime.lastError;
          resolve(res || {});
        });
      } catch (e) { resolve({}); }
    });
  }

  function storageSet(obj) {
    if (!isContextValid()) return;
    try { chrome.storage.local.set(obj, () => void chrome.runtime.lastError); } catch (e) {}
  }

  function storageRemove(keys) {
    if (!isContextValid()) return;
    try { chrome.storage.local.remove(keys, () => void chrome.runtime.lastError); } catch (e) {}
  }

  function safeSendMessage(msg) {
    if (!isContextValid()) return;
    try {
      const p = chrome.runtime.sendMessage(msg);
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (e) {}
  }

  // Tab ID dùng để lưu trạng thái ghi/chạy riêng cho từng tab (khôi phục sau khi trang chuyển hướng)
  let tabId = null;
  function getTabId() {
    if (tabId !== null) return Promise.resolve(tabId);
    return new Promise((resolve) => {
      if (!isContextValid()) return resolve(null);
      try {
        chrome.runtime.sendMessage({ action: 'GET_TAB_ID' }, (res) => {
          if (chrome.runtime.lastError || !res || typeof res.tabId !== 'number') return resolve(null);
          tabId = res.tabId;
          resolve(tabId);
        });
      } catch (e) { resolve(null); }
    });
  }
  const recKey = () => `afRec_${tabId}`;
  const runKey = () => `afRun_${tabId}`;
  const runPosKey = () => `afRunPos_${tabId}`;

  // ============================================================
  // TRẠNG THÁI HỆ THỐNG
  // ============================================================
  let isRecording = false;
  let isRunning = false;
  let isPaused = false;
  let recordedSteps = [];
  let lastActionTime = 0;
  let hoveredElement = null;
  let currentScenario = null;
  let currentDataset = [];
  let currentRunIndex = 0;
  let currentStepIndex = 0;
  let currentCycle = 0;
  let executionLogs = [];
  let currentRecordingScenarioId = null;
  let currentRecordingScenarioName = null;
  let currentRecordingMode = 'overwrite'; // 'overwrite' | 'append'
  let runToken = 0; // Mỗi phiên chạy có 1 token riêng -> chống 2 vòng lặp chạy song song
  let runOptions = { speed: 1, errorMode: 'stop', rowOffset: 0 };
  let errorState = null; // { message, resolve } khi đang chờ người dùng quyết định xử lý lỗi
  let lastClickedTrigger = null; // Lưu phần tử vừa click để tự động kích hoạt lại nếu popup/tooltip không kịp hiện

  let floatingBar = null;
  const $bar = (id) => (floatingBar ? floatingBar.querySelector(`#${id}`) : null);

  // ============================================================
  // TOAST THÔNG BÁO (chỉ hiện khi thành công hoặc thất bại/lỗi)
  // ============================================================
  let toastTimer = null;
  function showToast(message, type = 'info', duration = 4500) {
    // Chỉ hiển thị toast nổi khi thành công hoặc thất bại/lỗi theo yêu cầu người dùng
    if (type !== 'success' && type !== 'error') return;

    let toast = document.getElementById('autoflow-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'autoflow-toast';
      (document.body || document.documentElement).appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `af-toast-${type} af-toast-show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('af-toast-show'), duration);
  }

  // ============================================================
  // FLOATING BAR
  // ============================================================
  function initFloatingBar() {
    if (floatingBar && floatingBar.isConnected) return;

    floatingBar = document.createElement('div');
    floatingBar.id = 'autoflow-floating-bar';
    floatingBar.innerHTML = `
      <div class="af-mini-view" id="af-mini-toggle">
        <div class="af-logo-icon">⚡</div>
        <span id="af-mini-status" style="font-weight: 600;">AutoFlow</span>
      </div>
      <div class="af-full-view">
        <div class="af-header" id="af-drag-header">
          <div class="af-brand">
            <div class="af-logo-icon">⚡</div>
            <span>AutoFlow</span>
            <span class="af-status-badge af-badge-idle" id="af-status-badge">
              <span class="af-badge-dot"></span>
              <span id="af-status-text">Sẵn sàng</span>
            </span>
          </div>
          <div class="af-header-actions">
            <button class="af-btn-icon" id="af-btn-minimize" title="Thu nhỏ">─</button>
            <button class="af-btn-icon" id="af-btn-close" title="Đóng">✕</button>
          </div>
        </div>
        <div class="af-body">
          <div class="af-info-box" id="af-info-box">
            <div class="af-info-title" id="af-info-title">Trạng thái kịch bản</div>
            <div class="af-info-value">
              <span id="af-info-main">Chưa có kịch bản đang chạy</span>
              <span class="af-steps-count" id="af-steps-count">0 bước</span>
            </div>
            <div class="af-progress-container" id="af-progress-container" style="display: none;">
              <div class="af-progress-fill" id="af-progress-fill"></div>
            </div>
          </div>
          <div class="af-actions" id="af-actions"></div>
        </div>
      </div>
    `;

    (document.body || document.documentElement).appendChild(floatingBar);
    setupFloatingBarEvents();
  }

  function setupFloatingBarEvents() {
    $bar('af-mini-toggle').addEventListener('click', () => floatingBar.classList.remove('af-minimized'));
    $bar('af-btn-minimize').addEventListener('click', () => floatingBar.classList.add('af-minimized'));

    $bar('af-btn-close').addEventListener('click', () => {
      if (isRecording) {
        if (!confirm('Đang ghi mẫu. Đóng thanh điều khiển sẽ HỦY bản ghi hiện tại. Tiếp tục?')) return;
        stopRecording(false);
      }
      if (isRunning) {
        if (!confirm('Kịch bản đang chạy. Đóng thanh điều khiển sẽ DỪNG kịch bản. Tiếp tục?')) return;
        stopExecution();
      }
      floatingBar.style.display = 'none';
    });

    // Kéo thả Floating Bar
    const dragHeader = $bar('af-drag-header');
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    dragHeader.addEventListener('mousedown', (e) => {
      if (e.target.closest('button')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = floatingBar.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      floatingBar.style.bottom = 'auto';
      floatingBar.style.right = 'auto';
      floatingBar.style.left = `${initialLeft}px`;
      floatingBar.style.top = `${initialTop}px`;
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging || !floatingBar) return;
      const w = floatingBar.offsetWidth || 360;
      const h = floatingBar.offsetHeight || 150;
      floatingBar.style.left = `${Math.max(10, Math.min(window.innerWidth - w - 10, initialLeft + e.clientX - startX))}px`;
      floatingBar.style.top = `${Math.max(10, Math.min(window.innerHeight - h - 10, initialTop + e.clientY - startY))}px`;
    });

    document.addEventListener('mouseup', () => { isDragging = false; });
  }

  function setInfoMain(text) {
    const el = $bar('af-info-main');
    if (el) el.textContent = text;
  }

  const absRow = (i) => runOptions.rowOffset + i + 1;

  function updateFloatingBarUI() {
    initFloatingBar();
    if (!floatingBar) return;
    floatingBar.style.display = 'block';

    const statusBadge = $bar('af-status-badge');
    const statusText = $bar('af-status-text');
    const infoTitle = $bar('af-info-title');
    const infoMain = $bar('af-info-main');
    const stepsCount = $bar('af-steps-count');
    const progressContainer = $bar('af-progress-container');
    const progressFill = $bar('af-progress-fill');
    const actionsContainer = $bar('af-actions');
    const miniStatus = $bar('af-mini-status');

    if (isRecording) {
      statusBadge.className = 'af-status-badge af-badge-recording';
      statusText.textContent = currentRecordingMode === 'append' ? 'Ghi nối tiếp' : 'Đang ghi mẫu';
      miniStatus.textContent = currentRecordingMode === 'append' ? `🔴 Nối tiếp (${recordedSteps.length})` : `🔴 Đang ghi (${recordedSteps.length})`;
      const modeSuffix = currentRecordingMode === 'append' ? ' ⏩ [Nối tiếp]' : '';
      infoTitle.textContent = (currentRecordingScenarioName || 'Kịch bản đang ghi mẫu') + modeSuffix;
      infoMain.textContent = 'Thao tác chuột/phím trên web...';
      stepsCount.textContent = `${recordedSteps.length} bước`;
      progressContainer.style.display = 'none';

      actionsContainer.innerHTML = `
        <button class="af-btn af-btn-primary" id="af-btn-save-record">💾 Dừng &amp; Lưu</button>
        <button class="af-btn af-btn-secondary" id="af-btn-wait-record" title="Chèn thêm một bước chờ cố định (tính bằng giây)">⏱️ +Chờ (s)</button>
        <button class="af-btn af-btn-secondary" id="af-btn-undo-record" title="Xóa bước vừa ghi">↩️ Hoàn tác</button>
        <button class="af-btn af-btn-danger" id="af-btn-cancel-record">✕ Hủy</button>
      `;
      $bar('af-btn-save-record').onclick = () => stopRecording(true);
      $bar('af-btn-wait-record').onclick = () => {
        commitPendingType();
        const raw = prompt('Nhập số giây muốn dừng chờ tại điểm này (ví dụ: 2 hoặc 1.5):', '2');
        if (raw === null) return;
        const sec = Math.max(0.1, parseFloat(String(raw).replace(',', '.')) || 2);
        pushStep({
          id: genStepId(),
          type: 'wait',
          selector: '',
          description: `Chờ cố định ${Number(sec.toFixed(2))} giây`,
          delay: Math.round(sec * 1000)
        });
        lastActionTime = Date.now();
        showToast(`⏱️ Đã chèn bước chờ ${Number(sec.toFixed(2))} giây.`);
      };
      $bar('af-btn-undo-record').onclick = () => {
        commitPendingType();
        if (recordedSteps.length > 0) {
          const removed = recordedSteps.pop();
          persistRecording();
          updateFloatingBarUI();
          showToast(`Đã xóa bước: ${removed.description || removed.type}`);
        }
      };
      $bar('af-btn-cancel-record').onclick = () => {
        if (recordedSteps.length === 0 || confirm(`Hủy ${recordedSteps.length} bước vừa ghi?`)) stopRecording(false);
      };
    } else if (isRunning) {
      const total = currentDataset.length || 1;
      const totalSteps = currentScenario?.steps?.length || 1;
      const absTotal = runOptions.rowOffset + total;
      const repCount = runOptions.repeatCount || 1;
      const cyclePct = (currentRunIndex + currentStepIndex / totalSteps) / total;
      const overallPct = Math.min(100, Math.round(((currentCycle + cyclePct) / repCount) * 100));
      const cyclePrefix = repCount > 1 ? `[Vòng ${currentCycle + 1}/${repCount}] ` : '';

      infoTitle.textContent = currentScenario?.name ? `${cyclePrefix}${currentScenario.name}` : 'Đang thực thi';
      stepsCount.textContent = `${overallPct}%`;
      progressContainer.style.display = 'block';
      if (progressFill) progressFill.style.width = `${overallPct}%`;
      miniStatus.textContent = `${cyclePrefix}▶️ Dòng ${absRow(currentRunIndex)}/${absTotal}`;

      if (errorState) {
        statusBadge.className = 'af-status-badge af-badge-error';
        statusText.textContent = 'Gặp lỗi';
        infoMain.textContent = `❌ ${errorState.message}`;
        actionsContainer.innerHTML = `
          <button class="af-btn af-btn-primary" id="af-btn-err-retry">🔁 Thử lại</button>
          <button class="af-btn af-btn-secondary" id="af-btn-err-skip-step">⏭️ Bỏ qua bước</button>
          <button class="af-btn af-btn-secondary" id="af-btn-err-skip-row">⏩ Bỏ qua dòng</button>
          <button class="af-btn af-btn-danger" id="af-btn-err-stop">⏹️ Dừng</button>
        `;
        $bar('af-btn-err-retry').onclick = () => errorState?.resolve('retry');
        $bar('af-btn-err-skip-step').onclick = () => errorState?.resolve('skip-step');
        $bar('af-btn-err-skip-row').onclick = () => errorState?.resolve('skip-row');
        $bar('af-btn-err-stop').onclick = () => stopExecution();
      } else {
        statusBadge.className = 'af-status-badge af-badge-running';
        statusText.textContent = isPaused ? 'Tạm dừng' : 'Đang tự động';
        infoMain.textContent = `${cyclePrefix}Dòng ${absRow(currentRunIndex)}/${absTotal} • Bước ${Math.min(currentStepIndex + 1, totalSteps)}/${totalSteps}`;
        actionsContainer.innerHTML = `
          <button class="af-btn af-btn-secondary" id="af-btn-toggle-pause">${isPaused ? '▶️ Tiếp tục' : '⏸️ Tạm dừng'}</button>
          <button class="af-btn af-btn-danger" id="af-btn-stop-run">⏹️ Dừng ngay</button>
        `;
        $bar('af-btn-toggle-pause').onclick = togglePause;
        $bar('af-btn-stop-run').onclick = () => stopExecution();
      }
    } else {
      statusBadge.className = 'af-status-badge af-badge-idle';
      statusText.textContent = 'Sẵn sàng';
      miniStatus.textContent = '⚡ AutoFlow';
      infoTitle.textContent = 'AutoFlow';
      infoMain.textContent = 'Đang tải thông tin kịch bản...';
      stepsCount.textContent = '0 bước';
      progressContainer.style.display = 'none';

      storageGet(['scenarios', 'activeScenarioId', 'currentDataset', 'currentFileName', 'runnerPrefs']).then((res) => {
        if (isRecording || isRunning) return; // Trạng thái đã thay đổi trong lúc đọc storage
        const activeId = res.activeScenarioId;
        const sc = activeId && res.scenarios ? res.scenarios[activeId] : null;
        const stepsLen = sc && sc.steps ? sc.steps.length : 0;
        const dsLen = res.currentDataset ? res.currentDataset.length : 0;

        infoTitle.textContent = sc ? sc.name : 'Trạng thái';
        infoMain.textContent = sc
          ? `${stepsLen} bước • Excel: ${dsLen > 0 ? `${res.currentFileName || 'File'} (${dsLen} dòng)` : 'Chưa nạp'}`
          : 'Mở popup để chọn kịch bản';
        stepsCount.textContent = `${stepsLen} bước`;

        actionsContainer.innerHTML = `
          ${stepsLen > 0 ? '<button class="af-btn af-btn-success" id="af-btn-start-exec">▶️ Chạy kịch bản</button>' : ''}
          <button class="af-btn af-btn-secondary" id="af-btn-start-record">🔴 Ghi mẫu</button>
        `;
        const btnExec = $bar('af-btn-start-exec');
        if (btnExec) btnExec.onclick = () => startExecution(sc, res.currentDataset, res.runnerPrefs || {});
        const btnRec = $bar('af-btn-start-record');
        if (btnRec) {
          btnRec.onclick = () => {
            if (stepsLen > 0) {
              const ask = confirm(
                `⚠️ Kịch bản "${sc.name}" hiện đã có ${stepsLen} bước!\n\n` +
                `- Bấm OK để TẠO KỊCH BẢN MỚI (giữ nguyên ${stepsLen} bước cũ)\n` +
                `- Bấm HỦY (Cancel) để GHI ĐÈ lên kịch bản này`
              );
              if (ask) {
                const newId = `scenario_${Date.now()}`;
                const newName = `${sc.name} (Bản mới)`;
                storageGet(['scenarios']).then((sRes) => {
                  const scs = sRes.scenarios || {};
                  scs[newId] = {
                    id: newId,
                    name: newName,
                    createdAt: new Date().toISOString(),
                    steps: []
                  };
                  storageSet({ scenarios: scs, activeScenarioId: newId }).then(() => {
                    currentRecordingScenarioId = newId;
                    currentRecordingScenarioName = newName;
                    currentRecordingMode = 'overwrite';
                    startRecording();
                  });
                });
                return;
              }
            }
            currentRecordingScenarioId = activeId || null;
            currentRecordingScenarioName = sc ? sc.name : null;
            currentRecordingMode = 'overwrite';
            startRecording();
          };
        }
      });
    }
  }

  // ============================================================
  // THUẬT TOÁN TẠO SELECTOR THÔNG MINH
  // ============================================================

  // ID có ổn định không (loại bỏ ID ngẫu nhiên do framework sinh ra)
  function isStableId(id) {
    if (!id || typeof id !== 'string') return false;
    if (/^\d/.test(id)) return false;
    if (/^(react-|vue-|ember\d|ext-gen|ext-comp|ng-|_|:|el-id-|rc_|rc-|mui-|headlessui-|radix-)/i.test(id)) return false;
    if (/\d{4,}/.test(id)) return false; // Chuỗi số dài -> thường là ID sinh tự động
    if (/[a-f0-9]{8,}/i.test(id) && /\d/.test(id)) return false; // Dạng hash
    return true;
  }

  function isUniqueSelector(selector) {
    try { return document.querySelectorAll(selector).length === 1; } catch (e) { return false; }
  }

  // Nhận diện xem phần tử có nằm trong Bảng Lịch / DatePicker hay không
  function isCalendarElement(el) {
    if (!el) return false;
    return !!el.closest(
      '.ant-picker-dropdown, .ant-picker-panel, .ant-picker-content, ' +
      '.el-picker-panel, .el-date-picker, .el-date-table, ' +
      '.flatpickr-calendar, .flatpickr-days, .datepicker, .ui-datepicker, ' +
      '.vxe-calendar, [class*="picker"], [class*="calendar"], [class*="date-table"]'
    );
  }

  function getElementSelector(el) {
    if (!el || el === document.body || el === document.documentElement) return 'body';

    // 1. ID duy nhất và có ý nghĩa
    if (isStableId(el.id)) {
      const sel = `#${CSS.escape(el.id)}`;
      if (isUniqueSelector(sel)) return sel;
    }

    // 2. Thuộc tính đặc trưng trên chính phần tử
    const attrs = ['data-testid', 'data-test', 'data-qa', 'name', 'placeholder', 'aria-label', 'for', 'title', 'alt', 'role'];
    for (const attr of attrs) {
      const val = el.getAttribute(attr);
      if (val) {
        const sel = `${el.tagName.toLowerCase()}[${attr}="${CSS.escape(val)}"]`;
        if (isUniqueSelector(sel)) return sel;
      }
    }

    // 2.1 Thuộc tính title / aria-label / data-date trên ô cha td (Đặc biệt quan trọng cho DatePicker như Ant Design...)
    const parentCell = el.closest('td, th, [role="gridcell"]');
    if (parentCell && parentCell !== el) {
      for (const attr of ['title', 'aria-label', 'data-date', 'data-value']) {
        const val = parentCell.getAttribute(attr);
        if (val) {
          const sel = `${parentCell.tagName.toLowerCase()}[${attr}="${CSS.escape(val)}"]`;
          if (isUniqueSelector(sel)) return sel;
          const childSel = `${sel} > ${el.tagName.toLowerCase()}`;
          if (isUniqueSelector(childSel)) return childSel;
        }
      }
    }

    // 2.2 Xử lý chính xác ô trong Bảng Lịch Chọn Ngày (Calendar / DatePicker)
    if (isCalendarElement(el)) {
      const calTr = el.closest('tr');
      const calTd = el.closest('td, th');
      if (calTr && calTd) {
        const rIdx = Array.from(calTr.parentElement ? calTr.parentElement.children : []).indexOf(calTr) + 1;
        const cIdx = Array.from(calTr.children).indexOf(calTd) + 1;
        const calWrap = el.closest('.ant-picker-panel, .ant-picker-dropdown, .el-picker-panel, .el-date-picker, .flatpickr-calendar, .datepicker, table');
        const calCls = (calWrap && calWrap.className && typeof calWrap.className === 'string')
          ? '.' + calWrap.className.trim().split(/\s+/)[0] + ' '
          : '';
        const exactCellSel = `${calCls}tr:nth-child(${rIdx}) > td:nth-child(${cIdx})`.trim();
        return el !== calTd ? `${exactCellSel} ${el.tagName.toLowerCase()}` : exactCellSel;
      }
    }

    // 2.3 Trường nhập liệu trong Form có nhãn (Thời gian quét, Người quét...)
    const formItem = el.closest('.el-form-item, .ant-form-item, .form-group, .form-item');
    if (formItem) {
      const labelEl = formItem.querySelector('.el-form-item__label, .ant-form-item-label, label, .form-label');
      const labelText = norm(labelEl?.innerText);
      if (labelText && labelText.length >= 2 && labelText.length <= 40) {
        const targetInput = el.closest('input, select, textarea') || el.querySelector('input, select, textarea');
        const tag = targetInput ? targetInput.tagName.toLowerCase() : el.tagName.toLowerCase();
        const placeholder = targetInput?.getAttribute('placeholder') || el.getAttribute('placeholder');
        const phAttr = placeholder ? `[placeholder="${CSS.escape(placeholder)}"]` : '';
        const formSel = `form::-af-field("${labelText}") ${tag}${phAttr}`.trim();
        return formSel;
      }
    }

    // 3. Nút bấm / liên kết có chữ ngắn gọn (kể cả khi click vào span, i, svg bên trong nút)
    const btnParent = el.closest('button, a, [role="button"]');
    const targetBtn = btnParent || (['BUTTON', 'A'].includes(el.tagName) ? el : null);
    if (targetBtn) {
      const text = norm(targetBtn.innerText);
      if (text && text.length < 30 && !(targetBtn.innerText || '').trim().includes('\n')) {
        return `${targetBtn.tagName.toLowerCase()}::-af-text("${text}")`;
      }
    }

    // 3.1 Dropdown option (li, [role="option"], .el-select-dropdown__item)
    const optParent = el.closest('li, [role="option"], .el-select-dropdown__item');
    if (optParent) {
      const text = norm(optParent.innerText);
      if (text && text.length < 40 && !(optParent.innerText || '').trim().includes('\n')) {
        const tag = optParent.tagName.toLowerCase();
        return `${tag}::-af-text("${text}")`;
      }
    }

    // 3.5 Phần tử trong dòng bảng (tr): nhận dạng theo từ khóa dòng hoặc số thứ tự dòng
    const tr = el.closest('tr, .el-table__row');
    if (tr && !isCalendarElement(el)) {
      const cell = el.closest('td, th, .cell');
      const colIdx = cell ? (Array.from(tr.children).indexOf(cell) + 1) : 1;
      const btn = el.closest('button, a, [role="button"]');
      let subSelector = '';

      if (btn) {
        if (btn.getAttribute('title')) {
          subSelector = `${btn.tagName.toLowerCase()}[title="${CSS.escape(btn.getAttribute('title'))}"]`;
        } else if (btn.getAttribute('aria-label')) {
          subSelector = `[aria-label="${CSS.escape(btn.getAttribute('aria-label'))}"]`;
        } else {
          const iconEl = btn.querySelector('i, svg') || (['I', 'SVG'].includes(btn.tagName) ? btn : null);
          if (iconEl && iconEl.className && typeof iconEl.className === 'string') {
            const iconClass = iconEl.className.split(/\s+/).find((c) => c.includes('icon') || c.includes('fa-') || c.includes('btn-'));
            if (iconClass) subSelector = `.${CSS.escape(iconClass)}`;
          }
        }
        if (!subSelector) {
          subSelector = `td:nth-child(${colIdx}) ${btn.tagName.toLowerCase()}`;
        }
      } else if (cell) {
        subSelector = `td:nth-child(${colIdx})${el !== cell ? ' ' + el.tagName.toLowerCase() : ''}`;
      } else {
        subSelector = 'td';
      }

      // Dòng chính (nếu click nằm trong fixed wrapper của Element-UI)
      let mainTr = tr;
      if (tr.closest('.el-table__fixed, .el-table__fixed-right')) {
        const tableContainer = tr.closest('.el-table');
        const tbody = tr.closest('tbody');
        if (tableContainer && tbody) {
          const mainTbody = tableContainer.querySelector('.el-table__body-wrapper tbody');
          if (mainTbody) {
            const rIdx = Array.from(tbody.querySelectorAll('tr')).indexOf(tr);
            const matchingTr = mainTbody.querySelectorAll('tr')[rIdx];
            if (matchingTr) mainTr = matchingTr;
          }
        }
      }

      let kw = '';
      const clickedCell = el.closest('td, .cell');
      const clickedText = norm(clickedCell?.innerText);
      if (clickedText && clickedText.length >= 2 && clickedText.length <= 40 && !/^[0-9]+$/.test(clickedText)) {
        kw = clickedText;
      } else {
        const textCells = Array.from(mainTr.querySelectorAll('td, .cell'))
          .map((c) => norm(c.innerText))
          .filter((txt) => txt && txt.length >= 2 && txt.length <= 40 && !/^[0-9]+$/.test(txt));
        if (textCells.length > 0) {
          textCells.sort((a, b) => a.length - b.length);
          kw = textCells[0];
        }
      }

      if (kw) return `tr::-af-row("${kw}") ${subSelector}`;

      const parentTbody = tr.parentElement;
      if (parentTbody) {
        const allRows = Array.from(parentTbody.children).filter((c) => c.tagName === 'TR' || c.classList.contains('el-table__row'));
        const idx = allRows.indexOf(tr) + 1;
        if (idx > 0) return `tr::-af-row-index(${idx}) ${subSelector}`;
      }
    }

    // 4. Fallback: đường dẫn theo cấu trúc nth-of-type
    const path = [];
    let current = el;
    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
      if (isStableId(current.id)) {
        path.unshift(`#${CSS.escape(current.id)}`);
        break;
      }
      let index = 1;
      let sibling = current.previousElementSibling;
      while (sibling) {
        if (sibling.tagName === current.tagName) index++;
        sibling = sibling.previousElementSibling;
      }
      path.unshift(`${current.tagName.toLowerCase()}:nth-of-type(${index})`);
      current = current.parentElement;
      if (path.length >= 5) break;
    }
    return path.join(' > ');
  }

  function getElementDescription(el, actionType) {
    const text = norm(el.innerText) || el.getAttribute('placeholder') || el.getAttribute('aria-label') || el.name || el.id || '';
    const cleanText = text.substring(0, 25);
    const tag = el.tagName.toLowerCase();

    if (actionType === 'click') {
      if (tag === 'button' || el.getAttribute('role') === 'button') return `Click nút "${cleanText || 'Xác nhận'}"`;
      if (tag === 'a') return `Click liên kết "${cleanText || 'Link'}"`;
      if (tag === 'input' && ['checkbox', 'radio'].includes(el.type)) return `Chọn ô "${cleanText || el.type}"`;
      return `Click vào "${cleanText || tag}"`;
    }
    if (actionType === 'type') {
      if (tag === 'select') return `Chọn giá trị ở "${cleanText.split(' ')[0] || 'danh sách'}"`;
      return `Nhập dữ liệu vào ô "${cleanText || 'nhập liệu'}"`;
    }
    return `Thao tác trên ${tag}`;
  }

  // ============================================================
  // GHI THAO TÁC (RECORDER)
  // ============================================================
  const NON_TEXT_INPUTS = ['checkbox', 'radio', 'file', 'submit', 'button', 'reset', 'image'];
  let pendingTypeAction = null;
  let typeTimer = null;
  let lastEnterTime = 0;
  let lastClickInfo = { time: 0, target: null };

  const genStepId = () => `step_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  // Khoảng nghỉ giữa 2 thao tác (giới hạn 300ms - 2000ms để khi chạy lại không quá chậm)
  function recordGap() {
    const now = Date.now();
    const gap = lastActionTime > 0 ? now - lastActionTime : 500;
    lastActionTime = now;
    return Math.min(Math.max(gap, 300), 2000);
  }

  function persistRecording() {
    if (!isRecording) return;
    if (tabId === null) {
      getTabId().then((id) => { if (id !== null) persistRecording(); });
      return;
    }
    storageSet({
      [recKey()]: {
        scenarioId: currentRecordingScenarioId,
        scenarioName: currentRecordingScenarioName,
        mode: currentRecordingMode,
        steps: recordedSteps,
        savedAt: Date.now()
      }
    });
  }

  function pushStep(step) {
    recordedSteps.push(step);
    persistRecording();
    updateFloatingBarUI();
  }

  function isOwnElement(target) {
    return !!(floatingBar && floatingBar.contains(target)) || target?.id === 'autoflow-toast';
  }

  function handleRecordMouseMove(e) {
    if (!isRecording) return;
    const target = e.target;
    if (!(target instanceof Element) || isOwnElement(target)) return;
    if (hoveredElement && hoveredElement !== target) hoveredElement.classList.remove('af-inspect-highlight');
    hoveredElement = target;
    hoveredElement.classList.add('af-inspect-highlight');
  }

  function commitPendingType() {
    if (typeTimer) {
      clearTimeout(typeTimer);
      typeTimer = null;
    }
    if (!pendingTypeAction) return;
    const { target, selector, val } = pendingTypeAction;
    pendingTypeAction = null;
    const delay = recordGap();

    const lastStep = recordedSteps[recordedSteps.length - 1];
    if (lastStep && lastStep.type === 'type' && lastStep.selector === selector) {
      lastStep.value = val;
      persistRecording();
      updateFloatingBarUI();
    } else {
      pushStep({
        id: genStepId(),
        type: 'type',
        selector,
        value: val,
        description: getElementDescription(target, 'type'),
        delay
      });
    }
  }

  function handleRecordClick(e) {
    if (!isRecording) return;
    const target = e.target;
    if (!(target instanceof Element) || isOwnElement(target)) return;

    const now = Date.now();
    // Bỏ qua các click "ảo" do trình duyệt tự sinh (detail === 0):
    // - Nhấn Enter trong form -> trình duyệt tự click nút submit (bước Enter đã tái hiện việc này)
    // - Click vào <label> -> trình duyệt tự chuyển click sang ô input tương ứng
    if (e.detail === 0) {
      if (now - lastEnterTime < 200) return;
      const lt = lastClickInfo.target;
      if (now - lastClickInfo.time < 200 && lt && lt.tagName === 'LABEL' && (lt.control === target || lt.contains(target))) return;
    }
    lastClickInfo = { time: now, target };

    commitPendingType();
    pushStep({
      id: genStepId(),
      type: 'click',
      selector: getElementSelector(target),
      description: getElementDescription(target, 'click'),
      delay: recordGap()
    });
  }

  function handleRecordInput(e) {
    if (!isRecording) return;
    const target = e.target;
    if (!(target instanceof Element) || isOwnElement(target)) return;
    if (target.tagName === 'INPUT' && NON_TEXT_INPUTS.includes((target.type || '').toLowerCase())) return;
    if (!('value' in target) && !target.isContentEditable) return;

    if (pendingTypeAction && pendingTypeAction.target !== target) commitPendingType();

    const val = target.isContentEditable ? target.innerText : target.value;
    pendingTypeAction = { target, selector: getElementSelector(target), val };

    clearTimeout(typeTimer);
    typeTimer = setTimeout(commitPendingType, 400);
  }

  function handleRecordChange() {
    if (!isRecording) return;
    commitPendingType();
  }

  function handleRecordKeydown(e) {
    if (!isRecording) return;
    const target = e.target;
    if (!(target instanceof Element) || isOwnElement(target)) return;
    if (!['Enter', 'Tab', 'Escape'].includes(e.key)) return;
    if (e.isComposing) return; // Đang gõ bộ gõ tiếng Việt / IME

    // Enter trong textarea/contenteditable chỉ là xuống dòng -> đã nằm trong giá trị của bước "type"
    if (e.key === 'Enter' && (target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
    if (e.key === 'Enter') lastEnterTime = Date.now();

    commitPendingType();
    pushStep({
      id: genStepId(),
      type: 'keypress',
      key: e.key,
      selector: getElementSelector(target),
      description: `Nhấn phím [${e.key}]`,
      delay: recordGap()
    });
  }

  function handlePageHide() {
    if (isRecording) {
      commitPendingType();
      persistRecording();
    }
  }

  const RECORD_LISTENERS = [
    ['mouseover', handleRecordMouseMove],
    ['click', handleRecordClick],
    ['input', handleRecordInput],
    ['change', handleRecordChange],
    ['keydown', handleRecordKeydown]
  ];

  function startRecording(resume = null) {
    if (isRunning) stopExecution();
    isRecording = true;
    recordedSteps = resume && Array.isArray(resume.steps) ? resume.steps : [];
    pendingTypeAction = null;
    lastActionTime = Date.now();

    RECORD_LISTENERS.forEach(([evt, fn]) => {
      document.removeEventListener(evt, fn, true);
      document.addEventListener(evt, fn, true);
    });

    initFloatingBar();
    floatingBar.classList.remove('af-minimized');
    updateFloatingBarUI();
    persistRecording();
  }

  function stopRecording(save = true) {
    commitPendingType();
    isRecording = false;

    RECORD_LISTENERS.forEach(([evt, fn]) => document.removeEventListener(evt, fn, true));

    if (hoveredElement) {
      hoveredElement.classList.remove('af-inspect-highlight');
      hoveredElement = null;
    }
    if (tabId !== null) storageRemove(recKey());
    else getTabId().then((id) => { if (id !== null) storageRemove(recKey()); });

    const steps = recordedSteps.slice();
    recordedSteps = [];

    if (save && steps.length > 0) {
      storageGet(['scenarios', 'activeScenarioId']).then((res) => {
        const scenarios = res.scenarios || {};
        const targetId = currentRecordingScenarioId || res.activeScenarioId || `scenario_${Date.now()}`;

        if (scenarios[targetId]) {
          if (currentRecordingMode === 'append') {
            const prevSteps = Array.isArray(scenarios[targetId].steps) ? scenarios[targetId].steps : [];
            scenarios[targetId].steps = prevSteps.concat(steps);
            showToast(`✅ Đã nối tiếp ${steps.length} bước mới (tổng ${scenarios[targetId].steps.length} bước) vào "${scenarios[targetId].name}".`, 'success', 6000);
          } else {
            scenarios[targetId].steps = steps;
            showToast(`✅ Đã lưu ${steps.length} bước vào "${scenarios[targetId].name}". Mở AutoFlow để gán cột Excel.`, 'success', 6000);
          }
          scenarios[targetId].updatedAt = new Date().toISOString();
        } else {
          scenarios[targetId] = {
            id: targetId,
            name: currentRecordingScenarioName || `Kịch bản ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`,
            createdAt: new Date().toISOString(),
            steps
          };
          showToast(`✅ Đã lưu ${steps.length} bước vào "${scenarios[targetId].name}". Mở AutoFlow để gán cột Excel.`, 'success', 6000);
        }
        updateFloatingBarUI();
      });
    } else if (save) {
      showToast('Chưa ghi được bước nào nên không có gì để lưu.', 'warning');
    }

    updateFloatingBarUI();
  }

  // ============================================================
  // TÌM PHẦN TỬ KHI CHẠY LẠI
  // ============================================================

  // Độ tương đồng giữa 2 chuỗi (chống lỗi gõ nhầm: calibarion vs calibration)
  function stringSimilarity(s1, s2) {
    if (!s1 || !s2) return 0;
    const a = norm(s1).toLowerCase();
    const b = norm(s2).toLowerCase();
    if (a === b) return 1.0;
    if (a.includes(b) || b.includes(a)) return 0.95;
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) matches++;
    }
    return matches / longer.length;
  }

  function queryAllSafe(selector, root = document) {
    try { return Array.from(root.querySelectorAll(selector)); } catch (e) { return []; }
  }

  // Tìm ô ngày trong bảng lịch / DatePicker đang mở trên màn hình (Element-UI, Ant Design, Flatpickr...)
  function findActiveCalendarDay(targetDayText) {
    if (!targetDayText) return null;
    const cleanDay = String(targetDayText).trim().replace(/^0+/, ''); // "04" -> "4"
    if (!/^\d{1,2}$/.test(cleanDay)) return null;
    const dayNum = parseInt(cleanDay, 10);
    if (dayNum < 1 || dayNum > 31) return null;

    // 1. Quét tất cả các khung lịch đang hiển thị
    const calContainers = queryAllSafe(
      '.el-picker-panel, .el-date-picker, .ant-picker-dropdown, .ant-picker-panel, ' +
      '.flatpickr-calendar, .datepicker, .ui-datepicker, .vxe-calendar, ' +
      '[class*="picker-panel"], [class*="date-picker"], [class*="calendar-picker"], ' +
      '.el-date-table, table.ant-picker-content, [role="grid"]'
    ).filter((c) => {
      if (!isElementVisible(c)) return false;
      try {
        const s = window.getComputedStyle(c);
        if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false;
      } catch (e) {}
      return true;
    });

    // Fallback: nếu không khớp class trên, tìm table đang mở có hiển thị thứ trong tuần (Sun, Mon, CN, T2...)
    if (calContainers.length === 0) {
      const allTables = queryAllSafe('table, [role="grid"]').filter((t) => isElementVisible(t));
      for (const t of allTables) {
        const txt = norm(t.innerText).toLowerCase();
        if ((txt.includes('sun') || txt.includes('cn') || txt.includes('nhật')) &&
            (txt.includes('mon') || txt.includes('t2') || txt.includes('hai'))) {
          calContainers.push(t);
        }
      }
    }

    for (const cal of calContainers) {
      // Tìm tất cả các phần tử đại diện cho ngày (td, button, flatpickr-day, gridcell...)
      const dayCandidates = queryAllSafe(
        'td, .flatpickr-day, [role="gridcell"], .ant-picker-cell, .el-date-table-cell',
        cal
      );

      // Kiểm tra xem ô có thuộc tháng hiện tại (không bị disabled, không phải prev/next month)
      const isInCurrentMonth = (el) => {
        const cls = (el.className || '').toString().toLowerCase();
        const parentCls = (el.parentElement?.className || '').toString().toLowerCase();
        const combined = `${cls} ${parentCls}`;
        if (combined.includes('prev') || combined.includes('next') || combined.includes('disabled')) return false;
        if (el.getAttribute('aria-disabled') === 'true') return false;
        return true;
      };

      // Ưu tiên 1: Ô thuộc tháng hiện tại và khớp đúng ngày
      const inMonthMatch = dayCandidates.find((el) => {
        if (!isElementVisible(el)) return false;
        if (!isInCurrentMonth(el)) return false;
        const txt = norm(el.innerText);
        return txt === cleanDay || txt === targetDayText;
      });

      if (inMonthMatch) {
        const inner = inMonthMatch.querySelector('span, div, button') || inMonthMatch;
        return isElementVisible(inner) ? inner : inMonthMatch;
      }

      // Ưu tiên 2: Bất kỳ ô nào khớp text trong bảng lịch
      const anyMatch = dayCandidates.find((el) => {
        if (!isElementVisible(el)) return false;
        const txt = norm(el.innerText);
        return txt === cleanDay || txt === targetDayText;
      });

      if (anyMatch) {
        const inner = anyMatch.querySelector('span, div, button') || anyMatch;
        return isElementVisible(inner) ? inner : anyMatch;
      }
    }

    return null;
  }

  // Tìm nút / icon thao tác trong dòng (hỗ trợ cả cột Fixed của Element-UI, Ant Design...)
  function findActionBtnInRow(targetRow, subSelector, targetText = '') {
    if (!targetRow) return null;
    const FALLBACK = 'button, [role="button"], a, i, svg, .el-button, .cell *';

    const directCandidates = subSelector ? queryAllSafe(subSelector, targetRow) : [];
    const candidates = directCandidates.length > 0 ? directCandidates : queryAllSafe(FALLBACK, targetRow);

    // Ưu tiên 1: Khớp theo targetText (rất quan trọng khi click ô ngày số trong bảng lịch hoặc nút có tên cụ thể)
    if (targetText) {
      const tNorm = norm(targetText).toLowerCase();
      const matchText = candidates.find((btn) => {
        if (!isElementVisible(btn)) return false;
        const txt = norm(btn.innerText).toLowerCase();
        const title = (btn.getAttribute('title') || '').toLowerCase();
        const aria = (btn.getAttribute('aria-label') || '').toLowerCase();
        return txt === tNorm || title === tNorm || aria === tNorm;
      });
      if (matchText) return matchText;

      // Đang tìm ngày cụ thể (1-31) mà dòng này không chứa -> trả về null để findElement gọi findActiveCalendarDay
      if (/^\d{1,2}$/.test(targetText.replace(/^0+/, ''))) {
        return null;
      }
    }

    const visibleBtn = candidates.find((btn) => isElementVisible(btn));
    if (visibleBtn) return visibleBtn;

    // Nếu nút trong dòng chính bị ẩn, tìm sang bảng Fixed có cùng chỉ số dòng
    const tbody = targetRow.closest('tbody');
    if (tbody) {
      const rowIndex = Array.from(tbody.querySelectorAll('tr')).indexOf(targetRow);
      if (rowIndex >= 0) {
        const tableContainer = targetRow.closest('.el-table, .ant-table, table')?.parentElement || document;
        const fixedBodies = queryAllSafe('.el-table__fixed-body-wrapper tbody, .el-table__fixed-right .el-table__fixed-body-wrapper tbody, .el-table__fixed tbody, .el-table__fixed-right tbody, .ant-table-fixed-left tbody, .ant-table-fixed-right tbody', tableContainer);
        for (const fb of fixedBodies) {
          const fbRow = fb.querySelectorAll('tr')[rowIndex];
          if (!fbRow) continue;
          const fbDirect = subSelector ? queryAllSafe(subSelector, fbRow) : [];
          const fbList = fbDirect.length > 0 ? fbDirect : queryAllSafe(FALLBACK, fbRow);
          if (targetText) {
            const tNorm = norm(targetText).toLowerCase();
            const matchFb = fbList.find((btn) => isElementVisible(btn) && norm(btn.innerText).toLowerCase() === tNorm);
            if (matchFb) return matchFb;
          }
          const foundFbBtn = fbList.find((btn) => isElementVisible(btn));
          if (foundFbBtn) return foundFbBtn;
          if (fbList.length > 0) return fbList[0];
        }
      }
    }

    return candidates[0] || null;
  }

  function findElement(selector, targetText = '') {
    if (!selector) return null;

    const cleanDay = (targetText || '').trim().replace(/^0+/, '');
    const isDayNumber = /^\d{1,2}$/.test(cleanDay) && parseInt(cleanDay, 10) >= 1 && parseInt(cleanDay, 10) <= 31;

    // 0. ƯU TIÊN SỐ 1 CHO NGÀY THÁNG TRONG POPUP LỊCH (DATEPICKER)
    // Nếu targetText là số ngày và đang có popup DatePicker mở HOẶC selector là lịch:
    if (isDayNumber) {
      const calDay = findActiveCalendarDay(cleanDay);
      if (calDay) return calDay;
    }

    // 0.1 Nút/icon theo từ khóa trong dòng: tr::-af-row("Calibration") button
    if (selector.includes('::-af-row(')) {
      const match = selector.match(/tr::-af-row\((?:["']?)(.+?)(?:["']?)\)\s*(.*)/);
      if (match) {
        const rowKeyword = norm(match[1]).toLowerCase();
        const subSelector = match[2].trim() || 'button, i, a, [role="button"]';
        const allRows = queryAllSafe('tbody tr, .el-table__body tr, .el-table__row');

        let targetRow = allRows.find((tr) => {
          if (norm(tr.innerText).toLowerCase().includes(rowKeyword)) return true;
          return Array.from(tr.querySelectorAll('input, select')).some((inp) => (inp.value || '').toLowerCase().includes(rowKeyword));
        });

        if (!targetRow) {
          let bestSim = 0;
          allRows.forEach((tr) => {
            tr.querySelectorAll('td, .cell').forEach((c) => {
              const cText = norm(c.innerText);
              if (cText && cText.length >= 2) {
                const sim = stringSimilarity(cText, rowKeyword);
                if (sim > 0.7 && sim > bestSim) {
                  bestSim = sim;
                  targetRow = tr;
                }
              }
            });
          });
        }

        return targetRow ? findActionBtnInRow(targetRow, subSelector, targetText) : null;
      }
    }

    // 0.2 Nút/icon theo số thứ tự dòng: tr::-af-row-index(4) button
    if (selector.includes('::-af-row-index(')) {
      const match = selector.match(/tr::-af-row-index\((\d+)\)\s*(.*)/);
      if (match) {
        const rowIdx = parseInt(match[1], 10) - 1;
        const subSelector = match[2].trim() || 'button, i, a, [role="button"]';
        const mainTbody = document.querySelector('.el-table__body-wrapper tbody, table tbody');
        const allRows = mainTbody ? Array.from(mainTbody.querySelectorAll('tr')) : queryAllSafe('tbody tr, .el-table__body tr, .el-table__row');
        const res = allRows[rowIdx] ? findActionBtnInRow(allRows[rowIdx], subSelector, targetText) : null;
        if (res) {
          if (isDayNumber && norm(res.innerText) !== cleanDay) {
            const calDay = findActiveCalendarDay(cleanDay);
            if (calDay) return calDay;
          }
          return res;
        }
      }
    }

    // 0.3 Nút/ô nhập theo nhãn form: form::-af-field("Thời gian quét") input
    if (selector.includes('::-af-field(')) {
      const match = selector.match(/form::-af-field\((?:["']?)(.+?)(?:["']?)\)\s*(.*)/);
      if (match) {
        const fieldLabel = norm(match[1]).toLowerCase();
        const subSelector = match[2].trim() || 'input, select, textarea, [contenteditable="true"]';
        const allLabels = queryAllSafe('label, .el-form-item__label, .ant-form-item-label, .form-label, th');
        const targetLabel = allLabels.find((l) => norm(l.innerText).toLowerCase().includes(fieldLabel));
        if (targetLabel) {
          const container = targetLabel.closest('.el-form-item, .ant-form-item, .form-group, tr, div');
          if (container) {
            const field = queryAllSafe(subSelector, container).find((el) => isElementVisible(el)) || container.querySelector(subSelector);
            if (field) return field;
          }
        }
      }
    }

    // 1. Tìm theo chữ hiển thị: button::-af-text("Lưu")
    if (selector.includes('::-af-text(')) {
      const match = selector.match(/^([a-z][a-z0-9-]*)::-af-text\("(.*)"\)$/i);
      if (match) {
        const tag = match[1].toLowerCase();
        const text = norm(match[2]).toLowerCase();
        const pick = (list) => {
          const visibleList = list.filter((el) => isElementVisible(el));
          const pool = visibleList.length > 0 ? visibleList : list;
          return pool.find((el) => norm(el.innerText).toLowerCase() === text)
            || pool.find((el) => norm(el.innerText).toLowerCase().includes(text))
            || null;
        };
        let found = pick(queryAllSafe(tag));
        // Tương thích kịch bản cũ: option dạng div[role=option] từng bị lưu thành li::-af-text
        if (!found && tag === 'li') found = pick(queryAllSafe('[role="option"], .el-select-dropdown__item'));
        if (!found && tag === 'button') found = pick(queryAllSafe('[role="button"], input[type="submit"], input[type="button"]'));
        return found;
      }
    }

    // 2. CSS selector chuẩn (ưu tiên phần tử đang hiển thị)
    const candidates = queryAllSafe(selector);
    let found = candidates.find((el) => isElementVisible(el)) || (candidates.length > 0 ? candidates[0] : null);

    // KIỂM TRA ĐỘ KHỚP VỚI TARGET TEXT (Khắc phục trường hợp click ngày hoặc text/placeholder không khớp)
    if (isDayNumber) {
      if (!found || norm(found.innerText) !== cleanDay) {
        const calDay = findActiveCalendarDay(cleanDay);
        if (calDay) return calDay;
      }
    } else if (found && targetText) {
      const foundVal = norm(found.innerText) || found.getAttribute('placeholder') || found.getAttribute('aria-label') || found.value || '';
      if (foundVal !== targetText && targetText.length <= 25) {
        // Tìm phần tử cùng cấp hoặc con khớp text hoặc placeholder
        const sameText = queryAllSafe(selector).find((el) => {
          if (!isElementVisible(el)) return false;
          const v = norm(el.innerText) || el.getAttribute('placeholder') || el.getAttribute('aria-label') || el.value || '';
          return v === targetText || v.includes(targetText);
        });
        if (sameText) return sameText;
      }
    }

    if (found) return found;

    // 2.1 Fallback trực tiếp tìm ô input theo placeholder / title / aria-label khớp với targetText (ví dụ: "Select date")
    if (targetText && targetText.length >= 2) {
      const cleanTarget = targetText.trim();
      const escapedTarget = CSS.escape(cleanTarget);
      const inputCandidates = queryAllSafe(
        `input[placeholder="${escapedTarget}"], textarea[placeholder="${escapedTarget}"], ` +
        `input[placeholder*="${escapedTarget}" i], textarea[placeholder*="${escapedTarget}" i], ` +
        `input[aria-label*="${escapedTarget}" i], [title*="${escapedTarget}" i]`
      ).filter((el) => isElementVisible(el));
      if (inputCandidates.length > 0) return inputCandidates[0];
    }

    // 2.2 Fallback chuyên dụng cho trường Chọn Ngày / Giờ (DatePicker / TimePicker)
    const isDateRelated = /date|time|ngày|giờ|năm|tháng|hôm nay|select\s*date/i.test(targetText) || /date|time|picker|calendar/i.test(selector);
    if (isDateRelated) {
      // 2.2.1 Nếu có popup bảng lịch đang mở trên màn hình (Element UI, Ant Design, flatpickr...)
      const activeCalendarPanels = queryAllSafe(
        '.el-picker-panel:not([style*="display: none"]), .el-date-picker:not([style*="display: none"]), ' +
        '.ant-picker-dropdown:not(.ant-picker-dropdown-hidden), .ant-picker-panel, ' +
        '.flatpickr-calendar.open, .datepicker:not([style*="display: none"])'
      ).filter((p) => isElementVisible(p));

      if (activeCalendarPanels.length > 0) {
        for (const panel of activeCalendarPanels) {
          if (selector.includes('input') || /nhập|type|date|time/i.test(targetText)) {
            const panelInput = queryAllSafe('input', panel).find((inp) => isElementVisible(inp));
            if (panelInput) return panelInput;
          }
        }
      }

      // 2.2.2 Tìm các ô DatePicker trên form (Element UI: .el-date-editor input, Ant Design: .ant-picker input...)
      const formDateInputs = queryAllSafe(
        '.el-date-editor input, .el-date-picker input, .ant-picker input, ' +
        '.ant-calendar-picker input, input.flatpickr-input, input.datepicker, ' +
        'input[type="date"], input[type="datetime-local"], ' +
        '[class*="date-editor"] input, [class*="date-picker"] input, [class*="datepicker"] input, ' +
        'input[placeholder*="date" i], input[placeholder*="ngày" i]'
      ).filter((inp) => isElementVisible(inp));

      if (formDateInputs.length > 0) {
        let pickedIdx = 0;
        const nthMatch = selector.match(/nth-(?:of-type|child)\((\d+)\)/);
        if (nthMatch && formDateInputs.length > 1) {
          const rawNth = parseInt(nthMatch[1], 10);
          pickedIdx = (rawNth - 1) % formDateInputs.length;
        }
        return formDateInputs[pickedIdx] || formDateInputs[0];
      }
    }

    // 2.3 Fallback tìm trường nhập liệu theo nhãn Label của form
    if (targetText && (selector.includes('input') || selector.includes('select') || selector.includes('textarea'))) {
      const allLabels = queryAllSafe('label, .el-form-item__label, .ant-form-item-label, .form-label, th')
        .filter((l) => isElementVisible(l));
      for (const lbl of allLabels) {
        const lblText = norm(lbl.innerText).toLowerCase();
        if (lblText.includes(targetText.toLowerCase())) {
          const formItem = lbl.closest('.el-form-item, .ant-form-item, .form-group, tr, div');
          if (formItem) {
            const inp = formItem.querySelector('input:not([type="hidden"]), select, textarea');
            if (inp && isElementVisible(inp)) return inp;
          }
        }
      }
    }

    // 3. Fallback cho nút icon trong bảng kết quả
    if (selector.includes('td') && (selector.includes('button') || selector.includes('i'))) {
      const tableBtn = document.querySelector('tbody tr:first-child button, .el-table__body tr:first-child button, .el-table__row:first-child button, table tbody tr td button, tbody tr:first-child td i, .el-table__fixed-right tbody tr:first-child button, .el-table__fixed tbody tr:first-child button');
      if (tableBtn && isElementVisible(tableBtn)) return tableBtn;
    }

    // 4. Fallback cho ô input trong Modal Dialog đang mở
    if (selector.includes('input')) {
      const activeDialogInput = document.querySelector('.el-dialog:not([style*="display: none"]) input, [role="dialog"] input, .modal.show input, .modal:not([style*="display: none"]) input');
      if (activeDialogInput && isElementVisible(activeDialogInput)) return activeDialogInput;
    }

    // 5. Fallback cho ngày trong bảng lịch nếu các bước trên chưa tìm ra
    if (isDayNumber) {
      const calDay = findActiveCalendarDay(cleanDay);
      if (calDay) return calDay;
    }

    // 6. Fallback tìm nút / liên kết bên trong Popup Popover / Tooltip đang mở
    if (selector.includes('button') || selector.includes('a') || selector.includes('i') || /chi tiết|xem|sửa|xóa|xác nhận|thao tác/i.test(targetText)) {
      const openPopovers = queryAllSafe(
        '.el-popover:not([style*="display: none"]), .el-tooltip__popper:not([style*="display: none"]), ' +
        '.ant-popover:not(.ant-popover-hidden), .ant-tooltip:not(.ant-tooltip-hidden), ' +
        '.popover.show, .tooltip.show, [role="tooltip"]:not([style*="display: none"]), ' +
        '[role="dialog"]:not([style*="display: none"]), .dropdown-menu.show'
      ).filter((p) => isElementVisible(p));

      for (const pop of openPopovers) {
        if (targetText) {
          const tNorm = norm(targetText).toLowerCase();
          const popCandidates = queryAllSafe('button, a, [role="button"], span, div', pop);
          const matchBtn = popCandidates.find((b) => isElementVisible(b) && (norm(b.innerText).toLowerCase() === tNorm || norm(b.innerText).toLowerCase().includes(tNorm)));
          if (matchBtn) return matchBtn;
        }
        const firstPopBtn = queryAllSafe('button, a, [role="button"]', pop).find((b) => isElementVisible(b));
        if (firstPopBtn) return firstPopBtn;
      }
    }

    return null;
  }

  function isElementVisible(el) {
    if (!el || !el.isConnected) return false;
    try {
      const checkEl = el.closest('button, a, [role="button"]') || el;
      const style = window.getComputedStyle(checkEl);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;

      const hiddenDialog = checkEl.closest('.el-dialog__wrapper[style*="display: none"], .modal[style*="display: none"], .el-dialog__wrapper[aria-hidden="true"], .modal[aria-hidden="true"], [role="dialog"][aria-hidden="true"]');
      if (hiddenDialog) return false;

      if (checkEl.getClientRects().length === 0) return false;
      const rect = checkEl.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return false;
      return true;
    } catch (e) {
      return true;
    }
  }

  // ============================================================
  // THAO TÁC MÔ PHỎNG
  // ============================================================

  // Điền giá trị an toàn cho React / Vue / Angular (input, textarea, select, contenteditable)
  function setValueToInput(el, value) {
    value = value == null ? '' : String(value);

    if (el.isContentEditable) {
      el.focus();
      try {
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, value);
      } catch (e) {
        el.textContent = value;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }

    let proto = HTMLInputElement.prototype;
    if (el instanceof HTMLTextAreaElement) proto = HTMLTextAreaElement.prototype;
    else if (el instanceof HTMLSelectElement) {
      proto = HTMLSelectElement.prototype;
      // Cho phép khớp theo value HOẶC theo chữ hiển thị của option
      const v = norm(value).toLowerCase();
      const opts = Array.from(el.options);
      const opt = opts.find((o) => o.value === value)
        || opts.find((o) => norm(o.value).toLowerCase() === v)
        || opts.find((o) => norm(o.text).toLowerCase() === v)
        || opts.find((o) => v && norm(o.text).toLowerCase().includes(v));
      if (opt) value = opt.value;
    } else if (!(el instanceof HTMLInputElement)) {
      // Không phải ô nhập liệu: thử tìm ô input bên trong (ví dụ wrapper của UI framework)
      const inner = el.querySelector('input, textarea, select, [contenteditable="true"]');
      if (inner) return setValueToInput(inner, value);
    }

    el.focus?.();
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    try {
      if (setter) setter.call(el, value);
      else el.value = value;
    } catch (e) {
      el.value = value;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Phát chuỗi sự kiện hover (mouseenter, pointerenter) lên chính phần tử và các khối cha (cell, row, popover reference)
  function dispatchHover(el) {
    if (!el || !el.isConnected) return;
    try {
      const rect = el.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const base = { bubbles: true, cancelable: true, composed: true, view: window, clientX: x, clientY: y, screenX: x, screenY: y };
      const nonBubbling = { bubbles: false, cancelable: false, composed: true, view: window, clientX: x, clientY: y, screenX: x, screenY: y };

      const hierarchy = [el];
      let p = el.parentElement;
      while (p && p !== document.body) {
        if (p.classList.contains('cell') || p.tagName === 'TD' || p.tagName === 'TR' || p.hasAttribute('aria-haspopup') || p.classList.contains('el-popover__reference') || p.hasAttribute('data-popover')) {
          hierarchy.push(p);
        }
        p = p.parentElement;
      }

      hierarchy.forEach((target) => {
        target.dispatchEvent(new PointerEvent('pointerover', { ...base, pointerId: 1, pointerType: 'mouse' }));
        target.dispatchEvent(new MouseEvent('mouseover', base));
        target.dispatchEvent(new PointerEvent('pointerenter', { ...nonBubbling, pointerId: 1, pointerType: 'mouse' }));
        target.dispatchEvent(new MouseEvent('mouseenter', nonBubbling));
      });
    } catch (e) {}
  }

  function simulateClick(el) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const base = { bubbles: true, cancelable: true, composed: true, view: window, clientX: x, clientY: y, screenX: x, screenY: y, button: 0 };
    const ptr = { ...base, pointerId: 1, pointerType: 'mouse', isPrimary: true };

    // 1. Kích hoạt chuỗi hover / enter trước (giúp tooltip, popover dạng hover/click luôn được kích hoạt đầy đủ)
    dispatchHover(el);

    // 2. Chuỗi sự kiện bấm chuột (pointerdown, mousedown)
    el.dispatchEvent(new PointerEvent('pointerdown', { ...ptr, buttons: 1 }));
    el.dispatchEvent(new MouseEvent('mousedown', { ...base, buttons: 1 }));

    const focusTarget = el.closest('button, a, input, select, textarea, [tabindex]') || el;
    if (typeof focusTarget.focus === 'function') {
      try { focusTarget.focus({ preventScroll: true }); } catch (e) {}
    }

    el.dispatchEvent(new PointerEvent('pointerup', ptr));
    el.dispatchEvent(new MouseEvent('mouseup', base));

    // 3. Sự kiện click
    if (typeof el.click === 'function') {
      try { el.click(); } catch (e) {
        el.dispatchEvent(new MouseEvent('click', base));
      }
    } else {
      el.dispatchEvent(new MouseEvent('click', base));
    }

    // 4. Kích hoạt thêm wrapper cha nếu là ô DatePicker / Popover (Element UI, Ant Design)
    const dateWrap = el.closest('.el-date-editor, .ant-picker, .el-input--prefix');
    if (dateWrap && dateWrap !== el) {
      dateWrap.dispatchEvent(new MouseEvent('click', base));
    }
  }

  const KEY_CODES = { Enter: 13, Tab: 9, Escape: 27, Backspace: 8, Delete: 46, ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39, ' ': 32 };

  function focusNext(el) {
    const focusables = queryAllSafe('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]')
      .filter((f) => isElementVisible(f) && !isOwnElement(f));
    const idx = focusables.indexOf(el);
    const next = focusables[idx + 1];
    if (next) next.focus();
  }

  function simulateKey(el, key) {
    const keyCode = KEY_CODES[key] || (key.length === 1 ? key.toUpperCase().charCodeAt(0) : 0);
    const code = key === ' ' ? 'Space' : key.length === 1 ? `Key${key.toUpperCase()}` : key;
    const init = {
      key: key,
      code: code,
      keyCode: keyCode,
      which: keyCode,
      charCode: key === 'Enter' ? 13 : keyCode,
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window
    };

    if (typeof el.focus === 'function') {
      try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
    }

    el.dispatchEvent(new KeyboardEvent('keydown', init));
    if (key === 'Enter') {
      el.dispatchEvent(new KeyboardEvent('keypress', init));
    }
    el.dispatchEvent(new KeyboardEvent('keyup', init));

    if (key === 'Tab') {
      focusNext(el);
    }
  }

  // ============================================================
  // BỘ MÁY THỰC THI (EXECUTION ENGINE)
  // ============================================================
  const isAlive = (token) => isRunning && token === runToken;

  async function waitWhilePaused(token) {
    while (isPaused && isAlive(token)) await sleep(200);
  }

  // Sleep chia nhỏ, kết thúc sớm nếu người dùng bấm Dừng
  async function smartSleep(ms, token) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      if (token !== undefined && !isAlive(token)) return;
      await sleep(Math.min(100, end - Date.now()));
    }
  }

  function isElementInViewport(el) {
    if (!el) return false;
    try {
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth || document.documentElement.clientWidth;
      const vh = window.innerHeight || document.documentElement.clientHeight;
      return r.top >= 0 && r.left >= 0 && r.bottom <= vh && r.right <= vw;
    } catch (e) { return false; }
  }

  // Smart Wait: quét mỗi 150ms, thấy là chạy ngay, thời gian tạm dừng không bị tính vào timeout
  async function waitForElement(selector, timeout, ctx) {
    let elapsed = 0;
    let last = Date.now();
    let retriggered = false;

    // Trích xuất targetText từ mô tả bước (ví dụ: Click vào "4" -> targetText = "4")
    let targetText = '';
    const labelMatch = (ctx.label || '').match(/["'“]([^"'“”]+)["'”]/);
    if (labelMatch && labelMatch[1]) {
      targetText = labelMatch[1].trim();
    }
    if (!targetText) {
      const dayMatch = (ctx.label || '').match(/(?:ngày|ô|chọn|click|bước|\s)\s*([1-9]|[12]\d|3[01])\b/i);
      if (dayMatch && dayMatch[1]) {
        targetText = dayMatch[1].trim();
      }
    }

    while (isAlive(ctx.token)) {
      const found = findElement(selector, targetText);
      if (found && (isElementVisible(found) || found.offsetParent !== null)) return found;

      const now = Date.now();
      if (!isPaused) elapsed += now - last;
      last = now;

      // CƠ CHẾ TỰ ĐỘNG PHỤC HỒI POPUP & DATEPICKER (SELF-HEALING):
      // Nếu bước hiện tại đợi nút bấm (hoặc thông tin / lịch) mà sau 1s chưa thấy:
      // Kích hoạt lại ô bấm trước đó (lặp lại định kỳ mỗi 2.5s nếu vẫn chưa thấy)
      if (elapsed > 1000 && lastClickedTrigger && lastClickedTrigger.el && lastClickedTrigger.el.isConnected) {
        const lastRetrigger = lastClickedTrigger.lastRetrigger || lastClickedTrigger.timestamp;
        if (now - lastRetrigger >= 2500) {
          lastClickedTrigger.lastRetrigger = now;
          setInfoMain(`[Dòng ${absRow(currentRunIndex)} • Bước ${ctx.stepNum}/${ctx.totalSteps}] Kích hoạt lại ô chọn ngày / thông tin...`);
          simulateClick(lastClickedTrigger.el);
          await sleep(250);
          continue;
        }
      }

      // Tự động mở DatePicker trên form nếu đang cần chọn ngày mà popup lịch chưa hiện
      const isDateWait = (/^\d{1,2}$/.test(targetText) || /date|time|ngày|giờ|select\s*date/i.test(targetText) || /date|time|picker/i.test(selector)) &&
        !queryAllSafe('.el-picker-panel:not([style*="display: none"]), .ant-picker-dropdown:not(.ant-picker-dropdown-hidden)').some((p) => isElementVisible(p));
      if (isDateWait && elapsed > 1500) {
        const lastDateClick = ctx._lastDateClick || 0;
        if (now - lastDateClick >= 3000) {
          ctx._lastDateClick = now;
          const formDateInp = queryAllSafe('.el-date-editor input, .ant-picker input, [class*="date-editor"] input, input[placeholder*="date" i]').find((inp) => isElementVisible(inp));
          if (formDateInp) {
            setInfoMain(`[Dòng ${absRow(currentRunIndex)} • Bước ${ctx.stepNum}/${ctx.totalSteps}] Mở lại bảng chọn ngày...`);
            simulateClick(formDateInp);
            await sleep(250);
            continue;
          }
        }
      }

      if (elapsed >= timeout) return null;

      if (!errorState) {
        setInfoMain(`[Dòng ${absRow(currentRunIndex)} • Bước ${ctx.stepNum}/${ctx.totalSteps}] ${isPaused ? '⏸️ Tạm dừng' : 'Đang đợi'}: ${ctx.label || selector} (${Math.round(elapsed / 1000)}s/${Math.round(timeout / 1000)}s)`);
      }
      await sleep(150);
    }
    return null;
  }

  // Chờ DOM ổn định (không thay đổi trong quietMs) - tối đa maxMs
  function waitForDomSettle(quietMs, maxMs) {
    return new Promise((resolve) => {
      let quietTimer = null;
      let finished = false;
      const observer = new MutationObserver((mutations) => {
        if (mutations.every((m) => isOwnElement(m.target) || (floatingBar && floatingBar.contains(m.target)))) return;
        resetQuiet();
      });
      const done = () => {
        if (finished) return;
        finished = true;
        observer.disconnect();
        clearTimeout(quietTimer);
        clearTimeout(maxTimer);
        resolve();
      };
      const resetQuiet = () => {
        clearTimeout(quietTimer);
        quietTimer = setTimeout(done, quietMs);
      };
      const maxTimer = setTimeout(done, maxMs);
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['class', 'disabled', 'hidden', 'aria-hidden']
      });
      resetQuiet();
    });
  }

  const LOADING_SELECTORS = '.el-loading-mask, .ant-spin-spinning, .v-overlay--active, .loading-overlay, .loading-mask';

  async function waitForPageIdle(token, speed) {
    // 1. Chờ các lớp "đang tải" phổ biến biến mất (tối đa 15s)
    const start = Date.now();
    while (isAlive(token) && Date.now() - start < 15000) {
      const busy = queryAllSafe(LOADING_SELECTORS).some((el) => isElementVisible(el));
      if (!busy) break;
      setInfoMain(`[Dòng ${absRow(currentRunIndex)}] Trang đang tải dữ liệu, vui lòng chờ...`);
      await sleep(200);
    }
    if (!isAlive(token)) return;
    // 2. Chờ DOM ổn định
    await waitForDomSettle(250, Math.round(2000 * speed));
  }

  // Thay thế {Tên_Cột} / [Tên_Cột] trong selector bằng dữ liệu dòng Excel
  function substituteSelector(selector, rowData) {
    if (!rowData || !selector) return selector || '';
    return selector.replace(/\{+([^{}]+)\}+|\[+([^\[\]]+)\]+/g, (match, p1, p2) => {
      const key = (p1 || p2 || '').trim();
      return rowData[key] !== undefined ? String(rowData[key]) : match;
    });
  }

  // Giải nghĩa giá trị cần gõ: tên cột (không cần ngoặc), {Cột}, {{Cột}}, [Cột] hoặc chữ cố định
  function resolveValue(raw, rowData) {
    const value = raw == null ? '' : String(raw);
    if (!rowData || !value) return value;

    const exactKey = value.trim();
    const cleanKey = exactKey.replace(/^\{+|\}+$/g, '').replace(/^\[+|\]+$/g, '').trim();
    const bracketed = cleanKey !== exactKey;

    // Ký tự đơn như "A", "B" chỉ được hiểu là cột khi có ngoặc ({A}) để tránh thay nhầm chữ cố định
    const isLetterAlias = (k) => /^[A-Z]{1,3}$/.test(k) && rowData[`Cot_${k}`] !== undefined;

    if (rowData[exactKey] !== undefined && !isLetterAlias(exactKey)) return String(rowData[exactKey]);
    if (bracketed && rowData[cleanKey] !== undefined) return String(rowData[cleanKey]);

    return value.replace(/\{+([^{}]+)\}+|\[+([^\[\]]+)\]+/g, (match, p1, p2) => {
      const key = (p1 || p2 || '').trim();
      return rowData[key] !== undefined ? String(rowData[key]) : match;
    });
  }

  const QUERY_BUTTON_RE = /truy vấn|tìm kiếm|search|query/i;

  async function executeStep(step, rowData, ctx) {
    const speed = runOptions.speed || 1;
    const { token } = ctx;
    const baseMs = Math.min(Math.max(Number(step.delay) ?? 400, 0), 300000);
    const extraMs = step.type === 'wait' ? 0 : (runOptions.extraDelayMs || 0);
    const preWait = (baseMs + extraMs) * speed;

    if (step.type === 'wait') {
      setInfoMain(`[Dòng ${absRow(currentRunIndex)} • Bước ${ctx.stepNum}/${ctx.totalSteps}] Chờ ${(preWait / 1000).toFixed(1)}s...`);
      await smartSleep(preWait, token);
      ctx.onActionDone();
      return { ok: true };
    }

    if (!['click', 'type', 'keypress'].includes(step.type)) {
      return { ok: false, error: `Loại bước không được hỗ trợ: "${step.type}"` };
    }

    const selector = substituteSelector(step.selector, rowData);
    const timeout = Number(step.timeout) > 0 ? Number(step.timeout) : (step.optional ? 5000 : 30000);
    const el = await waitForElement(selector, timeout, { ...ctx, label: step.description });
    if (!isAlive(token)) return { ok: false, aborted: true };

    if (!el) {
      if (step.optional) {
        ctx.onActionDone();
        return { ok: true, skipped: true };
      }
      return { ok: false, error: `Không tìm thấy phần tử sau ${Math.round(timeout / 1000)} giây` };
    }

    // Chỉ cuộn trang khi phần tử nằm ngoài màn hình để tránh làm tắt các popup/tooltip đang mở
    if (!isElementInViewport(el) && typeof el.scrollIntoView === 'function') {
      try { el.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' }); } catch (e) {}
    }
    el.classList.add('af-playback-highlight');
    let target = el;

    try {
      setInfoMain(`[Dòng ${absRow(currentRunIndex)} • Bước ${ctx.stepNum}/${ctx.totalSteps}] Đã thấy, chờ ${(preWait / 1000).toFixed(1)}s rồi thực hiện...`);
      await smartSleep(preWait, token);
      await waitWhilePaused(token);
      if (!isAlive(token)) return { ok: false, aborted: true };

      // Phần tử có thể bị framework render lại trong lúc chờ -> tìm lại
      if (!target.isConnected) {
        let stepTargetText = (step.description || '').match(/["'“]([^"'“”]+)["'”]/)?.[1]?.trim() || '';
        if (!stepTargetText) {
          const m = (step.description || '').match(/(?:ngày|ô|chọn|click|bước|\s)\s*([1-9]|[12]\d|3[01])\b/i);
          if (m) stepTargetText = m[1].trim();
        }
        target = findElement(selector, stepTargetText);
        if (!target) return { ok: false, error: 'Phần tử biến mất trước khi kịp thao tác' };
      }

      if (step.type === 'click') {
        simulateClick(target);
        lastClickedTrigger = {
          el: target,
          selector,
          desc: step.description || '',
          timestamp: Date.now()
        };
        ctx.onActionDone();
        await smartSleep(300 * speed, token);
        if (QUERY_BUTTON_RE.test(`${step.description || ''} ${step.selector || ''}`)) {
          setInfoMain(`[Dòng ${absRow(currentRunIndex)}] Đã bấm tìm kiếm, chờ máy chủ trả kết quả...`);
          await smartSleep(1000 * speed, token);
        }
        await waitForPageIdle(token, speed);
      } else if (step.type === 'type') {
        setValueToInput(target, resolveValue(step.value, rowData));
        ctx.onActionDone();
      } else if (step.type === 'keypress') {
        simulateKey(target, step.key || 'Enter');
        ctx.onActionDone();
        await smartSleep(300 * speed, token);
        await waitForPageIdle(token, speed);
      }

      await smartSleep(150, token);
      return { ok: true };
    } finally {
      el.classList.remove('af-playback-highlight');
      if (target && target !== el) target.classList.remove('af-playback-highlight');
    }
  }

  // ---- Lưu tiến độ chạy (khôi phục được sau khi trang tải lại / chuyển hướng) ----
  function persistRunStatic() {
    if (!isRunning) return;
    if (tabId === null) {
      getTabId().then((id) => { if (id !== null) persistRunStatic(); });
      return;
    }
    storageSet({
      [runKey()]: {
        scenario: currentScenario,
        dataset: currentDataset,
        options: runOptions,
        origin: location.origin,
        startedAt: Date.now()
      }
    });
  }

  function persistRunPos() {
    if (!isRunning) return;
    if (tabId === null) {
      getTabId().then((id) => { if (id !== null) persistRunPos(); });
      return;
    }
    storageSet({
      [runPosKey()]: {
        rowIndex: currentRunIndex,
        stepIndex: currentStepIndex,
        cycleIndex: currentCycle,
        logs: executionLogs,
        savedAt: Date.now()
      }
    });
  }

  function clearRunState() {
    if (tabId !== null) storageRemove([runKey(), runPosKey()]);
    else getTabId().then((id) => { if (id !== null) storageRemove([runKey(), runPosKey()]); });
  }

  function sendProgress() {
    safeSendMessage({
      action: 'EXECUTION_PROGRESS',
      tabId: tabId,
      scenarioId: currentScenario?.id,
      scenarioName: currentScenario?.name,
      row: absRow(currentRunIndex),
      totalRows: runOptions.rowOffset + currentDataset.length,
      rowOffset: runOptions.rowOffset,
      runIndex: currentRunIndex,
      runTotal: currentDataset.length,
      step: currentStepIndex + 1,
      totalSteps: currentScenario?.steps?.length || 0,
      cycle: currentCycle + 1,
      repeatCount: runOptions.repeatCount || 1,
      isPaused,
      hasError: !!errorState,
      lastError: errorState?.message || '',
      multiTabJobId: runOptions.multiTabJobId || null
    });
  }

  function askUserOnError(message) {
    return new Promise((resolve) => {
      errorState = {
        message,
        resolve: (decision) => {
          errorState = null;
          resolve(decision);
          if (isRunning) updateFloatingBarUI();
        }
      };
      floatingBar?.classList.remove('af-minimized');
      updateFloatingBarUI();
      sendProgress();
    });
  }

  async function runLoop(token, startRow, startStep, startCycle = 0) {
    const steps = currentScenario.steps;
    const total = currentDataset.length;
    const repCount = runOptions.repeatCount || 1;

    for (let cycle = startCycle; cycle < repCount; cycle++) {
      if (!isAlive(token)) return;
      currentCycle = cycle;
      const initialRow = (cycle === startCycle) ? startRow : 0;

      for (let i = initialRow; i < total; i++) {
        if (!isAlive(token)) return;
        currentRunIndex = i;
        const row = currentDataset[i];
        let rowError = null;
        let s = (cycle === startCycle && i === startRow) ? startStep : 0;

        while (s < steps.length) {
          await waitWhilePaused(token);
          if (!isAlive(token)) return;

          currentStepIndex = s;
          updateFloatingBarUI();
          sendProgress();

          const stepIdx = s;
          let result;
          try {
            result = await executeStep(steps[s], row, {
              token,
              stepNum: s + 1,
              totalSteps: steps.length,
              onActionDone: () => {
                currentStepIndex = stepIdx + 1;
                persistRunPos();
              }
            });
          } catch (err) {
            console.log('[AutoFlow] [Lỗi khi thực thi bước]:', err);
            result = { ok: false, error: err?.message || String(err) };
          }
          if (!isAlive(token)) return;

          if (result.ok) {
            s++;
            continue;
          }

          const desc = steps[s].description || steps[s].selector || steps[s].type;
          const cycleLabel = repCount > 1 ? `[Vòng ${cycle + 1}/${repCount}] ` : '';
          const msg = `${cycleLabel}Dòng ${absRow(i)} • Bước ${s + 1}/${steps.length} "${desc}": ${result.error}`;
          console.log('[AutoFlow] [Thông báo bước]:', msg);

          if (runOptions.errorMode === 'skip') {
            rowError = msg;
            break;
          }

          const decision = await askUserOnError(msg);
          if (!isAlive(token)) return;
          if (decision === 'retry') continue;
          if (decision === 'skip-step') { s++; continue; }
          rowError = msg; // skip-row
          break;
        }

        executionLogs.push({
          cycle: cycle + 1,
          row: absRow(i),
          rowIndex: i,
          status: rowError ? 'failed' : 'success',
          error: rowError || '',
          time: new Date().toLocaleTimeString('vi-VN')
        });
        currentRunIndex = i + 1;
        currentStepIndex = 0;
        persistRunPos();
      }
    }

    finishExecution(token, 'completed');
  }

  function finishExecution(token, reason) {
    if (token !== runToken || !isRunning) return;
    isRunning = false;
    isPaused = false;
    if (errorState) {
      const r = errorState.resolve;
      errorState = null;
      r('stop');
    }
    clearRunState();

    const success = executionLogs.filter((l) => l.status === 'success').length;
    const failed = executionLogs.filter((l) => l.status === 'failed').length;
    const repCount = runOptions.repeatCount || 1;
    const summary = {
      reason,
      scenarioName: currentScenario?.name || '',
      finishedAt: new Date().toISOString(),
      repeatCount: repCount,
      success,
      failed,
      logs: executionLogs.map((l) => ({ ...l, data: currentDataset[l.rowIndex] || {} }))
    };
    storageSet({ lastRunResults: summary });
    safeSendMessage({
      action: 'EXECUTION_COMPLETED',
      tabId: tabId,
      scenarioId: currentScenario?.id,
      scenarioName: currentScenario?.name,
      multiTabJobId: runOptions.multiTabJobId || null,
      reason,
      logs: executionLogs,
      summary
    });

    updateFloatingBarUI();

    if (reason === 'completed') {
      const repLabel = repCount > 1 ? ` qua ${repCount} vòng lặp` : '';
      if (failed === 0) showToast(`🎉 Hoàn tất ${success} lượt chạy${repLabel} thành công 100%!`, 'success', 6000);
      else showToast(`⚠️ Hoàn tất: ${success} lượt thành công, ${failed} lượt lỗi. Mở AutoFlow để tải báo cáo.`, 'error', 8000);
    } else {
      // Khi bấm dừng chủ động thì không cần bung toast
    }
  }

  async function startExecution(scenario, dataset, options = {}, resume = null) {
    if (isRecording) stopRecording(false);

    if (!scenario || !Array.isArray(scenario.steps) || scenario.steps.length === 0) {
      const res = await storageGet(['scenarios', 'activeScenarioId', 'currentDataset']);
      if (res.activeScenarioId && res.scenarios && res.scenarios[res.activeScenarioId]) scenario = res.scenarios[res.activeScenarioId];
      if (!dataset || dataset.length === 0) dataset = res.currentDataset || [];
    }

    if (!scenario || !Array.isArray(scenario.steps) || scenario.steps.length === 0) {
      showToast('Kịch bản không có bước nào để chạy! Mở popup AutoFlow để ghi hoặc chọn kịch bản.', 'error');
      return;
    }

    if (isRunning) stopExecution(true);

    const token = ++runToken;
    currentScenario = scenario;
    currentDataset = Array.isArray(dataset) && dataset.length > 0 ? dataset : [{}]; // Chạy ít nhất 1 lần nếu không có file

    const legacyOffset = options.startRowIndex ? parseInt(options.startRowIndex, 10) - 1 : 0;
    const extraSec = Math.max(0, parseFloat(options.extraDelaySec) || 0);
    const repCount = Math.max(1, parseInt(options.repeatCount, 10) || 1);
    const multiJobId = options.multiTabJobId || null;
    runOptions = {
      speed: Number(options.speed) > 0 ? Number(options.speed) : 1,
      errorMode: options.errorMode === 'skip' ? 'skip' : 'stop',
      rowOffset: Math.max(0, parseInt(options.rowOffset ?? legacyOffset, 10) || 0),
      extraDelaySec: extraSec,
      extraDelayMs: Math.max(0, parseInt(options.extraDelayMs, 10) || Math.round(extraSec * 1000)),
      repeatCount: repCount,
      multiTabJobId: multiJobId
    };

    executionLogs = resume && Array.isArray(resume.logs) ? resume.logs : [];
    currentRunIndex = resume ? Math.max(0, resume.rowIndex || 0) : 0;
    currentStepIndex = resume ? Math.max(0, resume.stepIndex || 0) : 0;
    currentCycle = resume ? Math.max(0, resume.cycleIndex || 0) : 0;
    isRunning = true;
    isPaused = !!(resume && resume.paused);
    errorState = null;

    initFloatingBar();
    floatingBar.classList.remove('af-minimized');
    updateFloatingBarUI();
    persistRunStatic();
    persistRunPos();

    safeSendMessage({
      action: 'EXECUTION_STARTED',
      tabId: tabId,
      scenarioId: currentScenario?.id,
      scenarioName: currentScenario?.name,
      totalRows: currentDataset.length,
      rowOffset: runOptions.rowOffset,
      repeatCount: runOptions.repeatCount,
      multiTabJobId: multiJobId,
      options: runOptions
    });

    await runLoop(token, currentRunIndex, currentStepIndex, currentCycle);
  }

  function togglePause() {
    if (!isRunning) return;
    isPaused = !isPaused;
    updateFloatingBarUI();
    sendProgress();
  }

  function stopExecution(silent = false) {
    if (!isRunning) {
      if (!silent) updateFloatingBarUI();
      return;
    }
    const token = runToken;
    finishExecution(token, 'stopped');
    runToken++; // Vô hiệu hóa vòng lặp cũ
  }

  window.addEventListener('pagehide', handlePageHide, true);
  window.addEventListener('beforeunload', handlePageHide, true);

  // ============================================================
  // GIAO TIẾP VỚI POPUP & BACKGROUND / DASHBOARD
  // ============================================================
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch (msg && msg.action) {
      case 'PING':
        sendResponse({ status: 'PONG', isRecording, isRunning });
        break;
      case 'START_RECORDING':
        currentRecordingScenarioId = msg.scenarioId || null;
        currentRecordingScenarioName = msg.scenarioName || null;
        currentRecordingMode = msg.mode || 'overwrite';
        startRecording();
        sendResponse({ status: 'RECORDING_STARTED' });
        break;
      case 'STOP_RECORDING':
        stopRecording(msg.save);
        sendResponse({ status: 'RECORDING_STOPPED' });
        break;
      case 'START_EXECUTION':
        startExecution(msg.scenario, msg.dataset, msg.options || {});
        sendResponse({ status: 'EXECUTION_STARTED' });
        break;
      case 'STOP_EXECUTION':
        stopExecution();
        sendResponse({ status: 'EXECUTION_STOPPED' });
        break;
      case 'TOGGLE_PAUSE':
        togglePause();
        sendResponse({ isPaused });
        break;
      case 'PAUSE_EXECUTION':
        if (isRunning && !isPaused) togglePause();
        sendResponse({ isPaused });
        break;
      case 'RESUME_EXECUTION':
        if (isRunning && isPaused) togglePause();
        sendResponse({ isPaused });
        break;
      case 'GET_STATUS':
        sendResponse({
          isRecording,
          isRunning,
          isPaused,
          hasError: !!errorState,
          recordedCount: recordedSteps.length,
          currentRunIndex,
          totalRows: currentDataset.length,
          rowOffset: runOptions.rowOffset,
          currentStepIndex,
          totalSteps: currentScenario?.steps?.length || 0,
          currentCycle: currentCycle + 1,
          repeatCount: runOptions.repeatCount || 1,
          scenarioId: currentScenario?.id || null,
          scenarioName: currentScenario?.name || null,
          multiTabJobId: runOptions.multiTabJobId || null
        });
        break;
      default:
        return false;
    }
    return false;
  });

  // ============================================================
  // KHỞI ĐỘNG: khôi phục phiên ghi / chạy dở dang sau khi trang tải lại
  // ============================================================
  async function bootstrap() {
    await getTabId();
    if (tabId === null) return;

    const res = await storageGet([recKey(), runKey(), runPosKey()]);
    const now = Date.now();

    const rec = res[recKey()];
    if (rec) {
      if (now - (rec.savedAt || 0) > STALE_STATE_MS) {
        storageRemove(recKey());
      } else {
        currentRecordingScenarioId = rec.scenarioId || null;
        currentRecordingScenarioName = rec.scenarioName || null;
        currentRecordingMode = rec.mode || 'overwrite';
        startRecording(rec);
        return;
      }
    }

    const run = res[runKey()];
    if (run && run.scenario) {
      const pos = res[runPosKey()] || { rowIndex: 0, stepIndex: 0, cycleIndex: 0, logs: [], savedAt: run.startedAt };
      if (now - (pos.savedAt || run.startedAt || 0) > STALE_STATE_MS) {
        storageRemove([runKey(), runPosKey()]);
        return;
      }
      const sameOrigin = run.origin === location.origin;
      await sleep(600); // Cho trang mới ổn định
      startExecution(run.scenario, run.dataset, run.options || {}, {
        rowIndex: pos.rowIndex,
        stepIndex: pos.stepIndex,
        cycleIndex: pos.cycleIndex || 0,
        logs: pos.logs,
        paused: !sameOrigin
      });
    }
  }

  bootstrap();
  console.log('[AutoFlow] Content script v1.1 sẵn sàng.');
})();
