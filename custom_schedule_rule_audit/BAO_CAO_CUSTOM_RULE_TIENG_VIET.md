# Báo cáo kiểm tra toàn bộ custom rule với schedule custom

Ngày kiểm tra: 03/10/2026.

**Cập nhật sau xác nhận của người dùng:** fallback được miễn hard rule. Kết luận cũ về rule 1095 và 9 trường hợp của rule 881 đã được rà lại; chúng không còn bị tính là vi phạm hard rule. Job 8544 có kỹ thuật viên phụ được giữ ở nhóm cần kiểm tra riêng. Đây là rà soát lại bằng chứng đã lưu, không phải một lượt chạy API mới.

Đã thử bật/tắt **122/122 rule**. Đã hoàn tất lượt kiểm tra toàn bộ danh sách.
Có 99 rule bật thành công và có kết quả Sandbox; các rule còn lại chưa xác nhận bật vì xung đột hoặc lỗi trạng thái.
Trạng thái rule: **Đã khôi phục và xác nhận đúng trạng thái ban đầu.**
Lịch thực tế: **Không thay đổi trong quá trình kiểm tra, đã xác minh lại cuối đợt.**

## Kết quả tổng hợp

| Kết luận | Số rule |
|---|---:|
| Đạt các điều kiện bắt buộc đã kiểm | 62 |
| Bị chặn do xung đột thiết lập hệ thống | 23 |
| Đạt trên job trong tuyến; fallback được miễn hard rule | 1 |
| Ghi nhận ưu tiên mềm | 5 |
| Cần kiểm tra riêng job có kỹ thuật viên phụ | 1 |
| Chưa đủ bằng chứng | 29 |
| Cần làm rõ phạm vi sau đổi kỹ thuật viên | 1 |

“Đạt” chỉ có nghĩa là các điều kiện bắt buộc có đủ dữ liệu đã được thỏa mãn trong lần chạy này. Rule không có job phù hợp, thiếu dữ liệu bộ lọc hoặc chỉ có ưu tiên mềm không được kết luận là hoạt động đúng hoàn toàn.

## Phạm vi và cách kiểm tra

- Đánh giá 30 job mới, mã 8543–8572, có lịch chính custom (32), ngày 04–08/10/2026. Mỗi ngày 6 job; thời lượng 10–40 phút.
- Tại mốc ban đầu, job 8544 đã được giao cho Lam (31), lịch chính vẫn là custom; 29 job còn lại đang ở custom. Đây là trạng thái có trước kiểm tra, không quy cho rule đang được thử.
- Đầu vào Sandbox chỉ chọn lịch custom (32), trong khoảng 03–16/10/2026. Đối chiếu bất kỳ lịch đích nào được bộ máy trả về. Các rule ép sang kỹ thuật viên khác cần đọc cùng giới hạn đầu vào này.
- Tắt tất cả rule để lấy đối chứng. Sau đó bật riêng từng rule, đọc lại trạng thái, chạy Sandbox, tắt và đọc lại trạng thái. Giữ nguyên thiết lập hệ thống.
- Thiết lập hệ thống hiện tại: không cho đổi kỹ thuật viên (`allow_cross_technician_routing = 0`), phạm vi tối ưu 7 ngày, đóng băng ngày đang làm việc. Đây là thiết lập chụp lại trong đợt mới, khác với đợt kiểm tra trước.
- Không chấp nhận hoặc áp dụng phương án Sandbox vào lịch thực tế. Kiểm tra lịch thực tế định kỳ sau mỗi 15 rule và khi kết thúc.
- Giờ báo cáo giữ theo giá trị API, không tự chuyển sang múi giờ Florida. Tuần tính từ Chủ nhật đến thứ Bảy; giới hạn dịch chuyển tính theo độ lệch ngày tuyệt đối. Khung giờ được kiểm theo giờ đến.
- Chỉ chấm điểm các job trong nhóm 30 job này; các sự kiện khác chỉ hỗ trợ đối chiếu thứ tự điểm dừng và tuyến.

## Job có kỹ thuật viên phụ và bản ghi ở nhiều lịch

Khi truy vấn đồng thời lịch 31 và 32, cùng sự kiện **8540 / job 8544** xuất hiện ở custom và Lam. Kết quả job có `additional_schedules` chứa Lam; vì vậy việc trùng event ID giữa hai lịch có thể là cách biểu diễn kỹ thuật viên phụ, chưa đủ kết luận lỗi dữ liệu. Trình kiểm tra ban đầu chưa xử lý trường hợp này nên chuyển sang đầu vào chỉ chọn custom. Bằng chứng được giữ trong `all_rules_off_duplicate_raw.json`; cần đối chiếu lịch chính/phụ thay vì tự gộp hai bản ghi.

## Chi tiết từng rule

| ID | Bộ lọc và yêu cầu | Kết luận | Job đủ điều kiện | Điều kiện đạt | Vi phạm | Job khác đối chứng | Bật/tắt xác nhận | Ghi chú |
|---|---|---|---:|---:|---:|---:|---|---|
| 1097 | Dịch vụ: Call Back Service → Là điểm dừng cuối cùng trong ngày | Đạt các điều kiện bắt buộc đã kiểm | 4 | 4 | 0 | 11 | Có / Có |  |
| 1055 | Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên Lam 1 | Bị chặn do xung đột thiết lập hệ thống | 0 | 0 | 0 | 0 | Trạng thái 2 / Đã tắt | Trạng thái đọc lại = 2; xung đột: cho phép đổi kỹ thuật viên; API trả 1 nhưng đọc lại trả 2; chưa xác nhận rule hoạt động ở trạng thái bật |
| 961 | Dịch vụ: Call Back Service → Khóa ngày, giờ và kỹ thuật viên<br>Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên custom | Bị chặn do xung đột thiết lập hệ thống | 0 | 0 | 0 | 0 | Trạng thái 2 / Đã tắt | Trạng thái đọc lại = 2; xung đột: cho phép đổi kỹ thuật viên; API trả 1 nhưng đọc lại trả 2; chưa xác nhận rule hoạt động ở trạng thái bật |
| 956 | Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên custom<br>Dịch vụ: Call Back Service → Bắt buộc giờ đến trong 08:00–18:00 | Bị chặn do xung đột thiết lập hệ thống | 0 | 0 | 0 | 0 | Trạng thái 2 / Đã tắt | Trạng thái đọc lại = 2; xung đột: cho phép đổi kỹ thuật viên; API trả 1 nhưng đọc lại trả 2; chưa xác nhận rule hoạt động ở trạng thái bật |
| 867 | Dịch vụ: Call Back Service → Bắt buộc giờ đến trong 08:00–14:00 | Đạt các điều kiện bắt buộc đã kiểm | 4 | 4 | 0 | 11 | Có / Có |  |
| 966 | Dịch vụ: Call Back Service → Giữ nguyên tháng ban đầu<br>Dịch vụ: Call Back Service → Bắt buộc giờ đến trong 09:00–12:00 | Đạt các điều kiện bắt buộc đã kiểm | 4 | 8 | 0 | 17 | Có / Có |  |
| 1098 | Dịch vụ: Call Back Service → Dịch chuyển tối đa 2 ngày | Đạt các điều kiện bắt buộc đã kiểm | 4 | 4 | 0 | 26 | Có / Có |  |
| 1052 | Dịch vụ: Call Back Service → Dịch chuyển tối đa 6 ngày | Đạt các điều kiện bắt buộc đã kiểm | 4 | 4 | 0 | 0 | Có / Có |  |
| 1051 | Dịch vụ: Call Back Service → Dịch chuyển tối đa 5 ngày | Đạt các điều kiện bắt buộc đã kiểm | 4 | 4 | 0 | 0 | Có / Có |  |
| 898 | Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu<br>Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên custom<br>Dịch vụ: Call Back Service → Là điểm dừng đầu tiên trong ngày | Bị chặn do xung đột thiết lập hệ thống | 0 | 0 | 0 | 0 | Trạng thái 2 / Đã tắt | Trạng thái đọc lại = 2; xung đột: cho phép đổi kỹ thuật viên; API trả 1 nhưng đọc lại trả 2; chưa xác nhận rule hoạt động ở trạng thái bật |
| 1099 | Dịch vụ: Call Back Service → Là điểm dừng đầu tiên trong ngày<br>Dịch vụ: Call Back Service → Dịch chuyển tối đa 5 ngày | Đạt các điều kiện bắt buộc đã kiểm | 4 | 8 | 0 | 13 | Có / Có |  |
| 1095 | Dịch vụ: Call Back Service → Giữ nguyên ngày ban đầu<br>Dịch vụ: Call Back Service → Là điểm dừng đầu tiên trong ngày | Đạt trên job trong tuyến; fallback được miễn hard rule | 3 | 6 | 0 | 23 | Có / Có | 1 quan sát ngoài điều kiện nằm ở fallback và được miễn hard rule theo xác nhận của người dùng |
| 1100 | Dịch vụ: Call Back Service → Là điểm dừng cuối cùng trong ngày<br>Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu | Đạt các điều kiện bắt buộc đã kiểm | 4 | 8 | 0 | 11 | Có / Có |  |
| 1005 | Dịch vụ: Call Back Service → Loại khỏi tối ưu tuyến | Đạt các điều kiện bắt buộc đã kiểm | 4 | 4 | 0 | 25 | Có / Có |  |
| 998 | Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu<br>Dịch vụ: Call Back Service → Là điểm dừng cuối cùng trong ngày<br>Dịch vụ: Call Back Service → Ưu tiên kỹ thuật viên custom | Ghi nhận ưu tiên mềm | 4 | 8 | 0 | 11 | Có / Có | Ưu tiên mềm cần dữ liệu khả năng nhận việc và phương án thay thế |
| 557 | Dịch vụ: Call Back Service → Loại khỏi tối ưu tuyến | Đạt các điều kiện bắt buộc đã kiểm | 4 | 4 | 0 | 25 | Có / Có |  |
| 1114 | Dịch vụ: Call Back Service → Giữ nguyên ngày ban đầu | Đạt các điều kiện bắt buộc đã kiểm | 4 | 4 | 0 | 26 | Có / Có |  |
| 863 | Dịch vụ: Call Back Service → Giữ nguyên ngày ban đầu | Đạt các điều kiện bắt buộc đã kiểm | 4 | 4 | 0 | 26 | Có / Có |  |
| 1000 | Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu<br>Dịch vụ: Call Back Service → Khóa ngày, giờ và kỹ thuật viên<br>Dịch vụ: Call Back Service → Ưu tiên kỹ thuật viên Lam 1 | Ghi nhận ưu tiên mềm | 4 | 8 | 0 | 26 | Có / Có | Ưu tiên mềm cần dữ liệu khả năng nhận việc và phương án thay thế |
| 897 | Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu<br>Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên custom<br>Dịch vụ: Call Back Service → Là điểm dừng đầu tiên trong ngày | Bị chặn do xung đột thiết lập hệ thống | 0 | 0 | 0 | 0 | Trạng thái 2 / Đã tắt | Trạng thái đọc lại = 2; xung đột: cho phép đổi kỹ thuật viên; API trả 1 nhưng đọc lại trả 2; chưa xác nhận rule hoạt động ở trạng thái bật |
| 996 | Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu<br>Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên custom<br>Dịch vụ: Call Back Service → Dịch chuyển tối đa 1 ngày | Bị chặn do xung đột thiết lập hệ thống | 0 | 0 | 0 | 0 | Trạng thái 2 / Đã tắt | Trạng thái đọc lại = 2; xung đột: cho phép đổi kỹ thuật viên; API trả 1 nhưng đọc lại trả 2; chưa xác nhận rule hoạt động ở trạng thái bật |
| 1001 | Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu<br>Dịch vụ: Call Back Service → Dịch chuyển tối đa 1 ngày<br>Dịch vụ: Call Back Service → Bắt buộc giờ đến trong 08:00–12:00 | Đạt các điều kiện bắt buộc đã kiểm | 4 | 12 | 0 | 25 | Có / Có |  |
| 1002 | Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu<br>Dịch vụ: Call Back Service → Dịch chuyển tối đa 1 ngày<br>Dịch vụ: Call Back Service → Là điểm dừng đầu tiên trong ngày | Đạt các điều kiện bắt buộc đã kiểm | 4 | 12 | 0 | 25 | Có / Có |  |
| 555 | Dịch vụ: Call Back Service → Bắt buộc giờ đến trong 08:00–12:00<br>Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên Lam | Bị chặn do xung đột thiết lập hệ thống | 0 | 0 | 0 | 0 | Trạng thái 2 / Đã tắt | Trạng thái đọc lại = 2; xung đột: cho phép đổi kỹ thuật viên; API trả 1 nhưng đọc lại trả 2; chưa xác nhận rule hoạt động ở trạng thái bật |
| 978 | Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu<br>Dịch vụ: Call Back Service → Dịch chuyển tối đa 2 ngày<br>Dịch vụ: Call Back Service → Là điểm dừng cuối cùng trong ngày | Đạt các điều kiện bắt buộc đã kiểm | 4 | 12 | 0 | 17 | Có / Có |  |
| 1096 | Dịch vụ: Call Back Service → Dịch chuyển tối đa 2 ngày<br>Dịch vụ: Call Back Service → Là điểm dừng đầu tiên trong ngày | Đạt các điều kiện bắt buộc đã kiểm | 4 | 8 | 0 | 17 | Có / Có |  |
| 864 | Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên custom | Bị chặn do xung đột thiết lập hệ thống | 0 | 0 | 0 | 0 | Trạng thái 2 / Đã tắt | Trạng thái đọc lại = 2; xung đột: cho phép đổi kỹ thuật viên; API trả 1 nhưng đọc lại trả 2; chưa xác nhận rule hoạt động ở trạng thái bật |
| 695 | Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên Lam 1 | Bị chặn do xung đột thiết lập hệ thống | 0 | 0 | 0 | 0 | Trạng thái 2 / Đã tắt | Trạng thái đọc lại = 2; xung đột: cho phép đổi kỹ thuật viên; API trả 1 nhưng đọc lại trả 2; chưa xác nhận rule hoạt động ở trạng thái bật |
| 865 | Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên custom | Bị chặn do xung đột thiết lập hệ thống | 0 | 0 | 0 | 0 | Trạng thái 2 / Đã tắt | Trạng thái đọc lại = 2; xung đột: cho phép đổi kỹ thuật viên; API trả 1 nhưng đọc lại trả 2; chưa xác nhận rule hoạt động ở trạng thái bật |
| 1106 | Dịch vụ: Call Back Service → Bắt buộc giờ đến trong 08:00–14:00 | Đạt các điều kiện bắt buộc đã kiểm | 4 | 4 | 0 | 11 | Có / Có |  |
| 801 | Dịch vụ: Call Back Service → Bắt buộc giờ đến trong 08:00–12:00 | Đạt các điều kiện bắt buộc đã kiểm | 4 | 4 | 0 | 11 | Có / Có |  |
| 779 | Dịch vụ: Call Back Service → Bắt buộc giờ đến trong 08:00–15:00 | Đạt các điều kiện bắt buộc đã kiểm | 4 | 4 | 0 | 11 | Có / Có |  |
| 963 | Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu<br>Dịch vụ: Call Back Service → Dịch chuyển tối đa 2 ngày | Đạt các điều kiện bắt buộc đã kiểm | 4 | 8 | 0 | 26 | Có / Có |  |
| 970 | Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu<br>Dịch vụ: Call Back Service → Dịch chuyển tối đa 2 ngày | Đạt các điều kiện bắt buộc đã kiểm | 4 | 8 | 0 | 26 | Có / Có |  |
| 983 | Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu<br>Dịch vụ: Call Back Service → Là điểm dừng cuối cùng trong ngày | Đạt các điều kiện bắt buộc đã kiểm | 4 | 8 | 0 | 11 | Có / Có |  |
| 911 | Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu<br>Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên Lam 1 | Bị chặn do xung đột thiết lập hệ thống | 0 | 0 | 0 | 0 | Trạng thái 2 / Đã tắt | Trạng thái đọc lại = 2; xung đột: cho phép đổi kỹ thuật viên; API trả 1 nhưng đọc lại trả 2; chưa xác nhận rule hoạt động ở trạng thái bật |
| 952 | Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu<br>Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên custom | Bị chặn do xung đột thiết lập hệ thống | 0 | 0 | 0 | 0 | Trạng thái 2 / Đã tắt | Trạng thái đọc lại = 2; xung đột: cho phép đổi kỹ thuật viên; API trả 1 nhưng đọc lại trả 2; chưa xác nhận rule hoạt động ở trạng thái bật |
| 881 | Tất cả công việc → Bắt buộc giờ đến trong 00:00–08:00 | Cần kiểm tra riêng job có kỹ thuật viên phụ | 19 | 18 | 0 | 24 | Có / Có | 9 quan sát ngoài điều kiện nằm ở fallback và được miễn hard rule theo xác nhận của người dùng; Job có kỹ thuật viên phụ; cần đối chiếu hai lịch và ràng buộc đồng thời trước khi kết luận lỗi |
| 880 | Trạng thái: Confirmed → Thêm đệm di chuyển 120 phút | Chưa đủ bằng chứng | 0 | 0 | 0 | 28 | Có / Có | Thiếu dữ liệu bộ lọc trạng thái; Không có job phù hợp hoặc chưa xác định được phạm vi |
| 1010 | Trạng thái: Confirmed → Khóa ngày, giờ và kỹ thuật viên | Chưa đủ bằng chứng | 0 | 0 | 0 | 30 | Có / Có | Thiếu dữ liệu bộ lọc trạng thái; Không có job phù hợp hoặc chưa xác định được phạm vi |
| 1006 | Trạng thái: Confirmed → Khóa ngày, giờ và kỹ thuật viên<br>Trạng thái: Reschedule → Loại khỏi tối ưu tuyến vào thứ Sáu | Chưa đủ bằng chứng | 0 | 0 | 0 | 30 | Có / Có | Thiếu dữ liệu bộ lọc trạng thái; Không có job phù hợp hoặc chưa xác định được phạm vi |
| 955 | Trạng thái: Confirmed → Bắt buộc giao cho kỹ thuật viên custom<br>Trạng thái: Confirmed → Dịch chuyển tối đa 1 ngày | Bị chặn do xung đột thiết lập hệ thống | 0 | 0 | 0 | 0 | Trạng thái 2 / Đã tắt | Trạng thái đọc lại = 2; xung đột: cho phép đổi kỹ thuật viên; API trả 1 nhưng đọc lại trả 2; chưa xác nhận rule hoạt động ở trạng thái bật |
| 879 | Trạng thái: Confirmed → Thêm đệm di chuyển 120 phút | Chưa đủ bằng chứng | 0 | 0 | 0 | 28 | Có / Có | Thiếu dữ liệu bộ lọc trạng thái; Không có job phù hợp hoặc chưa xác định được phạm vi |
| 957 | Trạng thái: Confirmed → Dịch chuyển tối đa 2 ngày<br>Trạng thái: Confirmed → Bắt buộc giao cho kỹ thuật viên custom | Bị chặn do xung đột thiết lập hệ thống | 0 | 0 | 0 | 0 | Trạng thái 2 / Đã tắt | Trạng thái đọc lại = 2; xung đột: cho phép đổi kỹ thuật viên; API trả 1 nhưng đọc lại trả 2; chưa xác nhận rule hoạt động ở trạng thái bật |
| 871 | Trạng thái: Confirmed → Loại khỏi tối ưu tuyến | Chưa đủ bằng chứng | 0 | 0 | 0 | 30 | Có / Có | Thiếu dữ liệu bộ lọc trạng thái; Không có job phù hợp hoặc chưa xác định được phạm vi |
| 997 | Trạng thái: Confirmed → Giữ nguyên tuần ban đầu<br>Trạng thái: Confirmed → Bắt buộc giao cho kỹ thuật viên custom<br>Trạng thái: Confirmed → Là điểm dừng đầu tiên trong ngày | Bị chặn do xung đột thiết lập hệ thống | 0 | 0 | 0 | 0 | Trạng thái 2 / Đã tắt | Trạng thái đọc lại = 2; xung đột: cho phép đổi kỹ thuật viên; API trả 1 nhưng đọc lại trả 2; chưa xác nhận rule hoạt động ở trạng thái bật |
| 928 | Trạng thái: Confirmed - test → Là điểm dừng cuối cùng trong ngày | Chưa đủ bằng chứng | 0 | 0 | 0 | 0 | Có / Có | Thiếu dữ liệu bộ lọc trạng thái; Không có job phù hợp hoặc chưa xác định được phạm vi |
| 1081 | Khách hàng: enzo, Clark Kent → Loại khỏi tối ưu tuyến vào thứ Ba | Chưa đủ bằng chứng | 0 | 0 | 0 | 0 | Có / Có | Không có job phù hợp hoặc chưa xác định được phạm vi |
| 1083 | Ngày dịch vụ: 2026-10-06; đồng thời Khách hàng: enzo, Clark Kent → Loại khỏi tối ưu tuyến | Chưa đủ bằng chứng | 0 | 0 | 0 | 0 | Có / Có | Không có job phù hợp hoặc chưa xác định được phạm vi |
| 1024 | Khách hàng: messi → Là điểm dừng cuối cùng trong ngày | Chưa đủ bằng chứng | 0 | 0 | 0 | 0 | Có / Có | Không có job phù hợp hoặc chưa xác định được phạm vi |
| 1084 | Ngày dịch vụ: 2026-10-06; hoặc Khách hàng: enzo, Clark Kent → Loại khỏi tối ưu tuyến | Đạt các điều kiện bắt buộc đã kiểm | 6 | 6 | 0 | 29 | Có / Có |  |
| 1074 | Khách hàng: enzo → Giữ nguyên ngày ban đầu<br>Khách hàng: enzo → Bắt buộc giờ đến trong 12:00–15:00 | Chưa đủ bằng chứng | 0 | 0 | 0 | 0 | Có / Có | Không có job phù hợp hoặc chưa xác định được phạm vi |
| 1072 | Dịch vụ: Every 21 Days → Giữ nguyên ngày ban đầu | Đạt các điều kiện bắt buộc đã kiểm | 1 | 1 | 0 | 24 | Có / Có |  |
| 1089 | Dịch vụ: Every 21 Days → Là điểm dừng đầu tiên trong ngày | Đạt các điều kiện bắt buộc đã kiểm | 1 | 1 | 0 | 18 | Có / Có |  |
| 868 | Dịch vụ: Every 21 Days → Là điểm dừng đầu tiên trong ngày | Đạt các điều kiện bắt buộc đã kiểm | 1 | 1 | 0 | 18 | Có / Có |  |
| 1049 | Dịch vụ: Every 21 Days → Là điểm dừng cuối cùng trong ngày | Đạt các điều kiện bắt buộc đã kiểm | 1 | 1 | 0 | 18 | Có / Có |  |
| 869 | Dịch vụ: Every 21 Days → Là điểm dừng cuối cùng trong ngày | Đạt các điều kiện bắt buộc đã kiểm | 1 | 1 | 0 | 18 | Có / Có |  |
| 1085 | Dịch vụ: Every 21 Days → Là điểm dừng cuối cùng trong ngày | Đạt các điều kiện bắt buộc đã kiểm | 1 | 1 | 0 | 18 | Có / Có |  |
| 1087 | Dịch vụ: Every 21 Days → Là điểm dừng cuối cùng trong ngày | Đạt các điều kiện bắt buộc đã kiểm | 1 | 1 | 0 | 18 | Có / Có |  |
| 960 | Dịch vụ: Every 21 Days → Ưu tiên kỹ thuật viên custom<br>Dịch vụ: Every 21 Days → Là điểm dừng cuối cùng trong ngày | Ghi nhận ưu tiên mềm | 1 | 1 | 0 | 18 | Có / Có | Ưu tiên mềm cần dữ liệu khả năng nhận việc và phương án thay thế |
| 959 | Dịch vụ: Every 21 Days → Ưu tiên kỹ thuật viên custom<br>Dịch vụ: Every 21 Days → Là điểm dừng đầu tiên trong ngày | Ghi nhận ưu tiên mềm | 1 | 1 | 0 | 18 | Có / Có | Ưu tiên mềm cần dữ liệu khả năng nhận việc và phương án thay thế |
| 958 | Dịch vụ: Every 21 Days → Ưu tiên kỹ thuật viên custom<br>Dịch vụ: Every 21 Days → Bắt buộc giờ đến trong 08:00–12:00 | Ghi nhận ưu tiên mềm | 1 | 1 | 0 | 18 | Có / Có | Ưu tiên mềm cần dữ liệu khả năng nhận việc và phương án thay thế |
| 984 | Dịch vụ: Every 21 Days → Dịch chuyển tối đa 2 ngày<br>Dịch vụ: Every 21 Days → Là điểm dừng đầu tiên trong ngày | Đạt các điều kiện bắt buộc đã kiểm | 1 | 2 | 0 | 18 | Có / Có |  |
| 973 | Dịch vụ: Every 21 Days → Dịch chuyển tối đa 2 ngày<br>Dịch vụ: Every 21 Days → Là điểm dừng đầu tiên trong ngày | Đạt các điều kiện bắt buộc đã kiểm | 1 | 2 | 0 | 18 | Có / Có |  |
| 1101 | Dịch vụ: Every 21 Days → Dịch chuyển tối đa 5 ngày<br>Dịch vụ: Every 21 Days → Loại khỏi tối ưu tuyến | Chưa đủ bằng chứng | 1 | 1 | 0 | 7 | Có / Có | Có công việc bị cố định hoặc không được xếp tuyến; chưa kiểm chứng được hành động thay đổi lịch |
| 972 | Dịch vụ: Every 21 Days → Giữ nguyên tuần ban đầu<br>Dịch vụ: Every 21 Days → Khóa ngày, giờ và kỹ thuật viên | Đạt các điều kiện bắt buộc đã kiểm | 1 | 2 | 0 | 15 | Có / Có |  |
| 954 | Dịch vụ: Every 21 Days → Giữ nguyên ngày ban đầu<br>Dịch vụ: Every 21 Days → Bắt buộc giao cho kỹ thuật viên custom | Bị chặn do xung đột thiết lập hệ thống | 0 | 0 | 0 | 0 | Trạng thái 2 / Đã tắt | Trạng thái đọc lại = 2; xung đột: cho phép đổi kỹ thuật viên; API trả 1 nhưng đọc lại trả 2; chưa xác nhận rule hoạt động ở trạng thái bật |
| 890 | Trạng thái: Confirmed → Loại khỏi tối ưu tuyến | Chưa đủ bằng chứng | 0 | 0 | 0 | 30 | Có / Có | Thiếu dữ liệu bộ lọc trạng thái; Không có job phù hợp hoặc chưa xác định được phạm vi |
| 910 | Dịch vụ: Every 21 Days → Loại khỏi tối ưu tuyến | Đạt các điều kiện bắt buộc đã kiểm | 1 | 1 | 0 | 7 | Có / Có |  |
| 1082 | Ngày dịch vụ: 2026-10-06; hoặc Khách hàng: enzo, Clark Kent → Loại khỏi tối ưu tuyến | Đạt các điều kiện bắt buộc đã kiểm | 6 | 6 | 0 | 29 | Có / Có |  |
| 1103 | Tất cả công việc → Dịch chuyển tối đa 2 ngày | Đạt các điều kiện bắt buộc đã kiểm | 30 | 30 | 0 | 24 | Có / Có |  |
| 907 | Tất cả công việc → Dịch chuyển tối đa 3 ngày | Đạt các điều kiện bắt buộc đã kiểm | 30 | 30 | 0 | 22 | Có / Có |  |
| 866 | Tất cả công việc → Dịch chuyển tối đa 1 ngày | Đạt các điều kiện bắt buộc đã kiểm | 30 | 30 | 0 | 29 | Có / Có |  |
| 1056 | Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên Lam 1<br>Dịch vụ: Bed Bug Heat Treatment, Bi-Monthly Service, Eco-Friendly Pest Solutions, Every 21 Days, Flea & Tick Control, Follow Up Inspections, General Pest Control, Initial Service, Monthly Service, Mosquito Reduction Program, Preventative Monitoring & Maintenance, Quarterly Pest Control, Quarterly Service, Rodent Control & Exclusion, Termite Baiting & Monitoring, Wasp Nest Removal, Wildlife Trapping & Relocation → Loại khỏi tối ưu tuyến đối với kỹ thuật viên Lam 1 | Bị chặn do xung đột thiết lập hệ thống | 0 | 0 | 0 | 0 | Trạng thái 2 / Đã tắt | Trạng thái đọc lại = 2; xung đột: cho phép đổi kỹ thuật viên; API trả 1 nhưng đọc lại trả 2; chưa xác nhận rule hoạt động ở trạng thái bật |
| 1112 | Kỹ thuật viên: Lam 1 → Dịch chuyển tối đa 2 ngày | Đạt các điều kiện bắt buộc đã kiểm | 29 | 29 | 0 | 24 | Có / Có |  |
| 922 | Kỹ thuật viên: Lam 1 → Bắt buộc giờ đến trong 08:00–12:00 | Đạt các điều kiện bắt buộc đã kiểm | 27 | 27 | 0 | 30 | Có / Có |  |
| 909 | Kỹ thuật viên: Lam 1 → Giữ nguyên ngày ban đầu | Đạt các điều kiện bắt buộc đã kiểm | 29 | 29 | 0 | 29 | Có / Có |  |
| 1086 | Kỹ thuật viên: Lam 1 → Khóa ngày, giờ và kỹ thuật viên | Đạt các điều kiện bắt buộc đã kiểm | 29 | 29 | 0 | 30 | Có / Có |  |
| 921 | Kỹ thuật viên: Lam 1 → Khóa ngày, giờ và kỹ thuật viên | Đạt các điều kiện bắt buộc đã kiểm | 29 | 29 | 0 | 30 | Có / Có |  |
| 882 | Kỹ thuật viên: Lam Test → Dịch chuyển tối đa 1 ngày | Đạt các điều kiện bắt buộc đã kiểm | 1 | 1 | 0 | 29 | Có / Có |  |
| 895 | Kỹ thuật viên: Lam Test → Tổng thời gian di chuyển mỗi ca tối đa 30 phút | Chưa đủ bằng chứng | 1 | 0 | 0 | 17 | Có / Có | Thiếu chặng xuất phát/quay về để xác minh toàn bộ giới hạn di chuyển |
| 884 | Kỹ thuật viên: Lam → Bắt buộc giờ đến trong 00:00–08:00 | Cần làm rõ phạm vi sau đổi kỹ thuật viên | 1 | 0 | 0 | 24 | Có / Có | Job khớp kỹ thuật viên lúc đầu nhưng đã đổi người trong kết quả; cần xác nhận bộ lọc áp dụng trước hay sau đổi người |
| 883 | Kỹ thuật viên: Lam Test → Bắt buộc giờ đến trong 08:00–12:00 | Đạt các điều kiện bắt buộc đã kiểm | 1 | 1 | 0 | 30 | Có / Có |  |
| 1040 | Kỹ thuật viên: Lam Test → Dịch chuyển tối đa 2 ngày | Đạt các điều kiện bắt buộc đã kiểm | 1 | 1 | 0 | 24 | Có / Có |  |
| 1076 | Kỹ thuật viên: Lam Test → Giữ nguyên ngày ban đầu<br>Kỹ thuật viên: Lam Test → Bắt buộc giờ đến trong 12:00–15:00 | Đạt các điều kiện bắt buộc đã kiểm | 1 | 2 | 0 | 30 | Có / Có |  |
| 894 | Kỹ thuật viên: Lam Test → Dịch chuyển tối đa 1 ngày | Đạt các điều kiện bắt buộc đã kiểm | 1 | 1 | 0 | 29 | Có / Có |  |
| 886 | Kỹ thuật viên: Lam Test → Tổng thời gian di chuyển mỗi ca tối đa 240 phút | Chưa đủ bằng chứng | 1 | 0 | 0 | 0 | Có / Có | Thiếu chặng xuất phát/quay về để xác minh toàn bộ giới hạn di chuyển |
| 1014 | Kỹ thuật viên: Technician: Lam Test - nickname: Lam → Bắt buộc giờ đến trong 08:00–12:00 | Đạt các điều kiện bắt buộc đã kiểm | 1 | 1 | 0 | 30 | Có / Có |  |
| 888 | Kỹ thuật viên: Lam Test → Tổng quãng đường di chuyển tối đa 30 dặm | Chưa đủ bằng chứng | 1 | 0 | 0 | 17 | Có / Có | Chưa đủ dữ liệu để kiểm hành động max_travel_distance |
| 889 | Tất cả công việc → Loại khỏi tối ưu tuyến vào thứ Ba đối với kỹ thuật viên Lam | Đạt các điều kiện bắt buộc đã kiểm | 30 | 30 | 0 | 19 | Có / Có |  |
| 885 | Kỹ thuật viên: Lam Test → Loại khỏi tối ưu tuyến vào thứ Ba | Đạt các điều kiện bắt buộc đã kiểm | 1 | 1 | 0 | 19 | Có / Có |  |
| 913 | Tất cả công việc → Loại khỏi tối ưu tuyến vào thứ Tư đối với kỹ thuật viên Lam Test | Đạt các điều kiện bắt buộc đã kiểm | 30 | 30 | 0 | 0 | Có / Có |  |
| 1004 | Dịch vụ: Call Back Service → Khóa ngày, giờ và kỹ thuật viên | Đạt các điều kiện bắt buộc đã kiểm | 4 | 4 | 0 | 26 | Có / Có |  |
| 870 | Dịch vụ: Call Back Service → Khóa ngày, giờ và kỹ thuật viên | Đạt các điều kiện bắt buộc đã kiểm | 4 | 4 | 0 | 26 | Có / Có |  |
| 1019 | Trạng thái: Confirmed → Khóa ngày, giờ và kỹ thuật viên | Chưa đủ bằng chứng | 0 | 0 | 0 | 30 | Có / Có | Thiếu dữ liệu bộ lọc trạng thái; Không có job phù hợp hoặc chưa xác định được phạm vi |
| 1020 | Trạng thái: Reschedule → Khóa ngày, giờ và kỹ thuật viên | Chưa đủ bằng chứng | 0 | 0 | 0 | 0 | Có / Có | Thiếu dữ liệu bộ lọc trạng thái; Không có job phù hợp hoặc chưa xác định được phạm vi |
| 802 | Dịch vụ: Initial Service → Bắt buộc giờ đến trong 08:00–15:00 | Đạt các điều kiện bắt buộc đã kiểm | 1 | 1 | 0 | 8 | Có / Có |  |
| 1025 | Khách hàng: Messi → Bắt buộc giao cho kỹ thuật viên Lam 1 | Bị chặn do xung đột thiết lập hệ thống | 0 | 0 | 0 | 0 | Trạng thái 2 / Đã tắt | Trạng thái đọc lại = 2; xung đột: cho phép đổi kỹ thuật viên; API trả 1 nhưng đọc lại trả 2; chưa xác nhận rule hoạt động ở trạng thái bật |
| 1023 | Khách hàng: Messi → Bắt buộc giờ đến trong 08:00–09:00<br>Khách hàng: Messi → Bắt buộc giao cho kỹ thuật viên Lam Test | Bị chặn do xung đột thiết lập hệ thống | 0 | 0 | 0 | 0 | Trạng thái 2 / Đã tắt | Trạng thái đọc lại = 2; xung đột: cho phép đổi kỹ thuật viên; API trả 1 nhưng đọc lại trả 2; chưa xác nhận rule hoạt động ở trạng thái bật |
| 953 | Dịch vụ: Monthly Service → Giữ nguyên ngày ban đầu<br>Dịch vụ: Monthly Service → Bắt buộc giao cho kỹ thuật viên custom | Bị chặn do xung đột thiết lập hệ thống | 0 | 0 | 0 | 0 | Trạng thái 2 / Đã tắt | Trạng thái đọc lại = 2; xung đột: cho phép đổi kỹ thuật viên; API trả 1 nhưng đọc lại trả 2; chưa xác nhận rule hoạt động ở trạng thái bật |
| 1022 | Khách hàng: Nami → Bắt buộc giao cho kỹ thuật viên Lam Test<br>Khách hàng: Nami → Bắt buộc giờ đến trong 08:00–09:00 | Bị chặn do xung đột thiết lập hệ thống | 0 | 0 | 0 | 0 | Trạng thái 2 / Đã tắt | Trạng thái đọc lại = 2; xung đột: cho phép đổi kỹ thuật viên; API trả 1 nhưng đọc lại trả 2; chưa xác nhận rule hoạt động ở trạng thái bật |
| 975 | Dịch vụ: Quarterly Service → Dịch chuyển tối đa 3 ngày<br>Dịch vụ: Quarterly Service → Là điểm dừng cuối cùng trong ngày<br>Dịch vụ: Call Back Service → Dịch chuyển tối đa 3 ngày<br>Dịch vụ: Call Back Service → Là điểm dừng cuối cùng trong ngày | Đạt các điều kiện bắt buộc đã kiểm | 5 | 10 | 0 | 26 | Có / Có |  |
| 793 | Trạng thái: Recurrence → Bắt buộc giờ đến trong 08:00–12:00 | Chưa đủ bằng chứng | 0 | 0 | 0 | 0 | Có / Có | Thiếu dữ liệu bộ lọc trạng thái; Không có job phù hợp hoặc chưa xác định được phạm vi |
| 794 | Trạng thái: Recurrence → Bắt buộc giờ đến trong 08:00–12:00 | Chưa đủ bằng chứng | 0 | 0 | 0 | 0 | Có / Có | Thiếu dữ liệu bộ lọc trạng thái; Không có job phù hợp hoặc chưa xác định được phạm vi |
| 1029 | Khu vực: Region 2 → Là điểm dừng cuối cùng trong ngày | Chưa đủ bằng chứng | 0 | 0 | 0 | 0 | Có / Có | Thiếu dữ liệu bộ lọc khu vực; Không có job phù hợp hoặc chưa xác định được phạm vi |
| 1031 | Khu vực: Region 2 → Loại khỏi tối ưu tuyến vào thứ Sáu | Chưa đủ bằng chứng | 0 | 0 | 0 | 0 | Có / Có | Thiếu dữ liệu bộ lọc khu vực; Không có job phù hợp hoặc chưa xác định được phạm vi |
| 1034 | Khu vực: Region 2 → Bắt buộc giao cho kỹ thuật viên custom | Bị chặn do xung đột thiết lập hệ thống | 0 | 0 | 0 | 0 | Trạng thái 2 / Đã tắt | Trạng thái đọc lại = 2; xung đột: cho phép đổi kỹ thuật viên; API trả 1 nhưng đọc lại trả 2; chưa xác nhận rule hoạt động ở trạng thái bật |
| 1030 | Khu vực: Region 2 → Loại khỏi tối ưu tuyến | Chưa đủ bằng chứng | 0 | 0 | 0 | 0 | Có / Có | Thiếu dữ liệu bộ lọc khu vực; Không có job phù hợp hoặc chưa xác định được phạm vi |
| 1032 | Khu vực: Region 2 → Loại khỏi tối ưu tuyến vào Chủ nhật | Chưa đủ bằng chứng | 0 | 0 | 0 | 0 | Có / Có | Thiếu dữ liệu bộ lọc khu vực; Không có job phù hợp hoặc chưa xác định được phạm vi |
| 1033 | Trạng thái: Reschedule → Là điểm dừng cuối cùng trong ngày | Chưa đủ bằng chứng | 0 | 0 | 0 | 0 | Có / Có | Thiếu dữ liệu bộ lọc trạng thái; Không có job phù hợp hoặc chưa xác định được phạm vi |
| 906 | Tất cả công việc → Dịch chuyển tối đa 0 ngày | Đạt các điều kiện bắt buộc đã kiểm | 30 | 30 | 0 | 29 | Có / Có |  |
| 1113 | Kỹ thuật viên: custom → Giữ nguyên tuần ban đầu | Đạt các điều kiện bắt buộc đã kiểm | 29 | 29 | 0 | 0 | Có / Có |  |
| 896 | Kỹ thuật viên: Lam Test → Bắt buộc giờ đến trong 00:00–10:00 | Đạt các điều kiện bắt buộc đã kiểm | 1 | 1 | 0 | 22 | Có / Có |  |
| 1041 | Kỹ thuật viên: Lam Test; đồng thời Ngày dịch vụ: 2026-10-03 → Khóa ngày, giờ và kỹ thuật viên | Chưa đủ bằng chứng | 0 | 0 | 0 | 0 | Có / Có | Không có job phù hợp hoặc chưa xác định được phạm vi |
| 887 | Kỹ thuật viên: Lam Test → Dịch chuyển tối đa 0 ngày | Đạt các điều kiện bắt buộc đã kiểm | 1 | 1 | 0 | 29 | Có / Có |  |
| 1017 | Trạng thái: Unconfirmed → Bắt buộc giờ đến trong 08:00–12:00 | Chưa đủ bằng chứng | 0 | 0 | 0 | 0 | Có / Có | Thiếu dữ liệu bộ lọc trạng thái; Không có job phù hợp hoặc chưa xác định được phạm vi |
| 1060 | Trạng thái: Unconfirmed → Bắt buộc giao cho kỹ thuật viên Lam 1<br>Trạng thái: Confirmed, Completed, Reschedule, Pending Confirmation, Canceled, Pending Booking, Terminate Service, Confirmed - test → Loại khỏi tối ưu tuyến đối với kỹ thuật viên Lam 1 | Bị chặn do xung đột thiết lập hệ thống | 0 | 0 | 0 | 0 | Trạng thái 2 / Đã tắt | Trạng thái đọc lại = 2; xung đột: cho phép đổi kỹ thuật viên; API trả 1 nhưng đọc lại trả 2; chưa xác nhận rule hoạt động ở trạng thái bật |
| 878 | Tất cả công việc → Thêm đệm di chuyển 10 phút | Chưa đủ bằng chứng | 30 | 0 | 0 | 29 | Có / Có | Không có điểm dừng trước để kiểm tra đệm di chuyển; Cần thời gian di chuyển từng chặng để chứng minh đủ đệm |
| 1110 | Tất cả công việc → Bắt buộc giờ đến trong 08:00–12:00 | Đạt các điều kiện bắt buộc đã kiểm | 28 | 28 | 0 | 30 | Có / Có |  |
| 808 | Nhãn khách hàng: VIP → Loại khỏi tối ưu tuyến | Chưa đủ bằng chứng | 0 | 0 | 0 | 0 | Có / Có | Thiếu dữ liệu bộ lọc nhãn khách hàng; Không có job phù hợp hoặc chưa xác định được phạm vi |
| 807 | Nhãn khách hàng: VIP → Khóa ngày, giờ và kỹ thuật viên | Chưa đủ bằng chứng | 0 | 0 | 0 | 0 | Có / Có | Thiếu dữ liệu bộ lọc nhãn khách hàng; Không có job phù hợp hoặc chưa xác định được phạm vi |
| 908 | Kỹ thuật viên: Lam → Loại khỏi tối ưu tuyến vào thứ Tư | Đạt các điều kiện bắt buộc đã kiểm | 1 | 1 | 0 | 5 | Có / Có |  |

## Rule bị chặn khi bật

Đã thử lại các trường hợp này. API bật trả `status = 1`, nhưng đọc lại chi tiết trả `status = 2`. Lý do xung đột được ghi trực tiếp trong chi tiết rule. Với rule 1055, trạng thái vẫn là 2 tại ba lần đọc: ngay sau bật, sau 5 giây và sau thêm 10 giây. Không tính các rule này là đã bật thành công và không dùng chúng để kết luận hiệu lực trên job. Muốn kiểm tra hiệu lực cần một lượt riêng với thiết lập hệ thống tương thích.

| ID | Tên rule trên hệ thống | API bật trả về | Trạng thái đọc lại | Thiết lập xung đột |
|---|---|---|---|---|
| 1055 | Call Back Service Mandatory Assignment | 1 | 2 | cho phép đổi kỹ thuật viên |
| 961 | Call Back Service Mandatory Assignment and Lock | 1 | 2 | cho phép đổi kỹ thuật viên |
| 956 | Call Back Service Mandatory Assignment and Time Window | 1 | 2 | cho phép đổi kỹ thuật viên |
| 898 | Call Back Service Priority & Assignment Rule | 1 | 2 | cho phép đổi kỹ thuật viên |
| 897 | Call Back Service Scheduling & Assignment Policy | 1 | 2 | cho phép đổi kỹ thuật viên |
| 996 | Call Back Service Scheduling & Assignment Rule | 1 | 2 | cho phép đổi kỹ thuật viên |
| 555 | Call Back Service Scheduling & Technician Lock | 1 | 2 | cho phép đổi kỹ thuật viên |
| 864 | Call Back Service Technician Assignment | 1 | 2 | cho phép đổi kỹ thuật viên |
| 695 | Call Back Service Technician Assignment | 1 | 2 | cho phép đổi kỹ thuật viên |
| 865 | Call Back Service Technician Lock | 1 | 2 | cho phép đổi kỹ thuật viên |
| 911 | Call Back Service Weekly Lock & Technician Assignment | 1 | 2 | cho phép đổi kỹ thuật viên |
| 952 | Call Back Service Weekly Lock and Tech Assignment | 1 | 2 | cho phép đổi kỹ thuật viên |
| 955 | Confirmed Jobs Custom Tech & Movement Restriction | 1 | 2 | cho phép đổi kỹ thuật viên |
| 957 | Confirmed Jobs Mandatory Tech and Schedule Lock | 1 | 2 | cho phép đổi kỹ thuật viên |
| 997 | Confirmed Status Routing Rules | 1 | 2 | cho phép đổi kỹ thuật viên |
| 954 | Every 21 Days Technician & Day Lock | 1 | 2 | cho phép đổi kỹ thuật viên |
| 1056 | Lam 1 Call Back Service Dedicated Routing | 1 | 2 | cho phép đổi kỹ thuật viên |
| 1025 | Messi Customer Assignment Rule | 1 | 2 | cho phép đổi kỹ thuật viên |
| 1023 | Messi Customer Routing & Assignment Lock | 1 | 2 | cho phép đổi kỹ thuật viên |
| 953 | Monthly Service Same-Day Custom Tech Assignment | 1 | 2 | cho phép đổi kỹ thuật viên |
| 1022 | Nami Preferred Service Schedule & Technician Assignment | 1 | 2 | cho phép đổi kỹ thuật viên |
| 1034 | Region 2 Mandatory Technician Assignment | 1 | 2 | cho phép đổi kỹ thuật viên |
| 1060 | Unconfirmed Jobs Assignment for Lam 1 | 1 | 2 | cho phép đổi kỹ thuật viên |

## Bằng chứng từng job có vi phạm

Bảng ghi tất cả vi phạm xác nhận. Một job có thể vi phạm nhiều điều kiện; không cộng số dòng thành số nguyên nhân lỗi riêng biệt. “Trước” là lịch thực tế ban đầu, “Sau” là phương án Sandbox khi bật rule.

| Rule | Customer | Job / sự kiện | Yêu cầu | Trước | Sau | Vi phạm | Nhật ký bộ giải |
|---|---|---|---|---|---|---|---|

## Bằng chứng khi bật rule khắc phục vi phạm của đối chứng

Các dòng này cho thấy điều kiện bị vi phạm khi tắt rule nhưng được thỏa mãn khi bật. Đây là quan sát một cặp kết quả; chưa chạy lặp để loại hết khả năng bộ giải tự sinh phương án khác.

| Rule | Customer | Job | Điều kiện được thỏa mãn khi bật |
|---|---|---|---|
| 1097 | FL Routing Test 07 | 8552 | Là điểm dừng cuối cùng trong ngày |
| 1097 | FL Routing Test 09 | 8553 | Là điểm dừng cuối cùng trong ngày |
| 867 | FL Routing Test 07 | 8552 | Bắt buộc giờ đến trong 08:00–14:00 |
| 867 | FL Routing Test 09 | 8553 | Bắt buộc giờ đến trong 08:00–14:00 |
| 966 | FL Routing Test 07 | 8552 | Bắt buộc giờ đến trong 09:00–12:00 |
| 966 | FL Routing Test 09 | 8553 | Bắt buộc giờ đến trong 09:00–12:00 |
| 966 | FL Routing Test 15 | 8572 | Bắt buộc giờ đến trong 09:00–12:00 |
| 1098 | FL Routing Test 07 | 8552 | Dịch chuyển tối đa 2 ngày |
| 1098 | FL Routing Test 15 | 8572 | Dịch chuyển tối đa 2 ngày |
| 1099 | FL Routing Test 09 | 8553 | Là điểm dừng đầu tiên trong ngày |
| 1099 | FL Routing Test 06 | 8561 | Là điểm dừng đầu tiên trong ngày |
| 1099 | FL Routing Test 15 | 8572 | Là điểm dừng đầu tiên trong ngày |
| 1095 | FL Routing Test 06 | 8561 | Giữ nguyên ngày ban đầu |
| 1095 | FL Routing Test 15 | 8572 | Giữ nguyên ngày ban đầu |
| 1095 | FL Routing Test 09 | 8553 | Là điểm dừng đầu tiên trong ngày |
| 1095 | FL Routing Test 06 | 8561 | Là điểm dừng đầu tiên trong ngày |
| 1095 | FL Routing Test 15 | 8572 | Là điểm dừng đầu tiên trong ngày |
| 1100 | FL Routing Test 07 | 8552 | Là điểm dừng cuối cùng trong ngày |
| 1100 | FL Routing Test 09 | 8553 | Là điểm dừng cuối cùng trong ngày |
| 1005 | FL Routing Test 07 | 8552 | Loại khỏi tối ưu tuyến |
| 1005 | FL Routing Test 09 | 8553 | Loại khỏi tối ưu tuyến |
| 1005 | FL Routing Test 06 | 8561 | Loại khỏi tối ưu tuyến |
| 1005 | FL Routing Test 15 | 8572 | Loại khỏi tối ưu tuyến |
| 998 | FL Routing Test 07 | 8552 | Là điểm dừng cuối cùng trong ngày |
| 998 | FL Routing Test 09 | 8553 | Là điểm dừng cuối cùng trong ngày |
| 557 | FL Routing Test 07 | 8552 | Loại khỏi tối ưu tuyến |
| 557 | FL Routing Test 09 | 8553 | Loại khỏi tối ưu tuyến |
| 557 | FL Routing Test 06 | 8561 | Loại khỏi tối ưu tuyến |
| 557 | FL Routing Test 15 | 8572 | Loại khỏi tối ưu tuyến |
| 1114 | FL Routing Test 07 | 8552 | Giữ nguyên ngày ban đầu |
| 1114 | FL Routing Test 06 | 8561 | Giữ nguyên ngày ban đầu |
| 1114 | FL Routing Test 15 | 8572 | Giữ nguyên ngày ban đầu |
| 863 | FL Routing Test 07 | 8552 | Giữ nguyên ngày ban đầu |
| 863 | FL Routing Test 06 | 8561 | Giữ nguyên ngày ban đầu |
| 863 | FL Routing Test 15 | 8572 | Giữ nguyên ngày ban đầu |
| 1000 | FL Routing Test 07 | 8552 | Khóa ngày, giờ và kỹ thuật viên |
| 1000 | FL Routing Test 09 | 8553 | Khóa ngày, giờ và kỹ thuật viên |
| 1000 | FL Routing Test 06 | 8561 | Khóa ngày, giờ và kỹ thuật viên |
| 1000 | FL Routing Test 15 | 8572 | Khóa ngày, giờ và kỹ thuật viên |
| 1001 | FL Routing Test 07 | 8552 | Dịch chuyển tối đa 1 ngày |
| 1001 | FL Routing Test 15 | 8572 | Dịch chuyển tối đa 1 ngày |
| 1001 | FL Routing Test 07 | 8552 | Bắt buộc giờ đến trong 08:00–12:00 |
| 1001 | FL Routing Test 09 | 8553 | Bắt buộc giờ đến trong 08:00–12:00 |
| 1002 | FL Routing Test 07 | 8552 | Dịch chuyển tối đa 1 ngày |
| 1002 | FL Routing Test 15 | 8572 | Dịch chuyển tối đa 1 ngày |
| 1002 | FL Routing Test 09 | 8553 | Là điểm dừng đầu tiên trong ngày |
| 1002 | FL Routing Test 06 | 8561 | Là điểm dừng đầu tiên trong ngày |
| 1002 | FL Routing Test 15 | 8572 | Là điểm dừng đầu tiên trong ngày |
| 978 | FL Routing Test 07 | 8552 | Dịch chuyển tối đa 2 ngày |
| 978 | FL Routing Test 15 | 8572 | Dịch chuyển tối đa 2 ngày |
| 978 | FL Routing Test 07 | 8552 | Là điểm dừng cuối cùng trong ngày |
| 978 | FL Routing Test 09 | 8553 | Là điểm dừng cuối cùng trong ngày |
| 1096 | FL Routing Test 07 | 8552 | Dịch chuyển tối đa 2 ngày |
| 1096 | FL Routing Test 15 | 8572 | Dịch chuyển tối đa 2 ngày |
| 1096 | FL Routing Test 09 | 8553 | Là điểm dừng đầu tiên trong ngày |
| 1096 | FL Routing Test 06 | 8561 | Là điểm dừng đầu tiên trong ngày |
| 1096 | FL Routing Test 15 | 8572 | Là điểm dừng đầu tiên trong ngày |
| 1106 | FL Routing Test 07 | 8552 | Bắt buộc giờ đến trong 08:00–14:00 |
| 1106 | FL Routing Test 09 | 8553 | Bắt buộc giờ đến trong 08:00–14:00 |
| 801 | FL Routing Test 07 | 8552 | Bắt buộc giờ đến trong 08:00–12:00 |
| 801 | FL Routing Test 09 | 8553 | Bắt buộc giờ đến trong 08:00–12:00 |
| 779 | FL Routing Test 07 | 8552 | Bắt buộc giờ đến trong 08:00–15:00 |
| 779 | FL Routing Test 09 | 8553 | Bắt buộc giờ đến trong 08:00–15:00 |
| 963 | FL Routing Test 07 | 8552 | Dịch chuyển tối đa 2 ngày |
| 963 | FL Routing Test 15 | 8572 | Dịch chuyển tối đa 2 ngày |
| 970 | FL Routing Test 07 | 8552 | Dịch chuyển tối đa 2 ngày |
| 970 | FL Routing Test 15 | 8572 | Dịch chuyển tối đa 2 ngày |
| 983 | FL Routing Test 07 | 8552 | Là điểm dừng cuối cùng trong ngày |
| 983 | FL Routing Test 09 | 8553 | Là điểm dừng cuối cùng trong ngày |
| 881 | FL Routing Test 06 | 8545 | Bắt buộc giờ đến trong 00:00–08:00 |
| 881 | FL Routing Test 15 | 8549 | Bắt buộc giờ đến trong 00:00–08:00 |
| 881 | FL Routing Test 18 | 8550 | Bắt buộc giờ đến trong 00:00–08:00 |
| 881 | FL Routing Test 11 | 8554 | Bắt buộc giờ đến trong 00:00–08:00 |
| 881 | FL Routing Test 04 | 8557 | Bắt buộc giờ đến trong 00:00–08:00 |
| 881 | FL Routing Test 06 | 8561 | Bắt buộc giờ đến trong 00:00–08:00 |
| 881 | FL Routing Test 14 | 8569 | Bắt buộc giờ đến trong 00:00–08:00 |
| 881 | FL Routing Test 15 | 8572 | Bắt buộc giờ đến trong 00:00–08:00 |
| 1084 | FL Routing Test 13 | 8555 | Loại khỏi tối ưu tuyến |
| 1084 | FL Routing Test 05 | 8558 | Loại khỏi tối ưu tuyến |
| 1084 | FL Routing Test 02 | 8556 | Loại khỏi tối ưu tuyến |
| 1084 | FL Routing Test 04 | 8557 | Loại khỏi tối ưu tuyến |
| 1084 | FL Routing Test 01 | 8559 | Loại khỏi tối ưu tuyến |
| 1084 | FL Routing Test 01 | 8560 | Loại khỏi tối ưu tuyến |
| 1072 | FL Routing Test 02 | 8568 | Giữ nguyên ngày ban đầu |
| 1089 | FL Routing Test 02 | 8568 | Là điểm dừng đầu tiên trong ngày |
| 868 | FL Routing Test 02 | 8568 | Là điểm dừng đầu tiên trong ngày |
| 1049 | FL Routing Test 02 | 8568 | Là điểm dừng cuối cùng trong ngày |
| 869 | FL Routing Test 02 | 8568 | Là điểm dừng cuối cùng trong ngày |
| 1085 | FL Routing Test 02 | 8568 | Là điểm dừng cuối cùng trong ngày |
| 1087 | FL Routing Test 02 | 8568 | Là điểm dừng cuối cùng trong ngày |
| 960 | FL Routing Test 02 | 8568 | Là điểm dừng cuối cùng trong ngày |
| 959 | FL Routing Test 02 | 8568 | Là điểm dừng đầu tiên trong ngày |
| 958 | FL Routing Test 02 | 8568 | Bắt buộc giờ đến trong 08:00–12:00 |
| 984 | FL Routing Test 02 | 8568 | Là điểm dừng đầu tiên trong ngày |
| 973 | FL Routing Test 02 | 8568 | Là điểm dừng đầu tiên trong ngày |
| 1101 | FL Routing Test 02 | 8568 | Loại khỏi tối ưu tuyến |
| 972 | FL Routing Test 02 | 8568 | Khóa ngày, giờ và kỹ thuật viên |
| 910 | FL Routing Test 02 | 8568 | Loại khỏi tối ưu tuyến |
| 1082 | FL Routing Test 13 | 8555 | Loại khỏi tối ưu tuyến |
| 1082 | FL Routing Test 05 | 8558 | Loại khỏi tối ưu tuyến |
| 1082 | FL Routing Test 02 | 8556 | Loại khỏi tối ưu tuyến |
| 1082 | FL Routing Test 04 | 8557 | Loại khỏi tối ưu tuyến |
| 1082 | FL Routing Test 01 | 8559 | Loại khỏi tối ưu tuyến |
| 1082 | FL Routing Test 01 | 8560 | Loại khỏi tối ưu tuyến |
| 1103 | FL Routing Test 06 | 8545 | Dịch chuyển tối đa 2 ngày |
| 1103 | FL Routing Test 07 | 8552 | Dịch chuyển tối đa 2 ngày |
| 1103 | FL Routing Test 15 | 8572 | Dịch chuyển tối đa 2 ngày |
| 907 | FL Routing Test 06 | 8545 | Dịch chuyển tối đa 3 ngày |
| 907 | FL Routing Test 15 | 8572 | Dịch chuyển tối đa 3 ngày |
| 866 | FL Routing Test 06 | 8545 | Dịch chuyển tối đa 1 ngày |
| 866 | FL Routing Test 13 | 8555 | Dịch chuyển tối đa 1 ngày |
| 866 | FL Routing Test 07 | 8552 | Dịch chuyển tối đa 1 ngày |
| 866 | FL Routing Test 02 | 8568 | Dịch chuyển tối đa 1 ngày |
| 866 | FL Routing Test 15 | 8572 | Dịch chuyển tối đa 1 ngày |
| 1112 | FL Routing Test 06 | 8545 | Dịch chuyển tối đa 2 ngày |
| 1112 | FL Routing Test 07 | 8552 | Dịch chuyển tối đa 2 ngày |
| 1112 | FL Routing Test 15 | 8572 | Dịch chuyển tối đa 2 ngày |
| 922 | FL Routing Test 03 | 8546 | Bắt buộc giờ đến trong 08:00–12:00 |
| 922 | FL Routing Test 16 | 8547 | Bắt buộc giờ đến trong 08:00–12:00 |
| 922 | FL Routing Test 16 | 8548 | Bắt buộc giờ đến trong 08:00–12:00 |
| 922 | FL Routing Test 09 | 8551 | Bắt buộc giờ đến trong 08:00–12:00 |
| 922 | FL Routing Test 07 | 8552 | Bắt buộc giờ đến trong 08:00–12:00 |
| 922 | FL Routing Test 09 | 8553 | Bắt buộc giờ đến trong 08:00–12:00 |
| 922 | FL Routing Test 02 | 8556 | Bắt buộc giờ đến trong 08:00–12:00 |
| 922 | FL Routing Test 01 | 8559 | Bắt buộc giờ đến trong 08:00–12:00 |
| 922 | FL Routing Test 19 | 8563 | Bắt buộc giờ đến trong 08:00–12:00 |
| 922 | FL Routing Test 14 | 8564 | Bắt buộc giờ đến trong 08:00–12:00 |
| 922 | FL Routing Test 07 | 8566 | Bắt buộc giờ đến trong 08:00–12:00 |
| 922 | FL Routing Test 08 | 8567 | Bắt buộc giờ đến trong 08:00–12:00 |
| 922 | FL Routing Test 02 | 8568 | Bắt buộc giờ đến trong 08:00–12:00 |
| 922 | FL Routing Test 20 | 8570 | Bắt buộc giờ đến trong 08:00–12:00 |
| 922 | FL Routing Test 08 | 8571 | Bắt buộc giờ đến trong 08:00–12:00 |
| 909 | FL Routing Test 06 | 8545 | Giữ nguyên ngày ban đầu |
| 909 | FL Routing Test 03 | 8546 | Giữ nguyên ngày ban đầu |
| 909 | FL Routing Test 10 | 8543 | Giữ nguyên ngày ban đầu |
| 909 | FL Routing Test 15 | 8549 | Giữ nguyên ngày ban đầu |
| 909 | FL Routing Test 13 | 8555 | Giữ nguyên ngày ban đầu |
| 909 | FL Routing Test 18 | 8550 | Giữ nguyên ngày ban đầu |
| 909 | FL Routing Test 05 | 8558 | Giữ nguyên ngày ban đầu |
| 909 | FL Routing Test 07 | 8552 | Giữ nguyên ngày ban đầu |
| 909 | FL Routing Test 11 | 8554 | Giữ nguyên ngày ban đầu |
| 909 | FL Routing Test 06 | 8561 | Giữ nguyên ngày ban đầu |
| 909 | FL Routing Test 19 | 8563 | Giữ nguyên ngày ban đầu |
| 909 | FL Routing Test 07 | 8566 | Giữ nguyên ngày ban đầu |
| 909 | FL Routing Test 02 | 8568 | Giữ nguyên ngày ban đầu |
| 909 | FL Routing Test 14 | 8569 | Giữ nguyên ngày ban đầu |
| 909 | FL Routing Test 20 | 8570 | Giữ nguyên ngày ban đầu |
| 909 | FL Routing Test 15 | 8572 | Giữ nguyên ngày ban đầu |
| 1086 | FL Routing Test 06 | 8545 | Khóa ngày, giờ và kỹ thuật viên |
| 1086 | FL Routing Test 03 | 8546 | Khóa ngày, giờ và kỹ thuật viên |
| 1086 | FL Routing Test 16 | 8547 | Khóa ngày, giờ và kỹ thuật viên |
| 1086 | FL Routing Test 10 | 8543 | Khóa ngày, giờ và kỹ thuật viên |
| 1086 | FL Routing Test 16 | 8548 | Khóa ngày, giờ và kỹ thuật viên |
| 1086 | FL Routing Test 09 | 8551 | Khóa ngày, giờ và kỹ thuật viên |
| 1086 | FL Routing Test 15 | 8549 | Khóa ngày, giờ và kỹ thuật viên |
| 1086 | FL Routing Test 13 | 8555 | Khóa ngày, giờ và kỹ thuật viên |
| 1086 | FL Routing Test 18 | 8550 | Khóa ngày, giờ và kỹ thuật viên |
| 1086 | FL Routing Test 05 | 8558 | Khóa ngày, giờ và kỹ thuật viên |
| 1086 | FL Routing Test 07 | 8552 | Khóa ngày, giờ và kỹ thuật viên |
| 1086 | FL Routing Test 09 | 8553 | Khóa ngày, giờ và kỹ thuật viên |
| 1086 | FL Routing Test 11 | 8554 | Khóa ngày, giờ và kỹ thuật viên |
| 1086 | FL Routing Test 02 | 8556 | Khóa ngày, giờ và kỹ thuật viên |
| 1086 | FL Routing Test 04 | 8557 | Khóa ngày, giờ và kỹ thuật viên |
| 1086 | FL Routing Test 01 | 8559 | Khóa ngày, giờ và kỹ thuật viên |
| 1086 | FL Routing Test 01 | 8560 | Khóa ngày, giờ và kỹ thuật viên |
| 1086 | FL Routing Test 06 | 8561 | Khóa ngày, giờ và kỹ thuật viên |
| 1086 | FL Routing Test 12 | 8562 | Khóa ngày, giờ và kỹ thuật viên |
| 1086 | FL Routing Test 19 | 8563 | Khóa ngày, giờ và kỹ thuật viên |
| 1086 | FL Routing Test 14 | 8564 | Khóa ngày, giờ và kỹ thuật viên |
| 1086 | FL Routing Test 17 | 8565 | Khóa ngày, giờ và kỹ thuật viên |
| 1086 | FL Routing Test 07 | 8566 | Khóa ngày, giờ và kỹ thuật viên |
| 1086 | FL Routing Test 08 | 8567 | Khóa ngày, giờ và kỹ thuật viên |
| 1086 | FL Routing Test 02 | 8568 | Khóa ngày, giờ và kỹ thuật viên |
| 1086 | FL Routing Test 14 | 8569 | Khóa ngày, giờ và kỹ thuật viên |
| 1086 | FL Routing Test 20 | 8570 | Khóa ngày, giờ và kỹ thuật viên |
| 1086 | FL Routing Test 08 | 8571 | Khóa ngày, giờ và kỹ thuật viên |
| 1086 | FL Routing Test 15 | 8572 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 06 | 8545 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 03 | 8546 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 16 | 8547 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 10 | 8543 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 16 | 8548 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 09 | 8551 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 15 | 8549 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 13 | 8555 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 18 | 8550 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 05 | 8558 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 07 | 8552 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 09 | 8553 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 11 | 8554 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 02 | 8556 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 04 | 8557 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 01 | 8559 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 01 | 8560 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 06 | 8561 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 12 | 8562 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 19 | 8563 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 14 | 8564 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 17 | 8565 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 07 | 8566 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 08 | 8567 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 02 | 8568 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 14 | 8569 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 20 | 8570 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 08 | 8571 | Khóa ngày, giờ và kỹ thuật viên |
| 921 | FL Routing Test 15 | 8572 | Khóa ngày, giờ và kỹ thuật viên |
| 895 | FL Routing Test 13 | 8544 | Tổng thời gian di chuyển mỗi ca tối đa 30 phút |
| 883 | FL Routing Test 13 | 8544 | Bắt buộc giờ đến trong 08:00–12:00 |
| 1076 | FL Routing Test 13 | 8544 | Bắt buộc giờ đến trong 12:00–15:00 |
| 1014 | FL Routing Test 13 | 8544 | Bắt buộc giờ đến trong 08:00–12:00 |
| 1004 | FL Routing Test 07 | 8552 | Khóa ngày, giờ và kỹ thuật viên |
| 1004 | FL Routing Test 09 | 8553 | Khóa ngày, giờ và kỹ thuật viên |
| 1004 | FL Routing Test 06 | 8561 | Khóa ngày, giờ và kỹ thuật viên |
| 1004 | FL Routing Test 15 | 8572 | Khóa ngày, giờ và kỹ thuật viên |
| 870 | FL Routing Test 07 | 8552 | Khóa ngày, giờ và kỹ thuật viên |
| 870 | FL Routing Test 09 | 8553 | Khóa ngày, giờ và kỹ thuật viên |
| 870 | FL Routing Test 06 | 8561 | Khóa ngày, giờ và kỹ thuật viên |
| 870 | FL Routing Test 15 | 8572 | Khóa ngày, giờ và kỹ thuật viên |
| 802 | FL Routing Test 19 | 8563 | Bắt buộc giờ đến trong 08:00–15:00 |
| 975 | FL Routing Test 16 | 8548 | Là điểm dừng cuối cùng trong ngày |
| 975 | FL Routing Test 15 | 8572 | Dịch chuyển tối đa 3 ngày |
| 975 | FL Routing Test 07 | 8552 | Là điểm dừng cuối cùng trong ngày |
| 975 | FL Routing Test 09 | 8553 | Là điểm dừng cuối cùng trong ngày |
| 906 | FL Routing Test 06 | 8545 | Dịch chuyển tối đa 0 ngày |
| 906 | FL Routing Test 03 | 8546 | Dịch chuyển tối đa 0 ngày |
| 906 | FL Routing Test 10 | 8543 | Dịch chuyển tối đa 0 ngày |
| 906 | FL Routing Test 15 | 8549 | Dịch chuyển tối đa 0 ngày |
| 906 | FL Routing Test 13 | 8555 | Dịch chuyển tối đa 0 ngày |
| 906 | FL Routing Test 18 | 8550 | Dịch chuyển tối đa 0 ngày |
| 906 | FL Routing Test 05 | 8558 | Dịch chuyển tối đa 0 ngày |
| 906 | FL Routing Test 07 | 8552 | Dịch chuyển tối đa 0 ngày |
| 906 | FL Routing Test 11 | 8554 | Dịch chuyển tối đa 0 ngày |
| 906 | FL Routing Test 06 | 8561 | Dịch chuyển tối đa 0 ngày |
| 906 | FL Routing Test 19 | 8563 | Dịch chuyển tối đa 0 ngày |
| 906 | FL Routing Test 07 | 8566 | Dịch chuyển tối đa 0 ngày |
| 906 | FL Routing Test 02 | 8568 | Dịch chuyển tối đa 0 ngày |
| 906 | FL Routing Test 14 | 8569 | Dịch chuyển tối đa 0 ngày |
| 906 | FL Routing Test 20 | 8570 | Dịch chuyển tối đa 0 ngày |
| 906 | FL Routing Test 15 | 8572 | Dịch chuyển tối đa 0 ngày |
| 878 | FL Routing Test 16 | 8548 | Thêm đệm di chuyển 10 phút |
| 878 | FL Routing Test 13 | 8555 | Thêm đệm di chuyển 10 phút |
| 878 | FL Routing Test 09 | 8553 | Thêm đệm di chuyển 10 phút |
| 878 | FL Routing Test 01 | 8560 | Thêm đệm di chuyển 10 phút |
| 878 | FL Routing Test 06 | 8561 | Thêm đệm di chuyển 10 phút |
| 878 | FL Routing Test 17 | 8565 | Thêm đệm di chuyển 10 phút |
| 878 | FL Routing Test 07 | 8566 | Thêm đệm di chuyển 10 phút |
| 878 | FL Routing Test 02 | 8568 | Thêm đệm di chuyển 10 phút |
| 878 | FL Routing Test 14 | 8569 | Thêm đệm di chuyển 10 phút |
| 878 | FL Routing Test 08 | 8571 | Thêm đệm di chuyển 10 phút |
| 878 | FL Routing Test 15 | 8572 | Thêm đệm di chuyển 10 phút |
| 1110 | FL Routing Test 13 | 8544 | Bắt buộc giờ đến trong 08:00–12:00 |
| 1110 | FL Routing Test 03 | 8546 | Bắt buộc giờ đến trong 08:00–12:00 |
| 1110 | FL Routing Test 16 | 8547 | Bắt buộc giờ đến trong 08:00–12:00 |
| 1110 | FL Routing Test 16 | 8548 | Bắt buộc giờ đến trong 08:00–12:00 |
| 1110 | FL Routing Test 09 | 8551 | Bắt buộc giờ đến trong 08:00–12:00 |
| 1110 | FL Routing Test 07 | 8552 | Bắt buộc giờ đến trong 08:00–12:00 |
| 1110 | FL Routing Test 09 | 8553 | Bắt buộc giờ đến trong 08:00–12:00 |
| 1110 | FL Routing Test 02 | 8556 | Bắt buộc giờ đến trong 08:00–12:00 |
| 1110 | FL Routing Test 01 | 8559 | Bắt buộc giờ đến trong 08:00–12:00 |
| 1110 | FL Routing Test 19 | 8563 | Bắt buộc giờ đến trong 08:00–12:00 |
| 1110 | FL Routing Test 14 | 8564 | Bắt buộc giờ đến trong 08:00–12:00 |
| 1110 | FL Routing Test 07 | 8566 | Bắt buộc giờ đến trong 08:00–12:00 |
| 1110 | FL Routing Test 08 | 8567 | Bắt buộc giờ đến trong 08:00–12:00 |
| 1110 | FL Routing Test 02 | 8568 | Bắt buộc giờ đến trong 08:00–12:00 |
| 1110 | FL Routing Test 20 | 8570 | Bắt buộc giờ đến trong 08:00–12:00 |
| 1110 | FL Routing Test 08 | 8571 | Bắt buộc giờ đến trong 08:00–12:00 |

## Trường hợp cần làm rõ xung đột

| Rule | Customer | Job | Yêu cầu xung đột với khóa lịch | Quan sát |
|---|---|---|---|---|

## Phạm vi bộ lọc khi đổi kỹ thuật viên

Các job dưới đây khớp kỹ thuật viên trong lịch ban đầu nhưng không còn khớp kỹ thuật viên ở phương án trả về. Cần xác định rule áp dụng theo người được giao lúc đầu hay người ở tuyến cuối; chưa kết luận đây là lỗi áp dụng rule.

| Rule | Customer | Job | Trước | Sau | Yêu cầu cần làm rõ |
|---|---|---|---|---|---|
| 884 | FL Routing Test 13 | 8544 | 04/10/2026 09:00–04/10/2026 09:39 · lịch 31 | 04/10/2026 09:00–04/10/2026 09:39 · lịch 32 | Bắt buộc giờ đến trong 00:00–08:00 |

## Các quan sát được miễn hard rule do fallback

Theo xác nhận trực tiếp của người dùng, các trường hợp có `on_fallback_day = true` dưới đây không được tính là lỗi hard rule.

| Rule | Customer | Job | Quan sát đã được miễn |
|---|---|---|---|
| 1095 | FL Routing Test 07 | 8552 | Không giữ nguyên ngày ban đầu. |
| 881 | FL Routing Test 16 | 8547 | Giờ đến 12:00:00 nằm ngoài khung 00:00–08:00. |
| 881 | FL Routing Test 16 | 8548 | Giờ đến 13:00:00 nằm ngoài khung 00:00–08:00. |
| 881 | FL Routing Test 05 | 8558 | Giờ đến 11:00:00 nằm ngoài khung 00:00–08:00. |
| 881 | FL Routing Test 01 | 8559 | Giờ đến 12:00:00 nằm ngoài khung 00:00–08:00. |
| 881 | FL Routing Test 01 | 8560 | Giờ đến 13:00:00 nằm ngoài khung 00:00–08:00. |
| 881 | FL Routing Test 12 | 8562 | Giờ đến 09:00:00 nằm ngoài khung 00:00–08:00. |
| 881 | FL Routing Test 17 | 8565 | Giờ đến 12:00:00 nằm ngoài khung 00:00–08:00. |
| 881 | FL Routing Test 20 | 8570 | Giờ đến 11:00:00 nằm ngoài khung 00:00–08:00. |
| 881 | FL Routing Test 08 | 8571 | Giờ đến 12:00:00 nằm ngoài khung 00:00–08:00. |

## Job có kỹ thuật viên phụ cần kiểm tra thêm

| Rule | Customer | Job | Quan sát |
|---|---|---|---|
| 881 | FL Routing Test 13 | 8544 | Giờ đến 09:00:00 nằm ngoài khung 00:00–08:00. |

## Danh sách 30 job dùng để kiểm tra

| Customer | Mã customer | Job | Dịch vụ | Lịch được giao trước kiểm tra | Bắt đầu | Thời lượng |
|---|---|---|---|---|---|---:|
| FL Routing Test 10 | 15529 | 8543 | Bed Bug Heat Treatment | custom (32) | 2026-10-04T08:00:00+00:00 | 21 phút |
| FL Routing Test 13 | 15532 | 8544 | Flea & Tick Control | Lam (31) | 2026-10-04T09:00:00+00:00 | 39 phút |
| FL Routing Test 06 | 15525 | 8545 | Rodent Control & Exclusion | custom (32) | 2026-10-04T10:00:00+00:00 | 24 phút |
| FL Routing Test 03 | 15522 | 8546 | Termite Baiting & Monitoring | custom (32) | 2026-10-04T11:00:00+00:00 | 37 phút |
| FL Routing Test 16 | 15535 | 8547 | Mosquito Reduction Program | custom (32) | 2026-10-04T12:00:00+00:00 | 22 phút |
| FL Routing Test 16 | 15535 | 8548 | Quarterly Service | custom (32) | 2026-10-04T13:00:00+00:00 | 39 phút |
| FL Routing Test 15 | 15534 | 8549 | Eco-Friendly Pest Solutions | custom (32) | 2026-10-05T08:00:00+00:00 | 10 phút |
| FL Routing Test 18 | 15537 | 8550 | Preventative Monitoring & Maintenance | custom (32) | 2026-10-05T09:00:00+00:00 | 20 phút |
| FL Routing Test 09 | 15528 | 8551 | Flea & Tick Control | custom (32) | 2026-10-05T10:00:00+00:00 | 12 phút |
| FL Routing Test 07 | 15526 | 8552 | Call Back Service | custom (32) | 2026-10-05T11:00:00+00:00 | 12 phút |
| FL Routing Test 09 | 15528 | 8553 | Call Back Service | custom (32) | 2026-10-05T12:00:00+00:00 | 40 phút |
| FL Routing Test 11 | 15530 | 8554 | Eco-Friendly Pest Solutions | custom (32) | 2026-10-05T13:00:00+00:00 | 31 phút |
| FL Routing Test 13 | 15532 | 8555 | Rodent Control & Exclusion | custom (32) | 2026-10-06T08:00:00+00:00 | 20 phút |
| FL Routing Test 02 | 15521 | 8556 | General Pest Control | custom (32) | 2026-10-06T09:00:00+00:00 | 23 phút |
| FL Routing Test 04 | 15523 | 8557 | Quarterly Pest Control | custom (32) | 2026-10-06T10:00:00+00:00 | 11 phút |
| FL Routing Test 05 | 15524 | 8558 | Termite Baiting & Monitoring | custom (32) | 2026-10-06T11:00:00+00:00 | 21 phút |
| FL Routing Test 01 | 15520 | 8559 | Wasp Nest Removal | custom (32) | 2026-10-06T12:00:00+00:00 | 38 phút |
| FL Routing Test 01 | 15520 | 8560 | Eco-Friendly Pest Solutions | custom (32) | 2026-10-06T13:00:00+00:00 | 18 phút |
| FL Routing Test 06 | 15525 | 8561 | Call Back Service | custom (32) | 2026-10-07T08:00:00+00:00 | 40 phút |
| FL Routing Test 12 | 15531 | 8562 | Quarterly Pest Control | custom (32) | 2026-10-07T09:00:00+00:00 | 30 phút |
| FL Routing Test 19 | 15538 | 8563 | Initial Service | custom (32) | 2026-10-07T10:00:00+00:00 | 34 phút |
| FL Routing Test 14 | 15533 | 8564 | Eco-Friendly Pest Solutions | custom (32) | 2026-10-07T11:00:00+00:00 | 26 phút |
| FL Routing Test 17 | 15536 | 8565 | Wildlife Trapping & Relocation | custom (32) | 2026-10-07T12:00:00+00:00 | 37 phút |
| FL Routing Test 07 | 15526 | 8566 | Monthly Service | custom (32) | 2026-10-07T13:00:00+00:00 | 36 phút |
| FL Routing Test 08 | 15527 | 8567 | Termite Baiting & Monitoring | custom (32) | 2026-10-08T08:00:00+00:00 | 37 phút |
| FL Routing Test 02 | 15521 | 8568 | Every 21 Days | custom (32) | 2026-10-08T09:00:00+00:00 | 18 phút |
| FL Routing Test 14 | 15533 | 8569 | Mosquito Reduction Program | custom (32) | 2026-10-08T10:00:00+00:00 | 18 phút |
| FL Routing Test 20 | 15539 | 8570 | Rodent Control & Exclusion | custom (32) | 2026-10-08T11:00:00+00:00 | 19 phút |
| FL Routing Test 08 | 15527 | 8571 | Follow Up Inspections | custom (32) | 2026-10-08T12:00:00+00:00 | 19 phút |
| FL Routing Test 15 | 15534 | 8572 | Call Back Service | custom (32) | 2026-10-08T13:00:00+00:00 | 20 phút |

## Giới hạn và dữ liệu đối chiếu

- Trường trạng thái, nhãn khách hàng và khu vực có thể chưa đủ trong dữ liệu sự kiện. Các bộ lọc chưa kiểm chứng độc lập được ghi là thiếu bằng chứng.
- Ưu tiên kỹ thuật viên hoặc khung giờ mềm cần thông tin khả năng nhận việc và phương án thay thế. Không đạt ưu tiên chưa đủ kết luận lỗi.
- Thiếu dữ liệu chặng di chuyển hoặc khoảng cách sẽ giới hạn kết luận về đệm, tổng thời gian và quãng đường. Không lấy số liệu thiếu làm bằng chứng đạt.
- Số điều kiện đạt là số phép đối chiếu thành công; số job khác đối chứng không tự chứng minh rule hoạt động đúng.
- Rule khóa kết hợp yêu cầu khác không thể cùng thỏa trên lịch gốc được ghi là xung đột cần làm rõ, không tự tính là lỗi xác nhận.
- Nhật ký `balanced_exceptions` có thể ghi không xếp được job trong ngày và `on_fallback_day = true`. Theo xác nhận người dùng, fallback được miễn hard rule; các quan sát đó được lưu riêng, không tính vi phạm.
- File `original_rules.json` ghi trạng thái đầu đợt; `rule_details.json` ghi bộ lọc và hành động; `live_before.json` ghi 30 job gốc; `all_rules_off.json` là đối chứng; `rule_{id}_on.json` là từng lần bật; `audit_results.json` ghi tiến trình và khôi phục; `reviewed_results.json` là kết quả rà soát.

Đã rà soát 99 kết quả Sandbox của các rule bật thành công: phát hiện 0 sai khác về danh tính customer/job hoặc thời lượng so với lịch gốc.
