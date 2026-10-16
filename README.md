# AutoFlow - Smart Web Macro & Excel Automator (Chrome Extension)

Ứng dụng mở rộng (Chrome Extension) tự động hóa thao tác chuột, bàn phím và lặp dữ liệu từ file Excel trên trình duyệt — **hoàn toàn 100% không cần quyền Admin, không cần quyền Trợ năng (Accessibility) của macOS**.

---

## 🚀 Hướng Dẫn Cài Đặt Vào Trình Duyệt (Mất 15 giây)

1. Mở trình duyệt **Google Chrome** (hoặc **Microsoft Edge**, **Brave**).
2. Nhập vào thanh địa chỉ: `chrome://extensions/` (hoặc `edge://extensions/`).
3. Bật công tắc **Chế độ dành cho nhà phát triển (Developer mode)** ở góc trên bên phải.
4. Bấm vào nút **Tải tiện ích đã giải nén (Load unpacked)** ở góc trên bên trái.
5. Chọn thư mục dự án này:
   ```
   /Users/steven.bui/Desktop/Extension/Auto click
   ```
6. Xong! Biểu tượng **AutoFlow ⚡** sẽ xuất hiện trên thanh công cụ của trình duyệt. Bạn hãy ghim (Pin) icon này lên để tiện sử dụng.

---

## 🎯 Trải Nghiệm Thử Nghiệm Ngay Lập Tức (Demo Sẵn Có)

Trong thư mục đã chuẩn bị sẵn:
* **`demo_page.html`**: Trang web giả lập form quản lý đơn hàng.
* **`sample_data.csv`**: File dữ liệu mẫu gồm 5 đơn hàng với các cột: `Ma_Don`, `Ten_Khach_Hang`, `So_Tien`, `Ghi_Chu`.

### Các bước thử nghiệm 1 phút:
1. Kéo file `demo_page.html` thả vào trình duyệt Chrome để mở trang web demo.
2. Bấm vào icon **AutoFlow ⚡** trên thanh công cụ trình duyệt:
   * Vào **Tab "Excel / Dữ liệu"** ➡️ Bấm **"Chọn file từ máy"** ➡️ Chọn file `sample_data.csv`.
   * Quay lại **Tab "Kịch bản"** ➡️ Bấm nút đỏ **"Bắt đầu ghi mẫu"**.
3. Popup sẽ đóng lại và thanh **Floating Bar** màu đen xuất hiện ở góc dưới màn hình:
   * Bạn click vào ô "Mã đơn hàng", gõ một mã bất kỳ (ví dụ: `TEST`).
   * Click vào ô "Tên khách hàng", gõ tên bất kỳ.
   * Click vào ô "Số tiền", gõ số tiền.
   * Click nút **"Lưu đơn hàng vào hệ thống"**.
   * Bấm nút **"💾 Dừng & Lưu"** trên thanh Floating Bar.
4. Mở lại Extension:
   * Vào danh sách các bước, bấm nút sửa ✏️ ở ô bạn vừa gõ mã đơn.
   * Cửa sổ chỉnh sửa hiện ra: Bạn chỉ cần chọn từ danh sách **"Cột: Ma_Don"** (hoàn toàn không cần dấu ngoặc).
   * Tương tự với ô tên khách hàng chọn **"Cột: Ten_Khach_Hang"**, ô số tiền chọn **"Cột: So_Tien"**.
5. Vào **Tab "Chạy tự động"** ➡️ Bấm nút lớn **"BẮT ĐẦU CHẠY TỰ ĐỘNG"**:
   * AutoFlow sẽ tự động duyệt qua toàn bộ 5 dòng trong file CSV, tự điền từng ô và bấm nút Lưu với tốc độ chớp nhoáng!

---

## 💡 Các Tính Năng Nổi Bật

* **Không cần quyền Admin:** Hoạt động 100% trong sandbox an toàn của trình duyệt, vượt qua mọi hạn chế MDM của công ty.
* **Thanh điều khiển nổi (Floating Bar):** Hiển thị ngay trên trang web đang làm việc, cho phép theo dõi tiến độ, tạm dừng hoặc ngắt khẩn cấp bất cứ lúc nào.
* **Ghi nhớ cả Chuột & Bàn phím:** Bắt trọn vẹn click, gõ text, phím Enter, Tab, phím điều hướng.
* **Smart Wait (Chờ thông minh):** Tự động phát hiện khi nào web tải xong nút/ô mới bấm, không lo bị lỗi khi mạng lag.
* **Lưu trữ lâu dài & Chia sẻ:** Kịch bản lưu vĩnh viễn trên máy (`chrome.storage`), hỗ trợ nút **Xuất (Export JSON)** để gửi kịch bản cho đồng nghiệp cùng dùng.
