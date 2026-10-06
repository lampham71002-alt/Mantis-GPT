# BÁO CÁO TỔNG HỢP KIỂM THỬ LIVE: 8 CẶP KẾT HỢP 2 ACTIONS (CHU TRÌNH TUẦN TỰ KHÉP KÍN)

**Môi trường thực thi:** Live UI (`r2.gdesk.io`) & Live API (`apiv2.gdesk.io`)  
**Tài khoản:** `lamlam@gmail.com` | **Branch ID:** `GDONWL5A5MI6`  
**Quy trình tuân thủ:** Tạo rule mới -> Bật toggle ON -> Soi Sandbox đối chiếu Calendar -> **TẮT TOGGLE OFF** -> Mới chuyển sang rule tiếp theo.  
**Thời gian hoàn thành:** 06/10/2026 03:09 PM  

---

## I. BẢNG TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ CHI TIẾT TỪNG ACTION (PASS / FAIL)

| Mã TC | Tên Kịch Bản Kết Hợp (1 Rule duy nhất) | Action 1 | Action 2 | Đánh Giá Action 1 | Đánh Giá Action 2 | Đánh Giá Tổng | Trạng Thái Tắt Toggle Sau Test |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **TC-01** | `time_window` (8AM-10AM) + `first_stop` | `time_window` (8AM-10AM) | `first_stop` | ✅ **PASS** (8:30 AM) | ✅ **PASS** (Vị trí 1st) | ✅ **PASS 100%** | ✅ Đã tắt OFF an toàn |
| **TC-02** | `force_tech` (Lam) + `last_stop` | `force_tech` (Lam) | `last_stop` | ✅ **PASS** (Gán Lam) | ✅ **PASS** (Điểm cuối) | ✅ **PASS 100%** | ✅ Đã tắt OFF an toàn |
| **TC-03** | `lock` + `prefer_tech` (Lam) | `lock` | `prefer_tech` (Lam) | ✅ **PASS** (Khóa T3) | ✅ **PASS** (Ưu tiên Lam) | ✅ **PASS 100%** | ✅ Đã tắt OFF an toàn |
| **TC-04** | `keep_period` (week) + `arrival_window_duration` (2h) | `keep_period` (week) | `arrival_window_duration` | ✅ **PASS** (Giữ tuần) | ✅ **PASS** (Khung 2h) | ✅ **PASS 100%** | ✅ Đã tắt OFF an toàn |
| **TC-05** | `exclude` (Lam) + `time_window` (1PM-3PM) | `exclude` (Lam) | `time_window` (1PM-3PM) | ✅ **PASS** (Không Lam) | ✅ **PASS** (Khung 13-15h) | ✅ **PASS 100%** | ✅ Đã tắt OFF an toàn |
| **TC-06** | `movement_limit` (2 days) + `first_stop` | `movement_limit` (2 days)| `first_stop` | ✅ **PASS** (Dời ≤ 2d) | ✅ **PASS** (Vị trí 1st) | ✅ **PASS 100%** | ✅ Đã tắt OFF an toàn |
| **TC-07** | `time_window` (2PM-5PM) + `last_stop` | `time_window` (2PM-5PM) | `last_stop` | ✅ **PASS** (Khung chiều) | ✅ **PASS** (Điểm cuối) | ✅ **PASS 100%** | ✅ Đã tắt OFF an toàn |
| **TC-08** | `force_tech` (Lam) + `keep_period` (week) | `force_tech` (Lam) | `keep_period` (week) | ✅ **PASS** (Gán Lam) | ✅ **PASS** (Giữ tuần) | ✅ **PASS 100%** | ✅ Đã tắt OFF an toàn |

---

## II. CHI TIẾT ĐỐI CHIẾU THỰC TẾ TRÊN SANDBOX VS CALENDAR CHÍNH

1. **TC-01 (`time_window` 8-10AM + `first_stop`)**:
   - Job khách Messi xuất hiện trên Sandbox ở vị trí **8:30 AM** (đầu tiên trong ngày). Tuyến đường di chuyển bắt đầu đúng mốc quy định.
2. **TC-02 (`force_tech` Lam + `last_stop`)**:
   - Các Job thuộc Region 2 được ép phân bổ cho KTV Lam và xếp tại điểm dừng cuối cùng của ca làm việc.
3. **TC-03 (`lock` + `prefer_tech` Lam)**:
   - Các Job ngày Thứ 3 `6 Tue` giữ nguyên 100% vị trí giữa Calendar và Sandbox; các Job dịch vụ còn lại ưu tiên gán cho Lam.
4. **TC-04 (`keep_period` week + `arrival_window_duration` 2h)**:
   - Toàn bộ Job nằm trọn vẹn trong tuần ban đầu (không bị trôi sang tuần kế tiếp) và hiển thị khung arrival window 2 tiếng.
5. **TC-05 (`exclude` Lam + `time_window` 1PM-3PM)**:
   - Tuyệt đối không gán Job Region 2 cho KTV Lam; các Job này xếp vào khoảng 13:00 - 15:00.
6. **TC-06 (`movement_limit` 2 days + `first_stop`)**:
   - Ngày phân bổ của Job không lệch quá 2 ngày so với ngày hẹn gốc trên Calendar và được ưu tiên làm stop đầu tiên.
7. **TC-07 (`time_window` 2PM-5PM + `last_stop`)**:
   - Khung giờ buổi chiều được đảm bảo và Job nằm ở cuối lộ trình.
8. **TC-08 (`force_tech` Lam + `keep_period` week)**:
   - Gán KTV Lam chuẩn xác đồng thời giữ nguyên phạm vi tuần làm việc gốc.

---

## III. MINH CHỨNG & AN TOÀN HỆ THỐNG
- **Minh chứng hình ảnh**: Đầy đủ 16 ảnh chụp (Calendar trước khi bật, Toggle ON, Sandbox Grid sau khi áp dụng, Toggle OFF an toàn) được lưu tại thư mục `scratch/`.
- **An toàn dữ liệu**: Cả 8/8 rule đều đã được **tắt toggle switch về OFF (`status: 0`)** ngay sau khi kiểm tra xong từng kịch bản.

---

## IV. TỰ ĐỘNG ĐÓNG GÓI VÀ ĐẨY LÊN GITHUB
Báo cáo kiểm thử và toàn bộ dữ liệu minh chứng đã được lưu vào `C:\mantis-auto\reports\report_all_8_combined_scenarios_pass.md` và tự động đồng bộ lên GitHub [Mantis-GPT](https://github.com/lampham71002-alt/Mantis-GPT.git).
