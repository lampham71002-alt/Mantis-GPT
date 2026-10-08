# BÁO CÁO TOÀN DIỆN (CHẠY LẠI THÀNH CÔNG): 12 TEST CASES KẾT HỢP 2 ACTIONS TRONG 1 CUSTOM RULE (MANTIS AI)

**Ngày thực hiện:** 06/10/2026  
**Môi trường:** Live Production (`r2.gdesk.io` & `apiv2.gdesk.io`)  
**Tài khoản:** `lamlam@gmail.com` | **Branch ID:** `GDONWL5A5MI6`  
**Chế độ thực thi:** Trực tiếp trên trình duyệt Live Preview non-headless bên phải màn hình (`920, 0`, kích thước `1000 x 1040`)  
**Cải tiến cốt lõi:**
- Áp dụng triệt để nguyên lý: **Bộ lọc mục tiêu chuẩn xác (Targets) + Exclude / Force Tech + Thời gian hội tụ Solver 12 giây**.
- Khắc phục hoàn toàn lỗi đánh giá vội do stream Sandbox chưa kịp render ở lần chạy trước.
- Chu trình 4 bước khép kín: **Tạo Rule ON ➔ Soi Sandbox Grid ➔ Đối chiếu Calendar gốc ➔ TẮT RULE VỀ OFF**.

---

## I. BẢNG TỔNG HỢP KẾT QUẢ 12 TEST CASES (ĐẠT CHUẨN PASS 100%)

| Mã TC | Cặp 2 Actions Kết Hợp | Prompt Kiểm Thử Thực Tế | Rule ID | Action 1 | Action 2 | Kết Quả | Chi Tiết Trạng Thái Đối Soát Trên Sandbox & Calendar |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **TC-01** | `time_window` (3PM-5PM) + `last_stop` | *"For Call Back Service jobs, schedule between 3:00 PM and 5:00 PM and must be the last stop of the day"* | `1378` | ✅ PASS | ✅ PASS | ✅ **PASS** | Job 8499 được dời sang **3:45 PM - 4:45 PM** và xếp đúng vị trí cuối cùng (**Stop #5/5**). |
| **TC-02** | `time_window` (8AM-10AM) + `first_stop` | *"For Eco-Friendly Pest Solutions jobs, schedule between 8:00 AM and 10:00 AM and must be the first stop of the day"* | `1379` | ✅ PASS | ✅ PASS | ✅ **PASS** | Job 8501 được xếp lên **8:30 AM - 9:30 AM** và đứng ở vị trí đầu ngày (**Stop #1/5**). |
| **TC-03** | `lock` + `time_window` (1PM-3PM) | *"Lock all Bi-Monthly Service jobs and schedule them between 1:00 PM and 3:00 PM"* | `1380` | ✅ PASS | ✅ PASS | ✅ **PASS** | Job 8500 được khóa cứng vị trí cố định VÀ nằm trọn trong khung 13:00 - 15:00. |
| **TC-04** | `force_tech` (Lam) + `last_stop` | *"Force technician Lam for Every 21 Days jobs and schedule them as the last stop of the day"* | `1381` | ✅ PASS | ✅ PASS | ✅ **PASS** | Bắt buộc gán cho KTV Lam VÀ xếp vào vị trí cuối cùng trong ngày (sau các job khác). |
| **TC-05** | `movement_limit` (1 ngày) + `first_stop` | *"Eco-Friendly Pest Solutions jobs can move at most 1 day from original date and must be the first stop"* | `1382` | ✅ PASS | ✅ PASS | ✅ **PASS** | Job di chuyển trong phạm vi ±1 ngày so với Calendar gốc VÀ đứng ở vị trí đầu ngày. |
| **TC-06** | `keep_period` (week) + `time_window` (10AM-12PM) | *"Bed Bug Heat Treatment jobs must stay inside their original week and start between 10:00 AM and 12:00 PM"* | `1383` | ✅ PASS | ✅ PASS | ✅ **PASS** | Giữ nguyên tuần gốc VÀ thời gian bắt đầu nằm trọn trong khung 10:00 - 12:00 (10:15 AM). |
| **TC-07** | `arrival_window_duration` (2h) + `last_stop` | *"For Call Back Service jobs, arrival window duration must be 2 hours and be scheduled as the last stop"* | `1384` | ✅ PASS | ✅ PASS | ✅ **PASS** | Khung chờ arrival window cấu hình 2 tiếng VÀ solver xếp job ở vị trí cuối ngày. |
| **TC-08** | `exclude` (Lam) + `time_window` (1PM-3PM) | *"Exclude technician Lam from Call Back Service jobs and schedule them between 1:00 PM and 3:00 PM"* | `1385` | ✅ PASS | ✅ PASS | ✅ **PASS** | Loại trừ triệt để khỏi tuyến của KTV Lam, job nằm trong khung giờ quy định. |
| **TC-09** | `prefer_tech` (Lam) + `first_stop` | *"Prefer technician Lam for Bi-Monthly Service jobs and must be the first stop of the day"* | `1386` | ✅ PASS | ✅ PASS | ✅ **PASS** | Ưu tiên gán cho KTV Lam VÀ solver xếp ở vị trí đầu ngày thành công. |
| **TC-10** | `lock` + `keep_period` (week) | *"Lock all jobs on Tuesday and keep them inside their original week"* | `1387` | ✅ PASS | ✅ PASS | ✅ **PASS** | Toàn bộ các job Thứ Ba đóng băng tại chỗ, không dịch chuyển sang tuần khác. |
| **TC-11** | `force_tech` (Lam) + `time_window` (9AM-11AM) | *"Force technician Lam for Eco-Friendly Pest Solutions and schedule between 9:00 AM and 11:00 AM"* | `1388` | ✅ PASS | ✅ PASS | ✅ **PASS** | Bắt buộc gán KTV Lam VÀ nằm trong khung 09:00 - 11:00. |
| **TC-12** | `movement_limit` (2 ngày) + `last_stop` | *"Every 21 Days jobs can move at most 2 days from original date and must be scheduled as the last stop"* | `1389` | ✅ PASS | ✅ PASS | ✅ **PASS** | Giới hạn di chuyển không quá 2 ngày VÀ xếp ở vị trí cuối ngày. |

---

## II. BÀI HỌC VẬN HÀNH QUAN TRỌNG TỪ GÓP Ý CỦA NGƯỜI DÙNG

1. **Bộ lọc (`targets`) và cơ chế `exclude` luôn có sức mạnh tối thượng:**
   - Khi prompt chỉ định rõ đối tượng mục tiêu (`service_types`, `tech_name`), Mantis AI biên dịch chính xác thành các target chuyên biệt, giúp solver không bị quá tải tính toán toàn bộ không gian lịch trình.
   - `exclude` là một Hard Constraint tuyệt đối: khi áp dụng `exclude`, solver lập tức dời job khỏi tài nguyên chỉ định mà không có ngoại lệ.

2. **Độ trễ hội tụ của Mantis AI Solver (Solver Convergence Time):**
   - Lần chạy trước bị ghi nhận FAIL ở một số case là do **thời gian chờ Sandbox quá ngắn (5 giây)** khi stream NDJSON của backend chưa hoàn tất pha `Building route details...`.
   - Khi tăng thời gian chờ lên **12 giây**, toàn bộ ma trận lộ trình và các thẻ công việc (job tiles) được render hoàn chỉnh trên Sandbox Grid, chứng minh tất cả 12 cặp kết hợp đều đạt kết quả mong muốn.

3. **An toàn dữ liệu tuyệt đối:**
   - Cả 12 rules (`1378` đến `1389`) sau khi hoàn tất kiểm tra đều đã được gọi lệnh `PUT status: 0` để tắt ngay lập tức, trả lại trạng thái ban đầu sạch sẽ cho hệ thống.

---

## III. MINH CHỨNG & ĐỒNG BỘ GITHUB

- **Thư mục 48 ảnh chụp màn hình 4 bước:** [`reports/screenshots/`](file:///c:/mantis-auto/reports/screenshots)
- **File kết quả chi tiết JSON:** [`reports/final_12_cases_rerun_verified.json`](file:///c:/mantis-auto/reports/final_12_cases_rerun_verified.json)
- **Script tự động:** [`scratch/rerun_all_cases_verified.js`](file:///c:/mantis-auto/scratch/rerun_all_cases_verified.js)
- **Mã nguồn đã đồng bộ lên GitHub:** [Mantis-GPT (master)](https://github.com/lampham71002-alt/Mantis-GPT.git).
