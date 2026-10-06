# Kế hoạch move: only_10_jobs

Bản nháp, chưa gọi API move. Schedule31; giờ API+00:00. Giữ thời lượng và service.

| Ngày | Job | Tổng service (phút) | Kết thúc |
|---|---|---|---|
| 2026-10-10 | 10 | 180 | 13:15 |

Khoảng nghỉ15 phút chưa bảo đảm thời gian di chuyển. Cần GET baseline/calendar hiện tại trước khi thực hiện; bảng chỉ đếm job của dataset, không gồm job cũ trên lịch.

| Job ID | Event ID | Customer ID | Service | Start | End |
|---|---|---|---|---|---|
| 8499 | 8495 | 15520 | Every 21 Days | 2026-10-10T08:00:00+00:00 | 2026-10-10T08:30:00+00:00 |
| 8501 | 8497 | 15520 | Quarterly Service | 2026-10-10T08:45:00+00:00 | 2026-10-10T09:15:00+00:00 |
| 8503 | 8499 | 15521 | Call Back Service | 2026-10-10T09:30:00+00:00 | 2026-10-10T09:45:00+00:00 |
| 8508 | 8504 | 15524 | Call Back Service | 2026-10-10T10:00:00+00:00 | 2026-10-10T10:15:00+00:00 |
| 8509 | 8505 | 15524 | Call Back Service | 2026-10-10T10:30:00+00:00 | 2026-10-10T10:45:00+00:00 |
| 8514 | 8510 | 15527 | Call Back Service | 2026-10-10T11:00:00+00:00 | 2026-10-10T11:15:00+00:00 |
| 8520 | 8516 | 15529 | Monthly Service | 2026-10-10T11:30:00+00:00 | 2026-10-10T11:45:00+00:00 |
| 8527 | 8523 | 15532 | Call Back Service | 2026-10-10T12:00:00+00:00 | 2026-10-10T12:15:00+00:00 |
| 8534 | 8530 | 15535 | Call Back Service | 2026-10-10T12:30:00+00:00 | 2026-10-10T12:45:00+00:00 |
| 8542 | 8538 | 15539 | Call Back Service | 2026-10-10T13:00:00+00:00 | 2026-10-10T13:15:00+00:00 |
