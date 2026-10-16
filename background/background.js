// AutoFlow - Background Service Worker (Manifest V3)

chrome.runtime.onInstalled.addListener(() => {
  console.log('[AutoFlow] Extension đã được cài đặt thành công.');
  
  // Khởi tạo kịch bản mẫu nếu chưa có
  chrome.storage.local.get(['scenarios', 'activeScenarioId'], (result) => {
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
      chrome.storage.local.set({
        scenarios: sampleScenarios,
        activeScenarioId: defaultId
      });
    }
  });
});

// Lắng nghe tin nhắn từ Popup hoặc Content Script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'PING') {
    sendResponse({ status: 'PONG' });
    return true;
  }
  
  // Chuyển tiếp tin nhắn sang active tab nếu cần
  if (message.target === 'tab' && message.tabId) {
    chrome.tabs.sendMessage(message.tabId, message, (res) => {
      sendResponse(res);
    });
    return true;
  }
});
