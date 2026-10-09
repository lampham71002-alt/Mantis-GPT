# KẾ HOẠCH KIỂM THỬ SPECIFIC RULES - TÀI KHOẢN `lam.pham@gmail.com`

**Dự án:** Mantis AI Routing Autopilot  
**Tài khoản:** `lam.pham@gmail.com` / `Ahihi123`  
**Branch ID:** `GD1LK8RC5OH0`  
**Tập dữ liệu nguồn thực tế:** History Log ID `1581` (28 Jobs thực tế ngày 09/10/2026)  
**Kỹ thuật viên / Schedules đối chiếu:** `lam 1` (Schedule ID: `249`) & `QA hihi` (Schedule ID: `261`)  
**Khách hàng mục tiêu trong Log:** `Specific test`, `test move`, `qa 1`, `location`  
**Dịch vụ mục tiêu trong Log:** `Call Back Service`, `Initial Service`, `Every 21 Days`, `Quarterly Service`  

---

## I. KIẾN TRÚC NGHIỆP VỤ & NGUYÊN TẮC BẮT BUỘC

1. **Phạm vi tác động của Specific Rule (History Scope):**
   * Specific Rule **luôn gắn liền với `history_id: "1581"`**.
   * Chỉ 28 jobs trong History Log 1581 mới bị áp dụng ràng buộc. Các jobs khác trên Calendar của khách `Specific test` hay `test move` nhưng **nằm ngoài Log 1581 phải được bảo toàn nguyên trạng (Boundary Isolation)**.
2. **Đọc kỹ Rule Details khi Verify (Composite Filters):**
   * Khi rule có nhiều filter trên cùng target (VD: `Customer: Specific test` AND `Service Type: Call Back Service`), chỉ kiểm tra các job thỏa mãn **ĐỒNG THỜI CẢ HAI điều kiện**. Tuyệt đối không kiểm tra trên các job chỉ thỏa mãn 1 trong 2.
3. **Thứ bậc ưu tiên (Precedence Hierarchy):**
   $$\text{Specific Rule} > \text{Custom Rule} > \text{System Rule}$$
   * Khi xung đột trực tiếp trên cùng 1 job: Specific Rule luôn **THẮNG**.
4. **Thứ bậc nội bộ giữa các Action:**
   $$\text{Lock} > \text{Exclude} > \text{Các Action khác (Force Tech, Prefer Tech, Time Window, Sequence)}$$
   * `Exclude`: Giữ nguyên ngày gốc trên Calendar, **CHO PHÉP** job khác tối ưu xếp đè lên slot đó.
   * `Lock`: Khóa cứng ngày gốc & KTV, **TUYỆT ĐỐI KHÔNG CHO ĐÈ** (Route Around).
   * `Exclude` luôn thắng `Force Tech` / `Prefer Tech`.
5. **Cơ chế Phân Rải & Fallback Day của Solver:**
   * Khi một KTV bị dồn quá nhiều job hoặc thời lượng trong ngày vượt quá giới hạn (`Default Service Hours`), Solver tự động rải job sang các ngày khác.
   * Nếu vẫn không đủ sức chứa, Solver đẩy job ra **Fallback Day**. Job ra Fallback Day là hành vi **HỢP LỆ (PASS)** theo thiết kế của Solver.
6. **Đối chiếu song song 2 Schedules khi test Gán KTV:**
   * Bật đồng thời Schedule `QA hihi` (ID 261) và Schedule `lam 1` (ID 249) để kiểm tra: KTV gốc mất job, KTV đích nhận đúng job.

---

## II. MA TRẬN 14 TEST CASES CHI TIẾT DÀNH CHO `lam.pham@gmail.com`

| STT | Mã Case | Tên Kịch Bản | Target Filter (Đọc Kỹ Rule Details) | Action(s) Áp Dụng | Điều Kiện PASS (Ground-Truth Criteria) & Xử Lý Solver |
| :---: | :---: | :--- | :--- | :--- | :--- |
| **1** | **TC-SR-01** | **Boundary Isolation: Cùng Customer nhưng ngoài Log** | `Customer: test move`<br>*(Job trong Log 1581 vs Job ngày 10/10 ngoài Log)* | `first_stop` | - **Job trong Log 1581:** Được xếp làm First Stop.<br>- **Job ngày 10/10 (ngoài Log):** Giữ nguyên giờ gốc, không bị kéo lên First Stop. |
| **2** | **TC-SR-02** | **Lọc tập con (Sub-set) trong Log 1581** | `Customer: Specific test` **AND** `Service: Call Back Service` | `last_stop` | - Chỉ job `Call Back Service` của `Specific test` về Last Stop.<br>- Các job khác của `Specific test` (Initial, Every 21 Days) giữ nguyên vị trí. |
| **3** | **TC-SR-03** | **Khung giờ bắt buộc (Strict Time Window)** | `Customer: Specific test` **AND** `Service: Quarterly Service` | `time_window` (08:00 - 11:00) | Giờ bắt đầu (`event.start`) của job này trên Sandbox nằm chính xác trong khoảng 08:00 đến 11:00. |
| **4** | **TC-SR-04** | **Ép KTV (Force Tech) & Đối chiếu 2 Schedules** | `Customer: Specific test` (Gốc đang thuộc `QA hihi`) | `force_tech` (Ép sang `lam 1`) | Mở 2 schedule đối chiếu song song:<br>+ Schedule `QA hihi` (ID 261): Mất job.<br>+ Schedule `lam 1` (ID 249): Nhận job đúng ngày. |
| **5** | **TC-SR-05** | **Ưu tiên KTV (Prefer Tech) theo công suất** | `Customer: Specific test` trong Log 1581 | `prefer_tech` (`lam 1`) | Solver ưu tiên xếp sang `lam 1` nếu còn trống; nếu `lam 1` hết thời lượng thì giữ lại KTV gốc hoặc chia rải mà không báo lỗi. |
| **6** | **TC-SR-06** | **Khóa cứng (Lock) - Route Around** | `Customer: test move` trong Log 1581 (Job 38545) | `lock` (Khóa cứng ngày & KTV) | Khóa cứng tại KTV `lam 1` ngày 09/10, các job khác tối ưu vòng qua, **tuyệt đối không cho đè**. |
| **7** | **TC-SR-07** | **Loại khỏi tối ưu (Exclude) - Cho phép đè** | `Customer: Specific test` (Job 49991 Call Back Service) | `exclude` | Giữ nguyên ngày gốc, nhưng **CHO PHÉP** job khác tối ưu đè lên slot đó nếu cần. |
| **8** | **TC-SR-08** | **Kết hợp 2 Action: Force Tech + First Stop** | `Customer: Specific test` trong Log 1581 | `force_tech` (`lam 1`) + `first_stop` | Job chuyển từ `QA hihi` sang schedule `lam 1` VÀ nằm ở vị trí đầu ngày (07:00 / 08:00 AM). |
| **9** | **TC-SR-09** | **Kết hợp 2 Action: Time Window + Last Stop** | `Customer: Specific test` **AND** `Service: Initial Service` | `time_window` (13:00 - 17:00) + `last_stop` | Job bắt đầu sau 13:00 VÀ là điểm dừng cuối cùng trong ngày của KTV đó. |
| **10** | **TC-SR-10** | **Composite Filter: Multiple Service Types** | `Customer: Specific test` **AND** (`Call Back Service` OR `Quarterly Service`) | `first_stop` | Đúng 2 job thỏa mãn điều kiện dịch vụ được xếp làm First Stop cho từng ngày tương ứng. |
| **11** | **TC-SR-11** | **Xung Đột Thứ Bậc: Specific vs Custom (Cùng Job)** | `Customer: Specific test` trong Log 1581 | **Custom:** First Stop<br>**Specific:** Last Stop | **Specific Rule THẮNG** $\rightarrow$ Job trong Log 1581 phải là **Last Stop**. |
| **12** | **TC-SR-12** | **Xung Đột Gán KTV: Specific Force vs Custom Force** | `Customer: Specific test` trong Log 1581 | **Custom:** Ép KTV `QA hihi`<br>**Specific:** Ép KTV `lam 1` | **Specific Rule THẮNG** $\rightarrow$ Job trong Log 1581 chuyển sang KTV `lam 1`. |
| **13** | **TC-SR-13** | **Xung Đột Primitives: Specific Exclude vs Custom Force** | `Customer: Specific test` trong Log 1581 | **Custom:** Ép KTV `lam 1`<br>**Specific:** Exclude | **Exclude THẮNG** $\rightarrow$ Job giữ nguyên ở `QA hihi`, không bị ép chuyển sang `lam 1`. |
| **14** | **TC-SR-14** | **Ràng buộc quá tải, Phân Rải & Fallback Day** | 6 Jobs của `Specific test` & `test move` cùng ép vào `lam 1` khung giờ hẹp (08:00 - 09:30) | `time_window` hẹp cho nhiều job | Solver chia nhỏ rải các ngày; nếu vượt ngưỡng thời lượng thì đưa ra **Fallback Day** $\rightarrow$ **Xác nhận PASS**. |

---

## III. QUY TRÌNH KIỂM THỬ KHÉP KÍN (CHƯA CHẠY, ĐỂ NÍ REVIEW TRƯỚC)

1. **Khởi tạo & Kích hoạt:** Tạo Specific Rule gắn chặt `history_id: "1581"`, bật `status: 1`. Chụp ảnh UI Specific Rules.
2. **Chờ Solver Sandbox (14s):** Mở Sandbox Grid, đợi Solver tối ưu hoàn tất và phân tích NDJSON stream.
3. **Đối chiếu đa chiều:**
   - So sánh vị trí job trên Sandbox vs Calendar gốc.
   - So sánh song song 2 Schedule (`QA hihi` vs `lam 1`).
   - So sánh tính cô lập biên (Job trong Log 1581 vs Job ngoài Log 1581).
4. **Dọn dẹp an toàn:** Tắt Specific Rule (`status: 0`) ngay sau khi kết thúc để giữ tài khoản luôn ở trạng thái sạch.
