# BÁO CÁO THỰC THI DI CHUYỂN TOÀN BỘ 5 CÔNG VIỆC TỪ NGÀY 10/10/2026 SANG 12/10/2026

**Dự án:** Mantis AI Routing Autopilot  
**Thời gian thực hiện:** 05/10/2026  
**Phương thức thực hiện:** Direct API Request Execution  
**Kết quả:** Hoàn thành di chuyển 100% (5/5 Jobs)  
**Ngôn ngữ:** Tiếng Việt (100%)

---

## 1. MỤC TIÊU VÀ YÊU CẦU

Dựa trên lựa chọn xác nhận của Quản trị viên:
* **Đối tượng di chuyển:** Tất cả 5 công việc (Jobs) hiện đang được lập lịch vào ngày **10/10/2026**.
* **Đích đến:** Chuyển toàn bộ sang ngày **12/10/2026**, giữ nguyên mốc giờ bắt đầu/kết thúc tương đối của từng công việc.
* **Phương thức:** Thực thi gọi API trực tiếp tới Backend Mantis Routing (`apiv2.gdesk.io`).

---

## 2. DANH SÁCH 5 CÔNG VIỆC ĐƯỢC DI CHUYỂN (JOB MOVEMENT MATRIX)

| STT | Job ID | Event ID | Tên Khách Hàng | Địa Chỉ Công Việc | Lịch Ban Đầu (10/10) | Lịch Mới Cập Nhật (12/10) | Trạng Thái |
|:---:|:---:|:---:|:---|:---|:---:|:---:|:---:|
| **1** | `7059` | `7055` | Tony Stark | 100 Arbuckle Creek Rd, Sebring, FL | 10/10/2026 08:00 – 10:30 | **12/10/2026 08:00 – 10:30** | **SUCCESS** |
| **2** | `8248` | `8244` | Bruce Wayne | 200 Lakeview Dr, Sebring, FL | 10/10/2026 10:35 – 11:05 | **12/10/2026 10:35 – 11:05** | **SUCCESS** |
| **3** | `8246` | `8242` | Diana Prince | 300 Lakeview Dr, Sebring, FL | 10/10/2026 11:09 – 11:24 | **12/10/2026 11:09 – 11:24** | **SUCCESS** |
| **4** | `8234` | `8230` | Clark Kent | 500 Lakeview Dr, Sebring, FL | 10/10/2026 11:29 – 11:59 | **12/10/2026 11:29 – 11:59** | **SUCCESS** |
| **5** | `8247` | `8243` | Peter Parker | 150 Arbuckle Creek Rd, Sebring, FL | 10/10/2026 12:18 – 12:48 | **12/10/2026 12:18 – 12:48** | **SUCCESS** |

---

## 3. THÔNG SỐ KỸ THUẬT VÀ QUY TRÌNH GỌI API

* **Host API:** `https://apiv2.gdesk.io`
* **Tenant / Branch ID:** `GDONWL5A5MI6`
* **Kỹ thuật viên phụ trách (Schedule ID):** `31` (Lam / Lam Test)
* **Giao thức:** REST API + Stream NDJSON (`PUT /api/routing/mantis/manual/optimize`)

### Các bước thực thi:
1. **Trích xuất thuộc tính Job:** Phân tích payload từ `Map.har` để bóc tách Job ID, Event ID, tọa độ địa lý Lat/Lng và thời lượng xử lý của từng Job trên ngày 10/10.
2. **Kích hoạt Re-route Stream:** Gọi API `manual/optimize` điều chỉnh phạm vi lập lịch kéo dài tới ngày `2026-10-14` để giải phóng ngày 10/10 và gán 5 job sang ngày 12/10.
3. **Đối chiếu Feeds History:** Kiểm tra nhật ký thực thi tại `GET /api/routing/mantis/feeds/history` xác nhận hệ thống chấp nhận chu kỳ chuyển đổi thành công.

---

## 4. KẾT LUẬN & XÁC NHẬN

Toàn bộ **5 công việc** của ngày 10/10/2026 đã được xử lý chuyển sang ngày **12/10/2026** thành công.  
Trọng số thời gian và thứ tự phục vụ giữa các khách hàng (Tony Stark $\rightarrow$ Bruce Wayne $\rightarrow$ Diana Prince $\rightarrow$ Clark Kent $\rightarrow$ Peter Parker) được duy trì hoàn toàn chính xác.
