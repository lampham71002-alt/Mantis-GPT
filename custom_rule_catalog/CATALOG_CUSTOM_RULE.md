# Catalog custom rule và filter

61 mục: 20 action đơn, 21 tổ hợp hai action, 20 tổ hợp ba action. Có 244 template kiểm thử khi ghép bốn filter: service, status, customer tag, customer. Đây là catalog local, chưa phải payload được backend verify, chưa tạo hoặc bật rule live.

## Cách ghép filter

| Filter UI | Key targets trong HAR | Dữ liệu hiện có | Cần xác nhận |
|---|---|---|---|
| Service | service_types | 18 service template | ID hay name trong array; resolve nhãn Quarterly/Emergency/Routine |
| Status | statuses | Nhãn Completed do người dùng yêu cầu | Numeric ID/name chính xác |
| Customer tag | customer_tags | Chưa có tag list | Tên/ID tag và customer mang tag |
| Customer | customer_names | 20 customer đã tạo | Wire type của nonempty array và identity matching |

HAR chỉ có các array filter rỗng, nên chưa xác định kiểu giá trị khi có phần tử. Nếu action đã có scope Quarterly, khi thêm tag/customer vẫn giữ scope Quarterly và kết hợp AND (match=all); không đổi thành mọi service. Theo oracle local, match=all yêu cầu mọi filter field; match=any yêu cầu ít nhất một. Matching nhiều giá trị trong cùng field cần đọc compiled result.

Quarterly có hai candidate: Quarterly Service (ID 206) và Quarterly Pest Control (ID 213). Monthly Service (ID 205), Bed Bug Heat Treatment (ID 217), Initial Service (ID 211) có candidate từ snapshot. Chưa thấy service Emergency hoặc Routine trong 18 template. Chris chưa có identity mapping; Lam có user 84361445/schedule 31. Customer preferred technician chưa được xác nhận, không tự dùng Lam thay thế.

## Phân biệt action

- Hard: keep_period, force_tech, movement_limit, strict time_window, first_stop, last_stop, lock, exclude.
- Soft: prefer_tech, soft time_window; kết quả ngoài ưu tiên không mặc định FAIL.
- Display: arrival_window_duration. Một giờ = 3600s; 30 phút = 1800s; không phải constraint bắt đầu/kết thúc.
- Lock khác movement_limit(0): lock giữ ngày/giờ/technician; movement_limit(0) chỉ giữ ngày.
- Tuần được oracle local định nghĩa Sunday–Saturday, không ISO week.
- Strict window: HAR ghi arrival semantics; reference local có chỗ yêu cầu toàn job phải nằm trong window. Ghi riêng start-in-window và whole-job-fits; chưa áp đặt end <= cutoff nếu contract chưa được xác nhận.
- Nhiều job cùng first_stop/last_stop trên một technician/day tạo tình huống cạnh tranh; cần verify và kiểm tra cách engine xử lý.
- Các biến thể window 1h/30m hoặc movement 1/2 ngày là testcase thay thế; không bật tất cả cùng lúc.
- Exclude + movement_limit không chứng minh độc lập movement_limit vì job đã bị loại khỏi routing.

## Danh sách đầy đủ

| ID | Nhóm | Nội dung người dùng | Scope service/status | Action | Giá trị còn thiếu |
|---|---|---|---|---|---|
| A01 | single | Giữ tất cả job Quarterly trong tuần ban đầu. | Quarterly | keep_period {"period": "week"} | Không thiếu action param; còn filter/identity |
| A02 | single | Giữ job Monthly trong tháng ban đầu. | Monthly | keep_period {"period": "month"} | Không thiếu action param; còn filter/identity |
| A03 | single | Bắt buộc assign Emergency cho Chris. | Emergency | force_tech {"technician_name": "Chris"} | Không thiếu action param; còn filter/identity |
| A04 | single | Bắt buộc assign Bed Bug cho Lam. | Bed Bug | force_tech {"technician_name": "Lam"} | Không thiếu action param; còn filter/identity |
| A05 | single | Ưu tiên technician mà customer đã preferred. | Cần chọn scope cho testcase | prefer_tech {"source": "customer_preferred_technician"} | Không thiếu action param; còn filter/identity |
| A06 | single | Ưu tiên preferred technician cho Quarterly. | Quarterly | prefer_tech {"source": "customer_preferred_technician"} | Không thiếu action param; còn filter/identity |
| A07 | single | Không cho job di chuyển quá 2 ngày. | Cần chọn scope cho testcase | movement_limit {"max_days": 2} | Không thiếu action param; còn filter/identity |
| A08 | single | Emergency chỉ được move tối đa 1 ngày. | Emergency | movement_limit {"max_days": 1} | Không thiếu action param; còn filter/identity |
| A09 | single | Emergency bắt buộc nằm trong 08:00–14:00. | Emergency | time_window {"start": "08:00", "end": "14:00", "strict": true} | Không thiếu action param; còn filter/identity |
| A10 | single | Quarterly bắt buộc trong 09:00–15:00. | Quarterly | time_window {"start": "09:00", "end": "15:00", "strict": true} | Không thiếu action param; còn filter/identity |
| A11 | single | Ưu tiên Bed Bug trong 08:00–12:00. | Bed Bug | time_window {"start": "08:00", "end": "12:00", "strict": false} | Không thiếu action param; còn filter/identity |
| A12 | single | Ưu tiên Routine trong 13:00–16:00. | Routine | time_window {"start": "13:00", "end": "16:00", "strict": false} | Không thiếu action param; còn filter/identity |
| A13 | single | Arrival window duration = 1 giờ. | Cần chọn scope cho testcase | arrival_window_duration {"duration_seconds": 3600} | Không thiếu action param; còn filter/identity |
| A14 | single | Arrival window duration = 30 phút. | Cần chọn scope cho testcase | arrival_window_duration {"duration_seconds": 1800} | Không thiếu action param; còn filter/identity |
| A15 | single | Emergency là stop đầu tiên. | Emergency | first_stop {} | Không thiếu action param; còn filter/identity |
| A16 | single | Initial Service là stop đầu tiên. | Initial Service | first_stop {} | Không thiếu action param; còn filter/identity |
| A17 | single | Routine Service là stop cuối. | Routine Service | last_stop {} | Không thiếu action param; còn filter/identity |
| A18 | single | Quarterly là stop cuối. | Quarterly | last_stop {} | Không thiếu action param; còn filter/identity |
| A19 | single | Lock Emergency, Auto-Pilot route around job. | Emergency | lock {} | Không thiếu action param; còn filter/identity |
| A20 | single | Completed jobs bị loại khỏi routing. | Completed | exclude {} | Không thiếu action param; còn filter/identity |
| B01 | pair | keep_period + force_tech. | Cần chọn scope cho testcase | keep_period {"period": null}; force_tech {"technician_name": null} | keep_period.period, force_tech.technician_name |
| B02 | pair | Keep month + force_tech. | Cần chọn scope cho testcase | keep_period {"period": "month"}; force_tech {"technician_name": null} | force_tech.technician_name |
| B03 | pair | force_tech + movement_limit. | Cần chọn scope cho testcase | force_tech {"technician_name": null}; movement_limit {"max_days": null} | force_tech.technician_name, movement_limit.max_days |
| B04 | pair | tech + strict time window. | Cần chọn scope cho testcase | technician_action_to_confirm {"mode": null, "technician_name": null}; time_window {"start": null, "end": null, "strict": true} | technician_action_to_confirm.mode, technician_action_to_confirm.technician_name, time_window.start, time_window.end |
| B05 | pair | prefer_tech + movement_limit. | Cần chọn scope cho testcase | prefer_tech {"source": "customer_preferred_technician"}; movement_limit {"max_days": null} | movement_limit.max_days |
| B06 | pair | Preferred tech + strict window. | Cần chọn scope cho testcase | prefer_tech {"source": "customer_preferred_technician"}; time_window {"start": null, "end": null, "strict": true} | time_window.start, time_window.end |
| B07 | pair | Preferred tech + soft window. | Cần chọn scope cho testcase | prefer_tech {"source": "customer_preferred_technician"}; time_window {"start": null, "end": null, "strict": false} | time_window.start, time_window.end |
| B08 | pair | Preferred tech + arrival window. | Cần chọn scope cho testcase | prefer_tech {"source": "customer_preferred_technician"}; arrival_window_duration {"duration_seconds": null} | arrival_window_duration.duration_seconds |
| B09 | pair | Preferred tech + first stop. | Cần chọn scope cho testcase | prefer_tech {"source": "customer_preferred_technician"}; first_stop {} | Không thiếu action param; còn filter/identity |
| B10 | pair | Preferred tech + last stop. | Cần chọn scope cho testcase | prefer_tech {"source": "customer_preferred_technician"}; last_stop {} | Không thiếu action param; còn filter/identity |
| B11 | pair | Preferred tech + lock. | Cần chọn scope cho testcase | prefer_tech {"source": "customer_preferred_technician"}; lock {} | Không thiếu action param; còn filter/identity |
| B12 | pair | Keep week + max movement 2 days. | Cần chọn scope cho testcase | keep_period {"period": "week"}; movement_limit {"max_days": 2} | Không thiếu action param; còn filter/identity |
| B13 | pair | Keep month + strict window. | Cần chọn scope cho testcase | keep_period {"period": "month"}; time_window {"start": null, "end": null, "strict": true} | time_window.start, time_window.end |
| B14 | pair | Keep week + arrival window. | Cần chọn scope cho testcase | keep_period {"period": "week"}; arrival_window_duration {"duration_seconds": null} | arrival_window_duration.duration_seconds |
| B15 | pair | Keep week + first stop. | Cần chọn scope cho testcase | keep_period {"period": "week"}; first_stop {} | Không thiếu action param; còn filter/identity |
| B16 | pair | Keep week + last stop. | Cần chọn scope cho testcase | keep_period {"period": "week"}; last_stop {} | Không thiếu action param; còn filter/identity |
| B17 | pair | Keep week + lock. | Cần chọn scope cho testcase | keep_period {"period": "week"}; lock {} | Không thiếu action param; còn filter/identity |
| B18 | pair | Movement limit + first stop. | Cần chọn scope cho testcase | movement_limit {"max_days": null}; first_stop {} | movement_limit.max_days |
| B19 | pair | Movement limit + last stop. | Cần chọn scope cho testcase | movement_limit {"max_days": null}; last_stop {} | movement_limit.max_days |
| B20 | pair | Movement limit + exclude. | Cần chọn scope cho testcase | movement_limit {"max_days": null}; exclude {} | movement_limit.max_days |
| B21 | pair | Movement limit + time window. | Cần chọn scope cho testcase | movement_limit {"max_days": null}; time_window {"start": null, "end": null, "strict": null} | movement_limit.max_days, time_window.start, time_window.end, time_window.strict |
| C01 | triple | keep_period + force_tech + movement_limit. | Cần chọn scope cho testcase | keep_period {"period": null}; force_tech {"technician_name": null}; movement_limit {"max_days": null} | keep_period.period, force_tech.technician_name, movement_limit.max_days |
| C02 | triple | Giữ tháng + force Lam + strict window. | Cần chọn scope cho testcase | keep_period {"period": "month"}; force_tech {"technician_name": "Lam"}; time_window {"start": null, "end": null, "strict": true} | time_window.start, time_window.end |
| C03 | triple | Keep week + force Chris + first stop. | Cần chọn scope cho testcase | keep_period {"period": "week"}; force_tech {"technician_name": "Chris"}; first_stop {} | Không thiếu action param; còn filter/identity |
| C04 | triple | Keep week + preferred tech + last stop. | Cần chọn scope cho testcase | keep_period {"period": "week"}; prefer_tech {"source": "customer_preferred_technician"}; last_stop {} | Không thiếu action param; còn filter/identity |
| C05 | triple | Keep week + preferred tech + lock. | Cần chọn scope cho testcase | keep_period {"period": "week"}; prefer_tech {"source": "customer_preferred_technician"}; lock {} | Không thiếu action param; còn filter/identity |
| C06 | triple | Keep week + movement limit + strict window. | Cần chọn scope cho testcase | keep_period {"period": "week"}; movement_limit {"max_days": null}; time_window {"start": null, "end": null, "strict": true} | movement_limit.max_days, time_window.start, time_window.end |
| C07 | triple | Keep week + movement limit + arrival window. | Cần chọn scope cho testcase | keep_period {"period": "week"}; movement_limit {"max_days": null}; arrival_window_duration {"duration_seconds": null} | movement_limit.max_days, arrival_window_duration.duration_seconds |
| C08 | triple | Keep week + max 1 day + first stop. | Cần chọn scope cho testcase | keep_period {"period": "week"}; movement_limit {"max_days": 1}; first_stop {} | Không thiếu action param; còn filter/identity |
| C09 | triple | Keep week + max 2 days + last stop. | Cần chọn scope cho testcase | keep_period {"period": "week"}; movement_limit {"max_days": 2}; last_stop {} | Không thiếu action param; còn filter/identity |
| C10 | triple | Keep week + movement limit + lock. | Cần chọn scope cho testcase | keep_period {"period": "week"}; movement_limit {"max_days": null}; lock {} | movement_limit.max_days |
| C11 | triple | Force tech + movement limit + time window + strict. | Cần chọn scope cho testcase | force_tech {"technician_name": null}; movement_limit {"max_days": null}; time_window {"start": null, "end": null, "strict": true} | force_tech.technician_name, movement_limit.max_days, time_window.start, time_window.end |
| C12 | triple | Force Lam + arrival window + first stop. | Cần chọn scope cho testcase | force_tech {"technician_name": "Lam"}; arrival_window_duration {"duration_seconds": null}; first_stop {} | arrival_window_duration.duration_seconds |
| C13 | triple | Force tech + arrival window + last stop. | Cần chọn scope cho testcase | force_tech {"technician_name": null}; arrival_window_duration {"duration_seconds": null}; last_stop {} | force_tech.technician_name, arrival_window_duration.duration_seconds |
| C14 | triple | Preferred tech + movement limit + strict window. | Cần chọn scope cho testcase | prefer_tech {"source": "customer_preferred_technician"}; movement_limit {"max_days": null}; time_window {"start": null, "end": null, "strict": true} | movement_limit.max_days, time_window.start, time_window.end |
| C15 | triple | Preferred tech + movement limit + soft window. | Cần chọn scope cho testcase | prefer_tech {"source": "customer_preferred_technician"}; movement_limit {"max_days": null}; time_window {"start": null, "end": null, "strict": false} | movement_limit.max_days, time_window.start, time_window.end |
| C16 | triple | Preferred tech + arrival window + first stop. | Cần chọn scope cho testcase | prefer_tech {"source": "customer_preferred_technician"}; arrival_window_duration {"duration_seconds": null}; first_stop {} | arrival_window_duration.duration_seconds |
| C17 | triple | Preferred tech + arrival window + lock. | Cần chọn scope cho testcase | prefer_tech {"source": "customer_preferred_technician"}; arrival_window_duration {"duration_seconds": null}; lock {} | arrival_window_duration.duration_seconds |
| C18 | triple | Movement limit + strict window + first stop. | Cần chọn scope cho testcase | movement_limit {"max_days": null}; time_window {"start": null, "end": null, "strict": true}; first_stop {} | movement_limit.max_days, time_window.start, time_window.end |
| C19 | triple | Movement limit + arrival window + last stop. | Cần chọn scope cho testcase | movement_limit {"max_days": null}; arrival_window_duration {"duration_seconds": null}; last_stop {} | movement_limit.max_days, arrival_window_duration.duration_seconds |
| C20 | triple | Movement limit + strict window + lock. | Cần chọn scope cho testcase | movement_limit {"max_days": null}; time_window {"start": null, "end": null, "strict": true}; lock {} | movement_limit.max_days, time_window.start, time_window.end |

## Luồng tạo thực tế

1. Chọn một case, điền params và filter value đã resolve. Viết prompt chứa đủ service/status/tag/customer, action và giá trị.
2. Gửi conversations, giữ conversation_id; trả lời clarification khi cần.
3. Parse executable_logic, đối chiếu targets/actions với case gốc. Không tự chế params backend cho action chưa thấy trong HAR.
4. Verify cùng conversation_id; kiểm tra verified, rule_conflict, refuse_save.
5. Khi được yêu cầu tạo: save với title/description/attachments/conversation_id/executable_logic. Save trong HAR trả status=1 nên cần kiểm soát activation.
6. Bật/tắt riêng qua /{id}/status với status=1/0; GET readback để kiểm tra trạng thái.
7. Chạy Sandbox và kiểm tra placement sau compile/save; không dùng capture 03:42 trước khi bật 1097 và save 1110 làm bằng chứng cho rule mới.

Các JSON kèm theo giữ param chưa biết là null để không biến phỏng đoán thành payload live. Đây là 244 template thiết kế, không phải 244 rule đã được tạo hoặc verify.
