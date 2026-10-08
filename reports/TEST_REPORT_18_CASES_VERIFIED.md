# BÁO CÁO TOÀN DIỆN MỞ RỘNG: 18 TEST CASES KẾT HỢP 2 ACTIONS TRONG 1 CUSTOM RULE (MANTIS AI)

**Ngày thực hiện:** 06/10/2026  
**Môi trường:** Live Production (`r2.gdesk.io` & `apiv2.gdesk.io`)  
**Tài khoản:** `lamlam@gmail.com` | **Chi nhánh:** `GDONWL5A5MI6`  
**Chế độ thực thi:** Trực tiếp trên trình duyệt Live Preview non-headless bên phải màn hình (`920, 0`, kích thước `1000 x 1040`)  
**Phương pháp luận:** Áp dụng nguyên lý **Bộ lọc mục tiêu chuẩn xác (Targets: Customer / Service / Tech) + Ràng buộc loại trừ (Exclude) / Cố định (Force / Lock) + Thời gian hội tụ Solver 12 giây**.  
**Quy trình chuẩn 4 bước:** Tạo Rule ON ➔ Soi Sandbox Grid ➔ Đối chiếu Calendar gốc ➔ TẮT RULE VỀ OFF.

---

## I. BẢNG TỔNG HỢP KẾT QUẢ ĐỢT MỚI (TC-13 ĐẾN TC-18)

| Mã TC | Kịch Bản & Cặp 2 Actions Kết Hợp | Prompt Kiểm Thử Thực Tế | Rule ID | Action 1 | Action 2 | Kết Quả | Chi Tiết Kiểm Tra Sandbox & Calendar |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **TC-13** | **Customer Messi** + `time_window` (1PM-3PM) + `first_stop` | *"For jobs assigned to customer Messi, schedule between 1:00 PM and 3:00 PM and must be the first stop of the day"* | `1390` | ✅ PASS | ✅ PASS | ✅ **PASS** | Job khách Messi được xếp vào khung 13:00 - 15:00 VÀ đứng ở vị trí dừng đầu tiên trong ngày. |
| **TC-14** | **Wasp Nest Removal** + `force_tech` (Lam) + `first_stop` | *"Force technician Lam for Wasp Nest Removal jobs and schedule them as the first stop of the day"* | `1394` | ✅ PASS | ✅ PASS | ✅ **PASS** | Bắt buộc gán cho KTV Lam VÀ xếp làm điểm dừng đầu ngày. |
| **TC-15** | **Call Back Service** + `movement_limit` (3 ngày) + `keep_period` (tháng) | *"Call Back Service jobs can move at most 3 days from original date and must stay inside their original month"* | `1395` | ✅ PASS | ✅ PASS | ✅ **PASS** | Ngày dịch chuyển nằm trong phạm vi 3 ngày VÀ giữ nguyên trọn vẹn trong tháng 10/2026. |
| **TC-16** | **Bi-Monthly Service** + `arrival_window_duration` (3h) + `time_window` (8AM-11AM) | *"For Bi-Monthly Service jobs, arrival window duration must be 3 hours and schedule between 8:00 AM and 11:00 AM"* | `1396` | ✅ PASS | ✅ PASS | ✅ **PASS** | Hiển thị khung chờ 3 tiếng VÀ thời gian bắt đầu nằm trọn trong 08:00 - 11:00. |
| **TC-17** | **Eco-Friendly Pest** + `exclude` (Lam) + `keep_period` (tuần) | *"Exclude technician Lam from Eco-Friendly Pest Solutions jobs and keep them inside their original week"* | `1397` | ✅ PASS | ✅ PASS | ✅ **PASS** | Loại trừ tuyệt đối khỏi KTV Lam VÀ giữ nguyên trong tuần gốc (04/10 - 10/10). |
| **TC-18** | **Customer Lam** + `prefer_tech` (Lam) + `time_window` (2PM-4PM) | *"For customer Lam jobs, prefer technician Lam and schedule between 2:00 PM and 4:00 PM"* | `1398` | ✅ PASS | ✅ PASS | ✅ **PASS** | Ưu tiên gán cho Lam VÀ xếp trong khung giờ chiều 14:00 - 16:00. |

---

## II. DANH SÁCH 12 CASES ĐỢT TRƯỚC (TC-01 ĐẾN TC-12)

- **TC-01:** `time_window` (3PM-5PM) + `last_stop` ➔ ✅ **PASS** (Rule ID 1378)
- **TC-02:** `time_window` (8AM-10AM) + `first_stop` ➔ ✅ **PASS** (Rule ID 1379)
- **TC-03:** `lock` + `time_window` (1PM-3PM) ➔ ✅ **PASS** (Rule ID 1380)
- **TC-04:** `force_tech` (Lam) + `last_stop` ➔ ✅ **PASS** (Rule ID 1381)
- **TC-05:** `movement_limit` (1 ngày) + `first_stop` ➔ ✅ **PASS** (Rule ID 1382)
- **TC-06:** `keep_period` (week) + `time_window` (10AM-12PM) ➔ ✅ **PASS** (Rule ID 1383)
- **TC-07:** `arrival_window_duration` (2h) + `last_stop` ➔ ✅ **PASS** (Rule ID 1384)
- **TC-08:** `exclude` (Lam) + `time_window` (1PM-3PM) ➔ ✅ **PASS** (Rule ID 1385)
- **TC-09:** `prefer_tech` (Lam) + `first_stop` ➔ ✅ **PASS** (Rule ID 1386)
- **TC-10:** `lock` + `keep_period` (week) ➔ ✅ **PASS** (Rule ID 1387)
- **TC-11:** `force_tech` (Lam) + `time_window` (9AM-11AM) ➔ ✅ **PASS** (Rule ID 1388)
- **TC-12:** `movement_limit` (2 ngày) + `last_stop` ➔ ✅ **PASS** (Rule ID 1389)

---

## III. TỔNG KẾT & AN TOÀN HỆ THỐNG

1. **Tổng số Test Cases hoàn thành:** **18 / 18 Cases (Đạt tỉ lệ PASS 100%)**.
2. **Minh chứng:** Đầy đủ 72 ảnh chụp màn hình từng bước (18 cases x 4 bước: Step 1 Rule ON, Step 2 Sandbox, Step 3 Calendar, Step 4 Rule OFF) tại [`reports/screenshots/`](file:///c:/mantis-auto/reports/screenshots).
3. **An toàn:** 100% 18 Custom Rules đều đã được tắt về `status: 0` (OFF), trả lại nguyên trạng lịch trình ban đầu của hệ thống.
