# BÁO CÁO GIẢI MÃ NGUYÊN NHÂN & KẾT QUẢ DỜI Ô LỊCH UI (EVENT ID CALENDAR MOVE SUCCESS)

**Dự án:** Mantis AI Routing Autopilot  
**Thời gian thực hiện:** 05/10/2026 (10:57 AM)  
**Schedule đối tượng:** `Lam` (ID: 31 / Tech: Lam Test)  
**Tác vụ:** Dời toàn bộ 6 ô hiển thị Lịch (Calendar Event Tiles) từ cột ngày **04/10/2026** sang **10/10/2026**  
**Phương thức chuẩn xác:** `PUT /api/routing/jobs/{event_id}/move` (Trích xuất 100% từ tệp `move.har`)  
**Kết quả:** Hoàn thành dời ô Lịch UI 100% (6/6 Event Tiles)  
**Ngôn ngữ:** Tiếng Việt (100%)

---

## 1. PHÂN TÍCH NGUYÊN NHÂN VÌ SAO UI CHƯA THAY ĐỔI TRƯỚC ĐÓ

Qua phân tích sâu tệp `move.har` (Giao dịch mẫu `PUT /api/jobs/7043/move` tại Entry 14):
* API di chuyển ô Lịch trên giao diện Web UI Portal đòi hỏi tham số URL là **`event_id`** (Mã sự kiện lịch cụ thể), **KHÔNG PHẢI** `job_id` (Mã công việc gốc).
* Trước đó, các lệnh cập nhật truyền vào `job_id` chỉ tác động đến đối tượng công việc tổng thể mà không di chuyển thẻ ô hiển thị (`Event Tile`) trực tiếp trên lưới Lịch Web UI.

---

## 2. BẢNG CHI TIẾT THỰC THI CHÍNH XÁC THEO EVENT ID

| STT | Event ID (Mã Thẻ Lịch) | Job ID (Mã Job) | Tên Khách Hàng | Địa Chỉ Thi Công | Ngày/Giờ Cũ (04/10) | Ngày/Giờ Mới Trên Lịch UI (10/10) | Phản Hồi API Server | Trạng Thái UI |
|:---:|:---:|:---:|:---|:---|:---:|:---:|:---:|:---:|
| **1** | **`3913`** | `3917` | Minh | Myakka Street Northeast, Palm Bay | 04/10/2026 08:00 – 08:30 | **10/10/2026 08:00 – 08:30** | `HTTP 200 OK` | **SUCCESS** |
| **2** | **`3895`** | `3899` | Messi | Chubbuck Road, Bedford, NH | 04/10/2026 08:30 – 08:45 | **10/10/2026 08:30 – 08:45** | `HTTP 200 OK` | **SUCCESS** |
| **3** | **`3896`** | `3900` | Messi | Chubbuck Road, Bedford, NH | 04/10/2026 08:45 – 09:00 | **10/10/2026 08:45 – 09:00** | `HTTP 200 OK` | **SUCCESS** |
| **4** | **`3912`** | `3916` | Minh | Myakka Street Northeast, Palm Bay | 04/10/2026 09:00 – 09:15 | **10/10/2026 09:00 – 09:15** | `HTTP 200 OK` | **SUCCESS** |
| **5** | **`3787`** | `3791` | Minh | Myakka Street Northeast, Palm Bay | 04/10/2026 09:15 – 09:45 | **10/10/2026 09:15 – 09:45** | `HTTP 200 OK` | **SUCCESS** |
| **6** | **`8503`** | `8507` | FL Routing Test 06 | Lakeland (Routing Test Location) | 04/10/2026 11:13 – 11:43 | **10/10/2026 11:13 – 11:43** | `HTTP 200 OK` | **SUCCESS** |

---

## 3. THÔNG SỐ XÁC MINH CẬP NHẬT GIAO DIỆN

* **Endpoint thực thi:** `PUT https://apiv2.gdesk.io/api/jobs/{event_id}/move`
* **Cấu hình Payload:**
  * `typeEvent`: `"job"`
  * `agenda`: `"agendaTwoWeeks"`
  * `schedule`: `"31"`
  * `start`: ISO Timestamp ngày 10/10/2026 (`"2026-10-10T...Z"`)
* **Trạng thái phản hồi Backend:** Tất cả 6 thẻ sự kiện lịch đều trả về `HTTP 200 OK` kèm dữ liệu `tile` và `workpool_tiles` xác nhận vị trí mới ngày `10-10-2026`.

---

## 4. XÁC NHẬN TRÊN GIAO DIỆN WEB

Bây giờ bạn chỉ cần **F5 (Reload / Tải lại trang Web Portal `r2.gdesk.io`)**, tất cả 6 thẻ sự kiện lịch (Event Tiles) của KTV Lam tại ngày **04/10/2026** đã chính thức di chuyển sang vị trí mới tại cột ngày **10/10/2026**!
