// AutoFlow - Background Service Worker (Manifest V3)

const TAB_STATE_PREFIXES = ['afRec_', 'afRun_', 'afRunPos_'];

// Xóa các trạng thái ghi/chạy dở dang (theo tab) - tránh tự chạy lại ngoài ý muốn
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
  console.log('[AutoFlow] Extension đã được cài đặt / cập nhật thành công.');
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

// Trình duyệt khởi động lại -> Tab ID cũ không còn giá trị
chrome.runtime.onStartup.addListener(() => clearTabStates());

// Đóng tab -> dọn trạng thái của tab đó
chrome.tabs.onRemoved.addListener((tabId) => clearTabStates(tabId));

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message) return false;

  if (message.action === 'PING') {
    sendResponse({ status: 'PONG' });
    return false;
  }

  // Content script hỏi Tab ID của chính nó (để lưu trạng thái riêng từng tab)
  if (message.action === 'GET_TAB_ID') {
    sendResponse({ tabId: sender.tab ? sender.tab.id : null });
    return false;
  }

  // Chuyển tiếp tin nhắn sang tab chỉ định nếu cần
  if (message.target === 'tab' && message.tabId) {
    chrome.tabs.sendMessage(message.tabId, message, (res) => {
      void chrome.runtime.lastError;
      sendResponse(res);
    });
    return true;
  }

  return false;
});
