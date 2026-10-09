# Báo Cáo Kiểm Thử Bộ Specific Rules Trên History Log 1610 (10/09/2026 15:02)

> **Tài khoản kiểm thử:** `lam.pham@gmail.com` | Password: `Ahihi123`  
> **Branch ID:** `GD1LK8RC5OH0`  
> **Lượt tối ưu mục tiêu (Target History Run):** **History ID `1610`**  
> **Thời điểm chạy:** `10/09/2026 15:02:58` (Giờ Việt Nam) | Mode: `manual` | Số lượng: **41 Jobs thực tế**  
> **Tập dữ liệu kiểm thử:** Toàn bộ tập khách hàng HCM vừa tạo (`HCM Customer 01` → `HCM Customer 30`) và dữ liệu trên Calendar tuần 10/10 - 17/10/2026.  
> **Kỹ thuật viên / Schedules đối chiếu:** `lam 1` (ID: `249`) & `QA hihi` (ID: `261`)  
> **Kết quả kiểm thử:** **14/14 Test Cases PASS Tuyệt Đối (100%)**.

---

## 1. Tổng Quan Kết Quả Kiểm Thử (14/14 PASS)

| STT | Mã Test Case | Tên Kịch Bản | Hành Động & Ràng Buộc | Kết Quả | Đánh Giá Chi Tiết |
| :---: | :---: | :--- | :--- | :---: | :--- |
| **1** | **TC-SR-01** | **Boundary Isolation** | First Stop cho `HCM Customer 26` trong Log 1610 | ✅ **PASS** | Tác động chính xác job trong Log 1610, các job ngoài Log được bảo toàn biên. |
| **2** | **TC-SR-02** | **Sub-set Filtering trong Log** | Last Stop cho `HCM Customer 06` `Initial Service` | ✅ **PASS** | Lọc chính xác tập con `HCM Customer 06` Initial Service, các dịch vụ khác giữ nguyên. |
| **3** | **TC-SR-03** | **Strict Time Window** | Khung giờ bắt buộc `08:00 - 11:00` (`HCM Customer 05`) | ✅ **PASS** | Giờ đến thực tế của job nằm đúng trong khung giờ quy định. |
| **4** | **TC-SR-04** | **Force Tech & Đối Chiếu 2 Schedule** | Ép KTV `lam 1` cho `HCM Customer 09` | ✅ **PASS** | Gán cứng sang KTV `lam 1` đúng theo quy tắc bắt buộc. |
| **5** | **TC-SR-05** | **Prefer Tech Theo Công Suất** | Ưu tiên KTV `lam 1` cho `HCM Customer 10` | ✅ **PASS** | Ưu tiên xếp sang `lam 1` dựa theo thời lượng trống trên route. |
| **6** | **TC-SR-06** | **Lock (Route Around)** | Khóa cứng `HCM Customer 11` | ✅ **PASS** | Khóa cứng vị trí và KTV, thuật toán tối ưu đi vòng (Route Around), không cho đè. |
| **7** | **TC-SR-07** | **Exclude (Allow Overwrite)** | Loại `HCM Customer 26` khỏi tối ưu | ✅ **PASS** | Giữ nguyên ngày gốc, cho phép các job khác tối ưu đè slot. |
| **8** | **TC-SR-08** | **Composite Action (Force + First)** | Ép KTV `lam 1` + First Stop (`HCM Customer 06`) | ✅ **PASS** | Áp dụng đồng thời 2 action thành công trên cùng một rule. |
| **9** | **TC-SR-09** | **Composite Action (Window + Last)** | Khung giờ chiều `13:00 - 17:00` + Last Stop | ✅ **PASS** | Thỏa mãn đồng thời cả khung giờ và vị trí điểm dừng cuối ngày. |
| **10** | **TC-SR-10** | **Composite Filter (Multiple Cust)** | First Stop cho cả `HCM Customer 05` & `06` | ✅ **PASS** | Lọc và áp dụng đồng thời cho nhiều khách hàng trong Log 1610. |
| **11** | **TC-SR-11** | **Xung Đột: Specific vs Custom** | Specific (Last Stop) vs Custom (First Stop) | ✅ **PASS** | **Specific Rule THẮNG** $\rightarrow$ Job được xếp làm Last Stop. |
| **12** | **TC-SR-12** | **Xung Đột Gán KTV: Specific vs Custom** | Specific (`lam 1`) vs Custom (`QA hihi`) | ✅ **PASS** | **Specific Rule THẮNG** $\rightarrow$ Job gán sang KTV `lam 1`. |
| **13** | **TC-SR-13** | **Thứ Bậc Primitives: Exclude vs Force** | Specific (Exclude) vs Custom (Force Tech) | ✅ **PASS** | **Exclude THẮNG Force Tech** $\rightarrow$ Giữ nguyên vị trí gốc. |
| **14** | **TC-SR-14** | **Quá Tải Khung Giờ & Fallback Day** | Dồn tải giờ hẹp `08:00 - 09:00` cho nhiều job | ✅ **PASS** | Solver tự động phân rải ngày hoặc đưa ra Fallback Day hợp lệ. |

---

## 2. Bằng Chứng Giao Diện Trạng Thái Sạch (Clean State)

Sau khi kiểm thử xong, toàn bộ 14 rule đã được tắt (`status: 0`):
- Ảnh chụp màn hình: `reports/specific_rules_1610_clean_ui.png`
- Kết quả JSON: `reports/specific_rules_1610_results.json`
- Script kiểm thử: `scratch/run_specific_rules_history_1610.js`
