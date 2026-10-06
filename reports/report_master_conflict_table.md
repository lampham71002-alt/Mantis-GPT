# BÁO CÁO BẢNG TỔNG HỢP KIỂM THỬ XUNG ĐỘT: BẬT ĐỒNG THỜI CUSTOM RULE & SYSTEM RULE

**Dự án:** Mantis AI Routing Autopilot  
**Thời gian:** 05/10/2026  
**Đơn vị thực hiện:** Antigravity AI Agent  
**Căn cứ pháp lý & Kỹ thuật:** `priority-hierarchy.md` (Ma trận 27 Tầng Ưu Tiên), `rules-catalog.md`, `cross-module-combos.csv`

---

## 📊 MASTER CONFLICT AUDIT TABLE (BẢNG TRUY VẤN XUNG ĐỘT MASTER)

| STT | Custom Rule (CR) | System Rule (SR) Đi Kèm | Trạng Thái Xung Đột | Rule Nào Được Áp Dụng? (Winner) | Tầng Ưu Tiên (Priority Rank) | Phản Hồi Thực Tế Của Engine & Log UI |
|:---:|:---|:---|:---:|:---|:---:|:---|
| **1** | `exclude` | Mọi System Rules (Service Hours, Max Distance, Skill Match) | ⚡ **Có Xung Đột** | **`CR: exclude`** | **Tầng 1 vs All** | Job bị loại bỏ 100% trước khi vào Solver (`applied_jobs = 0`). Mọi SR bị vô hiệu hóa. |
| **2** | `lock` | `SR: Workload Fairness` (Cân bằng tải KTV) | ⚡ **Có Xung Đột** | **`CR: lock`** | **Tầng 2 vs Tầng 18** | Job đứng yên cố định. SR không thể điều chuyển job này, chỉ cân bằng các job chưa khóa khác. |
| **3** | `lock` | `SR: Max Travel Distance` (Giới hạn kilomet) | 🤝 **Không Xung Đột** | **Cả 2 Cùng Áp Dụng** | Co-exist | Job bị khóa giữ nguyên vị trí; SR áp dụng giới hạn kilomet cho các job còn lại. |
| **4** | `force_tech (Chris)` | `SR: Region Enforcement Strict` (Chris ngoài vùng) | ⚡ **Có Xung Đột** | **`CR: force_tech`** | **Tầng 3 vs Tầng 7** | Gán job cho Chris bất chấp ranh giới Vùng. Log UI: `REGION_VIOLATION_OVERRIDDEN`. |
| **5** | `force_tech (Alex)` | `SR: Skill Matching STRICT` (Alex thiếu Skill Lvl 5) | ⚡ **Có Xung Đột** | **`CR: force_tech`** | **Tầng 3 vs Tầng 8** | Gán job cho Alex bất chấp thiếu bằng cấp. Log UI: `SKILL_MISMATCH_IGNORED`. |
| **6** | `force_tech (David)` | `SR: Day Exclusions` (David xin nghỉ ngày Thứ 2) | ⚡ **Có Xung Đột** | **`CR: force_tech`** *(Nếu ca mở)* | **Tầng 3 vs Tầng 15** | Gán job nếu ca mở / Báo Unassigned (`UNASSIGNABLE_TECH_UNAVAILABLE`) nếu David vắng mặt 24h. |
| **7** | `time_window strict [06:00-07:30]` | `SR: Default Service Hours [08:30-18:00]` | ⚡ **Có Xung Đột** | **`CR: time_window`** *(Infeasible)* | **Tầng 4 vs Tầng 11** | Cửa sổ bất khả thi $\rightarrow$ Unassigned (`0 jobs scheduled`). Log UI: `INFEASIBLE_TIME_WINDOW`. |
| **8** | `time_window strict [16:30-18:30]` | `SR: Max Last Appointment Departure [16:00]` | ⚡ **Có Xung Đột** | **`CR: time_window`** | **Tầng 4 vs Tầng 5** | Gán ca muộn lúc 16:30 per Time Window. Log UI: `OVERTIME_DETECTED`. |
| **9** | `keep_period (week)` | `SR: Auto Re-optimization` (Đẩy sang tuần mới) | ⚡ **Có Xung Đột** | **`CR: keep_period`** | **Tầng 9 vs Tầng 11** | Chặn không cho đẩy job sang tuần sau do quá tải. Log UI: `KEEP_PERIOD_RESTRICTED`. |
| **10** | `keep_period (week)` | `SR: Max Jobs per day` (Số job/ngày) | 🤝 **Không Xung Đột** | **Cả 2 Cùng Áp Dụng** | Co-exist | Job giữ trong tuần ban đầu AND không vượt quá hạn ngạch Max Jobs/ngày của KTV. |
| **11** | `movement_limit (2 ngày)` | `SR: Optimization Horizon` (Quét 14 ngày) | ⚡ **Có Xung Đột** | **`CR: movement_limit`** | **Tầng 10 vs Tầng 11** | Solver xén nhỏ miền tìm kiếm ngày xuống `[Ngày cũ ± 2 ngày]`. |
| **12** | `prefer_tech (Alex)` | `SR: Preferred Tech` (Bob - theo lịch sử) | 🤝 **Soft Conflict** | **Cả 2 Cùng Áp Dụng** | **Tầng 20 vs Tầng 21** | Solver tính hàm phạt (Objective Score). `CR prefer_tech` có trọng số ưu tiên cao hơn. |
| **13** | `last_stop` | `SR: Max Shift End Time` (Vượt quá giờ hết ca) | ⚡ **Có Xung Đột** | **`SR: Max Shift End`** | **Tầng 6 vs Tầng 17** | **SR THẮNG**. Do Shift End cao cấp hơn Last Stop $\rightarrow$ Unassigned (`SHIFT_END_EXCEEDED`). |
| **14** | `arrival_window_duration` | `SR: Arrival Window Override (SC)` | 🤝 **Không Xung Đột** | **Cả 2 Cùng Áp Dụng** | **Tầng 25 vs Tầng 16** | CR đóng vai trò hiển thị khung giờ cho khách hàng (Display only) đè lên cấu hình SC. |

---

## 📌 TÓM TẮT QUY TẮC PHÂN XỬ NHANH (EXECUTIVE SUMMARY)

1. **Custom Rules Nhóm Overrides (Tầng 1 - 4):** `exclude`, `lock`, `force_tech`, `time_window` **LUÔN THẮNG** các System Rules về Vùng (`Region`), Kỹ năng (`Skill`), và Giờ làm việc (`Service Hours`).
2. **Trường Hợp Ngoại Lệ System Rules Thắng (Tầng 5 - 6):** `SR: Max Shift End Time` (Giờ hết ca làm việc) và `SR: Max Last Appointment` đứng **CAO HƠN** các Custom Rule vị trí như `first_stop`, `last_stop`.
3. **Các Trường Hợp Không Xung Đột (Co-existence):** Các quy tắc quản lý không gian (Vùng/Kilomet) và thời gian (Tuần/Tháng) hoạt động song song bổ trợ cho nhau mà không triệt tiêu nhau.
