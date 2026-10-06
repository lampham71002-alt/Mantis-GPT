# BÁO CÁO CHI TIẾT CÁC CASE CONFLICT GIỮA SYSTEM RULES VÀ CUSTOM RULES (MANTIS AI ENGINE)

**Dự án:** Mantis AI Routing Autopilot  
**Thời gian:** 05/10/2026  
**Thực hiện:** Antigravity AI Agent  
**Tài liệu gốc:** `priority-hierarchy.md`, `rules-catalog.md`, `cross-module-combos.csv`, `module-rules-testcases.csv`

---

## I. TỔNG QUAN VỀ PHÂN THỨC QUYỀN HẠN (RULES HIERARCHY)

Trong Mantis AI Engine, khi một **Custom Rule (CR)** và một **System Rule (SR)** áp đặt các điều kiện trái ngược nhau lên cùng một Công việc (Job) hoặc Kỹ thuật viên (KTV), hệ thống phân định thắng / thua theo thứ tự ưu tiên 27 cấp.

> **Quy tắc cốt lõi (Precedence Principle):**  
> $$\text{Specific Rules (Chi tiết)} > \text{Custom Rules (Tùy chỉnh)} > \text{Manual Filters (Bộ lọc thủ công)} > \text{System Rules (Hệ thống)}$$

---

## II. CHI TIẾT TỪNG CASE CONFLICT CỤ THỂ (CASE-BY-CASE CONFLICT DETAILS)

### 🔴 NHÓM 1: CUSTOM RULE GHI ĐÈ TUYỆT ĐỐI (FORCE & OVERRIDE CASES)

---

### 📌 Case 1.1: `CR: force_tech` vs `System Rule: Region Enforcement Strict`
* **Mô tả xung đột:**
  * **Custom Rule:** Người dùng tạo rule ép buộc gán Job A cho Technican **Chris** (`force_tech: Chris`).
  * **System Rule:** Cấu hình hệ thống `Region Enforcement Strict = ON`. Job A nằm ở **Vùng Quận 1**, trong khi Technican Chris thuộc quản lý **Vùng Quận 7** (không phủ sóng Quận 1).
* **Thứ tự ưu tiên:** `CR: force_tech` (**Tầng 3**) vs `System: Region Strict` (**Tầng 7**).
* **Kết quả phân xử (Winner):** **`CR: force_tech` THẮNG**.
* **Hành vi thực tế của Engine:**
  * Engine bỏ qua ranh giới Vùng (Region constraint).
  * Job A vẫn được gán thành công cho Chris.
  * Trong log giải trình của Engine xuất hiện cảnh báo mềm: `REGION_VIOLATION_OVERRIDDEN_BY_FORCE_TECH`.

---

### 📌 Case 1.2: `CR: force_tech` vs `System Rule: Skill Matching`
* **Mô tả xung đột:**
  * **Custom Rule:** Ép gán Job B (yêu cầu kỹ năng "Lắp đặt Điện âm tường - Skill Level 5") cho Technican **Alex** (`force_tech: Alex`).
  * **System Rule:** System Rule `Skill Matching = STRICT`. Alex hiện tại chỉ có chứng chỉ "Sửa chữa Điện lạnh - Skill Level 2".
* **Thứ tự ưu tiên:** `CR: force_tech` (**Tầng 3**) vs `System: Skill Matching` (**Tầng 8**).
* **Kết quả phân xử (Winner):** **`CR: force_tech` THẮNG**.
* **Hành vi thực tế của Engine:**
  * Engine bỏ qua kiểm tra bằng cấp/kỹ năng.
  * Job B được gán cho Alex.
  * Engine ghi nhận log: `SKILL_MISMATCH_IGNORED_DUE_TO_FORCE_RULE`.

---

### 📌 Case 1.3: `CR: force_tech` vs `System Rule: Day Exclusions / Holiday`
* **Mô tả xung đột:**
  * **Custom Rule:** Ép gán Job C thực hiện vào Thứ 2 cho Technican **David** (`force_tech: David`).
  * **System Rule:** System Rule / Lịch làm việc hệ thống ghi nhận Thứ 2 là ngày nghỉ phép cố định của David (`Day Exclusions: Monday`).
* **Thứ tự ưu tiên:** `CR: force_tech` (**Tầng 3**) vs `System: Day Exclusions` (**Tầng 15**).
* **Kết quả phân xử (Winner):** **`CR: force_tech` THẮNG**.
* **Hành vi thực tế của Engine:**
  * Engine sẽ cố gắng đưa Job C vào lịch làm việc của David trong Thứ 2 (nếu ca làm việc có mở).
  * *Lưu ý:* Nếu David được cấu hình "Off hoàn toàn" (vắng mặt 00:00 - 23:59), Engine sẽ báo lỗi `UNASSIGNABLE_TECH_UNAVAILABLE` trong `feeds/errors`.

---

### 📌 Case 1.4: `CR: lock` vs `System Rule: Workload Fairness (Cân bằng tải)`
* **Mô tả xung đột:**
  * **Custom Rule:** Khóa công việc Job D cố định lúc 09:00 AM cho Technican **John** (`lock: true`).
  * **System Rule:** System Rule `Workload Fairness` nhận thấy John đang quá tải (8 jobs/ngày) trong khi Technican **Mike** đang rảnh (1 job/ngày), cần điều chuyển Job D sang Mike.
* **Thứ tự ưu tiên:** `CR: lock` (**Tầng 2**) vs `System: Workload Fairness` (**Tầng 18**).
* **Kết quả phân xử (Winner):** **`CR: lock` THẮNG**.
* **Hành vi thực tế của Engine:**
  * Engine giữ nguyên vị trí Job D của John, không dịch chuyển.
  * Solver điều phối các công việc *chưa khóa* khác sang cho Mike để cân bằng tải tối đa có thể.

---

### 📌 Case 1.5: `CR: exclude` vs Tất cả các System Rules
* **Mô tả xung đột:**
  * **Custom Rule:** Gắn thẻ loại trừ Job E (`exclude: true`).
  * **System Rule:** Các System Rules khác (Max Distance, Skill Match, Service Hours) định giá Job E rất phù hợp để xếp lịch.
* **Thứ tự ưu tiên:** `CR: exclude` (**Tầng 1 - Cao nhất toàn hệ thống**).
* **Kết quả phân xử (Winner):** **`CR: exclude` THẮNG TUYỆT ĐỐI**.
* **Hành vi thực tế của Engine:**
  * Job E bị gạch tên ngay từ bước lọc dữ liệu đầu vào (Pre-filtering).
  * `applied_jobs = 0` cho Job E, không đưa vào ma trận tối ưu.

---

## 🟡 NHÓM 2: CỬA SỔ BẤT KHẢ THI (IMPOSSIBLE WINDOW / INFEASIBLE CASES)

---

### 📌 Case 2.1: `CR: time_window strict` vs `System Rule: Default Service Hours`
* **Mô tả xung đột:**
  * **Custom Rule:** Khách hàng đặt hẹn khung giờ cứng từ **06:00 AM – 07:30 AM** (`time_window strict`).
  * **System Rule:** Khung giờ dịch vụ mặc định của chi nhánh (`Default Service Hours`) quy định mở cửa từ **08:30 AM – 06:00 PM**.
* **Thứ tự ưu tiên:** `CR: time_window strict` (**Tầng 4**) vs `System: Default Service Hours` (**Tầng 11**).
* **Kết quả phân xử (Winner):** **`CR: time_window strict` THẮNG VỀ MẶT RÀNG BUỘC**.
* **Hành vi thực tế của Engine:**
  * Vì `CR` đứng Tầng 4 bắt buộc phải tuân thủ, nhưng thời gian đó nằm ngoài giờ làm việc của hệ thống (Tầng 11), Solver rơi vào trạng thái **Infeasible Window (Tập nghiệm rỗng)**.
  * **Kết quả:** Job rơi vào danh sách **Unassigned Jobs** (`0 jobs scheduled`).
  * **Log ghi nhận:** `INFEASIBLE_TIME_WINDOW: Job window [06:00-07:30] outside Working Hours [08:30-18:00]`. Engine **không bị crash/lỗi system**.

---

### 📌 Case 2.2: `CR: time_window strict` vs `System Rule: Max Last Appointment Time`
* **Mô tả xung đột:**
  * **Custom Rule:** Yêu cầu hoàn thành công việc từ **04:30 PM – 06:30 PM** (`time_window strict`).
  * **System Rule:** System Rule `Max Last Appointment Time` quy định cuộc hẹn cuối cùng trong ngày không được bắt đầu sau **04:00 PM** để tránh KTV tăng ca.
* **Thứ tự ưu tiên:** `CR: time_window strict` (**Tầng 4**) vs `System: Max Last Appointment` (**Tầng 5**).
* **Kết quả phân xử (Winner):** **`CR: time_window strict` THẮNG**.
* **Hành vi thực tế của Engine:**
  * Engine cho phép xếp ca hẹn lúc 04:30 PM theo yêu cầu của Custom Rule.
  * Ghi nhận cảnh báo tăng ca trong báo cáo hiệu suất KTV: `OVERTIME_DETECTED`.

---

### 📌 Case 2.3: `CR: movement_limit` vs `System Rule: Re-optimization Range`
* **Mô tả xung đột:**
  * **Custom Rule:** Giới hạn công việc chỉ được phép dịch chuyển trong vòng **+/- 2 ngày** so với lịch cũ (`movement_limit: 2 days`).
  * **System Rule:** Tính năng Re-optimization tự động chạy thuật toán quét lại lịch trong vòng **14 ngày**.
* **Thứ tự ưu tiên:** `CR: movement_limit` (**Tầng 10**) vs `System Re-optimization` (**Tầng 11/Soft**).
* **Kết quả phân xử (Winner):** **`CR: movement_limit` THẮNG**.
* **Hành vi thực tế của Engine:**
  * Dù thuật toán Re-opt có thể chuyển job sang ngày thứ 5 để đường đi tối ưu hơn, Engine vẫn chặn lại và chỉ xét các phương án trong biên độ +/- 2 ngày.

---

## 🟢 NHÓM 3: XUNG ĐỘT LUẬT MỀM & CÂN BẰNG ĐIỂM SỐ (SOFT RULES EVALUATION)

---

### 📌 Case 3.1: `CR: prefer_tech` vs `System Rule: Preferred Tech (System Level)`
* **Mô tả xung đột:**
  * **Custom Rule:** Ưu tiên chọn **KTV Alex** (`CR prefer_tech: Alex`).
  * **System Rule:** System Rule cấp hệ thống đề xuất **KTV Bob** dựa trên lịch sử phục vụ khách hàng cũ (`System Preferred Tech: Bob`).
* **Thứ tự ưu tiên:** Cả hai đều thuộc nhóm **Soft Rules** (Tầng 20 và Tầng 21).
* **Kết quả phân xử (Winner):** **HÀM PHẠT TỐI ƯU HÓA (OBJECTIVE SCORE EVALUATION)**.
* **Hành vi thực tế của Engine:**
  * Solver gán trọng số (weights) cho cả 2 tiêu chí.
  * Nếu khoảng cách di chuyển và thời gian của Alex và Bob tương đương, **Custom Rule `prefer_tech` của Khách hàng/User sẽ được cộng điểm ưu tiên cao hơn** so với System Preferred Tech.

---

### 📌 Case 3.2: `CR: keep_period (week)` vs `System Rule: Balance Daily Capacity`
* **Mô tả xung đột:**
  * **Custom Rule:** Yêu cầu giữ công việc ở lại **đúng trong tuần hiện tại** (`keep_period: week`).
  * **System Rule:** Hệ thống phát hiện Tuần này đã quá tải (100% capacity), muốn đẩy Job sang **Tuần sau** (mới đạt 40% capacity) để cân bằng tải.
* **Thứ tự ưu tiên:** `CR: keep_period` (**Tầng 9**) vs `System: Balance Capacity` (**Tầng 19 - Soft**).
* **Kết quả phân xử (Winner):** **`CR: keep_period` THẮNG**.
* **Hành vi thực tế of Engine:**
  * Job bắt buộc phải nằm ở tuần hiện tại. Solver không được phép chuyển Job sang tuần sau bất chấp tuần này đang quá tải.

---

## III. MA TRẬN TỔNG HỢP NHANH (QUICK REFERENCE TABLE)

| STT | Custom Rule (CR) | System Rule (SR) | Tầng Ưu Tiên | Winner | Trạng thái Log / Phản hồi Engine |
|:---:|:---|:---|:---:|:---:|:---|
| **1** | `exclude` | All System Rules | **Tầng 1 vs All** | **CR Exclude** | `0 jobs scheduled` (Bị loại bỏ từ pre-filter) |
| **2** | `lock` | Workload Fairness | **Tầng 2 vs 18** | **CR Lock** | Job đứng yên, sắp xếp các job khác xung quanh |
| **3** | `force_tech` | Region Enforcement Strict | **Tầng 3 vs 7** | **CR Force Tech** | Gán job bất chấp ranh giới Vùng/Miền |
| **4** | `force_tech` | Skill Matching | **Tầng 3 vs 8** | **CR Force Tech** | Gán job bất chấp thiếu Kỹ năng/Bằng cấp |
| **5** | `force_tech` | Day Exclusions (Ngày nghỉ) | **Tầng 3 vs 15** | **CR Force Tech** | Gán job nếu ca làm việc mở / Báo Unassigned nếu vắng mặt |
| **6** | `time_window strict` | Default Service Hours | **Tầng 4 vs 11** | **CR Time Window** | `INFEASIBLE_WINDOW` (`0 jobs scheduled`, Clean Log) |
| **7** | `time_window strict` | Max Last Appointment | **Tầng 4 vs 5** | **CR Time Window** | Gán ca muộn, ghi nhận log `OVERTIME_DETECTED` |
| **8** | `movement_limit` | Re-opt Window (14 ngày) | **Tầng 10 vs 11** | **CR Movement Limit** | Chỉ dịch chuyển trong biên độ đặt trước |
| **9** | `keep_period` | Balance Daily Capacity | **Tầng 9 vs 19** | **CR Keep Period** | Giữ nguyên tuần cũ, không đẩy sang tuần sau |
| **10** | `prefer_tech` | System Preferred Tech | **Soft vs Soft** | **CR Prefer Tech** | Cộng điểm hàm mục tiêu (Objective Score) nghiêng về CR |

---

## IV. KHUYẾN NGHỊ VÀassert CHO AUTOMATION TEST (PLAYWRIGHT)

Khi triển khai các kịch bản test tự động bằng Playwright API (`C:\mantis-auto\tests\api\`):

1. **Test Case Force Override (Case 1.1, 1.2):**
   - Assert HTTP Status: `200 OK`.
   - Assert `applied_jobs == 1`.
   - Assert `job.technician_id == forced_tech_id`.
2. **Test Case Infeasible Window (Case 2.1):**
   - Assert HTTP Status: `200 OK`.
   - Assert `applied_jobs == 0`.
   - Assert `reasons` trong API response chứa mã: `INFEASIBLE_TIME_WINDOW`.
3. **Test Case Lock (Case 1.4):**
   - Assert `start_time` và `technician_id` trước và sau khi run optimization là **hoàn toàn trùng khớp 100%**.
