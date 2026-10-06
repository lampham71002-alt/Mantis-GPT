# BÁO CÁO PHÂN TÍCH CHUYÊN SÂU 5 TỆP CẤU HÌNH HỆ THỐNG MỚI & BẢN ĐỒ THỰC THI (MAP.HAR)
**Dự án:** Mantis AI Routing Autopilot  
**Thời gian thực hiện:** 05/10/2026 (Sáng)  
**Tệp phân tích:** `WorSystem.har`, `ServiceSystem.har`, `TriggerSystem.har`, `RulesSystem.har`, `routeSystem.har`, `Map.har`  
**Môi trường ghi nhận:** Branch `GDONWL5A5MI6` | Backend `https://apiv2.gdesk.io` | Frontend `https://r2.gdesk.io`  
**Ngôn ngữ:** Tiếng Việt (100%)

---

## 1. TỔNG QUAN PHÁT HIỆN

5 tệp mạng mới bổ sung chính là **trọn bộ 4 nhóm quy tắc cấp hệ thống (System Rules)** và **bộ kích hoạt sự kiện (Routing Triggers)** được tải trực tiếp từ môi trường Backend thực tế, kèm theo tệp `Map.har` ghi lại toàn bộ chu kỳ tính toán và hiển thị bản đồ của đợt chạy Autopilot Live:

1. **`WorSystem.har`**: Cấu hình biên giới nhân lực (`workforce-boundaries`).
2. **`ServiceSystem.har`**: Cam kết dịch vụ và khung giờ phục vụ (`service-commitment`).
3. **`TriggerSystem.har`**: Các bộ kích hoạt tự động điều phối khi có sự kiện thay đổi (`triggers`).
4. **`RulesSystem.har`**: Các quy tắc cổng hệ thống (`system-rules`) và danh mục kỹ thuật viên (`users`).
5. **`routeSystem.har`**: Hiệu quả tuyến đường và thuật toán tối ưu (`route-efficiency`).
6. **`Map.har`**: Chu kỳ thực thi Autopilot Sandbox hoàn chỉnh (15 sự kiện NDJSON streaming, job metadata, settings giao diện và polylines bản đồ tuyến đường).

---

## 2. GIẢI MÃ CHI TIẾT TỪNG TỆP CẤU HÌNH HỆ THỐNG

### 2.1. `WorSystem.har` — Ranh Giới Lực Lượng Lao Động (`workforce-boundaries`)
* **Endpoint:** `GET https://apiv2.gdesk.io/api/routing/workforce-boundaries`
* **Dữ liệu thực tế thu được:**
  ```json
  {
    "default_service_hours": {
      "status": 1,
      "value": { "system_default": 0, "start": 480, "end": 990 }
    },
    "max_jobs_per_day": { "status": 0, "value": 5 },
    "preferred_jobs_per_day": { "status": 0, "value": 15 },
    "shift_travel_minutes": { "status": 0, "value": 15 },
    "max_shift_end_time": { "status": 0, "value": 900 },
    "workload_balance": 0,
    "include_depot_legs_in_shift": 0,
    "day_exclusions": { "status": 0, "value": [] }
  }
  ```
* **Phân tích đối chiếu nghiệp vụ:**
  * **`default_service_hours` (ĐANG BẬT - Status = 1):** Cửa sổ giờ phục vụ được cài đặt từ phút **480 (8:00 AM)** đến phút **990 (4:30 PM)** (8.5 tiếng làm việc). Đây là **Hard Constraint** cấp 11 trong bảng ưu tiên: Mọi công việc chỉ được phép xếp lịch trong khung 8:00 AM – 4:30 PM.
  * **Các trường khác (ĐANG TẮT - Status = 0):** `max_jobs_per_day`, `preferred_jobs_per_day`, `shift_travel_minutes`, `max_shift_end_time`, `workload_balance` đều ở trạng thái tắt (`status: 0`).
  * **Ý nghĩa kiểm thử:** Hệ thống đang ở trạng thái chuẩn để làm **Baseline** cho module Workforce Boundaries.

---

### 2.2. `ServiceSystem.har` — Cam Kết Dịch Vụ Khách Hàng (`service-commitment`)
* **Endpoint:** `GET https://apiv2.gdesk.io/api/routing/service-commitment`
* **Dữ liệu thực tế thu được:**
  ```json
  {
    "max_departure_time": { "status": 0, "value": 540 },
    "arrival_window_hours": { "status": 0, "value": 1 },
    "region_enforcement": { "status": 0, "value": "strict" },
    "customer_scheduling_preferences": { "status": 0, "value": "strict" },
    "drive_buffer": { "status": 0, "value": 0 }
  }
  ```
* **Phân tích đối chiếu nghiệp vụ:**
  * Toàn bộ các rule của Service Commitments hiện đang **TẮT (`status: 0`)**.
  * Cấu hình dự bị (khi bật):
    * `max_departure_time`: Phút 540 (9:00 AM).
    * `arrival_window_hours`: Khung giờ thông báo khách là 1 giờ.
    * `region_enforcement`: Chế độ `strict` (Ràng buộc cứng, không cho KTV vượt ranh giới vùng).
    * `customer_scheduling_preferences`: Chế độ `strict`.
    * `drive_buffer`: 0 phút đệm di chuyển.

---

### 2.3. `TriggerSystem.har` — Bộ Kích Hoạt Tự Động Điều Phối (`triggers`)
* **Endpoint:** `GET https://apiv2.gdesk.io/api/routing/triggers`
* **Dữ liệu thực tế thu được:**
  ```json
  {
    "job_added": 0,
    "job_moved": 0,
    "job_canceled": 0,
    "job_terminated": 0,
    "job_rescheduled": 0,
    "job_batch_move": 0,
    "job_batch_reassign": 0,
    "timeoff_added": 0,
    "custom_event_added": 0,
    "booking_unconfirmed": 0
  }
  ```
* **Phân tích đối chiếu nghiệp vụ:**
  * Cả 10 cờ kích hoạt đều đang bằng **0 (TẮT hoàn toàn)**.
  * Điều này xác nhận: Việc thay đổi trên Calendar/Job (thêm job, hủy job, dời lịch, xin nghỉ phép `timeoff_added`) hiện **không tự động kích hoạt đợt re-route nền**. Thuật toán chỉ chạy theo lịch định kỳ của Autopilot hoặc do người dùng bấm Optimize thủ công.

---

### 2.4. `RulesSystem.har` — Cổng Hệ Thống & Danh Mục Kỹ Thuật Viên (`system-rules` & `users`)
Tệp này chứa 2 API call nền tảng:

#### 1. System Rules (`GET /api/routing/system-rules`):
```json
{
  "auto_optimization": {
    "status": 1,
    "value": { "frequency": "daily", "day_of_week": null, "day_of_month": null, "run_at_minutes": 0 }
  },
  "freeze_window_days": {
    "status": 1,
    "value": "work_day"
  },
  "optimization_horizon": {
    "status": 1,
    "value": "14_days"
  },
  "job_movement_restriction_days": { "status": 0, "value": 10 },
  "preserve_original_period": { "status": 0, "value": "month" },
  "allow_cross_technician_routing": 1
}
```
* **Toán học cửa sổ điều phối xác thực:**
  * `auto_optimization`: **BẬT (Status = 1)**, tần suất hàng ngày lúc 00:00 (12:00 AM).
  * `freeze_window_days`: **BẬT (Status = 1)**, giá trị `'work_day'` (Đóng băng đến hết ngày làm việc hiện tại).
  * `optimization_horizon`: **BẬT (Status = 1)**, giá trị `'14_days'` (Tối ưu hóa công việc trong 14 ngày tới).
  * `allow_cross_technician_routing`: **BẬT (= 1)**: Cho phép thuật toán chuyển đổi phân công công việc chéo giữa các kỹ thuật viên.

#### 2. Danh mục Kỹ thuật viên / Người dùng (`GET /api/users`):
* Ghi nhận 3 kỹ thuật viên thực tế của chi nhánh:
  * **ID: 84361447** — Lam 1
  * **ID: 84361445** — Lam Test
  * **ID: 84361565** — Minh Tets

---

### 2.5. `routeSystem.har` — Hiệu Quả Tuyến Đường (`route-efficiency`)
* **Endpoint:** `GET https://apiv2.gdesk.io/api/routing/route-efficiency`
* **Dữ liệu thực tế thu được:**
  ```json
  {
    "minimize_travel_time_minutes": { "status": 0, "value": 5 },
    "minimize_travel_distance_miles": { "status": 0, "value": 30 },
    "max_travel_distance_miles": { "status": 0, "value": 30 },
    "max_shift_travel_time_minutes": { "status": 0, "value": 30 },
    "do_not_reroute_statuses": { "status": 0, "value": [] },
    "route_around_statuses": { "status": 0, "value": [] },
    "preferred_tech_matching": { "status": 0, "value": "soft" },
    "routing_algorithm": { "status": 1, "value": 2 },
    "tech_skill_matching": 0
  }
  ```
* **Phân tích đối chiếu nghiệp vụ:**
  * **`routing_algorithm`: `status: 1`, `value: 2`**: Hệ thống đang áp dụng **Thuật toán điều phối số 2** (Routing Algorithm V2).
  * Các mục tiêu tối ưu hóa thời gian/quãng đường lái xe và kỹ năng kỹ thuật viên (`tech_skill_matching`) hiện đang để `status: 0`.

---

## 3. GIẢI MÃ ĐẶC BIỆT: TỆP `MAP.HAR` (CHU TRÌNH AUTOPILOT SANDBOX & VẼ TUYẾN ĐƯỜNG)

Tệp `Map.har` là bằng chứng trực tiếp và sinh động nhất về cách thức hoạt động của công cụ hiển thị tuyến đường trên Calendar & Bản đồ vệ tinh:

### 3.1. Chuỗi sự kiện NDJSON Streaming (`GET /api/routing/mantis/autopilot/jobs`):
Bao gồm chính xác **15 dòng sự kiện** tuần tự:
```
Dòng 0: {"type":"progress","message":"Loading jobs..."}
Dòng 1: {"type":"progress","message":"Loading jobs..."}
Dòng 2: {"type":"events","items":[... 10 jobs ban đầu ...]}
Dòng 3: {"type":"events","items":[... 6 jobs tiếp theo ...]}
Dòng 4: {"type":"progress","message":"Optimizing routes..."}
Dòng 5: {"type":"progress","message":"Planning balanced zones..."}
Dòng 6: {"type":"progress","message":"Building route matrix..."}
Dòng 7: {"type":"progress","message":"Optimizing routes..."}
Dòng 8: {"type":"progress","message":"Optimizing routes..."}
Dòng 9: {"type":"progress","message":"Building route details..."}
Dòng 10: {"type":"events","items":[... 10 jobs sau tối ưu ...]}
Dòng 11: {"type":"events","items":[... 9 jobs sau tối ưu ...]}
Dòng 12: {"type":"drive_time", ...} (Các đoạn thời gian lái xe giữa các điểm)
Dòng 13: {"type":"downtime", ...} (Khoảng thời gian trống/chờ)
Dòng 14: {"type":"completed","optimization_id":"opt_sandbox_a98f68bdf96facbfd7089bcc957e35df"}
```

* **Khám phá mấu chốt:**
  * Dòng số 14 chốt hạ mã định danh phiên chạy:  
    `optimization_id`: **`opt_sandbox_a98f68bdf96facbfd7089bcc957e35df`**.
  * Dữ liệu địa chỉ công việc thực tế được ghi nhận tại Palm Bay, FL (Mã bưu chính 32907), ví dụ: khách hàng "Minh", địa chỉ "Myakka Street Northeast".

### 3.2. Truy xuất Polyline Bản đồ Tuyến Đường (`GET /api/routing/mantis/autopilot/routes`):
Ngay sau khi nhận được `optimization_id`, frontend gửi request lấy các chuỗi tọa độ mã hóa Google Encoded Polyline:
* **Tham số:** `optimization_id=opt_sandbox_a98f68bdf96facbfd7089bcc957e35df&schedule_ids=31`
* **Response:**
  * `type: "route"`, `schedule_id: "31"`, `day_label: "2026-10-04"`
  * Chứa mảng `polylines` (ví dụ: `"}~`jDxqikNeDA"`, `"...ht@yd@jEoC..."`) dùng để vẽ các nét đường xe chạy trên giao diện Google Map/Mapbox.

---

## 4. TỔNG HỢP TRẠNG THÁI HỆ THỐNG HIỆN HÀNH (LIVE STATE MATRIX)

Dưới đây là ma trận tổng kết toàn bộ cấu hình quy tắc thực tế đang hoạt động trên hệ thống (đối chiếu trực tiếp với `rules-catalog.md`):

| Nhóm Quy Tắc | Tên Trường Cấu Hình | Trạng Thái Thực Tế | Giá Trị Cấu Hình | Phân Loại Nghiệp Vụ |
|:---|:---|:---:|:---:|:---:|
| **Workforce Boundaries** | `default_service_hours` | **ON (1)** | 8:00 AM – 4:30 PM (480–990) | **Hard Constraint** |
| | `max_jobs_per_day` | OFF (0) | 5 jobs | Hard / Soft cap |
| | `preferred_jobs_per_day` | OFF (0) | 15 jobs | Soft Target |
| | `shift_travel_minutes` | OFF (0) | 15 phút | Hard Constraint |
| | `max_shift_end_time` | OFF (0) | 3:00 PM (900) | Hard Constraint |
| | `workload_balance` | OFF (0) | 0 | Soft Target |
| **System Gatekeepers** | `auto_optimization` | **ON (1)** | Daily lúc 00:00 AM | Autopilot Schedule |
| | `freeze_window_days` | **ON (1)** | `work_day` | System Hard Gate |
| | `optimization_horizon` | **ON (1)** | `14_days` | System Range |
| | `allow_cross_technician` | **ON (1)** | Cho phép (1) | Cross-Tech Enable |
| **Route Efficiency** | `routing_algorithm` | **ON (1)** | Thuật toán số 2 (v2) | Core Solver Version |
| | `minimize_travel_time` | OFF (0) | 5 phút | Soft Target |
| | `max_travel_distance` | OFF (0) | 30 dặm | Hard Constraint |
| | `tech_skill_matching` | OFF (0) | 0 | Hard Constraint |
| **Service Commitment** | `region_enforcement` | OFF (0) | Strict | Hard Constraint |
| | `max_departure_time` | OFF (0) | 9:00 AM (540) | Hard Constraint |
| | `drive_buffer` | OFF (0) | 0 phút | Hard Constraint |
| **Routing Triggers** | Toàn bộ 10 triggers | OFF (0) | 0 | Event Auto-ReRoute |

---

## 5. KẾT LUẬN & TÁC ĐỘNG ĐẾN BỘ KIỂM THỬ TỰ ĐỘNG

1. **Trạng thái thực tế cực kỳ lý tưởng cho Testing:** 
   Ngoại trừ khung giờ làm việc cơ bản (`default_service_hours: 8:00 - 16:30`) và các thông số quản trị (Freeze window, Horizon 14 days, Algorithm 2), hầu hết các quy tắc ràng buộc khác đều đang ở trạng thái **OFF (`status: 0`)**. Đây chính là điều kiện hoàn hảo để chạy bước **Baseline All-OFF (Step 4)** trong Sổ tay vận hành `runbook.md`.
2. **Chứng thực toàn vẹn giao thức NDJSON Stream:** 
   Tệp `Map.har` đã kiểm chứng trên thực tế cấu trúc NDJSON chuẩn (`progress` $\rightarrow$ `events` $\rightarrow$ `drive_time` $\rightarrow$ `downtime` $\rightarrow$ `completed` mang `optimization_id`), loại bỏ hoàn toàn các giả định thiếu căn cứ khi lập trình mock hay assert test.
3. **Sẵn sàng triển khai Test API Live & Mock:** 
   Các payload và response từ 5 tệp này cung cấp fixture dữ liệu mẫu chuẩn 100% cho bộ Playwright Test Suite.
