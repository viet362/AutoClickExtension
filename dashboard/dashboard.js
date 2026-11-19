// AutoFlow Control Center Dashboard Controller Script v1.2

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const metricRunning = document.getElementById('metricRunning');
  const metricPaused = document.getElementById('metricPaused');
  const metricError = document.getElementById('metricError');
  const metricCompleted = document.getElementById('metricCompleted');

  const btnPauseAll = document.getElementById('btnPauseAll');
  const btnResumeAll = document.getElementById('btnResumeAll');
  const btnStopAll = document.getElementById('btnStopAll');
  const btnExportMergedReport = document.getElementById('btnExportMergedReport');

  const launchScenarioSelect = document.getElementById('launchScenarioSelect');
  const excelSourceBadge = document.getElementById('excelSourceBadge');
  const dashExcelInfo = document.getElementById('dashExcelInfo');
  const btnBrowseExcelFile = document.getElementById('btnBrowseExcelFile');
  const dashExcelFileInput = document.getElementById('dashExcelFileInput');

  const targetUrlInput = document.getElementById('targetUrlInput');
  const btnGetActiveTabUrl = document.getElementById('btnGetActiveTabUrl');

  const workerChips = document.querySelectorAll('.worker-chip');
  const workerCountInput = document.getElementById('workerCountInput');
  const distributionDesc = document.getElementById('distributionDesc');

  const dashExtraDelay = document.getElementById('dashExtraDelay');
  const dashRepeatCount = document.getElementById('dashRepeatCount');
  const dashErrorMode = document.getElementById('dashErrorMode');
  const btnLaunchParallel = document.getElementById('btnLaunchParallel');

  const btnRefreshJobs = document.getElementById('btnRefreshJobs');
  const btnClearFinishedJobs = document.getElementById('btnClearFinishedJobs');
  const workersGridContainer = document.getElementById('workersGridContainer');

  // State
  let scenarios = {};
  let activeScenarioId = null;
  let currentDataset = [];
  let currentFileName = '';
  let activeJobs = {};
  let currentWorkerCount = 3;

  // ============================================================
  // KHỞI ĐỘNG & NẠP DỮ LIỆU TỪ STORAGE
  // ============================================================
  function loadState() {
    chrome.storage.local.get(
      ['scenarios', 'activeScenarioId', 'currentDataset', 'currentFileName', 'afActiveJobs'],
      (res) => {
        scenarios = res.scenarios || {};
        activeScenarioId = res.activeScenarioId || Object.keys(scenarios)[0] || null;
        currentDataset = Array.isArray(res.currentDataset) ? res.currentDataset : [];
        currentFileName = res.currentFileName || '';
        activeJobs = res.afActiveJobs || {};

        renderScenarioSelect();
        updateDatasetInfo();
        updateDistributionPreview();
        renderWorkers();

        // Lấy URL mặc định từ bước đầu tiên của kịch bản hoặc từ tab đang mở
        detectDefaultTargetUrl();
      }
    );
  }

  function detectDefaultTargetUrl() {
    chrome.tabs.query({ active: true, currentWindow: false }, (tabs) => {
      const otherTab = tabs && tabs[0] ? tabs[0] : null;
      if (otherTab && otherTab.url && !otherTab.url.startsWith('chrome') && !otherTab.url.startsWith('about:')) {
        targetUrlInput.value = otherTab.url;
      }
    });
  }

  btnGetActiveTabUrl.addEventListener('click', () => {
    chrome.tabs.query({}, (tabs) => {
      const candidates = tabs.filter((t) => t.url && !t.url.startsWith('chrome') && !t.url.startsWith('about:'));
      if (candidates.length > 0) {
        targetUrlInput.value = candidates[0].url;
      } else {
        alert('Không tìm thấy tab trang web thông thường nào đang mở!');
      }
    });
  });

  // ============================================================
  // RENDER DROPDOWN KỊCH BẢN & XỬ LÝ EXCEL
  // ============================================================
  function renderScenarioSelect() {
    launchScenarioSelect.innerHTML = '';
    const keys = Object.keys(scenarios);
    if (keys.length === 0) {
      const opt = document.createElement('option');
      opt.textContent = '(Chưa có kịch bản nào)';
      launchScenarioSelect.appendChild(opt);
      return;
    }

    keys.forEach((id) => {
      const sc = scenarios[id];
      const opt = document.createElement('option');
      opt.value = id;
      const stepCount = (sc.steps || []).length;
      const fileNote = sc.attachedFileName ? ` [File: ${sc.attachedFileName}]` : '';
      opt.textContent = `${sc.name} (${stepCount} bước)${fileNote}`;
      if (id === activeScenarioId) opt.selected = true;
      launchScenarioSelect.appendChild(opt);
    });

    launchScenarioSelect.addEventListener('change', (e) => {
      activeScenarioId = e.target.value;
      updateDatasetInfo();
      updateDistributionPreview();
    });
  }

  function getEffectiveDataset() {
    const sc = scenarios[activeScenarioId];
    if (sc && Array.isArray(sc.attachedDataset) && sc.attachedDataset.length > 0) {
      return {
        data: sc.attachedDataset,
        fileName: sc.attachedFileName || 'File riêng của kịch bản',
        isAttached: true
      };
    }
    return {
      data: currentDataset,
      fileName: currentFileName || 'Chưa nạp Excel',
      isAttached: false
    };
  }

  function updateDatasetInfo() {
    const info = getEffectiveDataset();
    if (info.data.length > 0) {
      dashExcelInfo.textContent = `${info.fileName} (${info.data.length} dòng)`;
      dashExcelInfo.style.color = '#38bdf8';
      excelSourceBadge.textContent = info.isAttached ? 'File riêng kịch bản' : 'File dùng chung';
      excelSourceBadge.className = info.isAttached ? 'source-badge' : 'source-badge source-global';
    } else {
      dashExcelInfo.textContent = 'Chưa nạp file Excel (Chạy kịch bản 1 lần)';
      dashExcelInfo.style.color = '#94a3b8';
      excelSourceBadge.textContent = 'Không có dữ liệu';
    }
  }

  // Nạp file Excel mới trực tiếp trên Dashboard (Hỗ trợ cả chọn file và kéo thả)
  function handleExcelFile(file) {
    if (!file || !/\.(xlsx|xls|csv)$/i.test(file.name)) {
      alert('Vui lòng chọn hoặc kéo thả file có định dạng .xlsx, .xls hoặc .csv!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          alert('File Excel không có dòng dữ liệu nào!');
          return;
        }

        // Chuẩn hóa tên cột
        const normalized = rawJson.map((row) => {
          const cleanRow = {};
          Object.keys(row).forEach((k) => {
            const cleanKey = k.trim().replace(/\s+/g, '_');
            cleanRow[cleanKey] = row[k];
          });
          return cleanRow;
        });

        currentDataset = normalized;
        currentFileName = file.name;

        // Lưu vào storage toàn cục
        chrome.storage.local.set({
          currentDataset: normalized,
          currentFileName: file.name
        });

        updateDatasetInfo();
        updateDistributionPreview();
        alert(`✅ Nạp thành công file "${file.name}" gồm ${normalized.length} dòng!`);
      } catch (err) {
        alert('Lỗi đọc file Excel: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  btnBrowseExcelFile.addEventListener('click', () => dashExcelFileInput.click());
  dashExcelFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleExcelFile(e.target.files[0]);
    }
  });

  const excelAttachBox = document.querySelector('.excel-attach-box');
  if (excelAttachBox) {
    excelAttachBox.addEventListener('dragover', (e) => {
      e.preventDefault();
      excelAttachBox.style.borderColor = '#38bdf8';
      excelAttachBox.style.background = 'rgba(56, 189, 248, 0.1)';
    });
    excelAttachBox.addEventListener('dragleave', () => {
      excelAttachBox.style.borderColor = '';
      excelAttachBox.style.background = '';
    });
    excelAttachBox.addEventListener('drop', (e) => {
      e.preventDefault();
      excelAttachBox.style.borderColor = '';
      excelAttachBox.style.background = '';
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleExcelFile(e.dataTransfer.files[0]);
      }
    });
  }

  // ============================================================
  // TÍNH TOÁN & HIỂN THỊ PHÂN BỔ DỮ LIỆU
  // ============================================================
  workerChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      workerChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      currentWorkerCount = parseInt(chip.dataset.workers, 10);
      workerCountInput.value = currentWorkerCount;
      updateDistributionPreview();
    });
  });

  workerCountInput.addEventListener('input', () => {
    const val = Math.max(1, parseInt(workerCountInput.value, 10) || 1);
    currentWorkerCount = val;
    workerChips.forEach((c) => {
      if (parseInt(c.dataset.workers, 10) === val) c.classList.add('active');
      else c.classList.remove('active');
    });
    updateDistributionPreview();
  });

  function updateDistributionPreview() {
    const info = getEffectiveDataset();
    const total = info.data.length;
    const workers = currentWorkerCount;

    if (total === 0) {
      distributionDesc.textContent = `Chạy 1 lượt trên mỗi tab (mở ${workers} tab/cửa sổ để thao tác độc lập).`;
      return;
    }

    const actualWorkers = Math.min(workers, total);
    const chunkSize = Math.ceil(total / actualWorkers);

    const slices = [];
    for (let w = 0; w < actualWorkers; w++) {
      const start = w * chunkSize + 1;
      const end = Math.min((w + 1) * chunkSize, total);
      slices.push(`• Tab ${w + 1}: Dòng ${start} - ${end} (${end - start + 1} dòng)`);
    }

    distributionDesc.innerHTML = `
      <div>Tổng <strong>${total} dòng</strong> chia cho <strong>${actualWorkers} tab/cửa sổ</strong> (mỗi tab gánh ~${chunkSize} dòng):</div>
      <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px; line-height: 1.5;">${slices.join('<br>')}</div>
    `;
  }

  // ============================================================
  // KHỞI CHẠY ĐA LUỒNG SONG SONG (LAUNCH MULTI-TAB)
  // ============================================================
  btnLaunchParallel.addEventListener('click', () => {
    const sc = scenarios[activeScenarioId];
    if (!sc || !Array.isArray(sc.steps) || sc.steps.length === 0) {
      alert('Vui lòng chọn kịch bản có ít nhất 1 bước trước khi chạy!');
      return;
    }

    const targetUrl = targetUrlInput.value.trim();
    if (!targetUrl || targetUrl === 'https://') {
      alert('Vui lòng nhập địa chỉ URL trang web mục tiêu cần thao tác!');
      targetUrlInput.focus();
      return;
    }

    const info = getEffectiveDataset();
    const openInNewWindows = document.querySelector('input[name="dashRunEnv"]:checked')?.value === 'windows';
    const extraDelaySec = Math.max(0, parseFloat(dashExtraDelay.value) || 0);
    const repeatCount = Math.max(1, parseInt(dashRepeatCount.value, 10) || 1);
    const errorMode = dashErrorMode.value;

    btnLaunchParallel.disabled = true;
    btnLaunchParallel.textContent = '⏳ Đang khởi tạo các tab / cửa sổ...';

    chrome.runtime.sendMessage(
      {
        action: 'LAUNCH_MULTI_TAB_JOB',
        scenario: sc,
        dataset: info.data,
        workerCount: currentWorkerCount,
        targetUrl,
        openInNewWindows,
        options: {
          speed: 1,
          errorMode,
          extraDelaySec,
          repeatCount
        }
      },
      (res) => {
        btnLaunchParallel.disabled = false;
        btnLaunchParallel.textContent = '🚀 BẮT ĐẦU CHẠY ĐA LUỒNG SONG SONG';

        if (chrome.runtime.lastError || !res || !res.ok) {
          alert('Lỗi khởi chạy đa luồng: ' + (res?.error || chrome.runtime.lastError?.message || 'Không rõ nguyên nhân'));
          return;
        }

        alert(`🎉 Đã mở thành công ${res.actualWorkers} ${openInNewWindows ? 'cửa sổ' : 'tab'} và tự động kích hoạt chạy kịch bản song song!`);

        // Cuộn xuống khu vực giám sát
        document.querySelector('.monitor-card').scrollIntoView({ behavior: 'smooth' });
        refreshJobs();
      }
    );
  });

  // ============================================================
  // GIÁM SÁT TIẾN ĐỘ CÁC TAB & RENDER CARDS
  // ============================================================
  function refreshJobs() {
    chrome.runtime.sendMessage({ action: 'GET_ALL_JOBS' }, (res) => {
      if (res && res.jobs) {
        activeJobs = res.jobs;
        renderWorkers();
      }
    });
  }

  function renderWorkers() {
    const jobsList = Object.values(activeJobs);

    // Tính toán metrics
    let running = 0;
    let paused = 0;
    let errCount = 0;
    let completed = 0;

    jobsList.forEach((j) => {
      if (j.status === 'running') running++;
      else if (j.status === 'paused') paused++;
      else if (j.status === 'error') errCount++;
      else if (j.status === 'completed') completed++;
    });

    metricRunning.textContent = running;
    metricPaused.textContent = paused;
    metricError.textContent = errCount;
    metricCompleted.textContent = completed;

    if (jobsList.length === 0) {
      workersGridContainer.innerHTML = `
        <div class="empty-workers">
          <div class="empty-icon">⚡</div>
          <div class="empty-text">Chưa có luồng nào đang chạy.</div>
          <div class="empty-sub">Hãy chọn kịch bản ở trên rồi bấm "Bắt đầu chạy đa luồng" hoặc kích hoạt chạy trên các tab thông thường.</div>
        </div>
      `;
      return;
    }

    workersGridContainer.innerHTML = '';
    jobsList.forEach((job) => {
      const card = document.createElement('div');
      card.className = 'worker-card';

      const statusMap = {
        running: { text: '🟢 Đang chạy', class: 'status-running' },
        paused: { text: '⏸️ Tạm dừng', class: 'status-paused' },
        error: { text: '🔴 Gặp lỗi', class: 'status-error' },
        completed: { text: '✅ Hoàn tất', class: 'status-completed' },
        stopped: { text: '⏹️ Đã dừng', class: 'status-stopped' }
      };
      const st = statusMap[job.status] || statusMap.stopped;

      const cycleText = (job.repeatCount && job.repeatCount > 1) ? `[Vòng ${job.cycle || 1}/${job.repeatCount}] ` : '';
      const rangeText = job.totalRows ? `Dòng ${(job.rowOffset || 0) + 1} ➔ ${(job.rowOffset || 0) + job.totalRows}` : '1 lượt';

      card.innerHTML = `
        <div class="worker-top">
          <div class="worker-identity">
            <div class="worker-title" title="${escapeHtml(job.title || job.url)}">${escapeHtml(job.title || 'Tab ' + job.tabId)}</div>
            <div class="worker-meta">Tab ID: ${job.tabId} • Cửa sổ: ${job.windowId || 1} • Phụ trách: <strong>${rangeText}</strong></div>
          </div>
          <span class="worker-status-badge ${st.class}">${st.text}</span>
        </div>

        <div style="font-size: 13px; font-weight: 600; color: #f1f5f9;">
          ${cycleText}${escapeHtml(job.scenarioName || 'Kịch bản')}
        </div>

        <div class="worker-stats">
          <span>Tiến độ: <strong class="worker-stats-strong">${job.pct || 0}%</strong></span>
          <span>Dòng: <strong class="worker-stats-strong">${job.row || 1}</strong> / ${job.totalRows || 1}</span>
          <span>Bước: <strong>${job.step || 1}</strong>/${job.totalSteps || 1}</span>
          <span>Còn lại: <strong class="worker-stats-strong" style="color: #38bdf8;">${job.status === 'completed' ? 'Hoàn tất' : (job.etaText ? '⏱️ ~' + job.etaText : 'Đang tính...')}</strong></span>
        </div>

        <div class="worker-progress-bar">
          <div class="worker-progress-fill" style="width: ${job.pct || 0}%;"></div>
        </div>

        ${job.lastError ? `<div class="worker-error-box">⚠️ ${escapeHtml(job.lastError)}</div>` : ''}

        <div class="worker-controls">
          <button class="btn btn-secondary btn-xs btn-focus" data-tabid="${job.tabId}" title="Đưa tab/cửa sổ này lên trước màn hình">👁️ Xem tab</button>
          ${['running', 'error'].includes(job.status) ? `<button class="btn btn-secondary btn-xs btn-pause" data-tabid="${job.tabId}">⏸️ Tạm dừng</button>` : ''}
          ${job.status === 'paused' ? `<button class="btn btn-secondary btn-xs btn-resume" data-tabid="${job.tabId}">▶️ Tiếp tục</button>` : ''}
          ${['running', 'paused', 'error'].includes(job.status) ? `<button class="btn btn-danger btn-xs btn-stop" data-tabid="${job.tabId}">⏹️ Dừng</button>` : ''}
        </div>
      `;

      // Gắn sự kiện cho các nút trên từng card
      card.querySelector('.btn-focus')?.addEventListener('click', () => controlJob(job.tabId, 'focus'));
      card.querySelector('.btn-pause')?.addEventListener('click', () => controlJob(job.tabId, 'pause'));
      card.querySelector('.btn-resume')?.addEventListener('click', () => controlJob(job.tabId, 'resume'));
      card.querySelector('.btn-stop')?.addEventListener('click', () => controlJob(job.tabId, 'stop'));

      workersGridContainer.appendChild(card);
    });
  }

  function controlJob(tabId, cmd) {
    chrome.runtime.sendMessage({ action: 'CONTROL_JOB', tabId, cmd }, () => refreshJobs());
  }

  // ============================================================
  // GLOBAL ACTIONS: PAUSE / RESUME / STOP ALL / CLEAR
  // ============================================================
  btnPauseAll.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'CONTROL_ALL_JOBS', cmd: 'pause' }, () => refreshJobs());
  });

  btnResumeAll.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'CONTROL_ALL_JOBS', cmd: 'resume' }, () => refreshJobs());
  });

  btnStopAll.addEventListener('click', () => {
    if (confirm('Bạn có chắc muốn DỪNG TẤT CẢ các tab đang chạy?')) {
      chrome.runtime.sendMessage({ action: 'CONTROL_ALL_JOBS', cmd: 'stop' }, () => refreshJobs());
    }
  });

  btnRefreshJobs.addEventListener('click', () => refreshJobs());

  btnClearFinishedJobs.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'CLEAR_COMPLETED_JOBS' }, () => refreshJobs());
  });

  // ============================================================
  // XUẤT BÁO CÁO EXCEL TỔNG HỢP TỪ TẤT CẢ CÁC TAB
  // ============================================================
  btnExportMergedReport.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'GET_AGGREGATED_REPORT' }, (res) => {
      if (chrome.runtime.lastError || !res || !res.logs || res.logs.length === 0) {
        alert('Chưa có dữ liệu báo cáo từ luồng nào!');
        return;
      }

      const reportRows = res.logs.map((entry) => {
        const cleanData = {};
        const raw = entry.data || {};
        Object.keys(raw).forEach((k) => {
          if (!(/^[A-Z]{1,3}$/.test(k) && raw[`Cot_${k}`] !== undefined)) {
            cleanData[k] = raw[k];
          }
        });

        const rowObj = {
          Tab_Worker: entry.tabId || 0,
          Kich_Ban: entry.scenarioName || ''
        };
        if (entry.cycle && entry.cycle > 1) {
          rowObj['Vong_Lap'] = entry.cycle;
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
      XLSX.utils.book_append_sheet(wb, ws, 'Tong_Hop_Cac_Tab');
      XLSX.writeFile(wb, `autoflow_merged_report_${Date.now()}.xlsx`);
    });
  });

  function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }

  // Tự động làm mới danh sách mỗi 1.5 giây
  setInterval(refreshJobs, 1500);

  // Lắng nghe thay đổi storage
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.afActiveJobs) {
      activeJobs = changes.afActiveJobs.newValue || {};
      renderWorkers();
    }
  });

  loadState();
});

