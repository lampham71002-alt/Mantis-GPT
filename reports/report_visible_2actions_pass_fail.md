# BÁO CÁO CHI TIẾT KẾT QUẢ KIỂM THỬ: TẠO RULE KẾT HỢP 2 ACTIONS (SANDBOX VS CALENDAR)

**Môi trường thử nghiệm:** Live UI (`r2.gdesk.io`) & Live API (`apiv2.gdesk.io`)  
**Tài khoản:** `lamlam@gmail.com`  
**Chế độ chạy:** Hiển thị trực tiếp trình duyệt trên màn hình người dùng  
**Thời gian kiểm thử:** 06/10/2026 02:58 PM  

---

## I. CÁC HÀNH ĐỘNG KIỂM THỬ TRỰC TIẾP TRÊN TRÌNH DUYỆT (6 BƯỚC)
1. **Đăng nhập**: Mở trình duyệt góc phải, tự động đăng nhập `lamlam@gmail.com`.
2. **Calendar chính**: Chụp ảnh ghi nhận vị trí các job trước khi bật rule ([test_step1_calendar_original.png](file:///c:/mantis-auto/test_step1_calendar_original.png)).
3. **Custom Rules**: Truy cập `/mantis/settings/custom`.
4. **Bật Rule ON**: Bật toggle cho Custom Rule kết hợp 2 action (`time_window` 8-10AM + `first_stop`).
5. **Soi Sandbox Grid**: Mở `/mantis/sandbox` đối chiếu ngay với Calendar ([test_step3_sandbox_applied.png](file:///c:/mantis-auto/test_step3_sandbox_applied.png)).
6. **Tắt Rule OFF**: Tự động tắt toggle về trạng thái ban đầu để an toàn dữ liệu.

---

## II. BẢNG ĐÁNH GIÁ CHI TIẾT TỪNG ACTION (PASS / FAIL)

| Action | Kỳ vọng theo Rule | Thực tế trên Sandbox so với Calendar | Đánh giá | Ghi chú bằng chứng |
| :--- | :--- | :--- | :---: | :--- |
| **Action 1: `time_window` (8:00 AM - 10:00 AM)** | Job mục tiêu phải được xếp bắt đầu trong khoảng từ 8:00 AM đến 10:00 AM | Trên Sandbox, job được xếp bắt đầu lúc **8:30 AM** (nằm hoàn toàn trong khung 8:00 - 10:00 AM). | ✅ **PASS** | Ô job hiển thị màu xanh lá đậm, bắt đầu 8:30 AM. |
| **Action 2: `first_stop`** | Job mục tiêu phải là điểm dừng đầu tiên trong ngày của KTV | Trên Sandbox, job đứng ở vị trí đầu tiên của ngày (8:30 AM là slot đầu tiên, các job tiếp theo lần lượt là 9:45 AM, 10:04 AM, 11:06 AM). | ✅ **PASS** | Không có job nào của KTV đó xếp trước 8:30 AM. |
| **Bảo lưu `lock` & Non-Rule Jobs** | Các job không thuộc rule hoặc đang bị lock phải giữ nguyên 100% vị trí | Các job màu xám ngày 6 Tue (`TestAut...` lúc 10:15 AM và `nami Rotonda...` lúc 12:30 PM) hoàn toàn trùng khớp vị trí giữa Calendar và Sandbox. | ✅ **PASS** | Không bị dịch chuyển hay thay đổi KTV. |

---

## III. KẾT LUẬN
- **Cả 2 Action (`time_window` + `first_stop`) đều PASS 100%**.
- Rule được áp dụng tự động ngay trên Sandbox Grid khi bật toggle mà không cần chạy thủ công.
- Dữ liệu lịch và các job không liên quan được bảo toàn tuyệt đối.
