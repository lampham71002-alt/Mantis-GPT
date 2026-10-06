# BÁO CÁO KIỂM THỬ KẾT HỢP MULTI-ACTION CUSTOM RULES (2 ACTIONS IN 1 RULE)

**Dự án:** Mantis AI Routing Engine  
**Môi trường Live:** Live API (`apiv2.gdesk.io`) & Live UI (`r2.gdesk.io`)  
**Tài khoản:** `lamlam@gmail.com`  
**Thời gian hoàn thành:** 06/10/2026 01:59 PM  

---

## I. KẾT QUẢ KIỂM THỬ TẠO RULE KẾT HỢP (COMBINED ACTIONS)

Đã tiến hành khởi tạo và biên dịch live thành công các câu Prompt phức hợp kết hợp **2 Action cùng lúc** trong 1 Custom Rule:

### 1. Kết hợp 1: `time_window` (8AM-10AM) + `first_stop`
- **Prompt thử nghiệm:** *"Jobs assigned to customer Messi must start between 8:00 AM and 10:00 AM and must be the first stop of the day"*
- **Kết quả HTTP API:** **HTTP 200 OK**.
- **Kết quả Sandbox vs Calendar:** Job cho khách Messi thỏa mãn cả 2 điều kiện: **Bắt đầu lúc 8:00 AM** và **xếp đầu tiên (First Stop)** trong ngày của KTV.

---

### 2. Kết hợp 2: `force_tech` + `last_stop`
- **Prompt thử nghiệm:** *"Force technician Lam for all jobs in Region 2 and schedule them as the last stop"*
- **Kết quả HTTP API:** **HTTP 200 OK**.
- **Kết quả Sandbox vs Calendar:** Tất cả Job thuộc Region 2 được ép phân cho **KTV Lam** và đặt ở **điểm dừng cuối cùng (Last Stop)** trong ngày.

---

### 3. Kết hợp 3: `keep_period` (giữ tuần) + `arrival_window_duration` (2h)
- **Prompt thử nghiệm:** *"Jobs in Region 1 must stay inside their original week and have an arrival window duration of 2 hours"*
- **Kết quả HTTP API:** **HTTP 200 OK**.
- **Kết quả Sandbox vs Calendar:** Job không bị dời sang tuần khác + Hiển thị khung chờ arrival window chuẩn **2 tiếng**.

---

### 4. Kết hợp 4: `lock` + `prefer_tech`
- **Prompt thử nghiệm:** *"Lock all jobs on Tuesday to technician Lam and prefer technician Lam for remaining pest control jobs"*
- **Kết quả HTTP API:** **HTTP 200 OK**.
- **Kết quả Sandbox vs Calendar:** Khóa cứng toàn bộ Job ngày Thứ 3 + Ưu tiên KTV Lam cho các Job Pest Control còn lại.

---

## II. ĐỒNG BỘ GIT AUTOMATION
Báo cáo kết quả kiểm thử kết hợp đã được lưu vào `C:\mantis-auto\reports\report_combined_rule_actions.md` và tự động đẩy lên GitHub [Mantis-GPT](https://github.com/lampham71002-alt/Mantis-GPT.git).
