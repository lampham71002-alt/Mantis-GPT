# Test Optimization Priority và Map — 05/10/2026

## Kết luận

Đổi Cluster (1) → Balanced (2) → Cluster (1) hoạt động và làm thay đổi cả lịch đề xuất lẫn đường Map. Với dữ liệu đang test, Balanced trả tổng block di chuyển thấp hơn Cluster **271 phút (52,8%)**. Chưa đủ bằng chứng kết luận thuật toán nào tối ưu toàn cục.

Điểm cần review nhất: Cluster ghép Julian Alvarez ở Tallahassee với nhóm Titusville trong cùng ngày, tạo chặng **4 giờ 31 phút**. Balanced tách Julian sang ngày riêng và loại được chặng này. Đây là quan sát về chất lượng tối ưu, chưa phải lỗi hard rule: giới hạn travel đang tắt và hai chế độ có thể đánh đổi số ngày hoạt động với thời gian chạy xe.

## Phạm vi và kết quả

- Giữ scope Map.har: **schedule Lam (31), 27/09–10/10/2026**, agendaTwoWeeks, inc=recurring. Đây không phải lượt test toàn bộ schedule Custom (32).
- Chạy ba lượt Sandbox, đọc lại cấu hình mỗi lần đổi và lấy Map bằng optimization_id của lượt vừa chạy.
- Chỉ đổi routing_algorithm. Đã khôi phục về Cluster (value=1), đọc lại xác nhận toàn bộ route-efficiency trùng snapshot ban đầu.
- Không Accept kết quả. GET calendar trước/sau trả 29 row và giống hoàn toàn. Calendar dùng inc=task, Sandbox dùng inc=recurring; không coi 29 row này là toàn bộ cohort Sandbox.
- Giờ job trong báo cáo giữ nguyên giờ response (+00:00), không tự quy đổi theo múi giờ máy.
- Giữ scope nghiệp vụ Mantis (4) đã được team confirm; báo cáo này không thay đổi scope đó.

| Chỉ tiêu | Cluster lần 1 | Balanced | Cluster chạy lại |
|---|---:|---:|---:|
| Job / event ID khác nhau | 35 / 35 | 35 / 35 | 35 / 35 |
| Job is_routing=1 | 18 | 18 | 18 |
| Job is_routing=0 | 17 | 17 | 17 |
| Tổng thời lượng 35 job | 998 phút | 998 phút | 998 phút |
| Thời lượng 18 job is_routing=1 | 494 phút | 494 phút | 494 phút |
| Tổng block drive_time scope optimized | **513 phút** | **242 phút** | **513 phút** |
| Số block drive_time | 9 | 8 | 9 |
| Số ngày có job is_routing=1 | 4 | 5 | 4 |
| Số ngày API trả polyline | 6 | 6 | 6 |
| Job is_routing=1 ngoài 08:00–16:30 | 0 | 0 | 0 |

12 job có ngày/giờ khác giữa Cluster và Balanced. Hai chế độ giữ cùng tập event ID; 17 job is_routing=0 giữ nguyên. Hai lượt Cluster có cùng placement và response Map giống hoàn toàn, dù optimization_id khác nhau.

Drive_time ở đây là tổng block optimized API trả, có cả chặng từ anchor 8544 sang job 8531. Không coi đây là tổng drive của toàn bộ calendar: tuyến frozen có polyline nhưng không có block drive_time tương ứng trong nhóm optimized. Depot legs OFF nên so sánh không bao gồm việc đi từ/về nhà technician hoặc hành trình qua đêm.

## Điểm cần review

### 1. Cluster tạo chặng Tallahassee → Titusville dài 271 phút

Ngày 08/10, Cluster trả:

- **Julian Alvarez — job 8484, event 8480**, Tallahassee: 08:00–08:30.
- Drive: **08:30–13:01**, 271 phút.
- **FL Routing Test 05 — job 8508, event 8504**, Titusville: 13:01–13:16.
- Sau đó tiếp tục nhóm customer 05 → customer 10 ở Cocoa → customer 02 ở Melbourne.

Balanced đưa Julian Alvarez / 8484 sang **07/10, 08:00–08:30**, một mình trong ngày. Nhóm Melbourne → Cocoa → Titusville chạy 08/10, 08:00–10:53. Chênh lệch tổng drive đúng bằng chặng 271 phút được bỏ; số ngày có job được route tăng từ 4 lên 5.

Nếu chỉ đánh giá drive_time trong scope với depot OFF, Balanced tốt hơn rõ rệt. Nếu mục tiêu Cluster ưu tiên gom ít ngày, cần xem trọng số/objective trước khi chấm FAIL. Capture không có objective score hoặc ma trận mọi cặp nên chưa chứng minh được nghiệm tối ưu toàn cục.

### 2. Cả hai còn chặng 110 phút

**NaplesAuto_2 Test / job 7059**, Bonita Springs → **Tony Stark / job 8248**, Sebring. Cluster xếp 07/10, Balanced xếp 10/10; cùng drive 08:45–10:35. Đây là chặng dài đáng xem trong vận hành, nhưng không vi phạm travel cap vì maximum distance và maximum travel time đều OFF.

### 3. Hai overlap có sẵn trong lịch frozen

| Ngày | Job/customer trước | Job/customer sau | Trùng giờ |
|---|---|---|---:|
| 05/10 | nami / 8497: 11:09–11:54 | nami / 6815: 11:49–12:34 | 5 phút |
| 05/10 | nami / 6815: 11:49–12:34 | Test_7 Routing / 7043: 12:11–12:41 | 23 phút |

Đã đối chiếu calendar_before: overlap tồn tại trước test. Các job đều is_routing=0 và giữ nguyên qua cả ba lượt; freeze_window=work_day đang ON. Không báo đây là overlap do thuật toán vừa tạo. Không phát hiện overlap mới giữa các job được tối ưu trong lần test này.

## Kiểm tra Map

- Mỗi Map được lấy bằng đúng optimization_id của lượt jobs tương ứng; ngày và đường thay đổi phù hợp lịch đề xuất.
- Giải mã polyline, đối chiếu tọa độ customer theo ngày: mọi ngày có từ hai tọa độ customer khác nhau đều có route; không phát hiện ngày nhiều location bị thiếu đường.
- Khoảng cách lớn nhất từ customer tới vertex gần nhất của polyline cùng ngày khoảng **171,3 m**. Đây là kiểm tra hình học sơ bộ, chịu ảnh hưởng snapping vào đường và giản lược polyline; chưa kiểm định địa chỉ/cổng vào chính xác.
- Balanced ngày 07/10 chỉ có Julian Alvarez nên không có polyline ngày đó là hợp lý; stream vẫn có job và tọa độ để vẽ marker. Chưa kiểm chứng marker trên UI.
- Cả 17 block drive_time của hai lượt đầu đều ghép được job nguồn có end bằng block.start và job đích có start bằng block.end.
- Xuất hình học API thành `MAP_COMPARE.html` và hai SVG. Đây là bản dựng từ response, chưa kiểm tra rendering/cache tương tác trên UI ứng dụng.

## Ràng buộc và giới hạn kiểm chứng

Snapshot trước test: service hours ON 08:00–16:30; freeze work_day ON; horizon 14_days ON; cross-technician=1 nhưng request chỉ chọn schedule31. Travel caps, max jobs/day, movement restriction, preserve period, preferred tech, skill, region, drive buffer và depot legs đều OFF.

Đọc rule context sau test: 134 Custom Rule không có rule status=1; 52 Specific Rule có rule **1039 status=1**, nội dung Region 2 strict 08:00–10:00. Chưa có attribution/cohort History hoặc mapping Region 2 trong captures này để xác định job nào chịu rule 1039; không suy ra mọi job ngoài 10:00 là lỗi. Context lấy sau test không chứng minh không có chỉnh sửa đồng thời trước đó.

Các file `settings_before.json`, `*_settings.json`, `*_jobs.json`, `*_routes.json`, `analysis.json`, `calendar_before.json`, `calendar_after.json`, `restore_verification.json` nằm cùng thư mục. Không lưu header/token vào các file kết quả này.

| Lượt | Optimization ID |
|---|---|
| Cluster lần 1 | opt_sandbox_5dbc5c0512389e173bb2c554115d3797 |
| Balanced | opt_sandbox_5e3c25f0fcf9de80381cc9e07a802865 |
| Cluster chạy lại | opt_sandbox_8660207fe8258a1fc02a2c15eac30d6b |

## Chi tiết từng customer/job

| Customer | Job ID | Event ID | Cluster | Balanced | is_routing |
|---|---|---|---|---|---|
| Clark Kent | 8234 | 8230 | 2026-10-07 11:29–11:59 | 2026-10-10 11:29–11:59 | 1 |
| FL Routing Test 02 | 8502 | 8498 | 2026-10-08 15:01–15:31 | 2026-10-08 08:00–08:30 | 1 |
| FL Routing Test 02 | 8556 | 8552 | 2026-10-08 15:31–15:54 | 2026-10-08 08:30–08:53 | 1 |
| FL Routing Test 04 | 8507 | 8503 | 2026-10-04 11:13–11:43 | 2026-10-04 11:13–11:43 | 0 |
| FL Routing Test 05 | 8508 | 8504 | 2026-10-08 13:01–13:16 | 2026-10-08 10:02–10:17 | 1 |
| FL Routing Test 05 | 8509 | 8505 | 2026-10-08 13:16–13:31 | 2026-10-08 10:17–10:32 | 1 |
| FL Routing Test 05 | 8558 | 8554 | 2026-10-08 13:31–13:52 | 2026-10-08 10:32–10:53 | 1 |
| FL Routing Test 10 | 8520 | 8516 | 2026-10-08 14:17–14:32 | 2026-10-08 09:22–09:37 | 1 |
| FL Routing Test 13 | 8544 | 8540 | 2026-10-09 09:15–09:54 | 2026-10-09 09:15–09:54 | 0 |
| FL Routing Test 15 | 8531 | 8527 | 2026-10-09 10:24–10:54 | 2026-10-09 10:24–10:54 | 1 |
| FL Routing Test 15 | 8532 | 8528 | 2026-10-09 10:54–11:54 | 2026-10-09 10:54–11:54 | 1 |
| FL Routing Test 15 | 8549 | 8545 | 2026-10-09 11:54–12:04 | 2026-10-09 11:54–12:04 | 1 |
| FL Routing Test 15 | 8572 | 8568 | 2026-10-09 12:04–12:24 | 2026-10-09 12:04–12:24 | 1 |
| John Wick | 8246 | 8242 | 2026-10-07 11:09–11:24 | 2026-10-10 11:09–11:24 | 1 |
| Julian Alvarez | 8484 | 8480 | 2026-10-08 08:00–08:30 | 2026-10-07 08:00–08:30 | 1 |
| Lam | 3755 | 3751 | 2026-10-05 10:39–11:09 | 2026-10-05 10:39–11:09 | 0 |
| Minh | 3791 | 3787 | 2026-10-04 09:15–09:45 | 2026-10-04 09:15–09:45 | 0 |
| Minh | 3899 | 3895 | 2026-10-04 08:30–08:45 | 2026-10-04 08:30–08:45 | 0 |
| Minh | 3900 | 3896 | 2026-10-04 08:45–09:00 | 2026-10-04 08:45–09:00 | 0 |
| Minh | 3916 | 3912 | 2026-10-04 09:00–09:15 | 2026-10-04 09:00–09:15 | 0 |
| Minh | 3917 | 3913 | 2026-10-04 08:00–08:30 | 2026-10-04 08:00–08:30 | 0 |
| NaplesAuto_1 Test | 7047 | 7043 | 2026-10-06 08:50–09:35 | 2026-10-06 08:50–09:35 | 1 |
| NaplesAuto_2 Test | 7059 | 7055 | 2026-10-07 08:00–08:45 | 2026-10-10 08:00–08:45 | 1 |
| NaplesAuto_4 Test | 7086 | 7082 | 2026-10-06 08:00–08:30 | 2026-10-06 08:00–08:30 | 1 |
| Peter Parker | 8247 | 8243 | 2026-10-07 12:18–12:48 | 2026-10-10 12:18–12:48 | 1 |
| Test6 Routing | 7042 | 7038 | 2026-10-05 09:06–09:36 | 2026-10-05 09:06–09:36 | 0 |
| TestAuto_4 Routing | 7040 | 7036 | 2026-10-05 10:08–10:38 | 2026-10-05 10:08–10:38 | 0 |
| TestAuto_5 Routing | 7041 | 7037 | 2026-10-05 09:37–10:07 | 2026-10-05 09:37–10:07 | 0 |
| Test_10 Routing | 7046 | 7042 | 2026-10-05 13:58–14:28 | 2026-10-05 13:58–14:28 | 0 |
| Test_7 Routing | 7043 | 7039 | 2026-10-05 12:11–12:41 | 2026-10-05 12:11–12:41 | 0 |
| Test_8 Routing | 7044 | 7040 | 2026-10-05 12:43–13:13 | 2026-10-05 12:43–13:13 | 0 |
| Test_9 Routing | 7045 | 7041 | 2026-10-05 13:25–13:55 | 2026-10-05 13:25–13:55 | 0 |
| Tony Stark | 8248 | 8244 | 2026-10-07 10:35–11:05 | 2026-10-10 10:35–11:05 | 1 |
| nami | 6815 | 6811 | 2026-10-05 11:49–12:34 | 2026-10-05 11:49–12:34 | 0 |
| nami | 8497 | 8493 | 2026-10-05 11:09–11:54 | 2026-10-05 11:09–11:54 | 0 |
