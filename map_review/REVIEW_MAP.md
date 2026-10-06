# Review Map.har

Phạm vi: đọc HAR, không gọi API live hoặc thay đổi dữ liệu.

## Luồng API

1. `GET /api/routing/mantis/autopilot/jobs`: tải job và chạy tối ưu Sandbox; HTTP 200, kết thúc success=true.
2. `GET /api/routing/mantis/settings`: freeze_window_days=work_day, optimization_horizon=14_days, cả hai status=1.
3. Hai `PUT /api/calendar/store`: type=13, value lần lượt 0 rồi 1, đều success=true. HAR chưa đủ để đặt tên chính xác cho tùy chọn UI này.
4. `GET /api/routing/mantis/autopilot/routes`: lấy đường vẽ theo optimization_id; HTTP 200, kết thúc success=true.

Hai API jobs/routes cùng scope schedule_ids=31 (Lam), agendaTwoWeeks, 27/09–10/10/2026, inc=recurring.
Optimization ID: `opt_sandbox_a98f68bdf96facbfd7089bcc957e35df`.
Dù Content-Type là text/event-stream, nội dung thực tế là mỗi dòng một JSON, dùng trường type để phân loại.

## Kết quả quan sát

- Có 35 event ID khác nhau trong bốn batch events: 10 + 6 + 10 + 9. Không coi hai batch đầu là toàn bộ before và hai batch cuối là toàn bộ after.
- is_routing=0: 17 job; is_routing=1: 18 job. Không suy ra riêng từ cờ này rằng tất cả 17 job là lỗi/không được áp rule.
- Backend báo input_job_count=35, final_calendar_job_count=35, missing_event_ids=[].
- routing_algorithm=2; balanced_global_plan=true; balanced_exception_count=0; balanced_fallback_solve_count=0.
- Có 8 drive_time block thuộc scope optimized, tổng 242 phút; downtime array rỗng. Đây là tổng block trả về, không tự coi là drive time của toàn bộ 35 job.
- HAR không có request Accept hay log History để chứng minh lịch đã được lưu.

## Route theo ngày

| Ngày | Schedule | Số đoạn polyline |
|---|---|---|
| 2026-10-04 | 31 | 13 |
| 2026-10-05 | 31 | 53 |
| 2026-10-06 | 31 | 14 |
| 2026-10-08 | 31 | 9 |
| 2026-10-09 | 31 | 8 |
| 2026-10-10 | 31 | 37 |

Polyline là dữ liệu hình học để vẽ đường, số đoạn không phải số job. Đã xác nhận có dữ liệu route; chưa kiểm tra hình vẽ thực tế trên UI hoặc độ chính xác đường đi.

## Customer và job trong stream

Giờ dưới đây giữ nguyên giờ ghi trong response (+00:00), chưa quy đổi múi giờ.

| Customer | Customer ID | Job ID | Event ID | Service | Bắt đầu | Kết thúc | is_routing |
|---|---|---|---|---|---|---|---|
| Minh | 14783 | 3917 | 3913 | Every 21 Days | 2026-10-04T08:00:00+00:00 | 2026-10-04T08:30:00+00:00 | 0 |
| Minh | 14783 | 3899 | 3895 | Call Back Service | 2026-10-04T08:30:00+00:00 | 2026-10-04T08:45:00+00:00 | 0 |
| Minh | 14783 | 3900 | 3896 | Call Back Service | 2026-10-04T08:45:00+00:00 | 2026-10-04T09:00:00+00:00 | 0 |
| Minh | 14783 | 3916 | 3912 | Call Back Service | 2026-10-04T09:00:00+00:00 | 2026-10-04T09:15:00+00:00 | 0 |
| Minh | 14783 | 3791 | 3787 | Every 21 Days | 2026-10-04T09:15:00+00:00 | 2026-10-04T09:45:00+00:00 | 0 |
| FL Routing Test 04 | 15523 | 8507 | 8503 | Every 21 Days | 2026-10-04T11:13:00+00:00 | 2026-10-04T11:43:00+00:00 | 0 |
| Test6 Routing | 14861 | 7042 | 7038 | Call Back Service | 2026-10-05T09:06:00+00:00 | 2026-10-05T09:36:00+00:00 | 0 |
| TestAuto_5 Routing | 14860 | 7041 | 7037 | Call Back Service | 2026-10-05T09:37:00+00:00 | 2026-10-05T10:07:00+00:00 | 0 |
| TestAuto_4 Routing | 14859 | 7040 | 7036 | Call Back Service | 2026-10-05T10:08:00+00:00 | 2026-10-05T10:38:00+00:00 | 0 |
| Lam | 14780 | 3755 | 3751 | Every 21 Days | 2026-10-05T10:39:00+00:00 | 2026-10-05T11:09:00+00:00 | 0 |
| nami | 14790 | 8497 | 8493 | Wasp Nest Removal | 2026-10-05T11:09:00+00:00 | 2026-10-05T11:54:00+00:00 | 0 |
| nami | 14790 | 6815 | 6811 | Call Back Service | 2026-10-05T11:49:00+00:00 | 2026-10-05T12:34:00+00:00 | 0 |
| Test_7 Routing | 14862 | 7043 | 7039 | Bed Bug Heat Treatment | 2026-10-05T12:11:00+00:00 | 2026-10-05T12:41:00+00:00 | 0 |
| Test_8 Routing | 14863 | 7044 | 7040 | Call Back Service | 2026-10-05T12:43:00+00:00 | 2026-10-05T13:13:00+00:00 | 0 |
| Test_9 Routing | 14864 | 7045 | 7041 | Follow Up Inspections | 2026-10-05T13:25:00+00:00 | 2026-10-05T13:55:00+00:00 | 0 |
| Test_10 Routing | 14865 | 7046 | 7042 | Follow Up Inspections | 2026-10-05T13:58:00+00:00 | 2026-10-05T14:28:00+00:00 | 0 |
| NaplesAuto_4 Test | 14869 | 7086 | 7082 | Preventative Monitoring & Maintenance | 2026-10-06T08:00:00+00:00 | 2026-10-06T08:30:00+00:00 | 1 |
| NaplesAuto_1 Test | 14866 | 7047 | 7043 | Bi-Monthly Service | 2026-10-06T08:50:00+00:00 | 2026-10-06T09:35:00+00:00 | 1 |
| Julian Alvarez | 15371 | 8484 | 8480 | Bi-Monthly Service | 2026-10-07T08:00:00+00:00 | 2026-10-07T08:30:00+00:00 | 1 |
| FL Routing Test 02 | 15521 | 8502 | 8498 | Flea & Tick Control | 2026-10-08T08:00:00+00:00 | 2026-10-08T08:30:00+00:00 | 1 |
| FL Routing Test 02 | 15521 | 8556 | 8552 | General Pest Control | 2026-10-08T08:30:00+00:00 | 2026-10-08T08:53:00+00:00 | 1 |
| FL Routing Test 10 | 15529 | 8520 | 8516 | Monthly Service | 2026-10-08T09:22:00+00:00 | 2026-10-08T09:37:00+00:00 | 1 |
| FL Routing Test 05 | 15524 | 8508 | 8504 | Call Back Service | 2026-10-08T10:02:00+00:00 | 2026-10-08T10:17:00+00:00 | 1 |
| FL Routing Test 05 | 15524 | 8509 | 8505 | Call Back Service | 2026-10-08T10:17:00+00:00 | 2026-10-08T10:32:00+00:00 | 1 |
| FL Routing Test 05 | 15524 | 8558 | 8554 | Termite Baiting & Monitoring | 2026-10-08T10:32:00+00:00 | 2026-10-08T10:53:00+00:00 | 1 |
| FL Routing Test 13 | 15532 | 8544 | 8540 | Flea & Tick Control | 2026-10-09T09:15:00+00:00 | 2026-10-09T09:54:00+00:00 | 0 |
| FL Routing Test 15 | 15534 | 8531 | 8527 | Flea & Tick Control | 2026-10-09T10:24:00+00:00 | 2026-10-09T10:54:00+00:00 | 1 |
| FL Routing Test 15 | 15534 | 8532 | 8528 | Wasp Nest Removal | 2026-10-09T10:54:00+00:00 | 2026-10-09T11:54:00+00:00 | 1 |
| FL Routing Test 15 | 15534 | 8549 | 8545 | Eco-Friendly Pest Solutions | 2026-10-09T11:54:00+00:00 | 2026-10-09T12:04:00+00:00 | 1 |
| FL Routing Test 15 | 15534 | 8572 | 8568 | Call Back Service | 2026-10-09T12:04:00+00:00 | 2026-10-09T12:24:00+00:00 | 1 |
| NaplesAuto_2 Test | 14867 | 7059 | 7055 | Flea & Tick Control | 2026-10-10T08:00:00+00:00 | 2026-10-10T08:45:00+00:00 | 1 |
| Tony Stark | 15373 | 8248 | 8244 | Preventative Monitoring & Maintenance | 2026-10-10T10:35:00+00:00 | 2026-10-10T11:05:00+00:00 | 1 |
| John Wick | 15372 | 8246 | 8242 | Eco-Friendly Pest Solutions | 2026-10-10T11:09:00+00:00 | 2026-10-10T11:24:00+00:00 | 1 |
| Clark Kent | 15376 | 8234 | 8230 | Bi-Monthly Service | 2026-10-10T11:29:00+00:00 | 2026-10-10T11:59:00+00:00 | 1 |
| Peter Parker | 15375 | 8247 | 8243 | Flea & Tick Control | 2026-10-10T12:18:00+00:00 | 2026-10-10T12:48:00+00:00 | 1 |
