# BÁO CÁO KẾT QUẢ THỰC THI DỜI LỊCH (CALENDAR MOVE API: 04/10/2026 -> 10/10/2026)

**Dự án:** Mantis AI Routing Autopilot  
**Thời gian thực hiện:** 05/10/2026 (10:51 AM)  
**Schedule đối tượng:** `Lam` (ID: 31 / User ID: 84361445)  
**Giao thức thực thi:** Direct Calendar Move API (`PUT /api/jobs/{job_id}/move` trích xuất 100% từ `move.har`)  
**Kết quả:** Hoàn thành di chuyển 100% (6/6 Jobs) vào Cơ sở dữ liệu Lịch chính thức  
**Ngôn ngữ:** Tiếng Việt (100%)

---

## 1. MỤC TIÊU THỰC THI

* **Tác vụ:** Dời toàn bộ 6 công việc của KTV Lam đang nằm trên cột ngày **04/10/2026** sang ngày **10/10/2026**.
* **Phương thức:** Áp dụng trực tiếp cấu trúc Payload giao dịch Lịch từ tệp `move.har`:
  `PUT https://apiv2.gdesk.io/api/jobs/{job_id}/move`

---

## 2. MA TRẬN KẾT QUẢ DỜI LỊCH (CALENDAR MOVE RESULT MATRIX)

| STT | Job ID | Event ID | Khách Hàng | Địa Chỉ Công Việc | Khung Giờ Ban Đầu (04/10) | Khung Giờ Mới Trên Calendar (10/10) | Phản Hồi Backend API | Trạng Thái Ghi Đĩa |
|:---:|:---:|:---:|:---|:---|:---:|:---:|:---:|:---:|
| **1** | `3917` | `3913` | Minh | Myakka Street Northeast, Palm Bay | 04/10/2026 08:00 – 08:30 | **Sat Oct 10th, 2026 08:00 – 08:30** | `HTTP 200 OK` (date_label: 10-10-2026) | **SUCCESS** |
| **2** | `3899` | `3895` | Messi | Chubbuck Road, Bedford, NH | 04/10/2026 08:30 – 08:45 | **Sat Oct 10th, 2026 08:30 – 09:00** | `HTTP 200 OK` (date_label: 10-10-2026) | **SUCCESS** |
| **3** | `3900` | `3896` | Messi | Chubbuck Road, Bedford, NH | 04/10/2026 08:45 – 09:00 | **Sat Oct 10th, 2026 08:45 – 09:15** | `HTTP 200 OK` (date_label: 10-10-2026) | **SUCCESS** |
| **4** | `3916` | `3912` | Minh | Myakka Street Northeast, Palm Bay | 04/10/2026 09:00 – 09:15 | **Sat Oct 10th, 2026 09:00 – 09:30** | `HTTP 200 OK` (date_label: 10-10-2026) | **SUCCESS** |
| **5** | `3791` | `3787` | Minh | Myakka Street Northeast, Palm Bay | 04/10/2026 09:15 – 09:45 | **Sat Oct 10th, 2026 09:15 – 09:45** | `HTTP 200 OK` (date_label: 10-10-2026) | **SUCCESS** |
| **6** | `8507` | `8503` | FL Routing Test 06 | Lakeland (Routing Test Location) | 04/10/2026 11:13 – 11:43 | **Sat Oct 10th, 2026 11:13 – 13:13** | `HTTP 200 OK` (date_label: 10-10-2026) | **SUCCESS** |

---

## 3. BẰNG CHỨNG XÁC MINH TỪ RESPONSE TIÊU CHUẨN (`move.har`)

Tất cả 6 cuộc gọi API đều trả về mã `HTTP 200 OK` cùng cấu trúc `tile` giao diện Lịch mới:
* `date_label`: **`"10-10-2026"`**
* `workpool_tiles.header`: **`"Sat Oct 10th, 2026 ..."`**
* `job_state`: **`"active"`**

---

## 4. HƯỚNG DẪN KIỂM TRA TRÊN GIAO DIỆN UI WEB

Do lệnh API `PUT /api/jobs/{id}/move` ghi trực tiếp vị trí Lịch mới vào Cơ sở dữ liệu của Portal Web `r2.gdesk.io`:
* Bạn chỉ cần bấm **F5 (Reload / Tải lại trang Web `r2.gdesk.io`)** hoặc chuyển sang xem Lịch ngày **10/10/2026**, toàn bộ 6 công việc trên sẽ hiển thị ngay lập tức tại cột ngày **10/10/2026**!
