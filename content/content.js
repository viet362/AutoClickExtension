// AutoFlow - In-Page Content Script (Recording & Execution Engine)

(function () {
  // Dọn dẹp phiên bản cũ nếu đã từng inject vào trang web này
  if (window.__AUTOFLOW_CLEANUP__) {
    try { window.__AUTOFLOW_CLEANUP__(); } catch (e) {}
  }
  window.__AUTOFLOW_INJECTED__ = true;

  // Trạng thái hệ thống
  let isRecording = false;
  let isRunning = false;
  let isPaused = false;
  let recordedSteps = [];
  let lastActionTime = 0;
  let hoveredElement = null;
  let currentScenario = null;
  let currentDataset = [];
  let currentRunIndex = 0;
  let executionLogs = [];
  let currentRecordingScenarioId = null;
  let currentRecordingScenarioName = null;

  // Tạo Floating Bar trên trang web (Chỉ hiển thị trên khung chính window.top)
  let floatingBar = null;

  window.__AUTOFLOW_CLEANUP__ = () => {
    if (floatingBar) {
      floatingBar.remove();
      floatingBar = null;
    }
    isRunning = false;
    isRecording = false;
  };

  function initFloatingBar() {
    if (window !== window.top) return; // Chỉ hiển thị Floating Bar ở khung chính
    const existing = document.getElementById('autoflow-floating-bar');
    if (existing) {
      floatingBar = existing;
      return;
    }

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
          <div class="af-actions" id="af-actions">
            <!-- Nút điều khiển sẽ được render động theo trạng thái -->
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(floatingBar);
    setupFloatingBarEvents();
  }

  function setupFloatingBarEvents() {
    const miniToggle = document.getElementById('af-mini-toggle');
    const btnMinimize = document.getElementById('af-btn-minimize');
    const btnClose = document.getElementById('af-btn-close');
    const dragHeader = document.getElementById('af-drag-header');

    miniToggle.addEventListener('click', () => {
      floatingBar.classList.remove('af-minimized');
    });

    btnMinimize.addEventListener('click', () => {
      floatingBar.classList.add('af-minimized');
    });

    btnClose.addEventListener('click', () => {
      if (isRecording) stopRecording(false);
      if (isRunning) stopExecution();
      floatingBar.style.display = 'none';
    });

    // Kéo thả Floating Bar
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    dragHeader.addEventListener('mousedown', (e) => {
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
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      floatingBar.style.left = `${Math.max(10, Math.min(window.innerWidth - 360, initialLeft + dx))}px`;
      floatingBar.style.top = `${Math.max(10, Math.min(window.innerHeight - 150, initialTop + dy))}px`;
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  function updateFloatingBarUI() {
    if (!floatingBar) initFloatingBar();
    floatingBar.style.display = 'block';

    const statusBadge = document.getElementById('af-status-badge');
    const statusText = document.getElementById('af-status-text');
    const infoTitle = document.getElementById('af-info-title');
    const infoMain = document.getElementById('af-info-main');
    const stepsCount = document.getElementById('af-steps-count');
    const progressContainer = document.getElementById('af-progress-container');
    const actionsContainer = document.getElementById('af-actions');
    const miniStatus = document.getElementById('af-mini-status');

    if (isRecording) {
      statusBadge.className = 'af-status-badge af-badge-recording';
      statusText.textContent = 'Đang ghi mẫu';
      miniStatus.textContent = `🔴 Đang ghi (${recordedSteps.length})`;
      infoTitle.textContent = 'Kịch bản đang ghi mẫu';
      infoMain.textContent = 'Thao tác chuột/phím trên web...';
      stepsCount.textContent = `${recordedSteps.length} bước`;
      progressContainer.style.display = 'none';

      actionsContainer.innerHTML = `
        <button class="af-btn af-btn-primary" id="af-btn-save-record">💾 Dừng & Lưu</button>
        <button class="af-btn af-btn-danger" id="af-btn-cancel-record">✕ Hủy bỏ</button>
      `;

      document.getElementById('af-btn-save-record').onclick = () => stopRecording(true);
      document.getElementById('af-btn-cancel-record').onclick = () => stopRecording(false);
    } else if (isRunning) {
      statusBadge.className = 'af-status-badge af-badge-running';
      statusText.textContent = isPaused ? 'Tạm dừng' : 'Đang tự động';
      miniStatus.textContent = `▶️ Dòng ${currentRunIndex + 1}/${currentDataset.length}`;
      infoTitle.textContent = currentScenario?.name || 'Đang thực thi';
      infoMain.textContent = `Dòng ${currentRunIndex + 1} / ${currentDataset.length}`;
      stepsCount.textContent = `${Math.round(((currentRunIndex + 1) / currentDataset.length) * 100)}%`;
      progressContainer.style.display = 'block';

      actionsContainer.innerHTML = `
        <button class="af-btn af-btn-secondary" id="af-btn-toggle-pause">
          ${isPaused ? '▶️ Tiếp tục' : '⏸️ Tạm dừng'}
        </button>
        <button class="af-btn af-btn-danger" id="af-btn-stop-run">⏹️ Dừng ngay</button>
      `;

      document.getElementById('af-btn-toggle-pause').onclick = togglePause;
      document.getElementById('af-btn-stop-run').onclick = stopExecution;
    } else {
      statusBadge.className = 'af-status-badge af-badge-idle';
      statusText.textContent = 'Sẵn sàng';
      miniStatus.textContent = '⚡ AutoFlow';
      infoTitle.textContent = 'AutoFlow';
      infoMain.textContent = 'Đang tải thông tin kịch bản...';
      stepsCount.textContent = '0 bước';
      progressContainer.style.display = 'none';

      chrome.storage.local.get(['scenarios', 'activeScenarioId', 'currentDataset', 'currentFileName'], (res) => {
        const activeId = res.activeScenarioId;
        const sc = activeId && res.scenarios ? res.scenarios[activeId] : null;
        const scName = sc ? sc.name : 'Sẵn sàng';
        const stepsLen = sc && sc.steps ? sc.steps.length : 0;
        const dsLen = res.currentDataset ? res.currentDataset.length : 0;

        infoTitle.textContent = sc ? scName : 'Trạng thái';
        infoMain.textContent = sc ? `${stepsLen} bước • Excel: ${dsLen > 0 ? `${res.currentFileName || 'File'} (${dsLen} dòng)` : 'Chưa nạp'}` : 'Mở popup để chọn kịch bản';
        stepsCount.textContent = `${stepsLen} bước`;

        actionsContainer.innerHTML = `
          ${stepsLen > 0 ? `<button class="af-btn af-btn-primary" id="af-btn-start-exec" style="background:#10b981; border-color:#10b981; font-weight:600;">▶️ Chạy kịch bản</button>` : ''}
          <button class="af-btn af-btn-secondary" id="af-btn-start-record">🔴 Ghi mẫu</button>
        `;

        if (document.getElementById('af-btn-start-exec')) {
          document.getElementById('af-btn-start-exec').onclick = () => {
            startExecution(sc, res.currentDataset);
          };
        }
        if (document.getElementById('af-btn-start-record')) {
          document.getElementById('af-btn-start-record').onclick = () => startRecording();
        }
      });
    }
  }

  // --- THUẬT TOÁN TẠO SELECTOR THÔNG MINH ---
  function getElementSelector(el) {
    if (!el || el === document.body || el === document.documentElement) return 'body';

    // 1. Kiểm tra ID duy nhất và có ý nghĩa
    if (el.id && !el.id.match(/^[0-9]|react-|vue-|ember-|ext-|ng-|_/)) {
      try {
        if (document.querySelectorAll(`#${CSS.escape(el.id)}`).length === 1) {
          return `#${CSS.escape(el.id)}`;
        }
      } catch (e) {}
    }

    // 2. Kiểm tra thuộc tính đặc trưng (data-testid, name, placeholder, aria-label)
    const attrs = ['data-testid', 'name', 'placeholder', 'aria-label', 'role'];
    for (const attr of attrs) {
      const val = el.getAttribute(attr);
      if (val) {
        const selector = `${el.tagName.toLowerCase()}[${attr}="${CSS.escape(val)}"]`;
        try {
          if (document.querySelectorAll(selector).length === 1) {
            return selector;
          }
        } catch (e) {}
      }
    }

    // 3. Với nút bấm hoặc thẻ a có text ngắn gọn (hoặc thẻ con span, i, svg nằm trong nút)
    const btnParent = el.closest('button, a, [role="button"]');
    const targetBtn = btnParent || (['BUTTON', 'A'].includes(el.tagName) ? el : null);
    if (targetBtn) {
      const text = targetBtn.innerText?.trim();
      if (text && text.length < 30 && !text.includes('\n')) {
        return `${targetBtn.tagName.toLowerCase()}::-af-text("${text}")`;
      }
    }

    // 3.1 Với dropdown option (li, [role="option"], .el-select-dropdown__item)
    const optParent = el.closest('li, [role="option"], .el-select-dropdown__item');
    if (optParent) {
      const text = optParent.innerText?.trim();
      if (text && text.length < 40 && !text.includes('\n')) {
        return `li::-af-text("${text}")`;
      }
    }
    // 3.5. Nếu phần tử nằm trong dòng bảng (tr): Nhận dạng theo từ khóa dòng hoặc số thứ tự dòng
    const tr = el.closest('tr, .el-table__row');
    if (tr) {
      const btn = el.closest('button, a, [role="button"]');
      let subSelector = btn ? btn.tagName.toLowerCase() : 'td, .cell';

      // Kiểm tra title, aria-label hoặc class icon đặc trưng nếu là button
      if (btn) {
        if (btn.getAttribute('title')) {
          subSelector = `${btn.tagName.toLowerCase()}[title="${CSS.escape(btn.getAttribute('title'))}"]`;
        } else if (btn.getAttribute('aria-label')) {
          subSelector = `[aria-label="${CSS.escape(btn.getAttribute('aria-label'))}"]`;
        } else {
          const iconEl = btn.querySelector('i, svg') || (['I', 'SVG'].includes(btn.tagName) ? btn : null);
          if (iconEl && iconEl.className && typeof iconEl.className === 'string') {
            const iconClass = iconEl.className.split(/\s+/).find(c => c.includes('icon') || c.includes('fa-') || c.includes('btn-'));
            if (iconClass) {
              subSelector = `.${iconClass}`;
            }
          }
        }
      }

      // Xác định dòng chính (nếu click nằm trong fixed wrapper của Element-UI)
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

      // 1. Nếu người dùng click trực tiếp vào một ô (cell) có chứa văn bản
      let kw = '';
      const clickedCell = el.closest('td, .cell');
      const clickedText = clickedCell?.innerText?.trim();
      if (clickedText && clickedText.length >= 2 && clickedText.length <= 40 && !clickedText.match(/^[0-9]+$/)) {
        kw = clickedText;
      } else {
        // 2. Nếu click vào icon/nút trong dòng: lấy ô phân loại ngắn nhất (Step: EIH, Setup, Online...)
        const allCells = Array.from(mainTr.querySelectorAll('td, .cell'));
        const textCells = allCells
          .map(c => c.innerText?.trim())
          .filter(txt => txt && txt.length >= 2 && txt.length <= 40 && !txt.match(/^[0-9]+$/));
        if (textCells.length > 0) {
          // Ưu tiên từ khóa ngắn nhất (thường là tên Step / Trạng thái) thay vì mã thiết bị dài
          textCells.sort((a, b) => a.length - b.length);
          kw = textCells[0];
        }
      }

      if (kw) {
        return `tr::-af-row("${kw}") ${subSelector}`;
      } else {
        // Fallback: nếu dòng không có chữ, tính theo số thứ tự dòng
        const parentTbody = tr.parentElement;
        if (parentTbody) {
          const allRows = Array.from(parentTbody.children).filter(c => c.tagName === 'TR' || c.classList.contains('el-table__row'));
          const idx = allRows.indexOf(tr) + 1;
          if (idx > 0) {
            return `tr::-af-row-index(${idx}) ${subSelector}`;
          }
        }
      }
    }

    // 4. Fallback: Path theo cấu trúc class và vị trí nth-child
    let path = [];
    let current = el;
    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
      let tag = current.tagName.toLowerCase();
      if (current.id && !current.id.match(/^[0-9]|react-|vue-|ember-|ext-|ng-|_/)) {
        path.unshift(`#${CSS.escape(current.id)}`);
        break;
      }
      
      let index = 1;
      let sibling = current.previousElementSibling;
      while (sibling) {
        if (sibling.tagName === current.tagName) index++;
        sibling = sibling.previousElementSibling;
      }
      path.unshift(`${tag}:nth-of-type(${index})`);
      current = current.parentElement;
      if (path.length >= 4) break; // Giữ selector ngắn gọn
    }
    return path.join(' > ');
  }

  function getElementDescription(el, actionType) {
    const text = el.innerText?.trim() || el.getAttribute('placeholder') || el.getAttribute('aria-label') || el.name || el.id || '';
    const cleanText = text.substring(0, 25);
    const tag = el.tagName.toLowerCase();

    if (actionType === 'click') {
      if (tag === 'button' || el.getAttribute('role') === 'button') {
        return `Click nút "${cleanText || 'Xác nhận'}"`;
      }
      if (tag === 'a') return `Click liên kết "${cleanText || 'Link'}"`;
      if (tag === 'input' && ['checkbox', 'radio'].includes(el.type)) return `Chọn ô "${cleanText || el.type}"`;
      return `Click vào "${cleanText || tag}"`;
    }
    if (actionType === 'type') {
      return `Nhập dữ liệu vào ô "${cleanText || 'nhập liệu'}"`;
    }
    if (actionType === 'keypress') {
      return `Nhấn phím`;
    }
    return `Thao tác trên ${tag}`;
  }

  // --- RECORDING LISTENERS ---
  function handleRecordMouseMove(e) {
    if (!isRecording) return;
    const target = e.target;
    if (floatingBar && floatingBar.contains(target)) return;

    if (hoveredElement && hoveredElement !== target) {
      hoveredElement.classList.remove('af-inspect-highlight');
    }
    hoveredElement = target;
    hoveredElement.classList.add('af-inspect-highlight');
  }

  // Lưu lại giá trị text đang gõ dở trước khi chuyển sang thao tác khác
  let pendingTypeAction = null;
  let typeTimer = null;

  function commitPendingType() {
    if (typeTimer) {
      clearTimeout(typeTimer);
      typeTimer = null;
    }
    if (pendingTypeAction) {
      const { target, selector, val } = pendingTypeAction;
      pendingTypeAction = null;

      const now = Date.now();
      const delay = lastActionTime > 0 ? Math.min(now - lastActionTime, 4000) : 500;
      lastActionTime = now;

      // Kiểm tra xem bước trước có phải là type vào cùng ô này không
      const lastStep = recordedSteps[recordedSteps.length - 1];
      if (lastStep && lastStep.type === 'type' && lastStep.selector === selector) {
        lastStep.value = val;
      } else {
        recordedSteps.push({
          id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          type: 'type',
          selector: selector,
          value: val,
          description: getElementDescription(target, 'type'),
          delay: Math.max(delay, 400)
        });
      }
      updateFloatingBarUI();
    }
  }

  function handleRecordClick(e) {
    if (!isRecording) return;
    const target = e.target;
    if (floatingBar && floatingBar.contains(target)) return;

    // Lưu văn bản đang gõ dở nếu có trước khi click nút khác
    commitPendingType();

    const selector = getElementSelector(target);
    const now = Date.now();
    const delay = lastActionTime > 0 ? Math.min(now - lastActionTime, 4000) : 500;
    lastActionTime = now;

    const step = {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: 'click',
      selector: selector,
      description: getElementDescription(target, 'click'),
      delay: Math.max(delay, 400)
    };

    recordedSteps.push(step);
    updateFloatingBarUI();
  }

  // Bắt sự kiện gõ văn bản
  function handleRecordInput(e) {
    if (!isRecording) return;
    const target = e.target;
    if (floatingBar && floatingBar.contains(target)) return;

    // Nếu người dùng chuyển sang ô khác, lưu ngay giá trị của ô trước
    if (pendingTypeAction && pendingTypeAction.target !== target) {
      commitPendingType();
    }

    const selector = getElementSelector(target);
    const val = target.value;
    pendingTypeAction = { target, selector, val };

    clearTimeout(typeTimer);
    typeTimer = setTimeout(() => {
      commitPendingType();
    }, 400);
  }

  function handleRecordChange(e) {
    if (!isRecording) return;
    commitPendingType();
  }

  // Bắt phím đặc biệt (Enter, Tab, Esc...)
  function handleRecordKeydown(e) {
    if (!isRecording) return;
    const target = e.target;
    if (floatingBar && floatingBar.contains(target)) return;

    if (['Enter', 'Tab'].includes(e.key)) {
      commitPendingType();

      const selector = getElementSelector(target);
      const now = Date.now();
      const delay = lastActionTime > 0 ? Math.min(now - lastActionTime, 4000) : 500;
      lastActionTime = now;

      recordedSteps.push({
        id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        type: 'keypress',
        key: e.key,
        selector: selector,
        description: `Nhấn phím [${e.key}]`,
        delay: Math.max(delay, 400)
      });
      updateFloatingBarUI();
    }
  }

  function startRecording() {
    isRecording = true;
    recordedSteps = [];
    pendingTypeAction = null;
    lastActionTime = Date.now();
    initFloatingBar();
    updateFloatingBarUI();

    document.addEventListener('mouseover', handleRecordMouseMove, true);
    document.addEventListener('click', handleRecordClick, true);
    document.addEventListener('input', handleRecordInput, true);
    document.addEventListener('change', handleRecordChange, true);
    document.addEventListener('keydown', handleRecordKeydown, true);
  }

  function stopRecording(save = true) {
    commitPendingType();
    isRecording = false;

    document.removeEventListener('mouseover', handleRecordMouseMove, true);
    document.removeEventListener('click', handleRecordClick, true);
    document.removeEventListener('input', handleRecordInput, true);
    document.removeEventListener('change', handleRecordChange, true);
    document.removeEventListener('keydown', handleRecordKeydown, true);

    if (hoveredElement) {
      hoveredElement.classList.remove('af-inspect-highlight');
      hoveredElement = null;
    }

    if (save && recordedSteps.length > 0) {
      chrome.storage.local.get(['scenarios', 'activeScenarioId'], (res) => {
        const scenarios = res.scenarios || {};
        const targetId = currentRecordingScenarioId || res.activeScenarioId || `scenario_${Date.now()}`;

        if (scenarios[targetId]) {
          scenarios[targetId].steps = recordedSteps;
          scenarios[targetId].updatedAt = new Date().toISOString();
        } else {
          scenarios[targetId] = {
            id: targetId,
            name: currentRecordingScenarioName || `Kịch bản ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`,
            createdAt: new Date().toISOString(),
            steps: recordedSteps
          };
        }

        chrome.storage.local.set({ scenarios, activeScenarioId: targetId }, () => {
          alert(`Đã lưu thành công toàn bộ ${recordedSteps.length} bước vào kịch bản "${scenarios[targetId].name}"!\n\nMở tiện ích AutoFlow để kiểm tra và gán cột Excel.`);
        });
      });
    }

    updateFloatingBarUI();
  }

  // --- PLAYBACK & EXECUTION ENGINE ---

  // Tính độ tương đồng giữa 2 chuỗi (Chống lỗi gõ nhầm: ví dụ calibarion vs calibration)
  function stringSimilarity(s1, s2) {
    if (!s1 || !s2) return 0;
    const a = s1.toLowerCase().replace(/\s+/g, ' ').trim();
    const b = s2.toLowerCase().replace(/\s+/g, ' ').trim();
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

  // Tìm nút bấm / icon thao tác thực tế trong dòng (hỗ trợ cả cột Fixed của Element-UI, Ant Design...)
  function findActionBtnInRow(targetRow, subSelector) {
    if (!targetRow) return null;

    // 1. Tìm trực tiếp trong chính dòng này
    const directCandidates = subSelector 
      ? Array.from(targetRow.querySelectorAll(subSelector)) 
      : [];
    const fallbackCandidates = Array.from(targetRow.querySelectorAll('button, [role="button"], a, i, svg, .el-button, .cell *'));
    const candidates = directCandidates.length > 0 ? directCandidates : fallbackCandidates;

    const visibleBtn = candidates.find(btn => isElementVisible(btn));
    if (visibleBtn) return visibleBtn;

    // 2. Nếu nút trong dòng chính bị ẩn (Element-UI thường đặt visibility:hidden cho cột fixed trong body chính),
    // ta tìm sang bảng Fixed tương ứng có cùng chỉ số dòng (rowIndex)
    const tbody = targetRow.closest('tbody');
    if (tbody) {
      const rowsInSameTbody = Array.from(tbody.querySelectorAll('tr'));
      const rowIndex = rowsInSameTbody.indexOf(targetRow);
      if (rowIndex >= 0) {
        const tableContainer = targetRow.closest('.el-table, .ant-table, table')?.parentElement || document;
        const fixedBodies = Array.from(tableContainer.querySelectorAll('.el-table__fixed-body-wrapper tbody, .el-table__fixed-right .el-table__fixed-body-wrapper tbody, .el-table__fixed tbody, .el-table__fixed-right tbody, .ant-table-fixed-left tbody, .ant-table-fixed-right tbody'));
        for (const fb of fixedBodies) {
          const fbRows = Array.from(fb.querySelectorAll('tr'));
          if (fbRows[rowIndex]) {
            const fbRow = fbRows[rowIndex];
            const fbDirect = subSelector ? Array.from(fbRow.querySelectorAll(subSelector)) : [];
            const fbFallback = Array.from(fbRow.querySelectorAll('button, [role="button"], a, i, svg, .el-button, .cell *'));
            const fbList = fbDirect.length > 0 ? fbDirect : fbFallback;
            const foundFbBtn = fbList.find(btn => isElementVisible(btn));
            if (foundFbBtn) return foundFbBtn;
            if (fbList.length > 0) return fbList[0];
          }
        }
      }
    }

    if (candidates.length > 0) return candidates[0];
    return null;
  }

  function findElement(selector) {
    if (!selector) return null;

    // 0. Hỗ trợ tìm nút/icon theo từ khóa trong dòng: tr::-af-row("Calibration") button/i
    if (selector.includes('::-af-row(')) {
      const match = selector.match(/tr::-af-row\((?:["']?)(.+?)(?:["']?)\)\s*(.*)/);
      if (match) {
        const rowKeyword = match[1].replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
        const subSelector = match[2].trim() || 'button, i, a, [role="button"]';
        const allRows = Array.from(document.querySelectorAll('tbody tr, .el-table__body tr, .el-table__row'));

        // 0.1 Tìm chính xác hoặc chứa từ khóa
        let targetRow = allRows.find(tr => {
          const text = (tr.innerText || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').toLowerCase();
          if (text.includes(rowKeyword)) return true;
          const inputs = Array.from(tr.querySelectorAll('input, select'));
          return inputs.some(inp => (inp.value || '').toLowerCase().includes(rowKeyword));
        });

        // 0.2 Nếu chưa thấy, áp dụng so khớp mờ (chống lỗi gõ nhầm ví dụ calibarion -> calibration)
        if (!targetRow) {
          let bestSim = 0;
          allRows.forEach(tr => {
            const cells = Array.from(tr.querySelectorAll('td, .cell'));
            cells.forEach(c => {
              const cText = (c.innerText || '').trim();
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

        if (targetRow) {
          const btn = findActionBtnInRow(targetRow, subSelector);
          if (btn) return btn;
        } else {
          // Log trợ giúp debug trên Console
          const available = allRows.map(r => r.innerText?.trim()).filter(Boolean);
          if (available.length > 0) {
            console.warn(`[AutoFlow] Đang tìm dòng "${rowKeyword}", các dòng hiện có:`, available);
          }
        }
        return null;
      }
    }

    // 0.1 Hỗ trợ tìm nút/icon theo số thứ tự dòng trong bảng: tr::-af-row-index(4) button
    if (selector.includes('::-af-row-index(')) {
      const match = selector.match(/tr::-af-row-index\((\d+)\)\s*(.*)/);
      if (match) {
        const rowIdx = parseInt(match[1]) - 1; // 1-indexed -> 0-indexed
        const subSelector = match[2].trim() || 'button, i, a, [role="button"]';
        const mainTbody = document.querySelector('.el-table__body-wrapper tbody, table tbody');
        const allRows = mainTbody 
          ? Array.from(mainTbody.querySelectorAll('tr')) 
          : Array.from(document.querySelectorAll('tbody tr, .el-table__body tr, .el-table__row'));

        if (allRows[rowIdx]) {
          const btn = findActionBtnInRow(allRows[rowIdx], subSelector);
          if (btn) return btn;
        }
        return null;
      }
    }

    // 1. Hỗ trợ tìm text thông minh (button, a, li, span...)
    if (selector.includes('::-af-text(')) {
      const match = selector.match(/^(button|a|li|span|div)::-af-text\("(.+)"\)$/);
      if (match) {
        const tag = match[1];
        const text = match[2].trim().toLowerCase();
        const list = Array.from(document.querySelectorAll(tag));
        const visibleList = list.filter(el => isElementVisible(el));
        const pool = visibleList.length > 0 ? visibleList : list;
        return pool.find(el => el.innerText?.trim().toLowerCase() === text)
          || pool.find(el => el.innerText?.trim().toLowerCase().includes(text))
          || null;
      }
    }

    // 2. Thử CSS query chuẩn (Ưu tiên phần tử visible)
    try {
      const candidates = Array.from(document.querySelectorAll(selector));
      const visible = candidates.find(el => isElementVisible(el));
      if (visible) return visible;
      if (candidates.length > 0) return candidates[0];
    } catch (e) {}

    // 3. Fallback cho nút icon trong bảng kết quả:
    if (selector.includes('td') && (selector.includes('button') || selector.includes('i'))) {
      const tableBtn = document.querySelector('tbody tr:first-child button, .el-table__body tr:first-child button, .el-table__row:first-child button, table tbody tr td button, tbody tr:first-child td i, .el-table__fixed-right tbody tr:first-child button, .el-table__fixed tbody tr:first-child button');
      if (tableBtn && isElementVisible(tableBtn)) return tableBtn;
    }

    // 4. Fallback cho ô input trong Modal Dialog khi dialog đang mở:
    if (selector.includes('input')) {
      const activeDialogInput = document.querySelector('.el-dialog:not([style*="display: none"]) input, [role="dialog"] input, .modal.show input, .modal:not([style*="display: none"]) input');
      if (activeDialogInput && isElementVisible(activeDialogInput)) return activeDialogInput;
    }

    return null;
  }

  // Kiểm tra phần tử có thực sự hiển thị trên màn hình không
  function isElementVisible(el) {
    if (!el) return false;
    try {
      const btn = el.closest('button, a, [role="button"]');
      const checkEl = btn || el;

      const style = window.getComputedStyle(checkEl);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return false;
      }

      // Kiểm tra có nằm trong modal hay dialog bị ẩn không (chỉ xét modal/dialog wrapper)
      const hiddenDialog = checkEl.closest('.el-dialog__wrapper[style*="display: none"], .modal[style*="display: none"], .el-dialog__wrapper[aria-hidden="true"], .modal[aria-hidden="true"], [role="dialog"][aria-hidden="true"]');
      if (hiddenDialog) return false;

      // Phần tử có kích thước thực tế trong layout
      const rects = checkEl.getClientRects();
      if (rects.length === 0) return false;

      const rect = checkEl.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return false;

      return true;
    } catch (e) {
      return true;
    }
  }

  // Đợi phần tử xuất hiện thông minh (Smart Wait):
  // - Quét liên tục mỗi 150ms.
  // - Vừa xuất hiện là dừng chờ ngay (KHÔNG BẮT CHỜ ĐỦ THỜI GIAN).
  // - Giới hạn tối đa 30s theo yêu cầu.
  // - Hiển thị rõ số bước và đếm giây trực quan.
  function waitForElement(selector, timeout = 30000, stepDesc = '', stepNum = 1, totalSteps = 1) {
    return new Promise((resolve) => {
      const initial = findElement(selector);
      if (initial && (isElementVisible(initial) || initial.offsetParent !== null)) return resolve(initial);

      const startTime = Date.now();
      const infoMain = document.getElementById('af-info-main');

      const interval = setInterval(() => {
        if (!isRunning) {
          clearInterval(interval);
          return resolve(null);
        }

        const found = findElement(selector);
        const elapsedSec = Math.round((Date.now() - startTime) / 1000);

        // Cập nhật trạng thái đếm giây trên Floating Bar để người dùng theo dõi
        if (infoMain && isRunning) {
          infoMain.textContent = `[Bước ${stepNum}/${totalSteps}] Đang đợi: ${stepDesc || selector} (${elapsedSec}s/${Math.round(timeout / 1000)}s)`;
        }

        if (found && (isElementVisible(found) || found.offsetParent !== null)) {
          clearInterval(interval);
          resolve(found);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(interval);
          resolve(null);
        }
      }, 150);
    });
  }

  // Điền văn bản an toàn cho React, Vue, Angular
  function setValueToInput(inputEl, value) {
    inputEl.focus();
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
      || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
    if (nativeSetter) {
      nativeSetter.call(inputEl, value);
    } else {
      inputEl.value = value;
    }
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function executeStep(step, rowData, stepNum = 1, totalSteps = 1, prevStep = null) {
    // Nếu bước trước là Click nút "Truy vấn", chờ 1.2s để máy chủ gửi request và bảng bắt đầu cập nhật
    if (prevStep && prevStep.type === 'click' && (prevStep.description?.includes('Truy vấn') || prevStep.selector?.includes('Truy vấn'))) {
      const infoMain = document.getElementById('af-info-main');
      if (infoMain && isRunning) {
        infoMain.textContent = `[Bước ${stepNum}/${totalSteps}] Đã bấm Truy vấn, chờ máy chủ tải kết quả...`;
      }
      await new Promise(r => setTimeout(r, 1200));
    }

    // 1. Quét tìm nút (vừa xuất hiện lúc nào là bắt lúc đó, tối đa 30s)
    let currentSelector = step.selector || '';
    if (rowData && currentSelector) {
      currentSelector = currentSelector.replace(/\{+([^{}]+)\}+|\[+([^\[\]]+)\]+/g, (match, p1, p2) => {
        const key = (p1 || p2 || '').trim();
        return rowData[key] !== undefined ? String(rowData[key]) : match;
      });
    }
    const el = await waitForElement(currentSelector, 30000, step.description, stepNum, totalSteps);
    if (!el) {
      console.warn(`[AutoFlow] Không tìm thấy phần tử ở Bước ${stepNum}: ${currentSelector}`);
      return false;
    }

    // 2. Cuộn tới phần tử và làm nổi bật viền xanh neon
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('af-playback-highlight');
    
    // 3. Tìm thấy nút thì chờ 1s để trang web ổn định rồi mới bấm/gõ
    const infoMain = document.getElementById('af-info-main');
    if (infoMain && isRunning) {
      infoMain.textContent = `[Bước ${stepNum}/${totalSteps}] Đã thấy, chờ 1s rồi thực hiện...`;
    }
    await new Promise(r => setTimeout(r, 1000));

    // 4. Thực thi thao tác
    if (step.type === 'click') {
      // Nếu click vào thẻ con (span, i, svg) trong button, kích hoạt click cả hai
      const btnParent = el.closest('button, a, [role="button"]');
      const targetEl = btnParent || el;
      
      targetEl.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      targetEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      targetEl.focus();
      targetEl.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      targetEl.click();

      // Nghỉ 400ms sau khi bấm để web kịp gửi request tải dữ liệu
      await new Promise(r => setTimeout(r, 400));
    } else if (step.type === 'type') {
      let finalVal = step.value || '';
      // Thay thế biến Excel: Nhận diện trực tiếp tên cột (100% KHÔNG CẦN DẤU NGOẶC)
      if (rowData) {
        const exactKey = finalVal.trim();
        const cleanKey = exactKey.replace(/^\{+|\}+$/g, '').replace(/^\[+|\]+$/g, '').trim();

        if (rowData[exactKey] !== undefined) {
          finalVal = String(rowData[exactKey]);
        } else if (rowData[cleanKey] !== undefined) {
          finalVal = String(rowData[cleanKey]);
        } else {
          finalVal = finalVal.replace(/\{+([^{}]+)\}+|\[+([^\[\]]+)\]+/g, (match, p1, p2) => {
            const trimmedKey = (p1 || p2 || '').trim();
            return rowData[trimmedKey] !== undefined ? String(rowData[trimmedKey]) : match;
          });
        }
      }
      setValueToInput(el, finalVal);
    } else if (step.type === 'keypress') {
      const key = step.key || 'Enter';
      el.dispatchEvent(new KeyboardEvent('keydown', { key: key, code: key, bubbles: true }));
      el.dispatchEvent(new KeyboardEvent('keypress', { key: key, code: key, bubbles: true }));
      el.dispatchEvent(new KeyboardEvent('keyup', { key: key, code: key, bubbles: true }));
    }

    await new Promise(r => setTimeout(r, 200));
    el.classList.remove('af-playback-highlight');
    return true;
  }

  async function startExecution(scenario, dataset, options = {}) {
    // Nếu scenario không được truyền vào, nạp tự động từ Chrome storage
    if (!scenario || !scenario.steps || scenario.steps.length === 0) {
      const res = await new Promise(r => chrome.storage.local.get(['scenarios', 'activeScenarioId', 'currentDataset'], r));
      if (res.activeScenarioId && res.scenarios && res.scenarios[res.activeScenarioId]) {
        scenario = res.scenarios[res.activeScenarioId];
      }
      if (!dataset || dataset.length === 0) {
        dataset = res.currentDataset || [];
      }
    }

    if (!scenario || !scenario.steps || scenario.steps.length === 0) {
      alert('Kịch bản không có bước nào để chạy! Vui lòng mở popup AutoFlow để ghi hoặc chọn kịch bản.');
      return;
    }

    // Nếu đang chạy, dừng phiên cũ trước khi bắt đầu
    if (isRunning) {
      stopExecution();
      await new Promise(r => setTimeout(r, 300));
    }

    currentScenario = scenario;
    currentDataset = dataset && dataset.length > 0 ? dataset : [{}]; // Chạy ít nhất 1 lần nếu không có file
    currentRunIndex = 0;
    isRunning = true;
    isPaused = false;
    executionLogs = [];

    initFloatingBar();
    updateFloatingBarUI();

    const speedMultiplier = options.speed || 1;

    for (let i = 0; i < currentDataset.length; i++) {
      if (!isRunning) break;
      currentRunIndex = i;

      // Cập nhật thanh tiến độ
      const pct = Math.round(((i + 1) / currentDataset.length) * 100);
      const fill = document.getElementById('af-progress-fill');
      if (fill) fill.style.width = `${pct}%`;
      updateFloatingBarUI();

      // Kiểm tra Pause
      while (isPaused && isRunning) {
        await new Promise(r => setTimeout(r, 300));
      }
      if (!isRunning) break;

      const row = currentDataset[i];
      let rowSuccess = true;

      for (let sIdx = 0; sIdx < scenario.steps.length; sIdx++) {
        if (!isRunning) break;
        while (isPaused && isRunning) {
          await new Promise(r => setTimeout(r, 300));
        }

        const step = scenario.steps[sIdx];
        const prevStep = sIdx > 0 ? scenario.steps[sIdx - 1] : null;
        const stepWithSpeed = { ...step, delay: (step.delay || 400) / speedMultiplier };
        const ok = await executeStep(stepWithSpeed, row, sIdx + 1, scenario.steps.length, prevStep);
        if (!ok) {
          rowSuccess = false;
          const stopMsg = `Dòng ${i + 1} dừng ở Bước ${sIdx + 1}/${scenario.steps.length}: "${step.description || step.selector}"`;
          console.error('[AutoFlow]', stopMsg);
          const infoMain = document.getElementById('af-info-main');
          if (infoMain) infoMain.textContent = `❌ ${stopMsg}`;
          
          alert(`⚠️ AUTOFLOW DỪNG LẠI:\n\n${stopMsg}\n\n👉 Không tìm thấy phần tử này sau 30 giây. Hệ thống đã dừng lại để bạn kiểm tra trang web.`);
          isRunning = false;
          break; // Thoát ngay, không chạy tiếp các bước sau!
        }
      }

      executionLogs.push({
        row: i + 1,
        status: rowSuccess ? 'success' : 'failed',
        data: row,
        time: new Date().toLocaleTimeString('vi-VN')
      });
    }

    isRunning = false;
    isPaused = false;
    updateFloatingBarUI();

    // Gửi thông báo hoàn tất
    chrome.runtime.sendMessage({
      action: 'EXECUTION_COMPLETED',
      logs: executionLogs
    });

    if (executionLogs.length > 0 && executionLogs.every(l => l.status === 'success')) {
      alert(`🎉 Hoàn tất tự động hóa ${currentDataset.length} dòng thành công 100%!`);
    }
  }

  function togglePause() {
    isPaused = !isPaused;
    updateFloatingBarUI();
  }

  function stopExecution() {
    isRunning = false;
    isPaused = false;
    updateFloatingBarUI();
  }

  // Lắng nghe lệnh từ Popup Extension
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'PING') {
      sendResponse({ status: 'PONG', isRecording, isRunning });
      return true;
    } else if (msg.action === 'START_RECORDING') {
      currentRecordingScenarioId = msg.scenarioId || null;
      currentRecordingScenarioName = msg.scenarioName || null;
      startRecording();
      sendResponse({ status: 'RECORDING_STARTED' });
      return true;
    } else if (msg.action === 'STOP_RECORDING') {
      stopRecording(msg.save);
      sendResponse({ status: 'RECORDING_STOPPED' });
    } else if (msg.action === 'START_EXECUTION') {
      startExecution(msg.scenario, msg.dataset, msg.options);
      sendResponse({ status: 'EXECUTION_STARTED' });
    } else if (msg.action === 'STOP_EXECUTION') {
      stopExecution();
      sendResponse({ status: 'EXECUTION_STOPPED' });
    } else if (msg.action === 'GET_STATUS') {
      sendResponse({
        isRecording,
        isRunning,
        isPaused,
        recordedCount: recordedSteps.length,
        currentRunIndex,
        totalRows: currentDataset.length
      });
    }
    return true;
  }
);

  console.log('[AutoFlow] Content script sẵn sàng.');
})();
