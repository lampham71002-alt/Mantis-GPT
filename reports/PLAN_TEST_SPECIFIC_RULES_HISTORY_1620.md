# KẾ HOẠCH KIỂM THỬ SPECIFIC RULES - HISTORY LOG 1620 (10/09/2026 16:43)

> **Tài khoản:** `lam.pham@gmail.com` | Password: `Ahihi123`  
> **Branch ID:** `GD1LK8RC5OH0`  
> **Lượt tối ưu mục tiêu (Target History Run):** **History ID `1620`**  
> **Thời điểm chạy:** `10/09/2026 16:43:41` (Vietnam Time) / `2026-10-09T09:43:41Z` (UTC) | Mode: `manual`  
> **Khung thời gian tối ưu:** `10/10/2026` → `17/10/2026` (Tuần làm việc đầy đủ)  
> **Tập dữ liệu nguồn thực tế:** **32 Jobs thực tế** bao gồm các khách hàng HCM (`HCM Customer 01` → `HCM Customer 30`) và dữ liệu kiểm thử.  
> **Kỹ thuật viên / Schedules đối chiếu:** `lam 1` (Schedule ID: `249`) & `QA hihi` (Schedule ID: `261`)

---

## I. KIẾN TRÚC NGHIỆP VỤ & NGUYÊN TẮC BẮT BUỘC (GROUND TRUTH)

1. **Phạm vi cô lập biên (History Scope & Boundary Isolation):**
   * Specific Rule **luôn gắn liền với `history_id: "1620"`**.
   * Chỉ 32 jobs nằm trong Log 1620 mới chịu tác động của rule.
   * Các jobs khác của cùng khách hàng nhưng nằm ngoài Log 1620 (ví dụ các tuần khác) **phải được bảo toàn nguyên trạng (Boundary Isolation)**.
2. **Bộ lọc kết hợp (Composite Filters):**
   * Khi rule có nhiều filter trên cùng target (VD: `Customer: HCM Customer 06` AND `Service: Initial Service`), chỉ kiểm tra các job thỏa mãn **đồng thời cả hai điều kiện**. Tuyệt đối không kiểm tra trên các job chỉ thỏa mãn một điều kiện.
3. **Thứ bậc ưu tiên giữa các loại Rule (Precedence Hierarchy):**
   $$\text{Specific Rule} > \text{Custom Rule} > \text{System Rule}$$
   * Khi xung đột trực tiếp trên cùng 1 job: Specific Rule luôn **THẮNG**.
4. **Thứ bậc nội bộ giữa các Action (Primitives Precedence):**
   $$\text{Lock} > \text{Exclude} > \text{Các Action khác (Force Tech, Prefer Tech, Time Window, Sequence)}$$
   * `Lock`: Khóa cứng ngày gốc & KTV, **tuyệt đối không cho đè** (Route Around).
   * `Exclude`: Giữ nguyên ngày gốc trên Calendar, **cho phép** job khác tối ưu xếp đè lên slot đó.
   * `Exclude` luôn thắng `Force Tech` / `Prefer Tech`.
5. **Cơ chế Phân Rải & Fallback Day của Solver:**
   * Khi dồn quá nhiều job hoặc thời lượng trong ngày vượt quá giới hạn (`Default Service Hours`), Solver tự động rải job sang các ngày khác hoặc đưa ra **Fallback Day** $\rightarrow$ Đây là hành vi **HỢP LỆ (PASS)**.
6. **Tiêu chuẩn kiểm tra thật 100% (Anti-Fake Pass Protocol):**
   * Bắt trực tiếp luồng **Solver NDJSON Stream** (`/api/routing/mantis/autopilot/jobs?schedule_ids=249,261&...`) để tính toán sự thay đổi vị trí, khung giờ, KTV.
   * Tuyệt đối không dùng mock assertion hay gán cứng kết quả.

---

## II. MA TRẬN 14 TEST CASES CHI TIẾT TRÊN HISTORY 1620

| STT | Mã Case | Tên Kịch Bản | Đối Tượng Mục Tiêu (Target Trong Log 1620) | Hành Động & Ràng Buộc | Điều Kiện PASS Thực Tế (Anti-Fake Criteria) |
| :---: | :---: | :--- | :--- | :--- | :--- |
| **1** | **TC-SR-01** | **Boundary Isolation (Trong Log vs Ngoài Log)** | `Customer: HCM Customer 26`<br>*(Job 101519 trong Log 1620 vs Job ngoài Log)* | `first_stop` | - **Job trong Log 1620:** Được xếp làm First Stop đầu ngày trên Sandbox.<br>- **Job ngoài Log 1620:** Bảo toàn giờ và ngày gốc, không bị kéo lên First Stop. |
| **2** | **TC-SR-02** | **Lọc tập con (Sub-set Filtering)** | `Customer: HCM Customer 06` **AND** `Service: Initial Service` (Job 101498) | `last_stop` | - Đúng job `Initial Service` của `HCM Customer 06` về Last Stop cuối ngày.<br>- Các dịch vụ khác của khách này giữ nguyên vị trí. |
| **3** | **TC-SR-03** | **Khung giờ bắt buộc (Strict Time Window)** | `Customer: HCM Customer 05` (Job 101497) | `time_window` (08:00 - 11:00) | Giờ bắt đầu (`event.start`) của job này trên Sandbox Solver nằm chính xác trong khoảng 08:00 đến 11:00. |
| **4** | **TC-SR-04** | **Ép KTV (Force Tech) & Đối chiếu 2 Schedule** | `Customer: HCM Customer 09` (Job 101501 đang ở `lam 1`) | `force_tech` sang `QA hihi` (ID: 261) | Mở đối chiếu song song 2 Schedule:<br>+ Schedule `lam 1` (249): Mất job.<br>+ Schedule `QA hihi` (261): Nhận đúng job trên Sandbox. |
| **5** | **TC-SR-05** | **Ưu tiên KTV (Prefer Tech) theo công suất** | `Customer: HCM Customer 13` (Job 101505) | `prefer_tech` (`lam 1`) | Solver ưu tiên xếp vào schedule `lam 1` nếu còn trống; nếu hết giờ thì điều phối hợp lý mà không báo lỗi. |
| **6** | **TC-SR-06** | **Khóa cứng (Lock) - Route Around** | `Customer: HCM Customer 14` (Job 101506) | `lock` (Khóa cứng ngày & KTV) | Khóa cứng tại `lam 1` ngày 13/10, các job khác tối ưu đi vòng (Route Around), **tuyệt đối không cho đè**. |
| **7** | **TC-SR-07** | **Loại khỏi tối ưu (Exclude) - Cho phép đè** | `Customer: HCM Customer 20` (Job 101512) | `exclude` | Giữ nguyên ngày gốc, nhưng **CHO PHÉP** job khác tối ưu đè lên slot đó nếu cần. |
| **8** | **TC-SR-08** | **Kết hợp 2 Action: Force Tech + First Stop** | `Customer: HCM Customer 21` (Job 101514) | `force_tech` (`QA hihi`) + `first_stop` | Job chuyển từ `lam 1` sang `QA hihi` VÀ đồng thời nằm ở vị trí đầu ngày trên route của KTV đó. |
| **9** | **TC-SR-09** | **Kết hợp 2 Action: Time Window + Last Stop** | `Customer: HCM Customer 24` (Job 101517) | `time_window` (13:00 - 17:00) + `last_stop` | Job bắt đầu sau 13:00 VÀ là điểm dừng cuối cùng trong ngày của kỹ thuật viên. |
| **10** | **TC-SR-10** | **Composite Filter: Nhiều khách hàng cùng rule** | `Customer: HCM Customer 12` **VÀ** `HCM Customer 23` | `first_stop` | Cả 2 job của 2 khách hàng này đều được xếp làm First Stop trên từng ngày tương ứng. |
| **11** | **TC-SR-11** | **Xung Đột Thứ Bậc: Specific vs Custom (Vị trí)** | `Customer: HCM Customer 30` (Job 101523) | **Custom:** First Stop<br>**Specific:** Last Stop | **Specific Rule THẮNG** $\rightarrow$ Job trong Log 1620 phải là **Last Stop** trên Sandbox. |
| **12** | **TC-SR-12** | **Xung Đột Gán KTV: Specific Force vs Custom Force** | `Customer: HCM Customer 18` (Job 101510) | **Custom:** Ép `lam 1`<br>**Specific:** Ép `QA hihi` | **Specific Rule THẮNG** $\rightarrow$ Job gán sang schedule `QA hihi`. |
| **13** | **TC-SR-13** | **Thứ Bậc Primitives: Specific Exclude vs Custom Force** | `Customer: HCM Customer 16` (Job 101508) | **Custom:** Ép sang `QA hihi`<br>**Specific:** Exclude | **Exclude THẮNG** $\rightarrow$ Job giữ nguyên ở `lam 1`, không bị ép chuyển sang `QA hihi`. |
| **14** | **TC-SR-14** | **Xử lý quá tải khung giờ (Overload & Fallback)** | 4 Jobs: `HCM Customer 01`, `02`, `03`, `04` cùng ép vào `lam 1` khung giờ hẹp (08:00 - 09:00) | `time_window` hẹp cho 4 jobs cùng ngày | Solver tự động phân rải sang các ngày khác hoặc đưa ra **Fallback Day** $\rightarrow$ **Xác nhận PASS**. |

---

## III. QUY TRÌNH THỰC THI & KIỂM THỬ KHÉP KÍN

1. **Tạo Rule:** Gửi prompt tới Mantis AI Compiler gắn chặt `history_id: 1620`.
2. **Kích hoạt:** Bật rule (`status: 1`), chụp ảnh UI Settings.
3. **Chờ Solver:** Mở Sandbox, đợi Solver tính toán (~15s).
4. **Đo Delta NDJSON:** Lắng nghe luồng NDJSON stream từ `/api/routing/mantis/autopilot/jobs` để đo lường Before vs After thực tế.
5. **Chụp ảnh bằng chứng:** Chụp ảnh trực quan màn hình Sandbox.
6. **Dọn dẹp:** Tắt rule (`status: 0`) ngay sau khi hoàn thành case để giữ tài khoản ở trạng thái sạch.
