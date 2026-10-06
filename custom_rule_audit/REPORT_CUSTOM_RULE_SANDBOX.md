# Báo cáo kiểm tra bật/tắt quy tắc tùy chỉnh và kết quả Sandbox

> **Cập nhật sau đợt kiểm tra mới:** trạng thái rule đã được khôi phục và xác nhận. Toàn bộ 122 rule đã được thử lại với schedule custom; xem [báo cáo mới](C:/Users/nlsoft/Documents/ChatGPT/Mantis/custom_schedule_rule_audit/BAO_CAO_CUSTOM_RULE_TIENG_VIET.md). Phần dưới là kết quả lịch sử của đợt 43/120 rule.

> **Chưa hoàn tất kiểm tra và khôi phục trạng thái.** Phiên đăng nhập hết hạn, API trả HTTP 403 sau 43/120 quy tắc. Quy tắc **1112 cần bật lại**; quy tắc **871 cần tắt lại**, nhưng trạng thái hiện tại của 871 chưa xác nhận được. Cần phiên đăng nhập mới để khôi phục và kiểm tra tiếp 77 quy tắc.

Ngày kiểm tra: 03/10/2026. Kết quả dưới đây đến từ việc bật/tắt quy tắc và gọi API Sandbox thực tế. Tên dịch vụ, khách hàng, kỹ thuật viên và các ID được giữ theo hệ thống để dễ đối chiếu.

## Kết quả tổng hợp

| Kết luận | Số quy tắc |
|---|---:|
| Đạt trong phạm vi kiểm tra | 16 |
| Cần làm rõ xung đột | 1 |
| Có vi phạm | 18 |
| Ghi nhận ưu tiên mềm | 1 |
| Chưa đủ bằng chứng | 7 |

Đã hoàn tất **43/120 quy tắc**: 16 đạt các điều kiện bắt buộc có đủ dữ liệu, 18 có vi phạm, 1 ghi nhận ưu tiên mềm, 1 cần làm rõ xung đột và 7 chưa đủ bằng chứng. “Đạt” chỉ áp dụng cho phạm vi đã kiểm tra, không chứng minh toàn bộ bộ máy tối ưu đều đúng.

## Cách kiểm tra và trạng thái dữ liệu

- Ban đầu có 120 quy tắc: 119 tắt, chỉ quy tắc 1112 bật.
- Tắt các quy tắc để lấy kết quả đối chứng; sau đó bật riêng từng quy tắc, đọc lại trạng thái, chạy Sandbox, tắt và đọc lại trạng thái. Cả 43 quy tắc đã hoàn tất đều có xác nhận bật và tắt thành công.
- Đối chiếu với 83 sự kiện trên lịch thực tế chụp trước kiểm tra, gồm lịch 31 của Lam và lịch 32 của custom (Lam 1). Sandbox chạy cho khoảng 03–16/10/2026.
- Thiết lập hệ thống giữ nguyên: giờ dịch vụ 06:00–15:00, phạm vi 14 ngày, cho phép đổi kỹ thuật viên, thuật toán cân bằng. Giới hạn dịch chuyển và giữ kỳ ở cấp hệ thống đang tắt.
- Sự kiện 6811 / công việc 6815 đã hoàn tất và bị loại khỏi tối ưu tuyến trong kết quả đối chứng. Không dùng sự kiện này để kết luận sai về các điều kiện thay đổi lịch; vẫn kiểm tra riêng nếu thuộc phạm vi khóa hoặc loại trừ.
- Không gọi thao tác chấp nhận phương án Sandbox hoặc di chuyển công việc trên lịch thực tế trong đợt kiểm tra này. Lịch thực tế không đổi tại các lần kiểm tra sau trường hợp 15 và 30; chưa xác minh được lần cuối do hết hạn đăng nhập.

## Các quy tắc có vi phạm

Mỗi mục đưa tối đa 4 bằng chứng. Số vi phạm là số điều kiện bị vi phạm, không nhất thiết là số công việc riêng biệt hoặc số nguyên nhân lỗi độc lập. Giờ dưới đây giữ nguyên giá trị trong API; không chuyển sang múi giờ Florida.

### Quy tắc 1098

Dịch vụ: Call Back Service → Dịch chuyển tối đa 2 ngày

Có 14 sự kiện đủ điều kiện kiểm tra; phát hiện **1 vi phạm**. Mã lần tối ưu: `opt_sandbox_0e6c8a988b2f3b6c1cb13629cb7560a5`.

| Khách hàng | Công việc / sự kiện | Trước tối ưu | Sau khi bật quy tắc | Vi phạm |
|---|---|---|---|---|
| FL Routing Test 13 | 8527 / 8523 | 11/10/2026 15:00–11/10/2026 15:15 · lịch 31 | 07/10/2026 06:00–07/10/2026 06:15 · lịch 31 | Dịch chuyển 4 ngày, vượt giới hạn 2 ngày. |

### Quy tắc 898

Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu

Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên custom

Dịch vụ: Call Back Service → Là điểm dừng đầu tiên trong ngày

Có 14 sự kiện đủ điều kiện kiểm tra; phát hiện **2 vi phạm**. Mã lần tối ưu: `opt_sandbox_9d9625a101ece05c6634e612f46bac09`.

| Khách hàng | Công việc / sự kiện | Trước tối ưu | Sau khi bật quy tắc | Vi phạm |
|---|---|---|---|---|
| FL Routing Test 20 | 8542 / 8538 | 10/10/2026 18:15–10/10/2026 18:30 · lịch 31 | 12/10/2026 06:00–12/10/2026 06:15 · lịch 32 | Không giữ nguyên tuần ban đầu. |
| FL Routing Test 13 | 8527 / 8523 | 11/10/2026 15:00–11/10/2026 15:15 · lịch 31 | 08/10/2026 06:00–08/10/2026 06:15 · lịch 32 | Không giữ nguyên tuần ban đầu. |

### Quy tắc 1095

Dịch vụ: Call Back Service → Giữ nguyên ngày ban đầu

Dịch vụ: Call Back Service → Là điểm dừng đầu tiên trong ngày

Có 14 sự kiện đủ điều kiện kiểm tra; phát hiện **3 vi phạm**. Mã lần tối ưu: `opt_sandbox_c92af40384d8a444d3ec7d6080a40055`.

| Khách hàng | Công việc / sự kiện | Trước tối ưu | Sau khi bật quy tắc | Vi phạm |
|---|---|---|---|---|
| FL Routing Test 20 | 8542 / 8538 | 10/10/2026 18:15–10/10/2026 18:30 · lịch 31 | 15/10/2026 06:00–15/10/2026 06:15 · lịch 32 | Không giữ nguyên ngày ban đầu. |
| FL Routing Test 13 | 8527 / 8523 | 11/10/2026 15:00–11/10/2026 15:15 · lịch 31 | 08/10/2026 06:00–08/10/2026 06:15 · lịch 32 | Không giữ nguyên ngày ban đầu. |
| FL Routing Test 05 | 8508 / 8504 | 13/10/2026 05:00–13/10/2026 05:15 · lịch 31 | 14/10/2026 06:00–14/10/2026 06:15 · lịch 31 | Không giữ nguyên ngày ban đầu. |

### Quy tắc 1100

Dịch vụ: Call Back Service → Là điểm dừng cuối cùng trong ngày

Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu

Có 14 sự kiện đủ điều kiện kiểm tra; phát hiện **1 vi phạm**. Mã lần tối ưu: `opt_sandbox_a6f5e8058f72fc08cc8197a4fa894b6b`.

| Khách hàng | Công việc / sự kiện | Trước tối ưu | Sau khi bật quy tắc | Vi phạm |
|---|---|---|---|---|
| FL Routing Test 13 | 8527 / 8523 | 11/10/2026 15:00–11/10/2026 15:15 · lịch 31 | 08/10/2026 09:48–08/10/2026 10:03 · lịch 32 | Không giữ nguyên tuần ban đầu. |

### Quy tắc 998

Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu

Dịch vụ: Call Back Service → Là điểm dừng cuối cùng trong ngày

Dịch vụ: Call Back Service → Ưu tiên kỹ thuật viên custom

Có 14 sự kiện đủ điều kiện kiểm tra; phát hiện **1 vi phạm**. Mã lần tối ưu: `opt_sandbox_7ff7a972fade17584ee58494f58312d0`.

| Khách hàng | Công việc / sự kiện | Trước tối ưu | Sau khi bật quy tắc | Vi phạm |
|---|---|---|---|---|
| FL Routing Test 13 | 8527 / 8523 | 11/10/2026 15:00–11/10/2026 15:15 · lịch 31 | 08/10/2026 09:48–08/10/2026 10:03 · lịch 32 | Không giữ nguyên tuần ban đầu. |

### Quy tắc 863

Dịch vụ: Call Back Service → Giữ nguyên ngày ban đầu

Có 14 sự kiện đủ điều kiện kiểm tra; phát hiện **3 vi phạm**. Mã lần tối ưu: `opt_sandbox_86313b850cacf1263c6955889eb71b48`.

| Khách hàng | Công việc / sự kiện | Trước tối ưu | Sau khi bật quy tắc | Vi phạm |
|---|---|---|---|---|
| FL Routing Test 20 | 8542 / 8538 | 10/10/2026 18:15–10/10/2026 18:30 · lịch 31 | 11/10/2026 09:29–11/10/2026 09:44 · lịch 31 | Không giữ nguyên ngày ban đầu. |
| FL Routing Test 13 | 8527 / 8523 | 11/10/2026 15:00–11/10/2026 15:15 · lịch 31 | 09/10/2026 06:51–09/10/2026 07:06 · lịch 31 | Không giữ nguyên ngày ban đầu. |
| FL Routing Test 05 | 8508 / 8504 | 13/10/2026 05:00–13/10/2026 05:15 · lịch 31 | 12/10/2026 09:24–12/10/2026 09:39 · lịch 31 | Không giữ nguyên ngày ban đầu. |

### Quy tắc 897

Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu

Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên custom

Dịch vụ: Call Back Service → Là điểm dừng đầu tiên trong ngày

Có 14 sự kiện đủ điều kiện kiểm tra; phát hiện **2 vi phạm**. Mã lần tối ưu: `opt_sandbox_311d326440eae6c9c14cc481e9804135`.

| Khách hàng | Công việc / sự kiện | Trước tối ưu | Sau khi bật quy tắc | Vi phạm |
|---|---|---|---|---|
| FL Routing Test 20 | 8542 / 8538 | 10/10/2026 18:15–10/10/2026 18:30 · lịch 31 | 12/10/2026 06:00–12/10/2026 06:15 · lịch 32 | Không giữ nguyên tuần ban đầu. |
| FL Routing Test 13 | 8527 / 8523 | 11/10/2026 15:00–11/10/2026 15:15 · lịch 31 | 08/10/2026 06:00–08/10/2026 06:15 · lịch 32 | Không giữ nguyên tuần ban đầu. |

### Quy tắc 996

Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu

Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên custom

Dịch vụ: Call Back Service → Dịch chuyển tối đa 1 ngày

Có 14 sự kiện đủ điều kiện kiểm tra; phát hiện **4 vi phạm**. Mã lần tối ưu: `opt_sandbox_460975fce1c99a82ec698939a6b6d1b8`.

| Khách hàng | Công việc / sự kiện | Trước tối ưu | Sau khi bật quy tắc | Vi phạm |
|---|---|---|---|---|
| FL Routing Test 20 | 8542 / 8538 | 10/10/2026 18:15–10/10/2026 18:30 · lịch 31 | 15/10/2026 06:00–15/10/2026 06:15 · lịch 32 | Không giữ nguyên tuần ban đầu. |
| FL Routing Test 13 | 8527 / 8523 | 11/10/2026 15:00–11/10/2026 15:15 · lịch 31 | 08/10/2026 06:00–08/10/2026 06:15 · lịch 32 | Không giữ nguyên tuần ban đầu. |
| FL Routing Test 20 | 8542 / 8538 | 10/10/2026 18:15–10/10/2026 18:30 · lịch 31 | 15/10/2026 06:00–15/10/2026 06:15 · lịch 32 | Dịch chuyển 5 ngày, vượt giới hạn 1 ngày. |
| FL Routing Test 13 | 8527 / 8523 | 11/10/2026 15:00–11/10/2026 15:15 · lịch 31 | 08/10/2026 06:00–08/10/2026 06:15 · lịch 32 | Dịch chuyển 3 ngày, vượt giới hạn 1 ngày. |

### Quy tắc 1001

Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu

Dịch vụ: Call Back Service → Dịch chuyển tối đa 1 ngày

Dịch vụ: Call Back Service → Bắt buộc giờ đến trong 08:00–12:00

Có 14 sự kiện đủ điều kiện kiểm tra; phát hiện **2 vi phạm**. Mã lần tối ưu: `opt_sandbox_1cb377232282b45b1a9871211cb9ee58`.

| Khách hàng | Công việc / sự kiện | Trước tối ưu | Sau khi bật quy tắc | Vi phạm |
|---|---|---|---|---|
| FL Routing Test 13 | 8527 / 8523 | 11/10/2026 15:00–11/10/2026 15:15 · lịch 31 | 08/10/2026 08:00–08/10/2026 08:15 · lịch 31 | Không giữ nguyên tuần ban đầu. |
| FL Routing Test 13 | 8527 / 8523 | 11/10/2026 15:00–11/10/2026 15:15 · lịch 31 | 08/10/2026 08:00–08/10/2026 08:15 · lịch 31 | Dịch chuyển 3 ngày, vượt giới hạn 1 ngày. |

### Quy tắc 1002

Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu

Dịch vụ: Call Back Service → Dịch chuyển tối đa 1 ngày

Dịch vụ: Call Back Service → Là điểm dừng đầu tiên trong ngày

Có 14 sự kiện đủ điều kiện kiểm tra; phát hiện **2 vi phạm**. Mã lần tối ưu: `opt_sandbox_f58fb966e818a48b877ef875d4e072fe`.

| Khách hàng | Công việc / sự kiện | Trước tối ưu | Sau khi bật quy tắc | Vi phạm |
|---|---|---|---|---|
| FL Routing Test 13 | 8527 / 8523 | 11/10/2026 15:00–11/10/2026 15:15 · lịch 31 | 08/10/2026 06:00–08/10/2026 06:15 · lịch 31 | Không giữ nguyên tuần ban đầu. |
| FL Routing Test 13 | 8527 / 8523 | 11/10/2026 15:00–11/10/2026 15:15 · lịch 31 | 08/10/2026 06:00–08/10/2026 06:15 · lịch 31 | Dịch chuyển 3 ngày, vượt giới hạn 1 ngày. |

### Quy tắc 555

Dịch vụ: Call Back Service → Bắt buộc giờ đến trong 08:00–12:00

Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên Lam

Có 14 sự kiện đủ điều kiện kiểm tra; phát hiện **9 vi phạm**. Mã lần tối ưu: `opt_sandbox_aff519b874bdff60fd0bb7d491b31bcf`.

| Khách hàng | Công việc / sự kiện | Trước tối ưu | Sau khi bật quy tắc | Vi phạm |
|---|---|---|---|---|
| Minh | 3900 / 3896 | 04/10/2026 11:45–04/10/2026 12:00 · lịch 31 | 04/10/2026 08:15–04/10/2026 08:30 · lịch 32 | Kỹ thuật viên được giao không khớp yêu cầu: lam. |
| FL Routing Test 02 | 8503 / 8499 | 12/10/2026 08:45–12/10/2026 09:00 · lịch 31 | 04/10/2026 09:59–04/10/2026 10:14 · lịch 32 | Kỹ thuật viên được giao không khớp yêu cầu: lam. |
| FL Routing Test 13 | 8527 / 8523 | 11/10/2026 15:00–11/10/2026 15:15 · lịch 31 | 07/10/2026 08:21–07/10/2026 08:36 · lịch 32 | Kỹ thuật viên được giao không khớp yêu cầu: lam. |
| FL Routing Test 05 | 8508 / 8504 | 13/10/2026 05:00–13/10/2026 05:15 · lịch 31 | 12/10/2026 08:10–12/10/2026 08:25 · lịch 32 | Kỹ thuật viên được giao không khớp yêu cầu: lam. |

### Quy tắc 978

Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu

Dịch vụ: Call Back Service → Dịch chuyển tối đa 2 ngày

Dịch vụ: Call Back Service → Là điểm dừng cuối cùng trong ngày

Có 14 sự kiện đủ điều kiện kiểm tra; phát hiện **2 vi phạm**. Mã lần tối ưu: `opt_sandbox_f416e63561092ad47362f8c3c9c91e85`.

| Khách hàng | Công việc / sự kiện | Trước tối ưu | Sau khi bật quy tắc | Vi phạm |
|---|---|---|---|---|
| FL Routing Test 13 | 8527 / 8523 | 11/10/2026 15:00–11/10/2026 15:15 · lịch 31 | 08/10/2026 07:51–08/10/2026 08:06 · lịch 31 | Không giữ nguyên tuần ban đầu. |
| FL Routing Test 13 | 8527 / 8523 | 11/10/2026 15:00–11/10/2026 15:15 · lịch 31 | 08/10/2026 07:51–08/10/2026 08:06 · lịch 31 | Dịch chuyển 3 ngày, vượt giới hạn 2 ngày. |

### Quy tắc 1096

Dịch vụ: Call Back Service → Dịch chuyển tối đa 2 ngày

Dịch vụ: Call Back Service → Là điểm dừng đầu tiên trong ngày

Có 14 sự kiện đủ điều kiện kiểm tra; phát hiện **1 vi phạm**. Mã lần tối ưu: `opt_sandbox_2488d1495ae3282adbccd82ffd6eaa7c`.

| Khách hàng | Công việc / sự kiện | Trước tối ưu | Sau khi bật quy tắc | Vi phạm |
|---|---|---|---|---|
| FL Routing Test 13 | 8527 / 8523 | 11/10/2026 15:00–11/10/2026 15:15 · lịch 31 | 08/10/2026 06:00–08/10/2026 06:15 · lịch 31 | Dịch chuyển 3 ngày, vượt giới hạn 2 ngày. |

### Quy tắc 963

Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu

Dịch vụ: Call Back Service → Dịch chuyển tối đa 2 ngày

Có 14 sự kiện đủ điều kiện kiểm tra; phát hiện **2 vi phạm**. Mã lần tối ưu: `opt_sandbox_681583a90d973bd5609564b9f7df3822`.

| Khách hàng | Công việc / sự kiện | Trước tối ưu | Sau khi bật quy tắc | Vi phạm |
|---|---|---|---|---|
| FL Routing Test 13 | 8527 / 8523 | 11/10/2026 15:00–11/10/2026 15:15 · lịch 31 | 07/10/2026 06:00–07/10/2026 06:15 · lịch 31 | Không giữ nguyên tuần ban đầu. |
| FL Routing Test 13 | 8527 / 8523 | 11/10/2026 15:00–11/10/2026 15:15 · lịch 31 | 07/10/2026 06:00–07/10/2026 06:15 · lịch 31 | Dịch chuyển 4 ngày, vượt giới hạn 2 ngày. |

### Quy tắc 970

Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu

Dịch vụ: Call Back Service → Dịch chuyển tối đa 2 ngày

Có 14 sự kiện đủ điều kiện kiểm tra; phát hiện **2 vi phạm**. Mã lần tối ưu: `opt_sandbox_53320e99fd29573f10ba52b4e5c395ec`.

| Khách hàng | Công việc / sự kiện | Trước tối ưu | Sau khi bật quy tắc | Vi phạm |
|---|---|---|---|---|
| FL Routing Test 13 | 8527 / 8523 | 11/10/2026 15:00–11/10/2026 15:15 · lịch 31 | 07/10/2026 06:00–07/10/2026 06:15 · lịch 31 | Không giữ nguyên tuần ban đầu. |
| FL Routing Test 13 | 8527 / 8523 | 11/10/2026 15:00–11/10/2026 15:15 · lịch 31 | 07/10/2026 06:00–07/10/2026 06:15 · lịch 31 | Dịch chuyển 4 ngày, vượt giới hạn 2 ngày. |

### Quy tắc 983

Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu

Dịch vụ: Call Back Service → Là điểm dừng cuối cùng trong ngày

Có 14 sự kiện đủ điều kiện kiểm tra; phát hiện **1 vi phạm**. Mã lần tối ưu: `opt_sandbox_71ebad71a38527ceac850545b108e8bc`.

| Khách hàng | Công việc / sự kiện | Trước tối ưu | Sau khi bật quy tắc | Vi phạm |
|---|---|---|---|---|
| FL Routing Test 13 | 8527 / 8523 | 11/10/2026 15:00–11/10/2026 15:15 · lịch 31 | 08/10/2026 09:48–08/10/2026 10:03 · lịch 32 | Không giữ nguyên tuần ban đầu. |

### Quy tắc 911

Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu

Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên Lam 1

Có 14 sự kiện đủ điều kiện kiểm tra; phát hiện **2 vi phạm**. Mã lần tối ưu: `opt_sandbox_122f51f826f8ee80eb3295f1ac32ee0b`.

| Khách hàng | Công việc / sự kiện | Trước tối ưu | Sau khi bật quy tắc | Vi phạm |
|---|---|---|---|---|
| FL Routing Test 20 | 8542 / 8538 | 10/10/2026 18:15–10/10/2026 18:30 · lịch 31 | 15/10/2026 06:00–15/10/2026 06:15 · lịch 32 | Không giữ nguyên tuần ban đầu. |
| FL Routing Test 13 | 8527 / 8523 | 11/10/2026 15:00–11/10/2026 15:15 · lịch 31 | 08/10/2026 06:00–08/10/2026 06:15 · lịch 32 | Không giữ nguyên tuần ban đầu. |

### Quy tắc 952

Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu

Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên custom

Có 14 sự kiện đủ điều kiện kiểm tra; phát hiện **2 vi phạm**. Mã lần tối ưu: `opt_sandbox_a2fa3112eecb0794cfbf1ab09a3579a2`.

| Khách hàng | Công việc / sự kiện | Trước tối ưu | Sau khi bật quy tắc | Vi phạm |
|---|---|---|---|---|
| FL Routing Test 20 | 8542 / 8538 | 10/10/2026 18:15–10/10/2026 18:30 · lịch 31 | 15/10/2026 06:00–15/10/2026 06:15 · lịch 32 | Không giữ nguyên tuần ban đầu. |
| FL Routing Test 13 | 8527 / 8523 | 11/10/2026 15:00–11/10/2026 15:15 · lịch 31 | 08/10/2026 06:00–08/10/2026 06:15 · lịch 32 | Không giữ nguyên tuần ban đầu. |

## Chi tiết 43 quy tắc đã kiểm tra

“Đủ điều kiện” là số sự kiện xác định được phạm vi áp dụng. “Điều kiện đã kiểm” là số phép đối chiếu. “Khác đối chứng” là số vị trí lịch thay đổi so với kết quả khi tắt quy tắc; số này không thể tự chứng minh quy tắc hoạt động đúng.

| ID | Phạm vi và yêu cầu | Kết luận | Đủ điều kiện | Điều kiện đã kiểm | Vi phạm | Khác đối chứng | Ghi chú |
|---|---|---|---:|---:|---:|---:|---|
| 1097 | Dịch vụ: Call Back Service → Là điểm dừng cuối cùng trong ngày | Đạt trong phạm vi kiểm tra | 14 | 14 | 0 | 76 | Đã xác nhận bật/tắt |
| 1055 | Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên Lam 1 | Đạt trong phạm vi kiểm tra | 14 | 14 | 0 | 74 | Đã xác nhận bật/tắt |
| 961 | Dịch vụ: Call Back Service → Khóa ngày, giờ và kỹ thuật viên<br>Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên custom | Cần làm rõ xung đột | 15 | 15 | 0 | 81 | 14 trường hợp có xung đột giữa khóa lịch và yêu cầu khác; chưa kết luận lỗi |
| 956 | Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên custom<br>Dịch vụ: Call Back Service → Bắt buộc giờ đến trong 08:00–18:00 | Đạt trong phạm vi kiểm tra | 14 | 28 | 0 | 71 | Đã xác nhận bật/tắt |
| 867 | Dịch vụ: Call Back Service → Bắt buộc giờ đến trong 08:00–14:00 | Đạt trong phạm vi kiểm tra | 14 | 14 | 0 | 75 | Đã xác nhận bật/tắt |
| 966 | Dịch vụ: Call Back Service → Giữ nguyên tháng ban đầu<br>Dịch vụ: Call Back Service → Bắt buộc giờ đến trong 09:00–12:00 | Đạt trong phạm vi kiểm tra | 14 | 28 | 0 | 70 | Đã xác nhận bật/tắt |
| 1098 | Dịch vụ: Call Back Service → Dịch chuyển tối đa 2 ngày | Có vi phạm | 14 | 13 | 1 | 75 | Đã xác nhận bật/tắt |
| 1052 | Dịch vụ: Call Back Service → Dịch chuyển tối đa 6 ngày | Đạt trong phạm vi kiểm tra | 14 | 14 | 0 | 70 | Đã xác nhận bật/tắt |
| 1051 | Dịch vụ: Call Back Service → Dịch chuyển tối đa 5 ngày | Đạt trong phạm vi kiểm tra | 14 | 14 | 0 | 52 | Đã xác nhận bật/tắt |
| 898 | Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu<br>Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên custom<br>Dịch vụ: Call Back Service → Là điểm dừng đầu tiên trong ngày | Có vi phạm | 14 | 34 | 2 | 79 | Thiếu sự kiện trong kết quả: 7037, 7038, 7037, 7038, 7037, 7038 |
| 1099 | Dịch vụ: Call Back Service → Là điểm dừng đầu tiên trong ngày<br>Dịch vụ: Call Back Service → Dịch chuyển tối đa 5 ngày | Đạt trong phạm vi kiểm tra | 14 | 28 | 0 | 72 | Đã xác nhận bật/tắt |
| 1095 | Dịch vụ: Call Back Service → Giữ nguyên ngày ban đầu<br>Dịch vụ: Call Back Service → Là điểm dừng đầu tiên trong ngày | Có vi phạm | 14 | 19 | 3 | 78 | Thiếu sự kiện trong kết quả: 3896, 3737, 3912, 3896, 3737, 3912 |
| 1100 | Dịch vụ: Call Back Service → Là điểm dừng cuối cùng trong ngày<br>Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu | Có vi phạm | 14 | 27 | 1 | 70 | Đã xác nhận bật/tắt |
| 1005 | Dịch vụ: Call Back Service → Loại khỏi tối ưu tuyến | Đạt trong phạm vi kiểm tra | 15 | 15 | 0 | 78 | Đã xác nhận bật/tắt |
| 998 | Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu<br>Dịch vụ: Call Back Service → Là điểm dừng cuối cùng trong ngày<br>Dịch vụ: Call Back Service → Ưu tiên kỹ thuật viên custom | Có vi phạm | 14 | 27 | 1 | 70 | Cần dữ liệu về khả năng nhận việc và phương án thay thế để đánh giá ưu tiên kỹ thuật viên |
| 557 | Dịch vụ: Call Back Service → Loại khỏi tối ưu tuyến | Đạt trong phạm vi kiểm tra | 15 | 15 | 0 | 78 | Đã xác nhận bật/tắt |
| 863 | Dịch vụ: Call Back Service → Giữ nguyên ngày ban đầu | Có vi phạm | 14 | 11 | 3 | 65 | Đã xác nhận bật/tắt |
| 1000 | Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu<br>Dịch vụ: Call Back Service → Khóa ngày, giờ và kỹ thuật viên<br>Dịch vụ: Call Back Service → Ưu tiên kỹ thuật viên Lam 1 | Ghi nhận ưu tiên mềm | 15 | 29 | 0 | 81 | Cần dữ liệu về khả năng nhận việc và phương án thay thế để đánh giá ưu tiên kỹ thuật viên |
| 897 | Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu<br>Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên custom<br>Dịch vụ: Call Back Service → Là điểm dừng đầu tiên trong ngày | Có vi phạm | 14 | 34 | 2 | 79 | Thiếu sự kiện trong kết quả: 7037, 7038, 7037, 7038, 7037, 7038 |
| 996 | Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu<br>Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên custom<br>Dịch vụ: Call Back Service → Dịch chuyển tối đa 1 ngày | Có vi phạm | 14 | 38 | 4 | 77 | Đã xác nhận bật/tắt |
| 1001 | Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu<br>Dịch vụ: Call Back Service → Dịch chuyển tối đa 1 ngày<br>Dịch vụ: Call Back Service → Bắt buộc giờ đến trong 08:00–12:00 | Có vi phạm | 14 | 40 | 2 | 71 | Đã xác nhận bật/tắt |
| 1002 | Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu<br>Dịch vụ: Call Back Service → Dịch chuyển tối đa 1 ngày<br>Dịch vụ: Call Back Service → Là điểm dừng đầu tiên trong ngày | Có vi phạm | 14 | 34 | 2 | 79 | Thiếu sự kiện trong kết quả: 3896, 3912, 3896, 3912, 3896, 3912 |
| 555 | Dịch vụ: Call Back Service → Bắt buộc giờ đến trong 08:00–12:00<br>Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên Lam | Có vi phạm | 14 | 19 | 9 | 70 | Đã xác nhận bật/tắt |
| 978 | Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu<br>Dịch vụ: Call Back Service → Dịch chuyển tối đa 2 ngày<br>Dịch vụ: Call Back Service → Là điểm dừng cuối cùng trong ngày | Có vi phạm | 14 | 40 | 2 | 79 | Đã xác nhận bật/tắt |
| 1096 | Dịch vụ: Call Back Service → Dịch chuyển tối đa 2 ngày<br>Dịch vụ: Call Back Service → Là điểm dừng đầu tiên trong ngày | Có vi phạm | 14 | 27 | 1 | 81 | Đã xác nhận bật/tắt |
| 864 | Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên custom | Đạt trong phạm vi kiểm tra | 14 | 14 | 0 | 74 | Đã xác nhận bật/tắt |
| 695 | Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên Lam 1 | Đạt trong phạm vi kiểm tra | 14 | 14 | 0 | 74 | Đã xác nhận bật/tắt |
| 865 | Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên custom | Đạt trong phạm vi kiểm tra | 14 | 14 | 0 | 74 | Đã xác nhận bật/tắt |
| 1106 | Dịch vụ: Call Back Service → Bắt buộc giờ đến trong 08:00–14:00 | Đạt trong phạm vi kiểm tra | 14 | 14 | 0 | 75 | Đã xác nhận bật/tắt |
| 801 | Dịch vụ: Call Back Service → Bắt buộc giờ đến trong 08:00–12:00 | Đạt trong phạm vi kiểm tra | 14 | 14 | 0 | 70 | Đã xác nhận bật/tắt |
| 779 | Dịch vụ: Call Back Service → Bắt buộc giờ đến trong 08:00–15:00 | Đạt trong phạm vi kiểm tra | 14 | 14 | 0 | 70 | Đã xác nhận bật/tắt |
| 963 | Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu<br>Dịch vụ: Call Back Service → Dịch chuyển tối đa 2 ngày | Có vi phạm | 14 | 26 | 2 | 75 | Đã xác nhận bật/tắt |
| 970 | Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu<br>Dịch vụ: Call Back Service → Dịch chuyển tối đa 2 ngày | Có vi phạm | 14 | 26 | 2 | 75 | Đã xác nhận bật/tắt |
| 983 | Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu<br>Dịch vụ: Call Back Service → Là điểm dừng cuối cùng trong ngày | Có vi phạm | 14 | 27 | 1 | 70 | Đã xác nhận bật/tắt |
| 911 | Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu<br>Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên Lam 1 | Có vi phạm | 14 | 26 | 2 | 70 | Đã xác nhận bật/tắt |
| 952 | Dịch vụ: Call Back Service → Giữ nguyên tuần ban đầu<br>Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên custom | Có vi phạm | 14 | 26 | 2 | 70 | Đã xác nhận bật/tắt |
| 881 | Tất cả công việc → Bắt buộc giờ đến trong 00:00–08:00 | Chưa đủ bằng chứng | 81 | 66 | 0 | 62 | Thiếu sự kiện trong kết quả: 8512, 8536, 8537, 6764, 8538, 8519, 8520, 8521, 8522, 8526, 8528, 8529, 8507, 8509, 7040 |
| 880 | Trạng thái: Confirmed → Thêm đệm di chuyển 120 phút | Chưa đủ bằng chứng | 0 | 0 | 0 | 80 | Thiếu trường trạng thái để xác nhận phạm vi áp dụng; Không có sự kiện phù hợp hoặc chưa xác định được phạm vi |
| 1010 | Trạng thái: Confirmed → Khóa ngày, giờ và kỹ thuật viên | Chưa đủ bằng chứng | 0 | 0 | 0 | 81 | Thiếu trường trạng thái để xác nhận phạm vi áp dụng; Không có sự kiện phù hợp hoặc chưa xác định được phạm vi |
| 1006 | Trạng thái: Confirmed → Khóa ngày, giờ và kỹ thuật viên<br>Trạng thái: Reschedule → Loại khỏi tối ưu tuyến vào thứ Sáu | Chưa đủ bằng chứng | 0 | 0 | 0 | 81 | Thiếu trường trạng thái để xác nhận phạm vi áp dụng; Không có sự kiện phù hợp hoặc chưa xác định được phạm vi |
| 955 | Trạng thái: Confirmed → Bắt buộc giao cho kỹ thuật viên custom<br>Trạng thái: Confirmed → Dịch chuyển tối đa 1 ngày | Chưa đủ bằng chứng | 0 | 0 | 0 | 81 | Thiếu trường trạng thái để xác nhận phạm vi áp dụng; Không có sự kiện phù hợp hoặc chưa xác định được phạm vi |
| 879 | Trạng thái: Confirmed → Thêm đệm di chuyển 120 phút | Chưa đủ bằng chứng | 0 | 0 | 0 | 80 | Thiếu trường trạng thái để xác nhận phạm vi áp dụng; Không có sự kiện phù hợp hoặc chưa xác định được phạm vi |
| 957 | Trạng thái: Confirmed → Dịch chuyển tối đa 2 ngày<br>Trạng thái: Confirmed → Bắt buộc giao cho kỹ thuật viên custom | Chưa đủ bằng chứng | 0 | 0 | 0 | 76 | Thiếu trường trạng thái để xác nhận phạm vi áp dụng; Không có sự kiện phù hợp hoặc chưa xác định được phạm vi |

Quy tắc 961 kết hợp bắt buộc giao cho custom và khóa lịch: 14 trường hợp giữ kỹ thuật viên cũ thay vì đổi sang custom. Vì hai yêu cầu có thể mâu thuẫn trên lịch ban đầu, kết quả được ghi là cần làm rõ thứ tự ưu tiên, chưa tính vào 18 quy tắc có vi phạm xác nhận.

## 77 quy tắc chưa hoàn tất

Các mục dưới đây chưa có kết luận về hoạt động đúng/sai. Quy tắc 871 bị ngắt trong quá trình kiểm tra; các quy tắc còn lại chưa chạy do phiên đăng nhập hết hạn.

| ID | Phạm vi và yêu cầu | Trạng thái kiểm tra |
|---|---|---|
| 871 | Trạng thái: Confirmed → Loại khỏi tối ưu tuyến | Bị ngắt; chưa xác nhận trạng thái bật/tắt |
| 997 | Trạng thái: Confirmed → Giữ nguyên tuần ban đầu<br>Trạng thái: Confirmed → Bắt buộc giao cho kỹ thuật viên custom<br>Trạng thái: Confirmed → Là điểm dừng đầu tiên trong ngày | Chưa kiểm tra |
| 928 | Trạng thái: Confirmed - test → Là điểm dừng cuối cùng trong ngày | Chưa kiểm tra |
| 1081 | Khách hàng: enzo, Clark Kent → Loại khỏi tối ưu tuyến vào thứ Ba | Chưa kiểm tra |
| 1083 | Ngày dịch vụ: 2026-10-06; đồng thời Khách hàng: enzo, Clark Kent → Loại khỏi tối ưu tuyến | Chưa kiểm tra |
| 1024 | Khách hàng: messi → Là điểm dừng cuối cùng trong ngày | Chưa kiểm tra |
| 1084 | Ngày dịch vụ: 2026-10-06; hoặc Khách hàng: enzo, Clark Kent → Loại khỏi tối ưu tuyến | Chưa kiểm tra |
| 1074 | Khách hàng: enzo → Giữ nguyên ngày ban đầu<br>Khách hàng: enzo → Bắt buộc giờ đến trong 12:00–15:00 | Chưa kiểm tra |
| 1072 | Dịch vụ: Every 21 Days → Giữ nguyên ngày ban đầu | Chưa kiểm tra |
| 1089 | Dịch vụ: Every 21 Days → Là điểm dừng đầu tiên trong ngày | Chưa kiểm tra |
| 868 | Dịch vụ: Every 21 Days → Là điểm dừng đầu tiên trong ngày | Chưa kiểm tra |
| 1049 | Dịch vụ: Every 21 Days → Là điểm dừng cuối cùng trong ngày | Chưa kiểm tra |
| 869 | Dịch vụ: Every 21 Days → Là điểm dừng cuối cùng trong ngày | Chưa kiểm tra |
| 1085 | Dịch vụ: Every 21 Days → Là điểm dừng cuối cùng trong ngày | Chưa kiểm tra |
| 1087 | Dịch vụ: Every 21 Days → Là điểm dừng cuối cùng trong ngày | Chưa kiểm tra |
| 960 | Dịch vụ: Every 21 Days → Ưu tiên kỹ thuật viên custom<br>Dịch vụ: Every 21 Days → Là điểm dừng cuối cùng trong ngày | Chưa kiểm tra |
| 959 | Dịch vụ: Every 21 Days → Ưu tiên kỹ thuật viên custom<br>Dịch vụ: Every 21 Days → Là điểm dừng đầu tiên trong ngày | Chưa kiểm tra |
| 958 | Dịch vụ: Every 21 Days → Ưu tiên kỹ thuật viên custom<br>Dịch vụ: Every 21 Days → Bắt buộc giờ đến trong 08:00–12:00 | Chưa kiểm tra |
| 984 | Dịch vụ: Every 21 Days → Dịch chuyển tối đa 2 ngày<br>Dịch vụ: Every 21 Days → Là điểm dừng đầu tiên trong ngày | Chưa kiểm tra |
| 973 | Dịch vụ: Every 21 Days → Dịch chuyển tối đa 2 ngày<br>Dịch vụ: Every 21 Days → Là điểm dừng đầu tiên trong ngày | Chưa kiểm tra |
| 1101 | Dịch vụ: Every 21 Days → Dịch chuyển tối đa 5 ngày<br>Dịch vụ: Every 21 Days → Loại khỏi tối ưu tuyến | Chưa kiểm tra |
| 972 | Dịch vụ: Every 21 Days → Giữ nguyên tuần ban đầu<br>Dịch vụ: Every 21 Days → Khóa ngày, giờ và kỹ thuật viên | Chưa kiểm tra |
| 954 | Dịch vụ: Every 21 Days → Giữ nguyên ngày ban đầu<br>Dịch vụ: Every 21 Days → Bắt buộc giao cho kỹ thuật viên custom | Chưa kiểm tra |
| 890 | Trạng thái: Confirmed → Loại khỏi tối ưu tuyến | Chưa kiểm tra |
| 910 | Dịch vụ: Every 21 Days → Loại khỏi tối ưu tuyến | Chưa kiểm tra |
| 1082 | Ngày dịch vụ: 2026-10-06; hoặc Khách hàng: enzo, Clark Kent → Loại khỏi tối ưu tuyến | Chưa kiểm tra |
| 1103 | Tất cả công việc → Dịch chuyển tối đa 2 ngày | Chưa kiểm tra |
| 907 | Tất cả công việc → Dịch chuyển tối đa 3 ngày | Chưa kiểm tra |
| 866 | Tất cả công việc → Dịch chuyển tối đa 1 ngày | Chưa kiểm tra |
| 1056 | Dịch vụ: Call Back Service → Bắt buộc giao cho kỹ thuật viên Lam 1<br>Dịch vụ: Bed Bug Heat Treatment, Bi-Monthly Service, Eco-Friendly Pest Solutions, Every 21 Days, Flea & Tick Control, Follow Up Inspections, General Pest Control, Initial Service, Monthly Service, Mosquito Reduction Program, Preventative Monitoring & Maintenance, Quarterly Pest Control, Quarterly Service, Rodent Control & Exclusion, Termite Baiting & Monitoring, Wasp Nest Removal, Wildlife Trapping & Relocation → Loại khỏi tối ưu tuyến đối với kỹ thuật viên Lam 1 | Chưa kiểm tra |
| 1112 | Kỹ thuật viên: Lam 1 → Dịch chuyển tối đa 2 ngày | Chưa kiểm tra |
| 922 | Kỹ thuật viên: Lam 1 → Bắt buộc giờ đến trong 08:00–12:00 | Chưa kiểm tra |
| 909 | Kỹ thuật viên: Lam 1 → Giữ nguyên ngày ban đầu | Chưa kiểm tra |
| 1086 | Kỹ thuật viên: Lam 1 → Khóa ngày, giờ và kỹ thuật viên | Chưa kiểm tra |
| 921 | Kỹ thuật viên: Lam 1 → Khóa ngày, giờ và kỹ thuật viên | Chưa kiểm tra |
| 882 | Kỹ thuật viên: Lam Test → Dịch chuyển tối đa 1 ngày | Chưa kiểm tra |
| 895 | Kỹ thuật viên: Lam Test → Tổng thời gian di chuyển mỗi ca tối đa 30 phút | Chưa kiểm tra |
| 884 | Kỹ thuật viên: Lam → Bắt buộc giờ đến trong 00:00–08:00 | Chưa kiểm tra |
| 883 | Kỹ thuật viên: Lam Test → Bắt buộc giờ đến trong 08:00–12:00 | Chưa kiểm tra |
| 1040 | Kỹ thuật viên: Lam Test → Dịch chuyển tối đa 2 ngày | Chưa kiểm tra |
| 1076 | Kỹ thuật viên: Lam Test → Giữ nguyên ngày ban đầu<br>Kỹ thuật viên: Lam Test → Bắt buộc giờ đến trong 12:00–15:00 | Chưa kiểm tra |
| 894 | Kỹ thuật viên: Lam Test → Dịch chuyển tối đa 1 ngày | Chưa kiểm tra |
| 886 | Kỹ thuật viên: Lam Test → Tổng thời gian di chuyển mỗi ca tối đa 240 phút | Chưa kiểm tra |
| 1014 | Kỹ thuật viên: Technician: Lam Test - nickname: Lam → Bắt buộc giờ đến trong 08:00–12:00 | Chưa kiểm tra |
| 888 | Kỹ thuật viên: Lam Test → Tổng quãng đường di chuyển tối đa 30 dặm | Chưa kiểm tra |
| 889 | Tất cả công việc → Loại khỏi tối ưu tuyến vào thứ Ba đối với kỹ thuật viên Lam | Chưa kiểm tra |
| 885 | Kỹ thuật viên: Lam Test → Loại khỏi tối ưu tuyến vào thứ Ba | Chưa kiểm tra |
| 913 | Tất cả công việc → Loại khỏi tối ưu tuyến vào thứ Tư đối với kỹ thuật viên Lam Test | Chưa kiểm tra |
| 1004 | Dịch vụ: Call Back Service → Khóa ngày, giờ và kỹ thuật viên | Chưa kiểm tra |
| 870 | Dịch vụ: Call Back Service → Khóa ngày, giờ và kỹ thuật viên | Chưa kiểm tra |
| 1019 | Trạng thái: Confirmed → Khóa ngày, giờ và kỹ thuật viên | Chưa kiểm tra |
| 1020 | Trạng thái: Reschedule → Khóa ngày, giờ và kỹ thuật viên | Chưa kiểm tra |
| 802 | Dịch vụ: Initial Service → Bắt buộc giờ đến trong 08:00–15:00 | Chưa kiểm tra |
| 1025 | Khách hàng: Messi → Bắt buộc giao cho kỹ thuật viên Lam 1 | Chưa kiểm tra |
| 1023 | Khách hàng: Messi → Bắt buộc giờ đến trong 08:00–09:00<br>Khách hàng: Messi → Bắt buộc giao cho kỹ thuật viên Lam Test | Chưa kiểm tra |
| 953 | Dịch vụ: Monthly Service → Giữ nguyên ngày ban đầu<br>Dịch vụ: Monthly Service → Bắt buộc giao cho kỹ thuật viên custom | Chưa kiểm tra |
| 1022 | Khách hàng: Nami → Bắt buộc giao cho kỹ thuật viên Lam Test<br>Khách hàng: Nami → Bắt buộc giờ đến trong 08:00–09:00 | Chưa kiểm tra |
| 975 | Dịch vụ: Quarterly Service → Dịch chuyển tối đa 3 ngày<br>Dịch vụ: Quarterly Service → Là điểm dừng cuối cùng trong ngày<br>Dịch vụ: Call Back Service → Dịch chuyển tối đa 3 ngày<br>Dịch vụ: Call Back Service → Là điểm dừng cuối cùng trong ngày | Chưa kiểm tra |
| 793 | Trạng thái: Recurrence → Bắt buộc giờ đến trong 08:00–12:00 | Chưa kiểm tra |
| 794 | Trạng thái: Recurrence → Bắt buộc giờ đến trong 08:00–12:00 | Chưa kiểm tra |
| 1029 | Khu vực: Region 2 → Là điểm dừng cuối cùng trong ngày | Chưa kiểm tra |
| 1031 | Khu vực: Region 2 → Loại khỏi tối ưu tuyến vào thứ Sáu | Chưa kiểm tra |
| 1034 | Khu vực: Region 2 → Bắt buộc giao cho kỹ thuật viên custom | Chưa kiểm tra |
| 1030 | Khu vực: Region 2 → Loại khỏi tối ưu tuyến | Chưa kiểm tra |
| 1032 | Khu vực: Region 2 → Loại khỏi tối ưu tuyến vào Chủ nhật | Chưa kiểm tra |
| 1033 | Trạng thái: Reschedule → Là điểm dừng cuối cùng trong ngày | Chưa kiểm tra |
| 906 | Tất cả công việc → Dịch chuyển tối đa 0 ngày | Chưa kiểm tra |
| 896 | Kỹ thuật viên: Lam Test → Bắt buộc giờ đến trong 00:00–10:00 | Chưa kiểm tra |
| 1041 | Kỹ thuật viên: Lam Test; đồng thời Ngày dịch vụ: 2026-10-03 → Khóa ngày, giờ và kỹ thuật viên | Chưa kiểm tra |
| 887 | Kỹ thuật viên: Lam Test → Dịch chuyển tối đa 0 ngày | Chưa kiểm tra |
| 1017 | Trạng thái: Unconfirmed → Bắt buộc giờ đến trong 08:00–12:00 | Chưa kiểm tra |
| 1060 | Trạng thái: Unconfirmed → Bắt buộc giao cho kỹ thuật viên Lam 1<br>Trạng thái: Confirmed, Completed, Reschedule, Pending Confirmation, Canceled, Pending Booking, Terminate Service, Confirmed - test → Loại khỏi tối ưu tuyến đối với kỹ thuật viên Lam 1 | Chưa kiểm tra |
| 878 | Tất cả công việc → Thêm đệm di chuyển 10 phút | Chưa kiểm tra |
| 1110 | Tất cả công việc → Bắt buộc giờ đến trong 08:00–12:00 | Chưa kiểm tra |
| 808 | Nhãn khách hàng: VIP → Loại khỏi tối ưu tuyến | Chưa kiểm tra |
| 807 | Nhãn khách hàng: VIP → Khóa ngày, giờ và kỹ thuật viên | Chưa kiểm tra |
| 908 | Kỹ thuật viên: Lam → Loại khỏi tối ưu tuyến vào thứ Tư | Chưa kiểm tra |

## Tra cứu khách hàng của các công việc có vi phạm

Bảng này gồm tất cả công việc có vi phạm xác nhận, kể cả những công việc không nằm trong 4 ví dụ của từng quy tắc ở trên.

| Khách hàng | Mã khách hàng | Công việc | Sự kiện | Dịch vụ | Quy tắc có vi phạm |
|---|---|---|---|---|---|
| Minh | 14783 | 3899 | 3895 | Call Back Service | 555 |
| Minh | 14783 | 3900 | 3896 | Call Back Service | 555 |
| Minh | 14783 | 3916 | 3912 | Call Back Service | 555 |
| FL Routing Test 02 | 15521 | 8503 | 8499 | Call Back Service | 555 |
| FL Routing Test 05 | 15524 | 8508 | 8504 | Call Back Service | 555, 863, 1095 |
| FL Routing Test 05 | 15524 | 8509 | 8505 | Call Back Service | 555 |
| FL Routing Test 08 | 15527 | 8514 | 8510 | Call Back Service | 555 |
| FL Routing Test 13 | 15532 | 8527 | 8523 | Call Back Service | 555, 863, 897, 898, 911, 952, 963, 970, 978, 983, 996, 998, 1001, 1002, 1095, 1096, 1098, 1100 |
| FL Routing Test 16 | 15535 | 8534 | 8530 | Call Back Service | 555 |
| FL Routing Test 20 | 15539 | 8542 | 8538 | Call Back Service | 863, 897, 898, 911, 952, 996, 1095 |

## Giới hạn của kết luận

- Kết quả API không có nhật ký giải thích từng quy tắc được áp dụng. Đối chiếu dựa trên lịch thực tế chụp ngay trước kiểm tra và kết quả Sandbox; không dùng bản HAR cũ làm lịch gốc.
- Dữ liệu sự kiện chưa đủ tên trạng thái, nhãn khách hàng và khu vực để kiểm chứng độc lập các bộ lọc này. Không tự suy đoán từ mã số trạng thái.
- Khung giờ bắt buộc được kiểm theo giờ bắt đầu đến khách hàng. Yêu cầu toàn bộ thời lượng công việc nằm trong khung giờ cần được kiểm riêng.
- Tuần được tính từ Chủ nhật đến thứ Bảy. Giới hạn dịch chuyển tính theo độ lệch ngày tuyệt đối. Khóa lịch phải giữ ngày, giờ và kỹ thuật viên; trường hợp khóa mâu thuẫn với yêu cầu khác cần làm rõ thứ tự ưu tiên.
- Điểm dừng đầu/cuối được đối chiếu theo giờ trên cùng lịch và ngày, gồm cả sự kiện cố định hiển thị. Nhiều công việc cùng yêu cầu đầu/cuối ngày có thể cần đổi ngày hoặc báo không xếp được.
- Khoảng trống nhỏ hơn thời gian đệm đã đủ chứng minh vi phạm; khoảng trống lớn hơn chưa đủ chứng minh đạt nếu thiếu thời gian di chuyển thực tế. Giới hạn tổng thời gian di chuyển cần tính cả chặng xuất phát và quay về. Giới hạn quãng đường cần dữ liệu khoảng cách tuyến.
- Ưu tiên mềm cần dữ liệu khả năng nhận việc và phương án thay thế. Được giao sang kỹ thuật viên khác không tự động là lỗi.
- Dùng chung một kết quả đối chứng khi tắt quy tắc. Các lần tối ưu chưa được lặp lại để loại hết khả năng bộ giải sinh phương án khác nhau.
- Hệ thống hiện không có yêu cầu giữ đúng 10 công việc/ngày trong thiết lập quy tắc; Sandbox phân bổ khác 10/ngày không tự động là lỗi.

## Dữ liệu bằng chứng

| Tệp | Nội dung |
|---|---|
| `original_rules.json` | Danh sách và trạng thái ban đầu |
| `rule_details.json` | Điều kiện và hành động thực thi của 120 quy tắc |
| `system_snapshot.json` | Thiết lập tối ưu ở cấp hệ thống |
| `live_before.json` | Lịch thực tế trước kiểm tra |
| `all_rules_off.json` | Kết quả đối chứng khi tắt quy tắc |
| `rule_{id}_on.json` | Kết quả Sandbox khi bật từng quy tắc |
| `audit_results.json` | Nhật ký kiểm tra và trạng thái khôi phục |
| `reviewed_results.json` | Kết quả sau rà soát phạm vi áp dụng và xung đột |

**Việc cần tiếp tục:** dùng phiên đăng nhập mới, bật lại 1112, tắt 871 và xác nhận trạng thái; sau đó kiểm tra 77 quy tắc còn lại và xác minh lịch thực tế lần cuối.
