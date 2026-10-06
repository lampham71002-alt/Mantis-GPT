# BÁO CÁO KIỂM THỬ TRỰC TIẾP TRÊN UI LIVE PREVIEW (KỊCH BẢN KẾT HỢP 2 ACTIONS)

**Môi trường thực thi:** Live Preview trực tiếp trên panel bên phải (`r2.gdesk.io` & `apiv2.gdesk.io`)  
**Tài khoản:** `lamlam@gmail.com` | **Branch ID:** `GDONWL5A5MI6`  
**Chế độ chạy:** Non-headless (Mở trình duyệt thực tế, chậm rãi từng bước cho người dùng xem)  
**Thời gian hoàn thành:** 06/10/2026 03:25 PM  

---

## I. MÔ TẢ KỊCH BẢN KIỂM THỬ THỰC TẾ
- **Đang test:** Kịch bản kết hợp 2 Actions trong 1 Custom Rule:
  1. **Action 1:** `time_window` (Khung giờ bắt đầu từ 8:00 AM đến 10:00 AM)
  2. **Action 2:** `first_stop` (Bắt buộc là điểm dừng đầu tiên trong ngày)
- **Prompt gửi hệ thống:** *"Jobs assigned to customer Messi must start between 8:00 AM and 10:00 AM and must be the first stop of the day"*

---

## II. TOÀN BỘ QUÁ TRÌNH THAO TÁC TRÊN PREVIEW PANEL
1. **Đăng nhập:** Mở trình duyệt, nhập tài khoản `lamlam@gmail.com` và mật khẩu.
2. **Ghi nhận Calendar trước khi test:** Mở trang Main Calendar ghi nhận trạng thái ban đầu của các job ([live_tc1_calendar_before.png](file:///c:/mantis-auto/scratch/live_tc1_calendar_before.png)).
3. **Biên dịch & Lưu Rule thật:**
   - Gửi yêu cầu qua AI Engine -> Nhận phản hồi -> Xác nhận lưu rule qua API `/custom-rules/verify`.
   - Kết quả trả về: `{"data":{"verified":true,"rule_conflict":null,"refuse_save":false},"success":true}`.
4. **Mở Settings & Bật Toggle:** Truy cập `/mantis/settings/custom`, click bật Toggle Switch sang trạng thái **ON** ([live_tc1_toggle_on.png](file:///c:/mantis-auto/scratch/live_tc1_toggle_on.png)).
5. **Soi Sandbox Grid & Quan sát Routing:** Mở `/mantis/sandbox`, quan sát các slot thời gian được tính toán lại ([live_tc1_sandbox_result.png](file:///c:/mantis-auto/scratch/live_tc1_sandbox_result.png)).
6. **Tắt Toggle Switch OFF:** Tự động quay lại Custom Rules và click tắt Toggle Switch về **OFF** để bảo vệ dữ liệu ([live_tc1_toggle_off.png](file:///c:/mantis-auto/scratch/live_tc1_toggle_off.png)).

---

## III. BẢNG ĐÁNH GIÁ KẾT QUẢ ROUTING (PASS / FAIL)

| Hành Động / Tiêu Chí | Yêu Cầu Của Rule | Thực Tế Trên Sandbox Đối Chiếu Với Calendar | Đánh Giá |
| :--- | :--- | :--- | :---: |
| **Action 1: `time_window` (8AM-10AM)** | Job phải bắt đầu trong khung 8:00 - 10:00 AM | Trên Sandbox, slot đầu tiên bắt đầu lúc **8:30 AM** (nằm trọn vẹn trong khung giờ). | ✅ **PASS** |
| **Action 2: `first_stop`** | Job phải là điểm dừng đầu tiên của ngày | Trên Sandbox, job này đứng ở vị trí số 1 đầu tuyến, các job sau lần lượt là 9:45 AM, 10:04 AM. | ✅ **PASS** |
| **Bảo lưu dữ liệu ngoài scope** | Các job không thuộc rule hoặc đang bị lock giữ nguyên | Các job màu xám ngày 6 Tue (`TestAut...` và `nami Rotonda...`) hoàn toàn giữ nguyên 100% vị trí. | ✅ **PASS** |

---

## IV. TỰ ĐỘNG ĐỒNG BỘ GIT
Báo cáo và trọn bộ ảnh chụp minh chứng thực tế trên Live Preview đã được đóng gói vào thư mục `C:\mantis-auto\` và đẩy tự động lên GitHub [Mantis-GPT](https://github.com/lampham71002-alt/Mantis-GPT.git).
