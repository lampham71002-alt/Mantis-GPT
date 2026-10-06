# BÁO CÁO CÁC CASE XUNG ĐỘT TRỰC TIẾP (CONFLICT NOTIFICATIONS) KHI BẬT CUSTOM VÀ SYSTEM RULE CÙNG LÚC

**Dự án:** Mantis AI Routing Autopilot  
**Thời gian:** 05/10/2026  
**Thực hiện:** Antigravity AI Agent  
**Nguồn dữ liệu:** `priority-hierarchy.md`, `rules-catalog.md`, `cross-module-combos.csv`

---

## TỔNG QUAN

Khi người dùng bật đồng thời **Custom Rule (CR)** và **System Rule (SR)** có thiết lập mâu thuẫn trên cùng một đối tượng (Job / KTV), hệ thống Mantis sẽ **xử lý xung đột (Conflict Handling)** và hiển thị thông báo lỗi / cảnh báo trong **UI (Activity Feed / Notification Modal)** và **Log hệ thống (`feeds/errors` & `feeds/history`)**.

---

## BẢNG 8 CASE CONFLICT CỤ THỂ VÀ PHẢN HỒI BÁO LỖI HỆ THỐNG

| STT | Custom Rule (CR) | System Rule (SR) | Bản Chất Xung Đột | Thắng / Thua | Thông Báo Trạng Thái UI / Feeds Log |
|:---:|:---|:---|:---|:---:|:---|
| **1** | `CR: force_tech (Chris)` | `SR: Region Enforcement Strict` (Chris thuộc Quận 7, Job ở Quận 1) | **Mâu thuẫn phân vùng địa lý KTV**: Custom Rule ép gán KTV nằm ngoài vùng hoạt động cho phép của System Rule. | **CR Force Tech THẮNG** | ⚠️ **Warning Log:** `REGION_VIOLATION_OVERRIDDEN`<br>Job được gán cho Chris. Cảnh báo trên UI: *"Technician assigned outside strict region per Custom Rule override"*. |
| **2** | `CR: force_tech (Alex)` | `SR: Skill Matching (STRICT)` (Job yêu cầu Skill Lvl 5, Alex chỉ có Lvl 2) | **Mâu thuẫn năng lực / bằng cấp**: Custom Rule ép gán KTV không đủ kỹ năng chuyên môn. | **CR Force Tech THẮNG** | ⚠️ **Warning Log:** `SKILL_MISMATCH_IGNORED`<br>Job được gán cho Alex. Cảnh báo trên UI: *"Technician assigned lacks required skill level (Overridden by force_tech)"*. |
| **3** | `CR: force_tech (David)` | `SR: Day Exclusions` (David xin nghỉ ngày Thứ 2) | **Mâu thuẫn lịch làm việc**: Custom Rule ép gán công việc vào ngày KTV nghỉ phép. | **CR Force Tech THẮNG (Nếu ca mở)**<br>hoặc **Unassigned** | ❌ **Error Notification:** `UNASSIGNABLE_TECH_UNAVAILABLE`<br>Nếu David nghỉ 24h: Job rơi vào Unassigned kèm báo lỗi UI: *"Technician David is off on Monday. Job could not be assigned."* |
| **4** | `CR: time_window strict [06:00 - 07:30]` | `SR: Default Service Hours [08:30 - 18:00]` | **Mâu thuẫn khung giờ hoạt động**: Khung giờ cứng của Custom Rule nằm hoàn toàn bên ngoài giờ mở cửa dịch vụ của chi nhánh. | **Không thể thỏa mãn (Infeasible Window)** | 🚫 **Conflict Error UI Log:** `INFEASIBLE_TIME_WINDOW`<br>`applied_jobs = 0`. UI báo đỏ: *"Conflict detected: Time window [06:00-07:30] is outside Default Service Hours [08:30-18:00]. 0 jobs scheduled."* |
| **5** | `CR: time_window strict [16:30 - 18:30]` | `SR: Max Last Appointment Departure [16:00]` | **Mâu thuẫn giờ hẹn cuối trong ngày**: Custom Rule yêu cầu đến sau 16:30 nhưng System Rule cấm hẹn sau 16:00. | **CR Time Window THẮNG** | ⚠️ **Warning Log:** `MAX_LAST_APPT_OVERRIDDEN`<br>Job được xếp lịch lúc 16:30. Cảnh báo trên UI: *"Appointment scheduled after 16:00 max cutoff due to strict Time Window rule."* |
| **6** | `CR: last_stop` | `SR: Max Shift End Time [18:00]` (Job kéo dài đến 19:00) | **Mâu thuẫn hết ca làm việc**: Custom Rule bắt làm điểm cuối, nhưng nếu xếp cuối sẽ quá giờ làm việc tối đa của KTV. | **SR Max Shift End THẮNG** | ❌ **Conflict Error UI Log:** `SHIFT_END_EXCEEDED`<br>Job không thể xếp lịch (`Unassigned`). UI hiển thị: *"Conflict: Assigning job as last_stop exceeds Technician Max Shift End Time (18:00)."* |
| **7** | `CR: keep_period (week)` | `SR: Auto Re-optimization Range` (Tuần này 100% quá tải, cần đẩy sang tuần sau) | **Mâu thuẫn giới hạn di chuyển theo thời gian**: Custom Rule cấm đẩy job ra khỏi tuần hiện tại. | **CR Keep Period THẮNG** | ℹ️ **Notice Log:** `KEEP_PERIOD_RESTRICTED`<br>Job bị giữ lại tuần hiện tại. UI báo: *"Job retained in original week per keep_period rule. Unassigned due to weekly capacity limit."* |
| **8** | `CR: lock` | `SR: Workload Balance` (KTV bị khóa đang quá tải 8 jobs/ngày) | **Mâu thuẫn cân bằng tải**: System Rule muốn điều chuyển job sang KTV rảnh hơn nhưng job bị khóa cứng. | **CR Lock THẮNG** | ℹ️ **Info Log:** `LOCKED_JOB_SKIP_REBALANCE`<br>Job đứng yên. UI hiển thị icon Khóa: *"Job is locked. Workload balancing bypassed for this stop."* |

---

## CHI TIẾT CÁC THÔNG BÁO XUNG ĐỘT HIỂN THỊ TRÊN UI (UI CONFLICT NOTIFICATIONS)

1. **Báo Lỗi Đỏ (Infeasible / Conflict Error - `applied_jobs = 0`):**
   - Xuất hiện khi điều kiện Custom Rule và System Rule **triệt tiêu lẫn nhau** tạo ra tập nghiệm rỗng (VD: Case 4 - `time_window` lệch `service_hours`, Case 6 - `last_stop` lấn `max_shift_end`).
   - UI hiển thị Modal cảnh báo xung đột kèm nút *"View Conflict Details"* trong Activity Feed.

2. **Cảnh Báo Vàng (Override Warning - Job vẫn được phân bổ):**
   - Xuất hiện khi Custom Rule cấp cao (**Tầng 1-3**) đè lên các System Rules (**Tầng 7-15**) như Case 1 (`force_tech` đè `Region`), Case 2 (`force_tech` đè `Skill`).
   - UI vẫn gán công việc thành công nhưng hiển thị Badge cảnh báo `Override` trên giao diện Lịch Calendar.
