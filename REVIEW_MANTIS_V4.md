# Review AI-testing-mantis-main (4)

Ngày kiểm tra: 05/10/2026.

## Kết quả đối chiếu phiên bản

Đã kiểm tra hai ZIP trong `C:\Users\nlsoft\Downloads` và thư mục giải nén `review\AI-testing-mantis-main (4)`.

| Kiểm tra | Kết quả |
|---|---|
| SHA-256 của ZIP (3) và (4) | Trùng hoàn toàn |
| Số file trong mỗi ZIP | 119 |
| File thêm / xóa / đổi nội dung | 0 / 0 / 0 |
| Thư mục giải nén (4) so với ZIP (4) | 119 file trùng nội dung; không thêm, thiếu hay sửa file |

SHA-256 chung: `376D8E94C7263C182BAA31F516C945A4852A2FF9D166B123AF600C082F72F193`.

Vì vậy, bản (4) đang có trên máy chưa chứa thay đổi so với ZIP (3). Tên file và thời gian tải mới không chứng minh nội dung đã cập nhật. Chưa thể review delta của bản mới mà người dùng mô tả.

## Những điểm vẫn cần cập nhật trong tài liệu này

Đối chiếu `rules-catalog.md` và `priority-hierarchy.md` với các xác nhận đã lưu từ cuộc trò chuyện:

| Nội dung trong ZIP | Nhận xét khi dùng để test hiện tại |
|---|---|
| Max Jobs/day ghi Hard nhưng chú thích Product đổi thành Soft | Tài liệu tự mâu thuẫn; chuẩn 9 mục đã confirm dùng giới hạn hard. |
| Max Last Appointment mô tả không job nào được kết thúc sau cutoff | Khác chuẩn đã confirm về giờ bắt đầu job cuối. Cần sửa expected result trước khi chấm. |
| `exclude` được mô tả thắng mọi rule | Thiếu phân biệt thứ tự nguồn Specific > Custom > Manual filter > System. Không áp dụng câu này như một ưu tiên tuyệt đối xuyên mọi nguồn. |
| Preferred Tech Strict mô tả không fallback, đưa job thành unassigned | Cần phân biệt không đổi sang technician khác với cơ chế fallback day. Không đủ để kết luận hệ thống không được dùng fallback day. |
| Các cấu hình bất khả thi được yêu cầu luôn trả 0 job scheduled | Không dùng làm khẳng định tổng quát khi hệ thống có fallback day được miễn hard rule. Phải phân biệt job trong route và job chuyển fallback. |

Những điểm này là vấn đề độ mới/nhất quán của tài liệu; chưa phải kết luận bug của ứng dụng hiện tại.

## Chuẩn đã được người dùng xác nhận tiếp tục có hiệu lực

- Cả 9 mục trong artifact là yêu cầu nghiệp vụ đã confirm.
- Fallback day được miễn kiểm hard rule; không đánh FAIL hard rule chỉ vì job fallback vượt ngày hoặc khung giờ.
- Thứ tự nguồn: Specific > Custom > Manual filter > System.
- Specific rule áp dụng cho cohort job optimize thành công và xuất hiện trong log History của lượt đó. Ví dụ 10 job đầu vào, chỉ 8 job optimize thành công thì cohort là 8 job.
- Báo cáo kiểm chứng cần có tên customer và job ID; xác nhận yêu cầu không đồng nghĩa implementation đã PASS.

## Phạm vi kiểm chứng lần này

Đã đối chiếu hash toàn bộ ZIP, hash từng file và nội dung thư mục giải nén; đọc lại tài liệu rule và priority liên quan. Không chạy live test, không bật/tắt rule hoặc thay đổi schedule trong lần review này. Các script, hướng dẫn và báo cáo nằm trong ZIP được xem là tài liệu để review.

Để review các cập nhật mới, cần bản ZIP/export có nội dung khác hoặc đường dẫn đúng tới thư mục đã sửa. Khi có bản đó, có thể đối chiếu từng thay đổi với chuẩn đã confirm, không cần xác nhận lại 9 mục.
