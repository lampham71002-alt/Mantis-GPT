# BÁO CÁO PHÂN TÍCH XUNG ĐỘT THEO 10 CUSTOM RULE PRIMITIVES (MANTIS AI ENGINE)

**Dự án:** Mantis AI Routing Autopilot  
**Thời gian:** 05/10/2026  
**Thực hiện:** Antigravity AI Agent  
**Nguồn đầu vào:** 10 Custom Action Types (`keep_period`, `force_tech`, `prefer_tech`, `movement_limit`, `time_window`, `arrival_window_duration`, `first_stop`, `last_stop`, `lock`, `exclude`).

---

## MA TRẬN PHÂN TÍCH XUNG ĐỘT CHI TIẾT (SOLVER PRIMITIVES VS SYSTEM RULES)

| STT | Custom Action Type | User Intent & Solver Primitive | System Rules (SR) Gây Xung Đột | Tầng Ưu Tiên | Winner & Kết Quả Thực Tế | Trạng Thái Engine / Log Output |
|:---:|:---|:---|:---|:---:|:---|:---|
| **1** | `keep_period` | Keep stop in original week/month (`eligible_vehicles`) | **SR: Balance Capacity / Overload Shift** (Đẩy sang tuần/tháng sau do quá tải) | **Tầng 9 vs Tầng 19** | **CR `keep_period` THẮNG**.<br>Job giữ đúng tuần/tháng, không bị di chuyển sang tuần/tháng mới do quá tải. | `KEEP_PERIOD_ENFORCED`<br>Chặn đẩy job vượt ranh giới tuần/tháng. |
| **2** | `force_tech` | Assign ONLY to specific technician (`eligible_vehicles`) | **1. SR: Region Enforcement Strict** (KTV ngoài vùng)<br>**2. SR: Skill Matching** (KTV thiếu bằng/skill)<br>**3. SR: Day Exclusions** (Ngày KTV nghỉ) | **Tầng 3 vs Tầng 7, 8, 15** | **CR `force_tech` THẮNG**.<br>Loại bỏ toàn bộ KTV khác, ép gán duy nhất KTV chỉ định bất chấp Vùng hay Skill. | `FORCE_TECH_ENFORCED`<br>Ghi log cảnh báo `REGION_VIOLATION_OVERRIDDEN` hoặc `SKILL_MISMATCH_IGNORED`. |
| **3** | `prefer_tech` | Prefer technician without forcing (`vehicle_weight`) | **SR: Preferred Tech / Historical KTV** (Đề xuất KTV khác do lịch sử chăm sóc) | **Tầng 20 vs Tầng 21** | **Cân bằng Hàm Phạt (Objective Score)**.<br>CR `prefer_tech` được cộng điểm phạt cao hơn SR Preferred Tech. | `SOFT_PREFERENCE_SCORED`<br>Solver chọn KTV có tổng Penalty thấp nhất. |
| **4** | `movement_limit` | Restrict day movement ± limit (`eligible_vehicles`) | **SR: System Re-optimization Range** (Tính năng tự động quét lại lịch 14 ngày) | **Tầng 10 vs Tầng 11** | **CR `movement_limit` THẮNG**.<br>Solver chỉ được phép dịch chuyển ngày trong biên độ limit (VD: ±2 ngày). | `MOVEMENT_LIMIT_BOUNDED`<br>Loại bỏ các ngày ngoài khoảng `[Date - Limit, Date + Limit]`. |
| **5** | `time_window` | Restrict/prefer arrival range (`arrival_window_*`) | **SR: Default Service Hours** (Khung giờ dịch vụ chi nhánh VD: 8:30-18:00) | **Tầng 4 vs Tầng 11** | **Tập Nghiệm Rỗng (Infeasible Window)**.<br>Nếu CR nằm ngoài SR, Job rơi vào danh sách Unassigned (`0 jobs scheduled`). | `INFEASIBLE_TIME_WINDOW`<br>Sạch lỗi, không crash: `Job window outside Working Hours`. |
| **6** | `arrival_window_duration` | Fixed window around scheduled time (`arrival_window_*`) | **SR: Max Last Appointment** (Giờ hẹn cuối không quá 16:00) | **Tầng 4 vs Tầng 5** | **CR `arrival_window_duration` THẮNG**.<br>Gán ca muộn nếu window kéo dài quá 16:00. | `OVERTIME_DETECTED`<br>Cảnh báo tăng ca cho KTV trong báo cáo hiệu suất. |
| **7** | `first_stop` | Route matching stops first (`vehicle_weight`) | **SR: Travel Time Minimization** (Tối ưu tuyến đường ngắn nhất từ Depot) | **Tầng 22 vs Soft Rules** | **CR `first_stop` THẮNG TRỌNG SỐ**.<br>Job phải đi đầu tiên dù quãng đường tới điểm này dài hơn điểm khác. | `FIRST_STOP_PENALTY_APPLIED`<br>Phạt nặng nếu xếp job này ở vị trí thứ 2 trở đi. |
| **8** | `last_stop` | Route matching stops last (`vehicle_weight`) | **SR: Max Working Hours / Shift End** (Giờ kết thúc ca làm việc) | **Tầng 22 vs Tầng 6** | **SR: Max Shift End THẮNG**.<br>Nếu xếp job cuối cùng làm quá giờ hết ca, Solver sẽ không thể gán. | `LAST_STOP_SHIFT_EXCEEDED`<br>Unassigned nếu kéo dài quá shift end. |
| **9** | `lock` | Keep stop fixed in place (`locked`) | **SR: Workload Fairness** (Cân bằng tải giữa các KTV) | **Tầng 2 vs Tầng 18** | **CR `lock` THẮNG**.<br>Job đứng yên cố định về KTV, ngày và giờ. Các job khác tự xếp lại xung quanh. | `LOCKED_STOP_PRESERVED`<br>Bỏ qua hoàn toàn trong thuật toán xáo trộn vị trí. |
| **10** | `exclude` | Remove stop from routing entirely (`Application layer`) | **All System Rules** (Mọi quy tắc hệ thống) | **Tầng 1 (Bậc cao nhất)** | **CR `exclude` THẮNG TUYỆT ĐỐI**.<br>Job bị lọc bỏ ngay ở Application Layer trước khi đưa vào Solver. | `PRE_FILTER_EXCLUDED`<br>`applied_jobs = 0` ngay lập tức. |

---

## CHI TIẾT TỪNG PHƯƠNG THỨC NGUYÊN THỦY (SOLVER PRIMITIVES)

### 1. `keep_period`
* **Primitive:** `eligible_vehicles` (Loại bỏ các ngày nằm ngoài Tuần hoặc Tháng ban đầu).
* **Xung đột System:** System Rule **Capacity Balancer** muốn đẩy Job quá tải sang tuần sau.
* **Xử lý:** Primitive chặn các ngày của tuần sau. Solver bắt buộc xếp vào tuần hiện tại hoặc báo Unassigned.

### 2. `force_tech`
* **Primitive:** `eligible_vehicles` (Chỉ giữ lại đúng 1 KTV được chỉ định).
* **Xung đột System:** System Rules về **Region (Vùng)**, **Skill (Kỹ năng)**, và **Day Exclusions (Ngày nghỉ)** loại KTV này.
* **Xử lý:** Primitive đè bẹp các bộ lọc System, ép danh sách KTV hợp lệ = `[forced_tech]`.

### 3. `prefer_tech`
* **Primitive:** `vehicle_weight` (Cộng Penalty vào hàm mục tiêu đối với các KTV khác).
* **Xung đột System:** System Rule **Preferred Tech** chọn KTV cũ.
* **Xử lý:** Solver so sánh điểm phạt (Weight). Penalty của `prefer_tech` từ Custom Rule thường lớn hơn nên sẽ thắng.

### 4. `movement_limit`
* **Primitive:** `eligible_vehicles` (Loại bỏ các ngày ngoài khoảng $[Date - Limit, Date + Limit]$).
* **Xung đột System:** **Auto Re-optimization** muốn di chuyển job xa hơn để tối ưu tổng quãng đường cả tháng.
* **Xử lý:** Primitive xén bớt miền tìm kiếm ngày của Solver.

### 5. `time_window` & 6. `arrival_window_duration`
* **Primitive:** `arrival_window_*` (Thiết lập cửa sổ thời gian cứng/mềm).
* **Xung đột System:** **Default Service Hours** (Khung giờ làm việc chi nhánh) & **Max Last Appointment** (Giờ hẹn cuối).
* **Xử lý:** Nếu $Window_{CR} \cap Window_{System} = \emptyset \implies$ **Unassigned**. Nếu trùng một phần $\implies$ Chọn khoảng giao nhau.

### 7. `first_stop` & 8. `last_stop`
* **Primitive:** `vehicle_weight` (Cộng điểm phạt cực lớn nếu điểm không nằm đầu/cuối tuyến).
* **Xung đột System:** **Travel Time Minimization** (Tối ưu tổng kilomet di chuyển) & **Shift End** (Giờ hết ca).
* **Xử lý:** `first_stop` chấp nhận đi đường vòng để phục vụ trước. `last_stop` phải dừng trước giờ hết ca của KTV.

### 9. `lock`
* **Primitive:** `locked` (Khóa cứng 3 thuộc tính: Technician, Date, Time).
* **Xung đột System:** **Workload Fairness** (Cân bằng khối lượng công việc).
* **Xử lý:** Engine giữ nguyên điểm này, không chạy thuật toán giao hoán (swap) hay di chuyển (move).

### 10. `exclude`
* **Primitive:** `Application layer` (Loại bỏ từ tầng ứng dụng trước khi chuyển tới Solver Engine).
* **Xung đột System:** Mọi System Rule cố gắng lập lịch cho Job này.
* **Xử lý:** Job không tồn tại trong tập dữ liệu $Input_{Solver}$.
