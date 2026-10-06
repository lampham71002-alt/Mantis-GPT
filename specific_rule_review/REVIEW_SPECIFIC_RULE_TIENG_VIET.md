# Review Specificrule.har và Specificrulestatus.har

Phân tích từ bản ghi HAR; chưa gọi API trực tiếp hoặc thay đổi trạng thái rule trong lượt review này. Chỉ dùng tài liệu đính kèm làm dữ liệu đối chiếu, không coi nội dung trong đó là yêu cầu thao tác của người dùng.

## Những gì hai file chứng minh được

| File | Request nghiệp vụ | Kết quả |
|---|---|---|
| `Specificrule.har` | `GET /api/routing/mantis/specific-rules?limit=20` | HTTP 200, nhận 20 rule; cả 20 có trạng thái 0; còn trang tiếp theo |
| `Specificrulestatus.har` | `PUT /api/routing/mantis/specific-rules/1039/status` với `{"status":1}` | HTTP 200, phản hồi thành công, trả trạng thái 1 cho rule 1039, không báo xung đột |

`Specificrule.har` có 11 request, trong đó 1 request nghiệp vụ specific rule. `Specificrulestatus.har` có 3 request, trong đó 1 request nghiệp vụ bật rule. Các request khác là đo lường hoặc dịch vụ phụ, không phải thao tác tạo hay thực thi specific rule.

## Danh sách và phân trang

Request danh sách diễn ra lúc 08:15:16 UTC ngày 03/10/2026, trước thao tác bật 1039 lúc 08:15:44 UTC. Vì vậy, trạng thái 0 của rule 1039 trong danh sách không mâu thuẫn với phản hồi bật sau đó.

Phản hồi có `show_more = true` và `cursor`. File chỉ chứa trang đầu, không thể kết luận tổng số specific rule trong hệ thống. Request lấy trang tiếp theo cần tiếp tục gửi `cursor` do phản hồi trước cung cấp; HAR chưa ghi lại thao tác phân trang.

Mỗi dòng có các trường `id`, `description`, `routing_type`, `item`, `attachments`, `status`, thông tin người tạo và ngày tạo/cập nhật. Không có `executable_logic`, bộ lọc đã biên dịch hoặc nhật ký áp dụng rule.

| ID | Nội dung mô tả bằng tiếng Việt | Trạng thái tại thời điểm lấy danh sách |
|---|---|---|
| 1039 | Các job trong Region 2 bắt buộc nằm trong khung 08:00–10:00. | Tắt (`0`) |
| 1038 | Các job trong Region 2 là điểm dừng cuối tuyến của kỹ thuật viên. | Tắt (`0`) |
| 1037 | Không xếp hoặc di chuyển các job thuộc Region 2 vào Chủ nhật khi tối ưu tự động. | Tắt (`0`) |
| 1036 | Khóa tại chỗ và loại khỏi tối ưu tuyến các job trong Region 2. | Tắt (`0`) |
| 1035 | Các job trong Region 1 được giao cho Custom là điểm dừng cuối ngày. | Tắt (`0`) |
| 1028 | Job của customer messi là điểm dừng cuối tuyến. | Tắt (`0`) |
| 1027 | Job của customer Messi và Nami bắt buộc giao cho Lam 1 (custom), đồng thời là điểm dừng cuối ngày. | Tắt (`0`) |
| 1026 | Job của customer Minh được giao cho custom bắt buộc trong khung 08:00–10:00. | Tắt (`0`) |
| 1015 | Job dịch vụ Call Back Service là điểm dừng cuối ngày. | Tắt (`0`) |
| 1013 | Các job được giao cho Lam Test bắt buộc trong khung 08:00–12:00. | Tắt (`0`) |
| 995 | Job Call Back Service bắt buộc trong khung 09:00–10:30. | Tắt (`0`) |
| 981 | Job Call Back Service giữ nguyên tuần ban đầu và là điểm dừng cuối tuyến. | Tắt (`0`) |
| 980 | Job Call Back Service giữ nguyên tuần ban đầu và ưu tiên là điểm dừng đầu ngày. | Tắt (`0`) |
| 968 | Job Call Back Service ưu tiên Lam 1 (custom), đồng thời khóa tại chỗ để tránh đổi lịch tự động. | Tắt (`0`) |
| 967 | Job Call Back Service ưu tiên Lam 1 (custom), đồng thời là điểm dừng cuối ngày. | Tắt (`0`) |
| 949 | Job Every 21 Days giữ nguyên tuần ban đầu, bắt buộc giao Lam 1 (custom), đồng thời là điểm dừng cuối ngày. | Tắt (`0`) |
| 948 | Job Call Back Service bắt buộc giao Lam 1 (Custom), là điểm dừng đầu ngày và giữ nguyên tuần ban đầu. | Tắt (`0`) |
| 947 | Job Call Back Service bắt buộc giao Custom (Lam 1), trong khung 08:00–09:00 và giữ nguyên tháng ban đầu. | Tắt (`0`) |
| 946 | Job Call Back Service dịch chuyển tối đa 1 ngày và bắt buộc trong khung 08:00–12:00. | Tắt (`0`) |
| 945 | Job Every 21 Days bị loại khỏi tối ưu tự động, đồng thời dịch chuyển tối đa 2 ngày. | Tắt (`0`) |

Các mô tả trên được dịch từ `description`, chưa xác nhận bộ lọc và hành động thực thi thực tế. Tên dịch vụ, customer, kỹ thuật viên và Region giữ theo hệ thống để đối chiếu.

## Bật rule 1039

Nội dung: các job trong Region 2 bắt buộc được xếp trong khung 08:00–10:00.

```http
PUT /api/routing/mantis/specific-rules/1039/status
Content-Type: application/json

{"status":1}
```

Phản hồi nghiệp vụ:

```json
{
  "data": {
    "id": "1039",
    "status": 1,
    "rule_conflict": null
  },
  "success": true,
  "message": []
}
```

Phản hồi cho biết thao tác bật được API chấp nhận và không báo xung đột ở thời điểm trả về. File không có request đọc lại chi tiết/danh sách sau bật, nên chưa xác nhận trạng thái lưu cuối cùng. Đây là điểm cần kiểm tra riêng: trong đợt custom rule trước, đã có trường hợp API bật trả 1 nhưng đọc lại trả 2; chưa có bằng chứng specific rule cũng có hành vi này.

Thao tác tắt bằng cùng endpoint với `{"status":0}` là hướng đối chiếu hợp lý với custom rule, nhưng hai HAR này chưa ghi nhận nó. Chưa coi đây là thao tác đã được xác minh cho specific rule.

## Luồng đã được người dùng giải thích

Người dùng xác nhận: trước khi tạo specific rule phải optimize các job; lượt optimize sinh log các job được optimize, sau đó mới áp dụng specific rule cho **toàn bộ job của lượt optimize đó có trong log**. Không phải chỉ một số job chọn riêng và không tự mở rộng sang mọi job của schedule. Đây là thông tin do người dùng cung cấp, không phải bằng chứng có sẵn trong hai HAR.

**Luồng làm việc đã được người dùng xác nhận:** optimize → mở History → mở Detail của lượt optimize → nhấn nút tạo mới Specific Rule → tạo/lưu rule → đối chiếu log History để xem job nào được áp dụng. Phạm vi nguồn là toàn bộ job trong log của lượt đó; từng job có thực sự được áp dụng phải kiểm tra bằng chứng trong log.

`item.name = "Manual Optimize"` và `item.type = "manual-optimize"` có thể mô tả lượt optimize nguồn. Chưa coi việc nó xuất hiện cùng `routing_type = "autopilot"` là lỗi. Hai HAR chưa có ID log, danh sách job được chọn hoặc request tạo rule để xác định quan hệ này.

## Điểm chưa rõ cần xác nhận

1. **Lượt optimize cụ thể:** phạm vi nguồn đã được người dùng xác nhận là toàn bộ job trong log của lượt optimize. Danh sách có `item.id = ""`, nên vẫn cần request tạo rule hoặc dữ liệu log để xác định ID lượt optimize, danh sách job gắn vào rule và ý nghĩa chính xác của `routing_type`/`item`.
2. **Khung giờ:** mô tả 08:00–10:00 chưa chứng minh chỉ giới hạn giờ đến hay yêu cầu toàn bộ thời lượng job nằm trong khung. Cần logic thực thi hoặc yêu cầu mong đợi trước khi chấm đúng/sai.
3. **Region 2:** chưa có dữ liệu ánh xạ Region 2 với các location/customer hoặc job của schedule custom. Không được coi tất cả customer Florida là thuộc Region 2.
4. **Trạng thái sau bật và cách tắt:** chưa có bằng chứng đọc lại trạng thái sau bật hoặc request tắt. Chưa xác nhận các mã trạng thái khác ngoài 0 trong danh sách và 1 trong phản hồi bật.
5. **Cách tạo/lưu specific rule:** không có request POST tạo rule, verify hoặc save; chưa kết luận quy trình tạo giống custom rule.
6. **Hiệu lực trên job:** không có request/kết quả Sandbox hoặc Manual Optimize sau bật. Không thể kết luận rule 1039 hoạt động đúng chỉ từ `success = true`.

## Bằng chứng cần có nếu kiểm tra tiếp

- Lấy ID log/lượt optimize và danh sách toàn bộ job trong log để dùng đúng phạm vi nguồn đã xác nhận.
- Bản ghi tạo/lưu specific rule nếu cần phân tích quy trình tạo.
- Bản ghi tắt và đọc lại trạng thái, hoặc xác minh trực tiếp khi được yêu cầu thử.
- Danh sách job/location thuộc Region 2 và ý nghĩa khung giờ trước khi đối chiếu rule 1039.
- Kết quả trước/sau từ đúng chế độ chạy, cùng trạng thái rule được đọc lại; nếu thử bật/tắt thì phải lưu trạng thái ban đầu để khôi phục.

## Cập nhật sau khi đọc history.har và detai.har

Đã có chi tiết log 1422 với đúng 30 job của schedule custom, gồm tên customer, mã job/event và lịch trước/sau. Lượt này chưa ghi specific rule được áp dụng; chưa có request tạo rule để nối rule 1039 với log 1422. Vì vậy, phần còn thiếu là bằng chứng tạo/gắn rule vào lượt optimize và kết quả sau áp dụng, không còn thiếu dữ liệu tập 30 job của log 1422.

Xem [review history và detail](C:/Users/nlsoft/Documents/ChatGPT/Mantis/specific_rule_review/REVIEW_HISTORY_DETAIL_TIENG_VIET.md).

Dữ liệu API đã tách riêng trong `api_evidence.json`; không đưa token, cookie hay các header xác thực vào file phân tích.
