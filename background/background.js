// AutoFlow - Background Service Worker (Manifest V3) - Multi-Tab Master Coordinator

const TAB_STATE_PREFIXES = ['afRec_', 'afRun_', 'afRunPos_'];
let activeJobs = {}; // tabId -> job details

// Khôi phục activeJobs từ storage khi service worker khởi động
chrome.storage.local.get(['afActiveJobs'], (res) => {
  if (res && res.afActiveJobs && typeof res.afActiveJobs === 'object') {
    activeJobs = { ...res.afActiveJobs, ...activeJobs };
    // Kiểm tra xem các tab này còn tồn tại không
    chrome.tabs.query({}, (tabs) => {
      const liveTabIds = new Set(tabs.map((t) => t.id));
      let changed = false;
      Object.keys(activeJobs).forEach((id) => {
        const numId = parseInt(id, 10);
        if (!liveTabIds.has(numId)) {
          if (activeJobs[id].status === 'running' || activeJobs[id].status === 'paused') {
            activeJobs[id].status = 'stopped';
            changed = true;
          }
        }
      });
      if (changed) syncActiveJobs();
    });
  }
});

function syncActiveJobs() {
  chrome.storage.local.set({ afActiveJobs: activeJobs });
}

// Xóa các trạng thái ghi/chạy dở dang (theo tab)
function clearTabStates(onlyTabId = null) {
  chrome.storage.local.get(null, (all) => {
    if (chrome.runtime.lastError || !all) return;
    const keys = Object.keys(all).filter((k) =>
      TAB_STATE_PREFIXES.some((p) => k.startsWith(p)) &&
      (onlyTabId === null || k.endsWith(`_${onlyTabId}`))
    );
    if (keys.length > 0) chrome.storage.local.remove(keys);
  });
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('[AutoFlow] Master Service Worker v1.2 đã được cài đặt.');
  clearTabStates();

  // Khởi tạo kịch bản mẫu nếu chưa có
  chrome.storage.local.get(['scenarios'], (result) => {
    if (!result.scenarios || Object.keys(result.scenarios).length === 0) {
      const defaultId = 'scenario_demo_1';
      const sampleScenarios = {
        [defaultId]: {
          id: defaultId,
          name: 'Kịch bản mẫu: Điền form & Tìm kiếm',
          createdAt: new Date().toISOString(),
          steps: [
            {
              id: 'step_1',
              type: 'click',
              selector: 'input[type="text"], input[type="search"], textarea',
              description: 'Click vào ô nhập liệu',
              delay: 400
            },
            {
              id: 'step_2',
              type: 'type',
              selector: 'input[type="text"], input[type="search"], textarea',
              value: 'Cot_A',
              description: 'Điền dữ liệu từ Cột A của Excel',
              delay: 500
            },
            {
              id: 'step_3',
              type: 'keypress',
              key: 'Enter',
              selector: 'input[type="text"], input[type="search"], textarea',
              description: 'Nhấn phím Enter để tìm kiếm / xác nhận',
              delay: 800
            }
          ]
        }
      };
      chrome.storage.local.set({ scenarios: sampleScenarios, activeScenarioId: defaultId });
    }
  });
});

chrome.runtime.onStartup.addListener(() => {
  clearTabStates();
  activeJobs = {};
  syncActiveJobs();
});

chrome.tabs.onRemoved.addListener((tabId) => {
  clearTabStates(tabId);
  if (activeJobs[tabId]) {
    activeJobs[tabId].status = 'stopped';
    activeJobs[tabId].updatedAt = Date.now();
    syncActiveJobs();
  }
});

// Helper: chờ một tab tải xong và content script sẵn sàng phản hồi PING
async function waitForTabReady(tabId, maxWaitMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab.status === 'complete') {
        const res = await new Promise((resolve) => {
          chrome.tabs.sendMessage(tabId, { action: 'PING' }, (r) => {
            if (chrome.runtime.lastError || !r) resolve(null);
            else resolve(r);
          });
        });
        if (res && res.status === 'PONG') return true;
      }
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

// Xử lý các tin nhắn từ Content Script, Popup và Dashboard
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message) return false;

  const senderTabId = sender.tab ? sender.tab.id : null;
  const senderWinId = sender.tab ? sender.tab.windowId : null;

  switch (message.action) {
    case 'PING':
      sendResponse({ status: 'PONG' });
      return false;

    case 'GET_TAB_ID':
      sendResponse({ tabId: senderTabId, windowId: senderWinId });
      return false;

    // ----------------------------------------------------
    // CONTENT SCRIPT BÁO CÁO TIẾN ĐỘ THỰC THI
    // ----------------------------------------------------
    case 'EXECUTION_STARTED': {
      if (senderTabId) {
        activeJobs[senderTabId] = {
          tabId: senderTabId,
          windowId: senderWinId,
          url: sender.tab?.url || '',
          title: sender.tab?.title || 'Trang web',
          scenarioId: message.scenarioId || null,
          scenarioName: message.scenarioName || 'Kịch bản tự động',
          totalRows: message.totalRows || 1,
          rowOffset: message.rowOffset || 0,
          currentRunIndex: 0,
          row: (message.rowOffset || 0) + 1,
          step: 1,
          totalSteps: message.options?.totalSteps || 1,
          cycle: 1,
          repeatCount: message.repeatCount || 1,
          pct: 0,
          status: 'running',
          hasError: false,
          lastError: '',
          multiTabJobId: message.multiTabJobId || null,
          startedAt: Date.now(),
          updatedAt: Date.now(),
          elapsedSec: 0,
          remainingSec: null,
          etaText: 'Đang tính...',
          elapsedText: '00:00',
          logs: [],
          summary: null
        };
        syncActiveJobs();
      }
      sendResponse({ ok: true });
      return false;
    }

    case 'EXECUTION_PROGRESS': {
      if (senderTabId) {
        const job = activeJobs[senderTabId] || {
          tabId: senderTabId,
          windowId: senderWinId,
          url: sender.tab?.url || '',
          title: sender.tab?.title || 'Trang web',
          scenarioId: message.scenarioId || null,
          scenarioName: message.scenarioName || 'Kịch bản tự động',
          startedAt: Date.now(),
          logs: []
        };

        const total = message.runTotal || message.totalRows || 1;
        const totalSteps = message.totalSteps || 1;
        const repCount = message.repeatCount || 1;
        const cycle = message.cycle || 1;
        const cyclePct = ((message.runIndex || 0) + ((message.step || 1) - 1) / totalSteps) / total;
        const overallPct = Math.min(100, Math.round((((cycle - 1) + cyclePct) / repCount) * 100));

        job.row = message.row;
        job.totalRows = message.totalRows;
        job.rowOffset = message.rowOffset || 0;
        job.currentRunIndex = message.runIndex || 0;
        job.step = message.step;
        job.totalSteps = message.totalSteps;
        job.cycle = cycle;
        job.repeatCount = repCount;
        job.pct = overallPct;
        job.hasError = !!message.hasError;
        job.lastError = message.lastError || '';
        job.status = message.hasError ? 'error' : (message.isPaused ? 'paused' : 'running');
        job.multiTabJobId = message.multiTabJobId || job.multiTabJobId || null;
        job.elapsedSec = message.elapsedSec ?? Math.floor((Date.now() - (job.startedAt || Date.now())) / 1000);
        job.remainingSec = message.remainingSec ?? null;
        job.etaText = message.etaText || job.etaText || 'Đang tính...';
        job.elapsedText = message.elapsedText || '00:00';
        job.updatedAt = Date.now();
        if (sender.tab?.url) job.url = sender.tab.url;
        if (sender.tab?.title) job.title = sender.tab.title;

        activeJobs[senderTabId] = job;
        syncActiveJobs();
      }
      sendResponse({ ok: true });
      return false;
    }

    case 'EXECUTION_COMPLETED': {
      if (senderTabId && activeJobs[senderTabId]) {
        const job = activeJobs[senderTabId];
        job.status = message.reason === 'completed' ? 'completed' : 'stopped';
        job.pct = 100;
        job.remainingSec = 0;
        job.etaText = message.reason === 'completed' ? 'Hoàn tất' : 'Đã dừng';
        job.logs = message.logs || [];
        job.summary = message.summary || null;
        job.updatedAt = Date.now();
        syncActiveJobs();
      }
      sendResponse({ ok: true });
      return false;
    }

    // ----------------------------------------------------
    // DASHBOARD & POPUP ĐIỀU KHIỂN TẬP TRUNG
    // ----------------------------------------------------
    case 'GET_ALL_JOBS': {
      sendResponse({ jobs: activeJobs });
      return false;
    }

    case 'CONTROL_JOB': {
      const targetId = parseInt(message.tabId, 10);
      const cmd = message.cmd; // 'pause', 'resume', 'stop', 'focus'
      if (!targetId) {
        sendResponse({ error: 'Thiếu tabId' });
        return false;
      }

      if (cmd === 'focus') {
        chrome.tabs.update(targetId, { active: true }, (tab) => {
          if (chrome.runtime.lastError) return sendResponse({ error: chrome.runtime.lastError.message });
          if (tab && tab.windowId) {
            chrome.windows.update(tab.windowId, { focused: true }, () => sendResponse({ ok: true }));
          } else {
            sendResponse({ ok: true });
          }
        });
        return true;
      }

      let subAction = 'STOP_EXECUTION';
      if (cmd === 'pause') subAction = 'PAUSE_EXECUTION';
      if (cmd === 'resume') subAction = 'RESUME_EXECUTION';

      chrome.tabs.sendMessage(targetId, { action: subAction }, (res) => {
        void chrome.runtime.lastError;
        if (activeJobs[targetId]) {
          if (cmd === 'pause') activeJobs[targetId].status = 'paused';
          if (cmd === 'resume') activeJobs[targetId].status = 'running';
          if (cmd === 'stop') activeJobs[targetId].status = 'stopped';
          syncActiveJobs();
        }
        sendResponse({ ok: true, res });
      });
      return true;
    }

    case 'CONTROL_ALL_JOBS': {
      const cmd = message.cmd; // 'pause', 'resume', 'stop'
      const ids = Object.keys(activeJobs).map((k) => parseInt(k, 10));
      let subAction = 'STOP_EXECUTION';
      if (cmd === 'pause') subAction = 'PAUSE_EXECUTION';
      if (cmd === 'resume') subAction = 'RESUME_EXECUTION';

      ids.forEach((id) => {
        chrome.tabs.sendMessage(id, { action: subAction }, () => void chrome.runtime.lastError);
        if (activeJobs[id]) {
          if (cmd === 'pause' && activeJobs[id].status === 'running') activeJobs[id].status = 'paused';
          if (cmd === 'resume' && activeJobs[id].status === 'paused') activeJobs[id].status = 'running';
          if (cmd === 'stop' && ['running', 'paused', 'error'].includes(activeJobs[id].status)) activeJobs[id].status = 'stopped';
        }
      });
      syncActiveJobs();
      sendResponse({ ok: true, count: ids.length });
      return false;
    }

    case 'CLEAR_COMPLETED_JOBS': {
      Object.keys(activeJobs).forEach((id) => {
        if (activeJobs[id].status === 'completed' || activeJobs[id].status === 'stopped') {
          delete activeJobs[id];
        }
      });
      syncActiveJobs();
      sendResponse({ ok: true, jobs: activeJobs });
      return false;
    }

    // ----------------------------------------------------
    // KHỞI CHẠY ĐA LUỒNG SONG SONG (MULTI-TAB RUNNER)
    // ----------------------------------------------------
    case 'LAUNCH_MULTI_TAB_JOB': {
      (async () => {
        const scenario = message.scenario;
        const dataset = Array.isArray(message.dataset) ? message.dataset : [];
        const requestedWorkers = Math.max(1, parseInt(message.workerCount, 10) || 2);
        const targetUrl = message.targetUrl || 'about:blank';
        const openInNewWindows = !!message.openInNewWindows;
        const options = message.options || {};
        const multiTabJobId = `mjob_${Date.now()}`;

        if (!scenario || !Array.isArray(scenario.steps) || scenario.steps.length === 0) {
          sendResponse({ ok: false, error: 'Kịch bản không hợp lệ hoặc chưa có bước nào!' });
          return;
        }

        // Chia tập dữ liệu thành các dải (slices/chunks)
        const totalRows = dataset.length;
        const actualWorkers = totalRows > 0 ? Math.min(requestedWorkers, totalRows) : requestedWorkers;
        const chunkSize = totalRows > 0 ? Math.ceil(totalRows / actualWorkers) : 1;

        const launchedWorkers = [];

        for (let w = 0; w < actualWorkers; w++) {
          const startIdx = totalRows > 0 ? w * chunkSize : 0;
          const endIdx = totalRows > 0 ? Math.min(startIdx + chunkSize, totalRows) : 0;
          if (totalRows > 0 && startIdx >= totalRows) break;

          const workerData = totalRows > 0 ? dataset.slice(startIdx, endIdx) : [{}];
          const workerRowOffset = startIdx;

          let workerTab = null;
          if (openInNewWindows) {
            const win = await new Promise((r) => {
              chrome.windows.create({ url: targetUrl, focused: false, width: 1024, height: 768 }, r);
            });
            workerTab = win?.tabs?.[0] || null;
          } else {
            workerTab = await new Promise((r) => {
              chrome.tabs.create({ url: targetUrl, active: false }, r);
            });
          }

          if (workerTab && workerTab.id) {
            launchedWorkers.push({
              tabId: workerTab.id,
              windowId: workerTab.windowId,
              startIdx,
              endIdx,
              rowCount: workerData.length
            });

            // Tiến hành kích hoạt chạy tự động ngầm khi tab đã tải xong
            (async (tabId, wData, offset) => {
              const ready = await waitForTabReady(tabId);
              if (ready) {
                chrome.tabs.sendMessage(tabId, {
                  action: 'START_EXECUTION',
                  scenario,
                  dataset: wData,
                  options: {
                    ...options,
                    rowOffset: offset,
                    multiTabJobId
                  }
                }, () => void chrome.runtime.lastError);
              } else {
                console.warn(`[AutoFlow] Tab ${tabId} không phản hồi sẵn sàng sau khi mở.`);
              }
            })(workerTab.id, workerData, workerRowOffset);
          }
        }

        sendResponse({
          ok: true,
          multiTabJobId,
          totalRows,
          actualWorkers: launchedWorkers.length,
          workers: launchedWorkers
        });
      })();

      return true; // Phản hồi bất đồng bộ
    }

    // ----------------------------------------------------
    // TỔNG HỢP BÁO CÁO EXCEL TỪ TẤT CẢ CÁC TAB
    // ----------------------------------------------------
    case 'GET_AGGREGATED_REPORT': {
      const targetJobId = message.multiTabJobId || null;
      let combinedLogs = [];
      let totalSuccess = 0;
      let totalFailed = 0;

      Object.values(activeJobs).forEach((job) => {
        if (!targetJobId || job.multiTabJobId === targetJobId) {
          const logs = (job.summary && Array.isArray(job.summary.logs)) ? job.summary.logs : (job.logs || []);
          logs.forEach((item) => {
            combinedLogs.push({
              ...item,
              tabId: job.tabId,
              scenarioName: job.scenarioName
            });
            if (item.status === 'success') totalSuccess++;
            else totalFailed++;
          });
        }
      });

      // Sắp xếp lại theo số thứ tự dòng Excel ban đầu
      combinedLogs.sort((a, b) => (a.row || 0) - (b.row || 0));

      sendResponse({
        ok: true,
        totalSuccess,
        totalFailed,
        totalEntries: combinedLogs.length,
        logs: combinedLogs
      });
      return false;
    }

    default:
      return false;
  }
});