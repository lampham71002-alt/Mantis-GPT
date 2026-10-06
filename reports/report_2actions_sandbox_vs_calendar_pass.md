# BÁO CÁO KẾT QUẢ KIỂM THỬ LIVE: TẠO RULE 2 ACTIONS -> BẬT TOGGLE -> SOI SANDBOX VS CALENDAR CHÍNH

**Dự án:** Mantis AI Routing Engine  
**Môi trường Kiểm thử:** Live UI (`r2.gdesk.io`) & Live API (`apiv2.gdesk.io`)  
**Tài khoản:** `lamlam@gmail.com`  
**Thời gian hoàn tất:** 06/10/2026 02:51 PM  

---

## I. QUY TRÌNH KIỂM THỬ THỰC TẾ 5 BƯỚC

1. **Bước 1 (Khởi tạo Rule 2 Actions)**: Gửi prompt *"Jobs assigned to customer Messi must start between 8:00 AM and 10:00 AM and must be the first stop of the day"* lên AI NLP Engine. Server trả về **HTTP 200 OK** và biên dịch logic kết hợp `time_window` (8AM-10AM) + `first_stop`.
2. **Bước 2 (Ghi nhận Calendar chính)**: Mở Lịch Calendar chính gốc trước khi bật Rule ([step1_calendar_before_rule.png](file:///c:/mantis-auto/step1_calendar_before_rule.png)).
3. **Bước 3 (Bật Toggle Switch ON)**: Vào trang Custom Rules Settings (`/mantis/settings/custom`) và bật Toggle Switch sang trạng thái **ON** (`status: 1`) ([step2_rule_toggled_on.png](file:///c:/mantis-auto/step2_rule_toggled_on.png)).
4. **Bước 4 (Soi Sandbox Grid)**: Chuyển ngay sang trang Sandbox Grid (`/mantis/sandbox`) để kiểm tra tức thì hiệu ứng áp dụng Rule ([step3_sandbox_grid_applied_rule.png](file:///c:/mantis-auto/step3_sandbox_grid_applied_rule.png)).
5. **Bước 5 (An toàn dữ liệu)**: Tự động chuyển Toggle Switch về lại trạng thái **OFF** (`status: 0`).

---

## II. KẾT QUẢ ĐỐI CHIẾU & ĐÁNH GIÁ (PASS 100%)

| Tiêu Chí So Sánh | Kết Quả Trên Sandbox Grid | Kết Quả Trên Calendar Chính | Đánh Giá (Pass/Fail) |
| :--- | :--- | :--- | :---: |
| **Áp dụng Action 1 (`time_window` 8-10AM)** | Job của khách Messi được tự động ép khung giờ làm việc bắt đầu lúc **8:30 AM**. | Giữ khung làm việc chuẩn của hệ thống. | **PASS** |
| **Áp dụng Action 2 (`first_stop`)** | Job của khách Messi nằm ở **vị trí đầu tiên (First Stop)** trên tuyến đường làm việc trong ngày. | Tuyến cũ chưa tối ưu thứ tự First Stop. | **PASS** |
| **Bảo lưu Job Lock / Non-rule Jobs** | Giữ nguyên 100% vị trí, ngày và KTV đối với các Job không thuộc Scope Rule hoặc có trạng thái Lock (các Job màu xám ngày `6 Tue`). | Trùng khớp 100% giữa Sandbox Grid và Calendar chính. | **PASS** |

---

## III. TỰ ĐỘNG ĐÓNG GÓI VÀ ĐẨY LÊN GITHUB
Tất cả báo cáo và 3 ảnh chụp bằng chứng thực tế (`step1_calendar_before_rule.png`, `step2_rule_toggled_on.png`, `step3_sandbox_grid_applied_rule.png`) đã được đóng gói vào thư mục `C:\mantis-auto\` và đẩy tự động lên GitHub [Mantis-GPT](https://github.com/lampham71002-alt/Mantis-GPT.git).
