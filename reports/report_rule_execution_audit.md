# BÁO CÁO ĐỐI CHIẾU KIỂM THỬ THỰC TẾ: BẬT ĐỒNG THỜI CUSTOM RULE & SYSTEM RULE

**Dự án:** Mantis AI Routing Autopilot  
**Thời gian:** 05/10/2026  
**Thực hiện:** Antigravity AI Agent  
**Căn cứ kiểm thử:** `priority-hierarchy.md` (27 Priority Ranks), `rules-catalog.md`, `cross-module-combos.csv`, `module-rules-testcases.csv`

---

## I. NGUYÊN TẮC PHÂN XỬ KHI BẬT CẢ CUSTOM RULE VÀ SYSTEM RULE

Khi bật đồng thời **Custom Rule (CR)** và **System Rule (SR)**:
1. **Có Xung Đột (Conflict):** Hai quy tắc quy định điều kiện mâu thuẫn/triệt tiêu nhau trên cùng 1 Job/KTV. Quy tắc nào có **Tầng ưu tiên (Priority Rank) nhỏ hơn (từ 1 đến 27)** sẽ **THẮNG (Win)** và được hệ thống áp dụng; quy tắc còn lại bị **Ghi đè (Overridden)** hoặc rơi vào **Bất khả thi (Infeasible Window)**.
2. **Không Xung Đột (No Conflict / Co-exist):** Hai quy tắc bổ sung cho nhau hoặc tác động lên hai khía cạnh khác nhau (VD: `keep_period` quản lý Tuần/Tháng + `Max Travel Distance` quản lý Kilomet). **Cả hai quy tắc đều cùng áp dụng**.

---

## II. BẢNG PHÂN LOẠI CHI TIẾT TỪNG CUSTOM RULE KHI BẬT CÙNG SYSTEM RULES

---

### 1. Custom Rule: `exclude` (Bật cùng System Rules)
* **Kịch bản kiểm thử:** Gắn `CR: exclude` cho Job A, đồng thời bật `SR: Service Hours`, `SR: Max Distance`, `SR: Skill Matching`.
* **Trạng thái Xung Đột:** ⚡ **CÓ XUNG ĐỘT (TERMINAL OVERRIDE)**.
* **Quy tắc được áp dụng:** **CR `exclude` (Tầng 1 - Cao nhất)**.
* **Kết quả thực tế:** Job A bị loại bỏ 100% khỏi luồng xử lý trước khi vào Solver (`applied_jobs = 0`). Tất cả System Rules đều bị vô hiệu hóa đối với Job này.

---

### 2. Custom Rule: `lock` (Bật cùng System Rules)
* **Kịch bản kiểm thử:** Khóa `CR: lock` Job B cố định cho KTV John lúc 09:00 AM, đồng thời bật `SR: Workload Fairness` (Cân bằng tải) và `SR: Max Travel Distance`.
* **Trạng thái Xung Đột:**
  * Đối với `SR: Workload Fairness` $\rightarrow$ ⚡ **CÓ XUNG ĐỘT**. **CR `lock` THẮNG (Tầng 2 vs Tầng 18)**.
  * Đối với `SR: Max Travel Distance` $\rightarrow$ 🤝 **KHÔNG XUNG ĐỘT**. **CẢ HAI CÙNG ÁP DỤNG**.
* **Quy tắc được áp dụng:** Job B đứng yên tại John; Solver áp dụng `Max Travel Distance` cho các Job *chưa khóa* khác xung quanh.

---

### 3. Custom Rule: `force_tech` (Bật cùng System Rules)
* **Kịch bản 3.1 (vs `SR: Region Enforcement Strict`):** Ép gán Job C cho Chris (`force_tech`), Chris thuộc Vùng Quận 7, Job C ở Vùng Quận 1 (`Region Strict = ON`).
  * **Trạng thái:** ⚡ **CÓ XUNG ĐỘT**.
  * **Quy tắc áp dụng:** **CR `force_tech` THẮNG (Tầng 3 vs Tầng 7)**. Chris vẫn nhận Job C, ghi log `REGION_VIOLATION_OVERRIDDEN`.
* **Kịch bản 3.2 (vs `SR: Skill Matching STRICT`):** Ép gán Job D cho Alex, Alex thiếu kỹ năng dịch vụ (`Skill Match = ON`).
  * **Trạng thái:** ⚡ **CÓ XUNG ĐỘT**.
  * **Quy tắc áp dụng:** **CR `force_tech` THẮNG (Tầng 3 vs Tầng 8)**. Alex vẫn nhận Job D, ghi log `SKILL_MISMATCH_IGNORED`.
* **Kịch bản 3.3 (vs `SR: Day Exclusions`):** Ép gán Job E cho David vào Thứ 2, David có lịch nghỉ ngày Thứ 2.
  * **Trạng thái:** ⚡ **CÓ XUNG ĐỘT (Q3 Open Question)**.
  * **Quy tắc áp dụng:** **CR `force_tech` THẮNG (Tầng 3 vs Tầng 15)** nếu ca làm việc còn mở. *Lưu ý:* Nếu David off 24h, Engine trả về `UNASSIGNABLE_TECH_UNAVAILABLE`.

---

### 4. Custom Rule: `time_window` strict (Bật cùng System Rules)
* **Kịch bản 4.1 (vs `SR: Default Service Hours [08:30-18:00]`):** Khách đặt khung giờ cứng `CR: [06:00-07:30]`.
  * **Trạng thái:** ⚡ **CÓ XUNG ĐỘT TRIỆT TIÊU (INFEASIBLE WINDOW)**.
  * **Quy tắc áp dụng:** **CR `time_window` (Tầng 4)** đứng trên **SR Service Hours (Tầng 11)**. Tuy nhiên do lệch giờ hoạt động, kết quả là **Tập nghiệm rỗng (0 jobs scheduled)**. Log ghi nhận `INFEASIBLE_TIME_WINDOW`.
* **Kịch bản 4.2 (vs `SR: Max Last Appointment Departure [16:00]`):** Đặt hẹn `CR: [16:30-18:30]`.
  * **Trạng thái:** ⚡ **CÓ XUNG ĐỘT**.
  * **Quy tắc áp dụng:** **CR `time_window` THẮNG (Tầng 4 vs Tầng 5)**. Job được xếp lúc 16:30, ghi log `OVERTIME_DETECTED`.

---

### 5. Custom Rule: `keep_period` (Bật cùng System Rules)
* **Kịch bản kiểm thử:** Đặt `CR: keep_period (week)`, đồng thời bật `SR: Auto Re-optimization` và `SR: Max Jobs per day`.
* **Trạng thái Xung Đột:**
  * Đối với `SR: Auto Re-optimization` (đẩy job sang tuần khác do quá tải) $\rightarrow$ ⚡ **CÓ XUNG ĐỘT**. **CR `keep_period` THẮNG (Tầng 9 vs Tầng 11/Soft)**.
  * Đối với `SR: Max Jobs per day` $\rightarrow$ 🤝 **KHÔNG XUNG ĐỘT**. **CẢ HAI CÙNG ÁP DỤNG**.
* **Quy tắc được áp dụng:** Job bắt buộc nằm ở tuần cũ AND không vượt quá giới hạn Max Jobs/ngày của tuần đó.

---

### 6. Custom Rule: `movement_limit` (Bật cùng System Rules)
* **Kịch bản kiểm thử:** Đặt `CR: movement_limit = 2 ngày`, đồng thời bật `SR: Optimization Horizon = 14 ngày`.
* **Trạng thái Xung Đột:** ⚡ **CÓ XUNG ĐỘT VỀ MIỀN TÌM KIẾM**.
* **Quy tắc được áp dụng:** **CR `movement_limit` THẮNG (Tầng 10 vs Tầng 11)**. Solver cắt nhỏ miền tìm kiếm từ 14 ngày xuống chỉ còn `[Ngày cũ ± 2 ngày]`.

---

### 7. Custom Rule: `prefer_tech` (Bật cùng System Rules)
* **Kịch bản kiểm thử:** Đặt `CR: prefer_tech (Alex)`, đồng thời bật `SR: Preferred Tech (Bob - theo lịch sử)`.
* **Trạng thái Xung Đột:** 🤝 **KHÔNG XUNG ĐỘT CỨNG (CẢ HAI CÙNG LÀ SOFT RULES)**.
* **Quy tắc được áp dụng:** **CẢ HAI CÙNG ĐƯỢC ÁP DỤNG TRONG HÀM MỤC TIÊU (OBJECTIVE SCORE)**. Solver tính điểm Penalty cho cả 2 tiêu chí, trong đó `CR prefer_tech` có trọng số ưu tiên cao hơn.

---

### 8. Custom Rule: `first_stop` / `last_stop` (Bật cùng System Rules)
* **Kịch bản kiểm thử:** Đặt `CR: last_stop`, đồng thời bật `SR: Max Shift End Time = 18:00` (Job kéo dài đến 19:00).
* **Trạng thái Xung Đột:** ⚡ **CÓ XUNG ĐỘT**.
* **Quy tắc được áp dụng:** **SR: Max Shift End Time THẮNG (Tầng 6 vs Tầng 17)**. Do System Rule quy định giờ hết ca có bậc ưu tiên cao hơn điểm dừng cuối, Job không thể gán và rơi vào `Unassigned` (Log: `SHIFT_END_EXCEEDED`).

---

### 9. Custom Rule: `arrival_window_duration` (Bật cùng System Rules)
* **Kịch bản kiểm thử:** Đặt `CR: arrival_window_duration = 3600s`, đồng thời bật `SR: Arrival Window Override (SC) = 2h`.
* **Trạng thái Xung Đột:** 🤝 **KHÔNG XUNG ĐỘT (BỔ SUNG CHO NHAU)**.
* **Quy tắc được áp dụng:** **CẢ HAI CÙNG ÁP DỤNG**. Custom Rule đóng vai trò hiển thị khung giờ cho khách hàng (Display only) nằm đè lên cấu hình mặc định của System.

---

## III. MA TRẬN BẢNG TỔNG HỢP KIỂM THỬ (SUMMARY AUDIT MATRIX)

| STT | Custom Rule | System Rule Đi Kèm | Trạng Thái Xung Đột | Quy Tắc Nào Được Áp Dụng? | Lý Do / Tầng Ưu Tiên |
|:---:|:---|:---|:---:|:---|:---|
| **1** | `exclude` | Service Hours, Max Distance, Skill | ⚡ **Có Xung Đột** | **CR `exclude`** | Tầng 1 (Ghi đè tuyệt đối) |
| **2** | `lock` | Workload Fairness | ⚡ **Có Xung Đột** | **CR `lock`** | Tầng 2 vs Tầng 18 |
| **3** | `lock` | Max Travel Distance | 🤝 **Không Xung Đột** | **Cả hai cùng áp dụng** | CR giữ vị trí job; SR giới hạn KM các job khác |
| **4** | `force_tech` | Region Enforcement Strict | ⚡ **Có Xung Đột** | **CR `force_tech`** | Tầng 3 vs Tầng 7 |
| **5** | `force_tech` | Skill Matching STRICT | ⚡ **Có Xung Đột** | **CR `force_tech`** | Tầng 3 vs Tầng 8 |
| **6** | `force_tech` | Day Exclusions | ⚡ **Có Xung Đột** | **CR `force_tech`** | Tầng 3 vs Tầng 15 (Nếu ca mở) |
| **7** | `time_window` | Default Service Hours (Lệch khung) | ⚡ **Có Xung Đột** | **CR `time_window` (Infeasible)** | Tầng 4 vs 11 $\rightarrow$ Unassigned (0 jobs) |
| **8** | `time_window` | Max Last Appointment Departure | ⚡ **Có Xung Đột** | **CR `time_window`** | Tầng 4 vs Tầng 5 |
| **9** | `keep_period` | Re-optimization Range | ⚡ **Có Xung Đột** | **CR `keep_period`** | Tầng 9 vs Tầng 11 |
| **10** | `keep_period` | Max Jobs per day | 🤝 **Không Xung Đột** | **Cả hai cùng áp dụng** | CR giữ tuần; SR giới hạn số job/ngày |
| **11** | `movement_limit` | Optimization Horizon (14 ngày) | ⚡ **Có Xung Đột** | **CR `movement_limit`** | Tầng 10 vs Tầng 11 |
| **12** | `prefer_tech` | System Preferred Tech | 🤝 **Soft / Không Xung Đột** | **Cả hai cùng áp dụng** | Cộng điểm hàm mục tiêu (CR có weight lớn hơn) |
| **13** | `last_stop` | Max Shift End Time | ⚡ **Có Xung Đột** | **SR `Max Shift End`** | Tầng 6 vs Tầng 17 (SR thắng) |
| **14** | `arrival_window` | SC Arrival Window Override | 🤝 **Không Xung Đột** | **Cả hai cùng áp dụng** | CR hiển thị giao diện đè lên SC |
