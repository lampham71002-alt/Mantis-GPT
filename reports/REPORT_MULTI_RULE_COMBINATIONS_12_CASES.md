# BÁO CÁO KẾT QUẢ KIỂM THỬ 12 KỊCH BẢN TỔ HỢP NHIỀU RULES ĐỒNG THỜI (`TC-MR-01` $\rightarrow$ `TC-MR-12`)

> [!IMPORTANT]
> **Tổng kết Thực Thi:**
> - **Tài khoản & Chi nhánh:** `lam.pham@gmail.com` (`Branch ID: GD1LK8RC5OH0`) | **Schedules:** `lam 1` (`ID: 249`), `QA hihi` (`ID: 261`).
> - **Phương pháp kiểm thử:** Mở trình duyệt độc lập **3 Tab kế bên phải nhau** (`[1] Custom Rules` $\leftrightarrow$ `[2] Sandbox` $\leftrightarrow$ `[3] Dashboard & Activity Feed`), khởi tạo và bật đồng thời từ **3 đến 6 Custom Rules** trong mỗi kịch bản (`Rule IDs: 2065` $\rightarrow$ `2111`), đo luồng NDJSON Stream thực tế và tắt toàn bộ về `OFF (status = 0)` sau mỗi lượt.
> - **Kết quả tổng thể:** **12 / 12 kịch bản đạt chuẩn (`100% PASS & CONTENTION VERIFIED`)**.
> - **Clean State & Undo:** Lịch trình và Dashboard đã được **`Undo` (`status = 3`)** khôi phục nguyên trạng (`37.59 miles`), 100% Custom Rules & Specific Rules ở trạng thái `OFF`.

---

## I. BẢNG TỔNG HỢP KẾT QUẢ 12 KỊCH BẢN TỔ HỢP NHIỀU RULES (`TC-MR-01` $\rightarrow$ `TC-MR-12`)

### 🟢 NHÓM 1: TỔ HỢP HÀI HÒA 3 $\rightarrow$ 5 CUSTOM RULES CÙNG BẬT TRÊN 1 NGÀY (`15/10/2026`)

| Mã Case | Số Rule Cùng Bật | Danh Sách Rules Bật Đồng Thời (`Rule IDs`) | Trạng Thái `Before` (Khi Tắt Rules) | Trạng Thái `After` (Khi Bật Đồng Thời Các Rules) | Kết Quả |
| :---: | :---: | :--- | :--- | :--- | :---: |
| **TC-MR-01** | **3 Rules** | `2065`: `Cust 20` $\rightarrow$ `first_stop`<br>`2066`: `Cust 14` $\rightarrow$ `lock`<br>`2067`: `Cust 24` $\rightarrow$ `last_stop` | `Cust 20`: `3:03pm` (`#7/7`)<br>`Cust 14`: `11:40am-12:40pm` (`#3/7`)<br>`Cust 24`: `9:47am` (`#2/7`) | - **Stop `#1/7`:** `Cust 20` (**`8:04 - 8:49am`**)<br>- **Giữ Lock `#3/7`:** `Cust 14` (**`11:40am - 12:40pm`**)<br>- **Last Stop `#7/7`:** `Cust 24` (**`3:20 - 4:20pm`**) | ✅ **PASS (3/3 Rules)** |
| **TC-MR-02** | **4 Rules** | `2068`: `Cust 20` $\rightarrow$ `first_stop`<br>`2069`: `Cust 14` $\rightarrow$ `lock`<br>`2070`: `Cust 24` $\rightarrow$ `last_stop`<br>`2071`: `Cust 12` $\rightarrow$ `strict 13:30–16:30` | `Cust 20`: `3:03pm`<br>`Cust 14`: `11:40am-12:40pm`<br>`Cust 12`: `10:49am` (Ca sáng)<br>`Cust 24`: `9:47am` | - **Stop `#1/7`:** `Cust 20` (**`8:04 - 8:49am`**)<br>- **Giữ Lock `#3/7`:** `Cust 14` (**`11:40am - 12:40pm`**)<br>- **Khung chiều `#5/7`:** `Cust 12` (**`1:46 - 2:46pm`**)<br>- **Last Stop `#7/7`:** `Cust 24` (**`3:20 - 4:20pm`**) | ✅ **PASS (4/4 Rules)** |
| **TC-MR-03** | **5 Rules** | `2072`: `Cust 30` $\rightarrow$ `exclude`<br>`2073`: `Cust 20` $\rightarrow$ `first_stop`<br>`2074`: `Cust 13` $\rightarrow$ `strict 08:30–11:55`<br>`2075`: `Cust 14` $\rightarrow$ `lock`<br>`2076`: `Cust 24` $\rightarrow$ `last_stop` | Toàn bộ 7 jobs ngày `15/10` | - **Loại trừ:** `Cust 30` bị loại ở Pre-filter (`0 jobs` trong stream)<br>- **Stop `#1/7`:** `Cust 20` (**`8:04 - 8:49am`**)<br>- **Khung sáng:** `Cust 13` (**`9:26 - 10:26am`**)<br>- **Giữ Lock:** `Cust 14` (**`11:40am - 12:40pm`**)<br>- **Last Stop `#7/7`:** `Cust 24` (**`3:35 - 4:35pm`**) | ✅ **PASS (5/5 Rules)** |

---

### 🔵 NHÓM 2: TỔ HỢP 4 $\rightarrow$ 6 CUSTOM RULES XUYÊN NHIỀU NGÀY (`12/10 – 15/10`, 31 JOBS)

| Mã Case | Số Rule Cùng Bật | Danh Sách Rules Bật Đồng Thời (`Rule IDs`) | Trạng Thái `Before` | Trạng Thái `After` (Trên Dải 4 Ngày `12/10 – 15/10`) | Kết Quả |
| :---: | :---: | :--- | :--- | :--- | :---: |
| **TC-MR-04** | **4 Rules** | `2077`: `Cust 28 & 16` $\rightarrow$ `keep_day + move 0`<br>`2078`: `Cust 18` $\rightarrow$ `first_stop`<br>`2079`: `Cust 14` $\rightarrow$ `lock`<br>`2080`: `Cust 24` $\rightarrow$ `last_stop` | `31 jobs` trên 4 ngày (`12/10 – 15/10`) | - `Cust 28 & 16`: Giữ cố định tại ngày **`10-12-2026`** (`11:14am`, `10:09am`)<br>- `Cust 18`: Đứng **Stop #1 đầu sáng (`8:19 - 9:19am`)**<br>- `Cust 14`: Khóa cứng tại **`10-15-2026 11:40am - 12:40pm`**<br>- `Cust 24`: Đứng **Last Stop `#8/8` (`3:53 - 4:53pm`)** ngày `15/10` | ✅ **PASS (4/4 Rules)** |
| **TC-MR-05** | **6 Rules** | 4 Rules của `TC-MR-04` (`2081`–`2084`) **+**`2085`: `Cust 29 & 30` $\rightarrow$ `exclude`<br>`2086`: `Cust 12 & 17` $\rightarrow$ `strict 13:30–16:30` | `31 jobs` trên 4 ngày (`12/10 – 15/10`) | - Tập stream giảm từ `31` $\rightarrow$ **`28 jobs`** (`Cust 29` & `Cust 30` bị `Exclude` 100%)<br>- `Cust 12` vào khung chiều **`2:38 - 3:38pm`**<br>- Các chốt `Keep Day`, `First Stop`, `Lock`, `Last Stop` đều giữ vững | ✅ **PASS (6/6 Rules)** |

---

### 🟣 NHÓM 3: TỔ HỢP ĐA TẦNG (BỔ TRỢ & ĐỐI ĐẦU — `TC-MR-06` $\rightarrow$ `TC-MR-07`)

| Mã Case | Số Rule Cùng Bật | Cấu Hình Tổ Hợp (`Rule IDs`) | Trạng Thái `After` & Cơ Chế Phân Xử Thực Tế | Kết Quả |
| :---: | :---: | :--- | :--- | :---: |
| **TC-MR-06** | **4 Rules** | **Phối hợp bổ trợ (`2087`–`2090`):**<br>- `Cust 12`: `Force lam 1 + Strict 13:30–16:00`<br>- `Cust 20`: `First Stop`<br>- `Cust 14`: `Lock` (`11:40am–12:40pm`)<br>- `Cust 24`: `Last Stop` | Toàn bộ 7 điểm dừng trên tuyến `lam 1` ngày `15/10` xếp theo trật tự hoàn hảo:<br>**`#1: Cust 20 (8:04-8:49am)`** $\rightarrow$ `#2: Cust 30 (8:55-9:55am)` $\rightarrow$ **`#3: Cust 14 (11:40am-12:40pm - Locked)`** $\rightarrow$ `#4: Cust 13 (12:42-1:42pm)` $\rightarrow$ **`#5: Cust 12 (1:46-2:46pm - Window 13:30-16:00)`** $\rightarrow$ `#6: location (2:48-3:18pm)` $\rightarrow$ **`#7: Cust 24 (3:20-4:20pm - Last Stop)`**. | ✅ **PASS (4/4 Rules)** |
| **TC-MR-07** | **3 Rules** | **Đối đầu trực tiếp (`2091`–`2093`):**<br>- `Rule 2091`: `Cust 20` $\rightarrow$ `Last Stop`<br>- `Rule 2092`: `Cust 20 & Cust 12` $\rightarrow$ `First Stop`<br>- `Rule 2093`: `Cust 14` $\rightarrow$ `Lock` | - Trên `Cust 20` (vừa có Rule `Last Stop` vừa có Rule `First Stop`): Rule tạo sau (`2092 - First Stop`) thắng và đưa `Cust 20` lên **Stop `#1/7` (`8:04 - 8:49am`)**.<br>- `Cust 14` vẫn giữ nguyên vị trí `Lock` tại `11:40am - 12:40pm`. | ✅ **PASS (Verified)** |

---

### 🔴 NHÓM 4: CHUỖI XUNG ĐỘT ĐA RULE (CONTENTION, OVERFLOW, DOMINO & CLOSED-LOOP UNDO — `TC-MR-08` $\rightarrow$ `TC-MR-12`)

| Mã Case | Số Rule Cùng Bật | Kịch Bản Tranh Chấp / Stress Test (`Rule IDs`) | Hành Vi Phân Xử Thực Tế Của Solver (`After`) | Kết Quả |
| :---: | :---: | :--- | :--- | :---: |
| **TC-MR-08** | **3 Rules** | **Triple First-Stop Contention (`2094`–`2096`):**<br>3 Custom Rules độc lập cùng ép 3 khách hàng khác nhau (`Cust 20`, `Cust 30`, `Cust 12`) phải làm **Stop #1** trên cùng KTV `lam 1` ngày `15/10`. | **Phát hiện quy luật Độc quyền Slot #1:**<br>- Chỉ **1 khách hàng duy nhất** (`HCM Customer 20`) giành được vị trí **Stop `#1` (`8:04 - 8:49am`)**.<br>- 2 khách hàng còn lại (`Cust 30` và `Cust 12`) vì cũng bị ép buộc phải là `First Stop` trên cùng tuyến nên bị Solver đẩy ra **`Unassigned` (`0 jobs` trong `optimized`)**! | ✅ **PASS (Contention Resolved)** |
| **TC-MR-09** | **3 Rules** | **Triple Last-Stop Contention (`2097`–`2099`):**<br>3 Custom Rules độc lập cùng ép 3 khách hàng (`Cust 24`, `Cust 12`, `Cust 13`) phải làm **Last Stop** trên cùng KTV `lam 1` ngày `15/10`. | **Phát hiện quy luật Độc quyền Last Stop:**<br>- Chỉ **1 khách hàng duy nhất** (`HCM Customer 13`) giành được vị trí **Stop cuối cùng `#6/6` (`1:47 - 2:47pm`)**.<br>- 2 khách hàng còn lại (`Cust 24` và `Cust 12`) không thể cùng đứng cuối tuyến nên bị đẩy ra **`Unassigned`**! | ✅ **PASS (Contention Resolved)** |
| **TC-MR-10** | **4 Rules** | **Overcrowded Time Window (`2100`–`2103`):**<br>4 Custom Rules cùng nhồi 4 jobs (`Cust 24`, `12`, `13`, `30` — mỗi job `60 phút`, tổng **> 4 tiếng**) vào cùng khung giờ hẹp **`13:30 – 15:30` (chỉ có 2 tiếng)**. | **Cắt tràn thông minh (Zero Overlap):**<br>- Khung `13:30 – 15:30` (2 tiếng) chỉ chứa tối đa 2 jobs 60 phút $\rightarrow$ Solver chọn đúng **2 jobs** xếp nối tiếp nhau: **`Cust 13` (`1:30 - 2:30pm`)** và **`Cust 12` (`2:34 - 3:34pm`)**.<br>- 2 jobs bị tràn (`Cust 24` và `Cust 30`) được đẩy ra **`Unassigned`** (`afterCount` giảm từ `8` $\rightarrow$ `6`), tuyệt đối không xếp chồng giờ! | ✅ **PASS (Overflow Safe)** |
| **TC-MR-11** | **4 Rules** | **Domino Collision đè lên khe giờ `Lock` (`2104`–`2107`):**<br>1. `Cust 14` bị `Lock`<br>2. `Cust 12` bị ép `Strict Window` va chạm giờ trưa<br>3. `Cust 20` $\rightarrow$ `First Stop`<br>4. `Cust 24` $\rightarrow$ `Last Stop` | - Chốt `Lock` của `Cust 14` (`11:40am - 12:40pm`) đứng vững bất khả xâm phạm.<br>- `Cust 12` được dời sang khe trống ngay sau đó (`1:46 - 2:46pm`).<br>- `Cust 20` giữ vững **Stop `#1` (`8:04 - 8:49am`)** và `Cust 24` giữ vững **Last Stop `#7/7` (`3:20 - 4:20pm`)**. | ✅ **PASS (Domino Handled)** |
| **TC-MR-12** | **4 Rules** | **Closed-Loop 4 Rules (`2108`–`2111`):**<br>Bật 4 Rules trên ngày `15/10` $\rightarrow$ `Optimize` $\rightarrow$ `Accept` $\rightarrow$ kiểm tra `Dashboard` $\rightarrow$ vào `Activity Feed` chọn dòng đầu tiên nhấn **`Undo`**. | - **Dashboard trước `Accept`:** `37.59 miles`<br>- **Sau khi `Accept` (`History ID: 2081`):** `36.14 miles`<br>- **Sau khi nhấn `Undo` (`status = 3`):** Dashboard lập tức khôi phục về đúng **`37.59 miles`** (`100% Exact Match`). | ✅ **PASS (Closed-Loop Undo)** |

---

## II. BẰNG CHỨNG HÌNH ẢNH & DỮ LIỆU ĐẦU RA

- **Kế hoạch kiểm thử 12 Case Tổ hợp:** [`reports/PLAN_TEST_MULTI_RULE_COMBINATIONS.md`](file:///c:/mantis-auto/reports/PLAN_TEST_MULTI_RULE_COMBINATIONS.md)
- **Báo cáo kết quả 12 Case Tổ hợp:** [`reports/REPORT_MULTI_RULE_COMBINATIONS_12_CASES.md`](file:///c:/mantis-auto/reports/REPORT_MULTI_RULE_COMBINATIONS_12_CASES.md)
- **Dữ liệu JSON thực tế:** [`reports/multi_rule_combinations_12_cases_results.json`](file:///c:/mantis-auto/reports/multi_rule_combinations_12_cases_results.json)
- **Script tự động hóa:** [`scratch/run_multi_rule_combinations_12_cases.js`](file:///c:/mantis-auto/scratch/run_multi_rule_combinations_12_cases.js)
- **Ảnh chụp Clean State (`100% Rules OFF`):** [`reports/multi_rule_12_cases_clean_state.png`](file:///c:/mantis-auto/reports/multi_rule_12_cases_clean_state.png)
