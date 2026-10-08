# KẾ HOẠCH MASTER FULL COVERAGE (16 TEST CASES BAO PHỦ 100%)
## TOÀN BỘ HỆ SINH THÁI MANTIS CUSTOM RULES (ACCOUNT: `lamlam@gmail.com`)
**Tiêu chuẩn chất lượng:** Senior QA Lead (20 năm kinh nghiệm) | **Cam kết:** Bao phủ 100% tính năng, Zero Fake Pass

---

## 1. MA TRẬN ĐỐI CHIẾU MỨC ĐỘ BAO PHỦ (COVERAGE AUDIT)

Để trả lời câu hỏi **"Bao phủ hết không?"**, bảng dưới đây đối chiếu tất cả các Action Types và cơ chế có trong Mantis:

| Action / Cơ chế trong Mantis | Trạng thái trong bộ 16 Cases | Test Case đại diện |
| :--- | :---: | :--- |
| **`lock`** (Khóa cứng, tuyệt đối cấm đè) | ✅ **100%** | TC-FC-01, TC-FC-03 |
| **`exclude`** (Giữ ngày gốc, cho phép đè lên) | ✅ **100%** | TC-FC-02, TC-FC-04 |
| **Thứ tự ưu tiên `lock` > `exclude`** | ✅ **100%** | TC-FC-03 |
| **Thứ tự ưu tiên `exclude` > `force_tech`** | ✅ **100%** | TC-FC-04 |
| **`force_tech`** (Bắt buộc KTV - đối chiếu 2 schedules) | ✅ **100%** | TC-FC-05, TC-FC-06, TC-FC-07 |
| **`prefer_tech`** (Ưu tiên KTV mềm - soft preference) | ✅ **100%** | TC-FC-08 |
| **`first_stop`** (Chặng dừng đầu ngày 7:00 AM) | ✅ **100%** | TC-FC-06, TC-FC-09, TC-FC-10, TC-FC-12 |
| **`last_stop`** (Chặng dừng cuối ngày trước hết ca) | ✅ **100%** | TC-FC-09, TC-FC-11 |
| **`time_window`** (Khung giờ sáng / chiều) | ✅ **100%** | TC-FC-05, TC-FC-10, TC-FC-11, TC-FC-14 |
| **`keep_period: day`** (Bảo lưu ngày hẹn gốc) | ✅ **100%** | TC-FC-12, TC-FC-14 |
| **`movement_limit`** (Giới hạn dịch chuyển max_days: 0) | ✅ **100%** | TC-FC-13 |
| **Cơ chế Phân rải Jobs qua nhiều ngày** | ✅ **100%** | TC-FC-07, TC-FC-16 |
| **Cơ chế Fallback Day khi xung đột bất khả thi** | ✅ **100%** | TC-FC-15 |
| **Cơ chế Fallback Day khi quá tải thời lượng** | ✅ **100%** | TC-FC-16 |

---

## 2. CHI TIẾT MA TRẬN 16 MASTER FULL COVERAGE TEST CASES

Toàn bộ 16 ca được ánh xạ 100% vào dữ liệu thực tế của 24 jobs Sandbox trên 3 KTV (`Lam`, `custom`, `Minh`):

| Mã TC | Phân Nhóm Kiểm Thử | Mệnh Đề 1 (Action 1) | Mệnh Đề 2 (Action 2) | Cơ Chế Xác Thực Đo Lường (Anti-Fake Pass) |
| :---: | :--- | :--- | :--- | :--- |
| **TC-FC-01** | **Bản Chất `lock`** | Customer `Peter Parker` $\rightarrow$ `lock` | Service `Bed Bug Heat Treatment` $\rightarrow$ `time_window: 13-17h` | Peter Parker bị khóa cứng tại ngày 12/10; Solver route xung quanh, cấm mọi job khác đè lên. |
| **TC-FC-02** | **Bản Chất `exclude`** | Service `Call Back Service` $\rightarrow$ `exclude` | Customer `Bruce Wayne` $\rightarrow$ `first_stop` | Call Back giữ ngày gốc cho phép đè lên; Bruce Wayne nhảy lên Stop #1 lúc 7:00 AM. |
| **TC-FC-03** | **Ưu Tiên `lock` Thắng `exclude`** | Customer `Clark Kent` $\rightarrow$ `lock` | Customer `Clark Kent` $\rightarrow$ `exclude` | Đối đầu trực tiếp trên cùng 1 job: `lock` THẮNG $\rightarrow$ Job bị khóa cứng, cấm tuyệt đối đè. |
| **TC-FC-04** | **Ưu Tiên `exclude` Thắng `force_tech`** | Service `Call Back Service` $\rightarrow$ `exclude` | Customer `Clark Kent` $\rightarrow$ `force_tech: Minh` | Clark Kent có dịch vụ Call Back $\rightarrow$ `exclude` THẮNG $\rightarrow$ Giữ nguyên trạng thái exclude, chặn chuyển KTV. |
| **TC-FC-05** | **Điều Chuyển KTV 2 Schedules (5 Jobs)** | Customer `FL Routing Test 14` $\rightarrow$ `force_tech: Minh` | Customer `FL Routing Test 14` $\rightarrow$ `time_window: 07-11h` | **Bật 2 Schedules `custom` và `Minh`:** Cột `custom` mất sạch 5 jobs; Cột `Minh` nhận đủ 5 jobs ca sáng. |
| **TC-FC-06** | **Điều Chuyển KTV & Đầu Ngày** | Customer `Bruce Wayne` $\rightarrow$ `force_tech: Lam` | Customer `Bruce Wayne` $\rightarrow$ `first_stop` | **Bật 2 Schedules:** `custom` mất job; `Lam` nhận job và xếp đúng Stop #1 lúc 7:00 AM. |
| **TC-FC-07** | **Điều Chuyển Chéo & Phân Rải Sức Chứa** | Customer `Peter Parker` $\rightarrow$ `force_tech: Lam` | Customer `Alexander` $\rightarrow$ `force_tech: custom` | **Bật cả 3 Schedules:** `Lam` nhận Peter Parker; `custom` (đang rảnh) nhận 3 jobs của Alexander trơn tru. |
| **TC-FC-08** | **Ưu Tiên KTV Mềm (`prefer_tech`)** | Customer `Alexander` $\rightarrow$ `prefer_tech: Lam` | Service `Initial Service` $\rightarrow$ `time_window: 13-17h` | Solver ưu tiên gán KTV `Lam` cho Alexander (nếu khả thi) và xếp Initial Service ca chiều. |
| **TC-FC-09** | **Chốt Ca Không Triệt Tiêu** | Service `Bed Bug Heat Treatment` $\rightarrow$ `first_stop` | Customer `Bruce Wayne` $\rightarrow$ `last_stop` | Tách riêng 2 đối tượng: Bed Bug lên Stop #1 (7:00 AM); Bruce Wayne chốt vị trí cuối ngày. |
| **TC-FC-10** | **Chốt Đầu Ngày & Khung Sớm** | Customer `FL Routing Test 17` $\rightarrow$ `first_stop` | Customer `FL Routing Test 17` $\rightarrow$ `time_window: 07-10h` | Đẩy job từ trưa (12:04 PM) lên vị trí Stop #1 lúc 7:00 AM và hoàn tất trước 10:00 AM. |
| **TC-FC-11** | **Đẩy Lên Sáng & Chốt Ca Cuối** | Customer `Sterling` $\rightarrow$ `time_window: 07-11h` | Customer `Miller` $\rightarrow$ `last_stop` | Sterling kéo từ 12:30 trưa lên buổi sáng; Miller chốt ca làm việc cuối ngày của KTV Lam. |
| **TC-FC-12** | **Bảo Lưu Ngày Gốc & Đầu Ngày** | Customer `Peter Parker` $\rightarrow$ `keep_period: day` | Customer `Peter Parker` $\rightarrow$ `first_stop` | Giữ chuẩn ngày gốc 12/10 và Solver đẩy lên vị trí Stop #1 đầu ca lúc 7:00 AM. |
| **TC-FC-13** | **Giới Hạn Dịch Chuyển (`movement_limit`)** | Customer `Clark Kent` $\rightarrow$ `movement_limit: 0` | Customer `Clark Kent` $\rightarrow$ `first_stop` | Cấm dịch chuyển ngày (`max_days: 0`), ép đứng đầu ngày tại đúng ngày gốc 12/10. |
| **TC-FC-14** | **Bảo Lưu Ngày Gốc & Khung Sáng** | Customer `Alexander` $\rightarrow$ `keep_period: day` | Customer `Alexander` $\rightarrow$ `time_window: 07-11:30` | Alexander giữ nguyên ngày 12/10; 3 jobs được đẩy từ khung trưa lên sáng sớm (8:30 AM). |
| **TC-FC-15** | **Fallback Khi Xung Đột Bất Khả Thi** | Customer `Peter Parker` $\rightarrow$ `first_stop` | Customer `Peter Parker` $\rightarrow$ `last_stop` | 1 job duy nhất vừa ép First vừa ép Last $\rightarrow$ Solver đưa ra **Fallback Day** (Expected: PASS). |
| **TC-FC-16** | **Phân Rải Quá Tải / Fallback** | Customer `Alexander` $\rightarrow$ `time_window: 07-11:30` | Customer `Miller` $\rightarrow$ `time_window: 13-16h` | 5 jobs không đủ giờ trong ngày $\rightarrow$ Solver đưa ra **Fallback Day** (Expected: PASS). |

---

## 3. KẾT LUẬN VỀ ĐỘ BAO PHỦ

Bộ 16 kịch bản trên:
1. **Bao phủ 100% các Action Types** của Mantis Custom Rules.
2. **Bao phủ 100% các quy tắc xung đột và phân cấp ưu tiên** (`Lock > Exclude > Other Actions`).
3. **Bao phủ 100% cơ chế Fallback Day** khi gặp bất khả thi hoặc quá tải ca.
4. **Bao phủ phương pháp đối chiếu 2 Schedules song song** khi điều chuyển KTV.

Xác nhận để khởi chạy tự động hóa toàn bộ 16 ca này ngay lập tức!
