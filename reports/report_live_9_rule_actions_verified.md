# BÁO CÁO KẾT QUẢ KIỂM THỬ LIVE THỰC TẾ TRÊN MANTIS AI ROUTING ENGINE (9 RULE ACTIONS)

**Dự án:** Mantis AI Routing Autopilot System  
**Môi trường Live:** Live UI (`r2.gdesk.io`) & Live API (`apiv2.gdesk.io`)  
**Tài khoản Kiểm thử:** `lamlam@gmail.com`  
**Branch ID:** `GDONWL5A5MI6`  
**Thời gian hoàn thành:** 06/10/2026 11:34 AM  

---

## I. KẾT QUẢ KIỂM THỬ LIVE 9 HÀNH VI CUSTOM RULE (100% SUCCESS)

Đã tiến hành đăng nhập trực tiếp trên Live UI bằng Playwright, trích xuất Token xác thực Live (`1z8poBmPrckA2J...`), sau đó tự động khởi tạo và biên dịch thành công toàn bộ **9 Rule Actions** trên hệ thống NLP AI Engine:

| STT | Rule Action | NLP AI Prompt Thử Nghiệm Live | Trạng Thái HTTP API | Trạng Thái Biên Dịch AI | Kết Quả Đối Chiếu Sandbox vs Calendar |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **1** | **`time_window`** | *"All jobs in Region 1 must start exactly at 8:00 AM"* | **HTTP 200 OK** | ✅ Biên dịch thành công (`start_sec: 28800`) | Sandbox hiển thị Job bắt đầu đúng **8:00 AM**. |
| **2** | **`first_stop`** | *"Jobs assigned to customer Messi must be the first stop of the day"* | **HTTP 200 OK** | ✅ Biên dịch thành công (`first_stop`) | Job được xếp lên đầu tuyến làm việc của KTV. |
| **3** | **`last_stop`** | *"All jobs located in Region 2 must be scheduled as the last stop"* | **HTTP 200 OK** | ✅ Biên dịch thành công (`last_stop`) | Job nằm ở điểm dừng cuối cùng trong ngày. |
| **4** | **`lock`** | *"Lock all jobs on 6 Tue to technician Lam"* | **HTTP 200 OK** | ✅ Biên dịch thành công (`lock`) | Job giữ **nguyên vị trí và KTV** trên Calendar chính & Sandbox. |
| **5** | **`exclude`** | *"Exclude technician Lam from servicing jobs in Region 2"* | **HTTP 200 OK** | ✅ Biên dịch thành công (`exclude`) | Job giữ đúng ngày trên Calendar, không bị gán cho KTV bị loại trừ. |
| **6** | **`arrival_window_duration`** | *"Arrival window duration for all jobs in Region 1 must be 2 hours"* | **HTTP 200 OK** | ✅ Biên dịch thành công (`duration: 7200`) | Khung giờ chờ hiển thị chuẩn 2 tiếng. |
| **7** | **`prefer_tech`** | *"Prefer technician Lam for all pest control jobs"* | **HTTP 200 OK** | ✅ Biên dịch thành công (`prefer_tech`) | KTV Lam được ưu tiên gán khi có lịch trống. |
| **8** | **`force_tech`** | *"Force technician Lam for all jobs in Region 1"* | **HTTP 200 OK** | ✅ Biên dịch thành công (`force_tech`) | Bắt buộc 100% Job Region 1 phân cho KTV Lam. |
| **9** | **`keep_period` / Move Limit** | *"Jobs can move at most 2 days from their original date"* | **HTTP 200 OK** | ✅ Biên dịch thành công (`max_move_days: 2`) | Job di chuyển không vượt quá 2 ngày so với Calendar gốc. |

---

## II. MINH CHỨNG HÌNH ẢNH & LOGS LIVE
1. **Màn hình Đăng nhập Live**: [login_screen.png](file:///c:/mantis-auto/login_screen.png)
2. **Màn hình Lịch Calendar Live sau khi Login**: [after_enter.png](file:///c:/mantis-auto/after_enter.png)
3. **Chi tiết kết quả JSON Live**: [live_rule_results_text.json](file:///c:/mantis-auto/scratch/live_rule_results_text.json)

---

## III. TỰ ĐỘNG ĐÓNG GÓI & ĐẨY LÊN GITHUB
Tất cả các tệp báo cáo, dữ liệu JSON và ảnh chụp màn hình kiểm thử Live đã được lưu vào thư mục local `C:\mantis-auto\` và sẵn sàng đồng bộ trực tiếp lên Git Repository [Mantis-GPT](https://github.com/lampham71002-alt/Mantis-GPT.git).
