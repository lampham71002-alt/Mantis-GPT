# Báo Cáo Tạo 10 Jobs Rải Đều Theo Thời Gian (HCM Customer 21 - 30)

> **Tài khoản thực hiện:** `lam.pham@gmail.com` | Password: `Ahihi123`  
> **Branch:** `GD1LK8RC5OH0` | **Schedule:** `lam 1` (ID: `249`)  
> **Dịch vụ:** `Initial Service` (ID: `2539`, thời lượng: 1 giờ/job)  
> **Yêu cầu:** Tạo 10 job cho 10 khách hàng mới (`HCM Customer 21` → `HCM Customer 30`), **rải đều theo các khung giờ trong ngày**, không bị chồng lấn hay gom cục.  
> **Kết quả:** **10/10 Jobs hoàn thành thành công 100%**.

---

## 1. Lịch Trình Rải Đều Khung Giờ Trong Ngày

Các công việc được rải đều thành 5 ca làm việc mỗi ngày, cách nhau khoảng nghỉ hợp lý từ sáng đến chiều:
- **Ca 1 (Sáng sớm):** `08:00 - 09:00`
- **Ca 2 (Giữa sáng):** `09:30 - 10:30`
- **Ca 3 (Trưa):** `11:00 - 12:00`
- **Ca 4 (Đầu chiều):** `13:30 - 14:30`
- **Ca 5 (Xế chiều):** `15:00 - 16:00`

---

## 2. Bảng Chi Tiết 10 Jobs Đã Tạo

| STT | Job ID | Ngày Hẹn | Khung Giờ Làm | Khách Hàng | Customer ID | Quận / Khu Vực | Địa Chỉ Chi Tiết |
| :---: | :---: | :---: | :---: | :--- | :---: | :--- | :--- |
| **1** | **`101514`** | 15/10/2026 | **08:00 - 09:00** | HCM Customer 21 | `1587` | Quận 1 | 100 Hàm Nghi, Bến Nghé |
| **2** | **`101515`** | 15/10/2026 | **09:30 - 10:30** | HCM Customer 22 | `1588` | Quận 1 | 2 Pasteur, Bến Nghé |
| **3** | **`101516`** | 15/10/2026 | **11:00 - 12:00** | HCM Customer 23 | `1589` | Quận 3 | 32 Trần Quốc Thảo, P. 7 |
| **4** | **`101517`** | 15/10/2026 | **13:30 - 14:30** | HCM Customer 24 | `1590` | Quận 10 | 500 Sư Vạn Hạnh, P. 12 |
| **5** | **`101518`** | 15/10/2026 | **15:00 - 16:00** | HCM Customer 25 | `1591` | Phú Nhuận | 150 Huỳnh Văn Bánh, P. 12 |
| **6** | **`101519`** | 16/10/2026 | **08:00 - 09:00** | HCM Customer 26 | `1592` | Bình Thạnh | 200 Xô Viết Nghệ Tĩnh, P. 21 |
| **7** | **`101520`** | 16/10/2026 | **09:30 - 10:30** | HCM Customer 27 | `1593` | Tân Bình | 12 Phổ Quang, P. 2 |
| **8** | **`101521`** | 16/10/2026 | **11:00 - 12:00** | HCM Customer 28 | `1594` | Quận 7 | 10 Nguyễn Thị Thập, Tân Hưng |
| **9** | **`101522`** | 16/10/2026 | **13:30 - 14:30** | HCM Customer 29 | `1595` | TP. Thủ Đức | 50 Trần Não, An Khánh |
| **10** | **`101523`** | 16/10/2026 | **15:00 - 16:00** | HCM Customer 30 | `1596` | Quận 5 | 200 Trần Hưng Đạo, P. 11 |

---

## 3. Tệp Dữ Liệu & Mã Nguồn

- File JSON dữ liệu 10 Jobs: `reports/hcm_10_more_jobs_staggered.json`
- Script thực thi tạo jobs: `scratch/create_10_staggered_jobs.js`
- Ảnh chụp màn hình Calendar: `reports/hcm_10_staggered_jobs_calendar.png`
