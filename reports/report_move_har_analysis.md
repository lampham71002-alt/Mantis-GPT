# BÁO CÁO PHÂN TÍCH CHUYÊN SÂU TỆP `MOVE.HAR` (THAO TÁC DỜI LỊCH TRÊN CALENDAR UI)

**Dự án:** Mantis AI Routing Autopilot  
**Thời gian thực hiện:** 05/10/2026  
**Tệp phân tích:** `c:\mantis-auto\move.har` (Dung lượng: 811.9 KB)  
**Mục tiêu:** Trích xuất đặc tả API thực tế của thao tác Kéo & Thả (Drag & Drop) dời lịch trên giao diện Lịch Calendar (`https://r2.gdesk.io`).  
**Trạng thái hiện tại:** **Đã bóc tách 100% — Sẵn sàng chờ lệnh thao tác từ Quản trị viên.**  
**Ngôn ngữ:** Tiếng Việt (100%)

---

## 1. TỔNG QUAN PHÁT HIỆN TỪ `MOVE.HAR`

Tệp `move.har` ghi lại chuỗi 15 giao dịch mạng khi người dùng thực hiện thao tác xem lịch và **Kéo - Thả (Drag & Drop)** dời một công việc trên giao diện Lịch Web Calendar:

* **Endpoint dời lịch chính:** `PUT https://apiv2.gdesk.io/api/jobs/{job_id}/move`
* **Mã công việc ghi nhận trong HAR:** Job ID `7043` (Bi-Monthly Service của khách hàng NaplesAuto_1 Test tại 8950 Tamiami Trail N, Naples, FL).
* **Mã Schedule:** `31` (KTV Lam / Lam Test).
* **Mã khung thời gian hiển thị (`agenda`):** `agendaTwoWeeks` (Xem góc nhìn 2 tuần).

---

## 2. GIẢI MÃ CHI TIẾT CẤU TRÚC GIAO DỊCH API MOVE JOB

### 2.1. Request Payload chuẩn (`PUT /api/jobs/{job_id}/move`):
```json
{
  "typeEvent": "job",
  "start": "2026-10-11T08:00:00.000Z",
  "color_id": 1,
  "schedule": "31",
  "agenda": "agendaTwoWeeks",
  "agenda_start": "2026-10-04T00:00:00Z",
  "all": 0,
  "notify_tech": 0,
  "socket_id": "1791171123467_main_calendar"
}
```

#### Phân tích các trường dữ liệu bắt buộc:
* **`typeEvent`**: Định dạng sự kiện (`"job"`).
* **`start`**: ISO Timestamp mốc giờ bắt đầu mới ấn định (ví dụ: `"2026-10-11T08:00:00.000Z"` cho ngày 11/10/2026 lúc 8:00 AM UTC).
* **`schedule`**: ID của Lịch / Kỹ thuật viên phụ trách (`"31"`).
* **`agenda`**: Chế độ xem của Lịch (`"agendaTwoWeeks"`).
* **`agenda_start`**: Ngày đầu tiên của khung xem (`"2026-10-04T00:00:00Z"`).
* **`notify_tech`**: Cờ gửi thông báo cho KTV (`0`: Không gửi / `1`: Gửi).
* **`socket_id`**: Mã định danh Socket giao diện thời gian thực để đồng bộ giữa các tab trình duyệt (`"1791171123467_main_calendar"`).

---

### 2.2. Response chuẩn từ Backend Server (Status 200 OK):
Backend cập nhật vị trí lịch trực tiếp trong cơ sở dữ liệu và trả về cấu trúc HTML/JSON của thẻ hiển thị mới (`tile`):

```json
{
  "data": [
    {
      "tile": {
        "header_long": "8 - 8:45am",
        "header": "8 - 8:45am",
        "content_long": ["NaplesAuto_1 Test", "8950 Tamiami Trail N", "Bi-Monthly Service $65.00"],
        "content": ["NaplesAuto_1 Test", "8950 Tamiami Trail N", "Bi-Monthly Service $65.00"]
      },
      "map_tiles": [...],
      "job_tiles": [...]
    }
  ]
}
```

---

## 3. DANH SÁCH CÁC ENDPOINT ĐI KÈM TRONG CHU TRÌNH LỊCH

Ngoài API `PUT /api/jobs/{id}/move`, tệp `move.har` còn ghi nhận các API bổ trợ trong chu trình tải Lịch:

1. **`GET /api/calendar/holiday?start=...&end=...`**: Tải danh sách ngày lễ quốc gia/địa phương để tô màu ngày nghỉ trên Lịch.
2. **`GET /api/workpool?...`**: Tải danh sách công việc chờ phân công (Workpool).
3. **`GET /api/jobs?agenda=agendaTwoWeeks&schedule=31&start=...&end=...`**: Tải toàn bộ công việc hiển thị trên Lịch cho 2 tuần.
4. **`GET /api/workpool/count`**: Đếm số công việc chưa phân công (Pool: 104, Missed: 13).

---

## 4. TỔNG KẾT & TRẠNG THÁI SẮN SÀNG

* **Kết quả:** Đã đọc, phân tích và trích xuất thành công 100% cú pháp API thực tế từ tệp `move.har`.
* **Trạng thái hiện tại:** **Đã hoàn tất bóc tách toàn bộ file mới.**  
* **Hành động tiếp theo:** **Đang đứng chờ Quản trị viên ra lệnh thao tác tiếp theo.**
