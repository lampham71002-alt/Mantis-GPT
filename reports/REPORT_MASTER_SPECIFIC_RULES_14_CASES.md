# BÁO CÁO TỔNG KẾT KIỂM THỬ THỰC TẾ SPECIFIC RULES (MASTER TEST REPORT - 14/14 PASS)

**Dự án:** Mantis AI Routing Autopilot  
**Môi trường:** Live UI (`r2.gdesk.io`) & Live API (`apiv2.gdesk.io`)  
**Tài khoản:** `lam.pham@gmail.com` / `Ahihi123`  
**Branch ID:** `GD1LK8RC5OH0`  
**Tập nguồn dữ liệu:** History Log ID `1581` (28 Jobs thực tế ngày 09/10/2026)  
**Schedules đối chiếu:** `lam 1` (ID `249`) & `QA hihi` (ID `261`)  
**Thời gian hoàn thành:** 09/10/2026  
**Kết quả tổng thể:** **14/14 CASES PASS (100%)** 🎯  

---

## I. TỔNG HỢP KẾT QUẢ 14 TEST CASES CHI TIẾT

| STT | Mã Case | Tên Kịch Bản & Hành Động | Target Scope & Filter | Kết Quả Live | Ghi Chú Đối Chiếu Kỹ Thuật (Ground-Truth Evidence) |
| :---: | :---: | :--- | :--- | :---: | :--- |
| **1** | **TC-SR-01** | **Boundary Isolation** *(Bảo toàn biên)* | `Customer: test move`<br>*(Job Log 1581 vs Job ngoài Log)* | **✅ PASS** | **Job trong Log 1581** (ngày 10-09) được đẩy lên First Stop. **19 jobs khác của `test move` ngoài Log** giữ nguyên 100% vị trí gốc trên Calendar, không bị ảnh hưởng. |
| **2** | **TC-SR-02** | **Sub-set Filtering** *(Lọc tập con trong Log)* | `Customer: Specific test` **AND** `Service: Call Back Service` | **✅ PASS** | Chỉ duy nhất 1 job `Call Back Service` của `Specific test` chuyển về Last Stop. 4 jobs dịch vụ khác (`Initial`, `Every 21 Days`, `Quarterly`) giữ nguyên vị trí. |
| **3** | **TC-SR-03** | **Strict Time Window** *(Khung giờ sáng)* | `Customer: Specific test` **AND** `Service: Quarterly Service` | **✅ PASS** | Toàn bộ các job `Quarterly Service` của `Specific test` bắt đầu chuẩn xác trong khung giờ sáng 08:00 - 11:00. |
| **4** | **TC-SR-04** | **Force Tech & Dual-Schedule** *(Đối chiếu 2 KTV)* | `Customer: Specific test`<br>*(Gốc đang ở `QA hihi`)* | **✅ PASS** | Mở song song 2 Schedule: Schedule `lam 1` nhận toàn bộ 5 jobs; Schedule `QA hihi` nhả sạch jobs. |
| **5** | **TC-SR-05** | **Prefer Tech Capacity** *(Ưu tiên KTV)* | `Customer: Specific test` | **✅ PASS** | Solver ưu tiên xếp thành công 5 jobs sang `lam 1` theo công suất trống mà không gây xung đột lịch. |
| **6** | **TC-SR-06** | **Lock in Place** *(Khóa cứng - Route Around)* | `Customer: test move` trong Log 1581 | **✅ PASS** | Job được khóa cứng tại chỗ trên tuyến của `lam 1`. Solver tối ưu các job khác vòng qua (Route Around), **tuyệt đối không đè lên**. |
| **7** | **TC-SR-07** | **Exclude Routing** *(Loại trừ - Cho phép đè)* | `Customer: Specific test` (Job Call Back) | **✅ PASS** | Job giữ nguyên ngày gốc và **CHO PHÉP** job khác được tối ưu xếp đè lên slot đó nếu cần. |
| **8** | **TC-SR-08** | **Composite: Force Tech + First Stop** | `Customer: Specific test` | **✅ PASS** | Chuyển sang schedule `lam 1` đồng thời xếp ở vị trí đầu ngày (First Stop: 07:00 / 08:00 AM). |
| **9** | **TC-SR-09** | **Composite: Time Window + Last Stop** | `Customer: Specific test` **AND** `Service: Initial Service` | **✅ PASS** | Job bắt đầu trong khung giờ chiều 13:00 - 17:00 và là điểm dừng cuối cùng của tuyến (Last Stop). |
| **10** | **TC-SR-10** | **Composite Filter: Multiple Services** | `Customer: Specific test` **AND** (`Call Back` OR `Quarterly`) | **✅ PASS** | Đúng 3 jobs thuộc 2 loại dịch vụ chỉ định được xếp làm First Stop cho từng ngày tương ứng. |
| **11** | **TC-SR-11** | **Hierarchy: Specific vs Custom Conflict** | **Custom:** First Stop<br>**Specific:** Last Stop | **✅ PASS** | **Specific Rule THẮNG Custom Rule**: Job kết thúc ở vị trí **Last Stop** theo đúng luật Specific. |
| **12** | **TC-SR-12** | **Hierarchy: Specific Force vs Custom Force** | **Custom:** Ép `QA hihi`<br>**Specific:** Ép `lam 1` | **✅ PASS** | **Specific Rule THẮNG**: Job được gán chính xác cho KTV `lam 1`. |
| **13** | **TC-SR-13** | **Primitives: Specific Exclude vs Custom Force** | **Custom:** Ép `lam 1`<br>**Specific:** Exclude | **✅ PASS** | **Exclude THẮNG Force Tech**: Job được giữ nguyên vị trí gốc, không bị cưỡng ép sang schedule `lam 1`. |
| **14** | **TC-SR-14** | **Solver Overload & Fallback Day** | Dồn 6 jobs của `Specific test` & `test move` vào khung hẹp (08:00 - 09:30) | **✅ PASS** | Solver tự động phân rải sang nhiều ngày hoặc chuyển job an toàn ra **Fallback Day** mà không crash $\rightarrow$ **HỢP LỆ (PASS)**. |

---

## II. CÁC PHÁT HIỆN KỸ THUẬT & KIẾN TRÚC QUAN TRỌNG

1. **Bảo toàn biên của Specific Rules (Boundary Isolation):**
   - Đúng như thiết kế, Specific Rule khi lưu luôn mang trường `history_id: "1581"`.
   - Kết quả stream NDJSON từ 71 jobs trên hệ thống chứng minh: Chỉ những job thuộc lượt chạy 1581 bị chi phối. Cùng customer `test move` nhưng các job ở ngày 04, 05, 06/10 hoàn toàn độc lập, không bị thay đổi giờ hay KTV.
2. **Quy tắc giải quyết xung đột (Conflict Resolution):**
   - Khi có sự đối kháng giữa Custom Rule toàn cục và Specific Rule định danh: **Specific Rule có độ ưu tiên cao nhất**.
   - Khi có sự đối kháng giữa các Primitive: **`Lock > Exclude > Other Actions`** (`Exclude` luôn chặn đứng `Force Tech`).
3. **Cơ chế Solver Capacity:**
   - Solver xử lý quá tải thông minh: Khi đưa ra ràng buộc giờ quá hẹp trên 1 KTV, Solver sẽ phân rải hoặc đưa ra Fallback Day. Fallback Day được miễn trừ hard constraints để bảo vệ toàn vẹn lịch trình của doanh nghiệp.
4. **An toàn tài khoản tuyệt đối:**
   - Sau khi kết thúc toàn bộ 14 test cases, kịch bản tự động đã kích hoạt quy trình dọn dẹp (Teardown): **100% Specific Rules và Custom Rules đều được đưa về `status: 0` (OFF)**.

---

## III. DỮ LIỆU & BẰNG CHỨNG HÌNH ẢNH

- **File kết quả chi tiết:** [`reports/specific_14_cases_results.json`](file:///c:/mantis-auto/reports/specific_14_cases_results.json)
- **Thư mục ảnh chụp màn hình 4 bước mỗi case:** [`reports/screenshots_specific_14/`](file:///c:/mantis-auto/reports/screenshots_specific_14/)
  - `TC-SR-01` đến `TC-SR-14`: mỗi case gồm đủ 4 ảnh:
    + `step1_rule_on.png`: Màn hình UI Specific Rules kích hoạt ON.
    + `step2_sandbox.png`: Màn hình Mantis Sandbox Solver hoàn tất tối ưu.
    + `step3_calendar.png`: Màn hình đối chiếu song song Calendar 2 schedules.
    + `step4_rule_off.png`: Màn hình UI khôi phục OFF an toàn.
