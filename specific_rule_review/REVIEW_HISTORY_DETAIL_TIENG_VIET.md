# Review history.har và detai.har

Đọc từ HAR, chưa gọi API trực tiếp hoặc thực hiện optimize/bật/tắt rule. File được người dùng gọi là `detail.har` hiện có tên `detai.har` trong thư mục.

## Kết luận chính

- `history.har` ghi danh sách 11 lượt optimize trong tháng 10 và tổng số lỗi 7.
- `detai.har` ghi chi tiết lượt **1422**, chế độ Manual Optimize, đúng **30 job của schedule custom (32)**, mã job 8543–8572.
- Nhật ký lượt này có trạng thái `accepted`; toàn bộ 30 job được đánh dấu đã optimize và thay đổi vị trí lịch. Không có job được ghi nhận chưa gán tuyến; thời lượng trước/sau giữ nguyên.
- Danh sách specific rule và các rule specific được ghi áp dụng đều rỗng. Chưa có bằng chứng specific rule 1039 gắn hoặc tác động đến lượt 1422.
- Khoảng `period` là 04–08/10/2026 nhưng **11 job** có kết quả vào 10/10 hoặc 13/10. Chưa kết luận lỗi nếu khoảng này chỉ chọn job đầu vào; cần xác nhận yêu cầu giới hạn ngày kết quả.

## Các API ghi nhận

| File | Request | HTTP | Nội dung |
|---|---|---|---|
| `history.har` | `GET /api/routing/mantis/feeds/history?start=...&end=...&limit=20` | 200 | Lịch sử từ 01/10 đến hết 31/10/2026, 11 lượt; không còn trang sau |
| `history.har` | `GET /api/routing/mantis/feeds/errors/count?start=...&end=...` | 200 | Tổng lỗi 7; không có chi tiết lỗi |
| `detai.har` | `GET /api/routing/mantis/feeds/history/1422` | 200 | Chi tiết lượt optimize, thống kê và bằng chứng từng job |

Cả hai file không ghi thao tác POST tạo specific rule hoặc request thực hiện optimize. Chúng ghi thao tác xem lịch sử và xem chi tiết kết quả đã có.

## 11 lượt optimize trong history

Giờ trong bảng lịch sử được đổi từ timestamp UTC sang **Asia/Tomsk (UTC+7)** để hiển thị. Đây là thời điểm chạy/lưu log, không phải giờ hẹn của job.

| Log ID | Chế độ | Thời điểm lưu log, UTC+7 | Trạng thái API | Tiết kiệm lái xe, phút | Tiết kiệm quãng đường, dặm |
|---|---|---|---|---:|---:|
| 1422 | Manual | 03/10/2026 14:54:01 | 3 | 2642 | 2765.99 |
| 1420 | Manual | 03/10/2026 14:41:06 | 3 | 2646 | 2785.34 |
| 1419 | Manual | 03/10/2026 14:39:51 | 3 | 2646 | 2785.34 |
| 1416 | Manual | 03/10/2026 11:31:42 | 3 | 3291 | 3169.09 |
| 1396 | Auto-Pilot | 03/10/2026 01:03:19 | 3 | 591 | 564.32 |
| 1384 | Manual | 02/10/2026 14:10:23 | 3 | 7 | 2.07 |
| 1382 | Manual | 02/10/2026 11:49:22 | 3 | 1091 | 976.24 |
| 1362 | Auto-Pilot | 02/10/2026 00:00:47 | 3 | 539 | 448.16 |
| 1343 | Manual | 01/10/2026 16:03:43 | 3 | 489 | 399.68 |
| 1335 | Auto-Pilot | 01/10/2026 14:36:12 | 3 | 320 | 224.78 |
| 1310 | Manual | 01/10/2026 08:56:51 | 2 | 1391 | 1346.64 |

Có 8 lượt Manual và 3 lượt Auto-Pilot. 10 lượt có mã trạng thái 3; lượt 1310 có mã 2. Chi tiết 1422 có `run.status = accepted`, nhưng hai HAR chưa đủ xác định ý nghĩa mọi mã trạng thái; không tự coi trạng thái 2 là lỗi hoặc ánh xạ nó với trạng thái của custom rule.

`errors/count.total = 7` là tổng lỗi trong khoảng thời gian được truy vấn. Chưa có danh sách lỗi để biết lỗi thuộc job/lượt nào hoặc có liên quan đến 1422 không.

## Chi tiết lượt 1422

- Mã tối ưu: `opt_sandbox_342cb4e0648043c16702773a39a06bab`.
- Chế độ trong lịch sử: `manual`; chế độ trong bằng chứng: `manual_optimize`; trạng thái bằng chứng: `accepted`.
- Schedule ghi trong lượt: `custom`, ID 32. Danh sách job trong bằng chứng khớp đủ 30 job đã tạo trước đó.
- Thời điểm bắt đầu 07:53:55 UTC, kết thúc 07:53:58 UTC và lưu log 07:54:01 UTC ngày 03/10/2026.
- `can_undo = false`: phản hồi tại thời điểm quay HAR không cho phép hoàn tác lượt này. Chưa có thông tin lý do.
- `period.start = 2026-10-04`, `period.end = 2026-10-08`.
- Trạng thái job có tên rõ ràng trong log: 29 Confirmed và 1 Reschedule, giữ nguyên trước/sau. Đây là dữ liệu của lượt 1422, không dùng để tự suy ngược trạng thái ở đợt kiểm tra cũ.

## Phân bổ job trước và sau

| Ngày | Trước optimize | Sau optimize |
|---|---:|---:|
| 2026-10-04 | 6 | 6 |
| 2026-10-05 | 6 | 5 |
| 2026-10-06 | 6 | 0 |
| 2026-10-07 | 6 | 8 |
| 2026-10-08 | 6 | 0 |
| 2026-10-10 | 0 | 5 |
| 2026-10-13 | 0 | 6 |

Period ghi trong lượt chưa chứng minh là giới hạn bắt buộc của kết quả. Phần ứng viên có các ngày 03–17/10/2026; bộ giải thực tế chọn thêm 10/10 và 13/10. Cần đối chiếu thiết lập ở thời điểm lượt 1422 và kỳ vọng của người dùng, không dùng thiết lập chụp ở lượt kiểm tra trước để kết luận lỗi cho lượt này.

## Thống kê trước và sau

| Chỉ số | Trước | Sau | Giảm |
|---|---:|---:|---:|
| Thời gian làm dịch vụ | 772 phút | 772 phút | 0 |
| Thời gian lái xe | 3.004 phút | 362 phút | 2.642 phút |
| Thời gian trống | 86 phút | 5 phút | 81 phút |
| Tổng thời gian | 3.862 phút | 1.139 phút | 2.723 phút |
| Quãng đường | 3.059,30 dặm | 293,31 dặm | 2.765,99 dặm |
| Nhiên liệu theo thống kê hệ thống | 152,98 gallon | 14,67 gallon | 138,31 gallon |
| Job được gán | 30 | 30 | 0 |

Số tiết kiệm lái xe, quãng đường và nhiên liệu khớp giữa dòng history 1422 và phần chi tiết. Chưa kiểm chứng độc lập độ chính xác của cách hệ thống tính quãng đường/nhiên liệu.

## Các rule được log ghi nhận

| Nhóm | Dữ liệu trong lượt 1422 |
|---|---|
| Custom | `applied_rules.custom = []` |
| Specific | `specific_rules = []`, `applied_rules.specific = []` |
| System | Route Across All Tech Schedules; Default Service Hours (06:00–15:00), mỗi mục ghi 30 job |

Chi tiết từng job có `rule_analysis.complete = false`, `coverage.system_rules = partial` và `coverage.custom_specific_rules = not_available`. Vì vậy, danh sách rule trong log là bằng chứng chưa đầy đủ; danh sách rỗng không chứng minh tuyệt đối rằng không có ảnh hưởng từ rule nào ngoài phần được ghi.

Một số rule system có nhãn active/applied nhưng trường bằng chứng `feature_active = false`; nguồn phân tích là `preview_rule_keys`. Đây là giới hạn của phần giải thích, không tự xem nhãn applied là bằng chứng đầy đủ rằng mỗi cơ chế đã thực thi đúng.

## Danh sách đủ 30 job trong log

Giờ hẹn dưới đây giữ nguyên giá trị lịch trong API. `run.clock = calendar_wall_clock_as_utc` và `company_timezone = Asia/Dhaka`; không tự đổi các giờ hẹn này sang Asia/Tomsk hoặc Florida. Việc chuyển múi giờ ở bảng history chỉ áp dụng cho thời điểm lưu log.

| Customer | Job | Sự kiện | Dịch vụ | Trước | Sau | Thời lượng |
|---|---|---|---|---|---|---:|
| FL Routing Test 10 | 8543 | 8539 | Bed Bug Heat Treatment | 04/10/2026 08:00 · lịch 32 | 05/10/2026 09:26 · lịch 32 | 21 phút |
| FL Routing Test 13 | 8544 | 8540 | Flea & Tick Control | 04/10/2026 09:00 · lịch 32 | 04/10/2026 06:00 · lịch 32 | 39 phút |
| FL Routing Test 06 | 8545 | 8541 | Rodent Control & Exclusion | 04/10/2026 10:00 · lịch 32 | 13/10/2026 08:52 · lịch 32 | 24 phút |
| FL Routing Test 03 | 8546 | 8542 | Termite Baiting & Monitoring | 04/10/2026 11:00 · lịch 32 | 05/10/2026 06:00 · lịch 32 | 37 phút |
| FL Routing Test 16 | 8547 | 8543 | Mosquito Reduction Program | 04/10/2026 12:00 · lịch 32 | 04/10/2026 07:20 · lịch 32 | 22 phút |
| FL Routing Test 16 | 8548 | 8544 | Quarterly Service | 04/10/2026 13:00 · lịch 32 | 04/10/2026 07:42 · lịch 32 | 39 phút |
| FL Routing Test 15 | 8549 | 8545 | Eco-Friendly Pest Solutions | 05/10/2026 08:00 · lịch 32 | 04/10/2026 08:35 · lịch 32 | 10 phút |
| FL Routing Test 18 | 8550 | 8546 | Preventative Monitoring & Maintenance | 05/10/2026 09:00 · lịch 32 | 07/10/2026 10:37 · lịch 32 | 20 phút |
| FL Routing Test 09 | 8551 | 8547 | Flea & Tick Control | 05/10/2026 10:00 · lịch 32 | 05/10/2026 07:03 · lịch 32 | 12 phút |
| FL Routing Test 07 | 8552 | 8548 | Call Back Service | 05/10/2026 11:00 · lịch 32 | 13/10/2026 06:00 · lịch 32 | 12 phút |
| FL Routing Test 09 | 8553 | 8549 | Call Back Service | 05/10/2026 12:00 · lịch 32 | 05/10/2026 07:15 · lịch 32 | 40 phút |
| FL Routing Test 11 | 8554 | 8550 | Eco-Friendly Pest Solutions | 05/10/2026 13:00 · lịch 32 | 07/10/2026 09:48 · lịch 32 | 31 phút |
| FL Routing Test 13 | 8555 | 8551 | Rodent Control & Exclusion | 06/10/2026 08:00 · lịch 32 | 04/10/2026 06:39 · lịch 32 | 20 phút |
| FL Routing Test 02 | 8556 | 8552 | General Pest Control | 06/10/2026 09:00 · lịch 32 | 07/10/2026 06:00 · lịch 32 | 23 phút |
| FL Routing Test 04 | 8557 | 8553 | Quarterly Pest Control | 06/10/2026 10:00 · lịch 32 | 07/10/2026 09:17 · lịch 32 | 11 phút |
| FL Routing Test 05 | 8558 | 8554 | Termite Baiting & Monitoring | 06/10/2026 11:00 · lịch 32 | 05/10/2026 08:40 · lịch 32 | 21 phút |
| FL Routing Test 01 | 8559 | 8555 | Wasp Nest Removal | 06/10/2026 12:00 · lịch 32 | 07/10/2026 07:59 · lịch 32 | 38 phút |
| FL Routing Test 01 | 8560 | 8556 | Eco-Friendly Pest Solutions | 06/10/2026 13:00 · lịch 32 | 07/10/2026 08:37 · lịch 32 | 18 phút |
| FL Routing Test 06 | 8561 | 8557 | Call Back Service | 07/10/2026 08:00 · lịch 32 | 13/10/2026 09:16 · lịch 32 | 40 phút |
| FL Routing Test 12 | 8562 | 8558 | Quarterly Pest Control | 07/10/2026 09:00 · lịch 32 | 10/10/2026 06:42 · lịch 32 | 30 phút |
| FL Routing Test 19 | 8563 | 8559 | Initial Service | 07/10/2026 10:00 · lịch 32 | 07/10/2026 07:07 · lịch 32 | 34 phút |
| FL Routing Test 14 | 8564 | 8560 | Eco-Friendly Pest Solutions | 07/10/2026 11:00 · lịch 32 | 10/10/2026 07:45 · lịch 32 | 26 phút |
| FL Routing Test 17 | 8565 | 8561 | Wildlife Trapping & Relocation | 07/10/2026 12:00 · lịch 32 | 10/10/2026 08:37 · lịch 32 | 37 phút |
| FL Routing Test 07 | 8566 | 8562 | Monthly Service | 07/10/2026 13:00 · lịch 32 | 13/10/2026 06:12 · lịch 32 | 36 phút |
| FL Routing Test 08 | 8567 | 8563 | Termite Baiting & Monitoring | 08/10/2026 08:00 · lịch 32 | 13/10/2026 07:18 · lịch 32 | 37 phút |
| FL Routing Test 02 | 8568 | 8564 | Every 21 Days | 08/10/2026 09:00 · lịch 32 | 07/10/2026 06:23 · lịch 32 | 18 phút |
| FL Routing Test 14 | 8569 | 8565 | Mosquito Reduction Program | 08/10/2026 10:00 · lịch 32 | 10/10/2026 08:11 · lịch 32 | 18 phút |
| FL Routing Test 20 | 8570 | 8566 | Rodent Control & Exclusion | 08/10/2026 11:00 · lịch 32 | 10/10/2026 06:00 · lịch 32 | 19 phút |
| FL Routing Test 08 | 8571 | 8567 | Follow Up Inspections | 08/10/2026 12:00 · lịch 32 | 13/10/2026 07:55 · lịch 32 | 19 phút |
| FL Routing Test 15 | 8572 | 8568 | Call Back Service | 08/10/2026 13:00 · lịch 32 | 04/10/2026 08:45 · lịch 32 | 20 phút |

## Dữ liệu hữu ích để kiểm specific rule

Người dùng xác nhận giao diện Detail có nút tạo mới Specific Rule. Luồng cần đối chiếu là **History → Detail → tạo Specific Rule → xem log History để xác định job được áp dụng**. Đây là mô tả thao tác của người dùng; HAR hiện tại chỉ ghi request mở Detail trước khi tạo rule.

- `routing_evidence.jobs` có 30 khóa là event ID. Mỗi mục có `job_id`, customer, dịch vụ, kỹ thuật viên và giờ trước/sau; đây là nguồn lập tập job của lượt optimize.
- Có `status_name`, `status_type` và `custom_status_id`, hữu ích khi kiểm bộ lọc trạng thái; dữ liệu lịch trực tiếp trước đây chưa có đủ tên trạng thái.
- Có `constraints`, `candidate_evaluations`, `selected_candidate`, `routing_explanation`, `rule_analysis` và `unassigned_reason`, giúp phân biệt được xếp tuyến, không xếp được hoặc thiếu bằng chứng.
- Theo xác nhận của người dùng, specific rule áp dụng cho toàn bộ job trong log của lượt optimize đó. Với lượt 1422, tập nguồn gồm đúng 30 job trong bảng; bộ lọc/hành động của rule cần lấy từ request tạo hoặc chi tiết rule.
- Vẫn thiếu request tạo/lưu specific rule: chưa biết trường nào truyền history ID, optimization ID hoặc danh sách event ID. Không tự đoán payload để tạo rule.
- Sau khi tạo/lưu, đối chiếu `specific_rules` và `applied_rules.specific` ở cấp lượt; ở từng event ID kiểm tra `routing_evidence.jobs[event_id].rules.specific`, `rule_analysis` và `rule_attribution` nếu được ghi đầy đủ. Tên customer và `job_id` dùng để chỉ rõ job được áp dụng.
- Phải phân biệt job thuộc tập nguồn trong log, job được log ghi nhận áp dụng rule, và job có kết quả thực tế thỏa điều kiện rule. Job không thay đổi lịch vẫn có thể thỏa rule; chỉ có mặt trong log chưa chứng minh rule đã được áp dụng.
- Nếu sau tạo rule log vẫn có `coverage.custom_specific_rules = not_available`, kết luận là thiếu bằng chứng áp dụng, chưa được ghi thành không áp dụng. HAR hiện tại chưa cho biết có cần chạy optimize lại trước khi xuất hiện bằng chứng mới hay không.
- Chưa có bằng chứng nối rule 1039 với lượt 1422. Rule 1039 trong HAR trước có ngày tạo 01/10, còn lượt 1422 được lưu ngày 03/10; việc cùng có nhãn Manual Optimize chưa đủ để khẳng định chúng gắn với nhau.

## Thời hạn và giới hạn bằng chứng

Nguồn bằng chứng runtime ghi lưu trong Redis, TTL **28.800 giây (8 giờ)**, hết hạn `2026-10-03T15:53:58+00:00`. Bản HAR đã lưu vẫn đọc được sau thời hạn đó; dữ liệu runtime có thể không còn khi truy vấn lại.

Thứ tự tuyến và các chặng quan sát được là dữ liệu thực tế của kết quả. Phần giải thích không chứng minh được toàn bộ nguyên nhân lựa chọn hay điểm số từng ưu tiên mềm. Không coi câu tóm tắt tự động là chứng cứ độc lập cho mọi rule.

Bằng chứng API: `history_detail_api_evidence.json`. Tóm tắt và các job ngoài period đầu vào: `history_1422_summary.json`. Các file phân tích không chứa token/cookie/header xác thực.
