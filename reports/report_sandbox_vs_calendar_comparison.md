# BÁO CÁO ĐỐI CHIẾU THỰC TẾ JOB TRÊN SANDBOX VS CALENDAR CHÍNH

**Dự án:** Mantis AI Routing Engine  
**Môi trường:** Live UI (`r2.gdesk.io`) & Live API (`apiv2.gdesk.io`)  
**Thời gian kiểm tra:** 06/10/2026 02:36 PM  

---

## I. XÁC NHẬN KẾT QUẢ ĐỐI CHIẾU GIỮA SANDBOX GRID VÀ CALENDAR CHÍNH

Tôi đã khởi chạy tự động script chụp lại 2 màn hình đối chiếu trực tiếp trên hệ thống thật khi bật Custom Rule:

1. **Màn hình Calendar chính gốc**: [calendar_main_view.png](file:///c:/mantis-auto/calendar_main_view.png)
2. **Màn hình Sandbox Grid khi Rule được áp dụng**: [sandbox_grid_view.png](file:///c:/mantis-auto/sandbox_grid_view.png)

---

## II. KẾT QUẢ ĐỐI CHIẾU CHI TIẾT THEO QUY TẮC BẬT RULE

### 1. Đối với các Job thỏa mãn điều kiện Custom Rule (VD: `time_window`, `first_stop`):
- **Trạng thái trên Sandbox Grid**: Job được sắp xếp lại vị trí tối ưu trên Sandbox (khung thời gian màu xanh lá cây đậm nét, hiển thị rõ ràng thời gian di chuyển `13 mins`, `38 mins`, `26 mins`).
- **Khung giờ**: Job bắt đầu đúng trong khoảng giờ quy định của Rule (VD: từ 8:30 AM hoặc 9:00 AM).

### 2. Đối với các Job Lock (`lock`) hoặc loại trừ (`exclude`):
- **Trạng thái đối chiếu**: Giữ **nguyên 100% ngày, vị trí và KTV** giữa Calendar chính gốc và Sandbox Grid (VD: các Job màu xám khóa tại ngày 6 Tue `TestAut...` và `Lam Rotonda...` nằm chính xác trùng khớp trên cả 2 màn hình).

---

## III. ĐỒNG BỘ NGUYÊN BẢN GIT AUTOMATION
Báo cáo và hình ảnh đối chiếu đã được tự động lưu vào local `C:\mantis-auto\` và đẩy trực tiếp lên GitHub Repository [Mantis-GPT](https://github.com/lampham71002-alt/Mantis-GPT.git).
