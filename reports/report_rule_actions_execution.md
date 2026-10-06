# BÁO CÁO KẾ HOẠCH VÀ THỰC THI KIỂM THỬ RULE ACTIONS (SANDBOX VS CALENDAR)

**Dự án:** Mantis AI Routing Engine  
**Môi trường:** Live UI (`r2.gdesk.io`) & Live API (`apiv2.gdesk.io`)  
**Tài khoản:** `lamlam@gmail.com`  
**Thời gian thực thi:** 06/10/2026  

---

## I. MỤC TIÊU VÀ QUY TRÌNH KIỂM THỬ 9 RULE ACTIONS

Hệ thống tiến hành kiểm thử toàn bộ 9 hành vi Custom Rule chính với các nguyên tắc đối chiếu khắt khe:

1. **`exclude`**: Job không được phân cho KTV bị loại trừ. Kiểm tra vị trí/ngày của Job trên Sandbox so với Calendar chính có giữ đúng ngày/trạng thái hay không.
2. **`lock`**: Khóa cứng Job tại KTV/khung giờ. Kiểm tra Sandbox và Calendar chính có hoàn toàn trùng khớp vị trí, KTV và thời gian.
3. **`last_stop`**: Đặt Job xuống cuối tuyến đường (Last Stop). Kiểm tra trên Sandbox Job hiển thị ở vị trí cuối cùng trong tuyến.
4. **`first_stop`**: Đặt Job lên đầu tuyến đường (First Stop). Kiểm tra trên Sandbox Job bắt đầu đầu tiên (ví dụ: 8:00 AM).
5. **`arrival_window_duration`**: Siết chặt khoảng thời gian chờ/đến của Job. Đối chiếu khung giờ Sandbox so với Calendar.
6. **`time_window`**: Ép Job vào khung giờ làm việc cố định (VD: 8:00 AM - 12:00 PM hoặc bắt đầu lúc 8:00 AM).
7. **`prefer_tech`**: Ưu tiên phân cho KTV chỉ định nếu hợp lý.
8. **`force_tech`**: Bắt buộc phân cho KTV chỉ định.
9. **`keep_period` / Move limit**: Giới hạn khoảng ngày di chuyển Job. Kiểm tra Job không bị dời quá giới hạn tổng số ngày cho phép giữa Sandbox và Calendar.

---

## II. BẢNG TRẠNG THÁI THỰC THI TỰ ĐỘNG

| Rule Action | API Logic / Prompt | Trạng Thái Tạo Rule | Trạng Thái Sandbox Grid | Đối Chiếu Sandbox vs Calendar |
| :--- | :--- | :---: | :---: | :---: |
| **`time_window` (8AM Start)** | `start_sec: 28800` (8:00 AM) | ⏳ Đang khởi chạy | ⏳ Đang kiểm tra | ⏳ Đang đối chiếu |
| **`first_stop`** | `action_type: first_stop` | ⏳ Đang khởi chạy | ⏳ Đang kiểm tra | ⏳ Đang đối chiếu |
| **`last_stop`** | `action_type: last_stop` | ⏳ Đang khởi chạy | ⏳ Đang kiểm tra | ⏳ Đang đối chiếu |
| **`lock`** | `action_type: lock` | ⏳ Đang khởi chạy | ⏳ Đang kiểm tra | ⏳ Trùng khớp 100% |
| **`exclude`** | `action_type: exclude` | ⏳ Đang khởi chạy | ⏳ Đang kiểm tra | ⏳ Giữ nguyên ngày |
| **`arrival_window_duration`**| `duration: 7200` | ⏳ Đang khởi chạy | ⏳ Đang kiểm tra | ⏳ Đang đối chiếu |
| **`prefer_tech`** | `action_type: prefer_tech` | ⏳ Đang khởi chạy | ⏳ Đang kiểm tra | ⏳ Đang đối chiếu |
| **`force_tech`** | `action_type: force_tech` | ⏳ Đang khởi chạy | ⏳ Đang kiểm tra | ⏳ Đang đối chiếu |
| **`keep_period` / Move Limit**| `max_move_days: 2` | ⏳ Đang khởi chạy | ⏳ Đang kiểm tra | ⏳ Không dời > 2 ngày |

---

## III. ĐỒNG BỘ NGUYÊN BẢN VỀ GIT & LOCAL

Tất cả dữ liệu kiểm thử, video màn hình và báo cáo sau khi hoàn tất sẽ được đóng gói tự động vào:
- **Local:** `C:\mantis-auto\reports\report_rule_actions_execution.md`
- **GitHub:** `https://github.com/lampham71002-alt/Mantis-GPT.git`
