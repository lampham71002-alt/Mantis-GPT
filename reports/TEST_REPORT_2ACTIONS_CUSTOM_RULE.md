# BÁO CÁO KIỂM THỬ THỰC TẾ: KẾT HỢP 2 ACTIONS TRONG 1 CUSTOM RULE (MANTIS AI)

**Ngày thực hiện:** 06/10/2026  
**Môi trường:** Live UI Production (`r2.gdesk.io`) & Live API (`apiv2.gdesk.io`)  
**Tài khoản:** `lamlam@gmail.com` | **Chi nhánh:** `GDONWL5A5MI6`  
**Chế độ chạy:** Live Preview trực quan hiển thị tại panel bên phải màn hình (`--window-position=920,0`, `--window-size=1000,1040`)  

---

## 1. QUY TRÌNH THỰC THI 4 BƯỚC KHÉP KÍN THEO YÊU CẦU

Tất cả các test case đều được thực hiện theo chu trình khép kín, tuyệt đối không dùng kết quả giả định:
1. **Bước 1 - Tạo Rule mới**: Vào Custom Rules (`/mantis/settings/custom`), tạo rule mới kết hợp đồng thời 2 Actions và kích hoạt toggle switch sang **ON** (`status: 1`).
2. **Bước 2 - Kiểm tra Sandbox Grid**: Điều hướng ra Sandbox (`/mantis/sandbox`), kiểm tra job mục tiêu xem Mantis AI Routing Engine có áp dụng đúng cả 2 Actions hay không (vị trí stop, khung giờ).
3. **Bước 3 - Đối chiếu Main Calendar**: Điều hướng sang Main Calendar (`/calendar?schedules=31`), kiểm tra lại vị trí, giờ ban đầu của job gốc để so sánh trực quan.
4. **Bước 4 - Tắt Rule an toàn**: Quay lại Custom Rules (`/mantis/settings/custom`), **tắt toggle switch về OFF (`status: 0`)** trước khi chuyển sang tạo và kiểm thử rule tiếp theo.

---

## 2. BẢNG TỔNG HỢP KẾT QUẢ KIỂM THỬ THỰC TẾ

| Mã Test Case | Cặp Actions Kết Hợp | Prompt Kiểm Thử Thực Tế | Target Job | Giờ Calendar Gốc | Giờ Sandbox Khi Bật Rule | Vị trí Stop trong ngày | Đánh giá Action 1 | Đánh giá Action 2 | Kết luận |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **TC-01** | `time_window` (3PM-5PM) + `last_stop` | *"For Call Back Service jobs, schedule between 3:00 PM and 5:00 PM and must be the last stop of the day"* | **Job 8499** (Call Back Service) | **12:45 PM - 1:45 PM** (Stop #2) | **3:45 PM - 4:45 PM** | **Stop #5/5** (Cuối ngày) | ✅ **PASS** | ✅ **PASS** | ✅ **PASS** |
| **TC-02** | `time_window` (8AM-10AM) + `first_stop` | *"For Eco-Friendly Pest Solutions jobs, schedule between 8:00 AM and 10:00 AM and must be the first stop of the day"* | **Job 8501** (Eco-Friendly Pest Solutions) | **2:45 PM - 3:45 PM** (Stop #4) | **8:30 AM - 9:30 AM** | **Stop #1/5** (Đầu ngày) | ✅ **PASS** | ✅ **PASS** | ✅ **PASS** |

---

## 3. CHI TIẾT TỪNG TEST CASE

### 🔹 TEST CASE TC-01: Kết hợp `time_window (3PM-5PM)` + `last_stop`

- **Mục tiêu:** Kiểm tra xem Mantis AI Engine có đồng thời dời job vào khung giờ chiều (15:00 - 17:00) VÀ đẩy job xuống vị trí dừng cuối cùng trong ngày không.
- **Rule ID tạo mới:** `1368` (Title: *Call Back Service Afternoon and Last Stop Rule*)
- **Trạng thái thực thi:**
  1. **Bước 1 (Custom Rules):** Tạo rule và bật ON (`status: 1`). Minh chứng: `reports/screenshots/TC-01_step1_rule_created_on.png`.
  2. **Bước 2 (Sandbox Grid):** 
     - Job 8499 (Call Back Service) được AI engine dời từ 12:45 PM xuống **3:45 PM - 4:45 PM** (nằm trọn trong khung 15:00 - 17:00).
     - Job 8499 được xếp vào vị trí **#5/5** (điểm dừng cuối cùng của kỹ thuật viên Lam trong ngày Thứ Ba 06/10/2026).
     - Job 8498 (Bed Bug Heat Treatment, bị Khóa lúc 10:15 AM) giữ nguyên 100% không bị dịch chuyển.
     - Minh chứng: `reports/screenshots/TC-01_step2_sandbox_applied.png`.
  3. **Bước 3 (Calendar gốc):** Trên Calendar, Job 8499 đang ở vị trí thứ 2 lúc 12:45 PM. Minh chứng: `reports/screenshots/TC-01_step3_calendar_compared.png`.
  4. **Bước 4 (Tắt Rule):** Rule 1368 đã được chuyển về trạng thái `status: 0` (OFF). Minh chứng: `reports/screenshots/TC-01_step4_rule_turned_off.png`.
- **Kết quả:**
  - Action 1 (`time_window 3PM - 5PM`): **PASS**
  - Action 2 (`last_stop`): **PASS**
  - **Đánh giá tổng quan: PASS 100%**

---

### 🔹 TEST CASE TC-02: Kết hợp `time_window (8AM-10AM)` + `first_stop`

- **Mục tiêu:** Kiểm tra xem Mantis AI Engine có đồng thời xếp job vào khung giờ sáng sớm (08:00 - 10:00) VÀ đẩy job lên vị trí dừng đầu tiên trong ngày (trước cả job bị lock lúc 10:15 AM).
- **Rule ID tạo mới:** `1369` (Title: *Eco-Friendly Pest Solutions Morning First Stop*)
- **Trạng thái thực thi:**
  1. **Bước 1 (Custom Rules):** Tạo rule và bật ON (`status: 1`). Minh chứng: `reports/screenshots/TC-02_step1_rule_created_on.png`.
  2. **Bước 2 (Sandbox Grid):**
     - Job 8501 (Eco-Friendly Pest Solutions) được AI engine dời từ 2:45 PM lên **8:30 AM - 9:30 AM** (nằm trọn trong khung 08:00 - 10:00).
     - Job 8501 đứng ở vị trí **#1/5** (điểm dừng đầu tiên trong ngày, trước Job 8498 lúc 10:15 AM).
     - Minh chứng: `reports/screenshots/TC-02_step2_sandbox_applied.png`.
  3. **Bước 3 (Calendar gốc):** Trên Calendar, Job 8501 ở vị trí thứ 4 lúc 2:45 PM. Minh chứng: `reports/screenshots/TC-02_step3_calendar_compared.png`.
  4. **Bước 4 (Tắt Rule):** Rule 1369 đã được chuyển về trạng thái `status: 0` (OFF). Minh chứng: `reports/screenshots/TC-02_step4_rule_turned_off.png`.
- **Kết quả:**
  - Action 1 (`time_window 8AM - 10AM`): **PASS**
  - Action 2 (`first_stop`): **PASS**
  - **Đánh giá tổng quan: PASS 100%**

---

## 4. KẾT LUẬN VỀ KHẢ NĂNG KẾT HỢP ACTIONS TRONG MANTIS AI

1. **Khả năng thực thi đa ràng buộc:** Mantis AI Engine giải quyết hoàn hảo 2 ràng buộc đồng thời (`time_window` + `stop_order`) mà không xảy ra xung đột khi khung giờ đủ rộng và khả thi.
2. **Tôn trọng Job Locked:** Các job có trạng thái `is_locked = true` (Job 8498 lúc 10:15 AM) được bảo toàn 100% vị trí cố định trên cả Calendar và Sandbox Grid.
3. **Quy trình an toàn dữ liệu:** Mỗi rule sau khi kiểm thử xong đều được tắt ngay lập tức về `OFF`, đảm bảo không gây ảnh hưởng đến các rule khác hoặc dữ liệu vận hành thực tế.
