# BÁO CÁO KIỂM THỬ LIVE THỰC TẾ: BẬT 3 CUSTOM RULES ĐẦU TIÊN VÀ ĐỐI CHIẾU LỊCH CALENDAR

**Dự án:** Mantis AI Routing Autopilot  
**Môi trường:** Live API (`apiv2.gdesk.io`) & Live UI (`r2.gdesk.io`)  
**Tài khoản đăng nhập:** `lamlam@gmail.com`  
**Branch ID:** `GDONWL5A5MI6`  
**Auth Token Live:** `OMa2xSx5ZGQej1F0NXulRIX9tzQA3blchqh5...`  
**Thời gian thực hiện:** 06/10/2026  
**Thực hiện:** Antigravity AI Agent  

---

## I. XÁC ĐỊNH DANH SÁCH 3 CUSTOM RULES ĐẦU TIÊN LIVE TRÊN HỆ THỐNG

Sau khi tự động đăng nhập và tải danh sách Custom Rules thực tế từ tài khoản `lamlam@gmail.com`, 3 Custom Rules đầu tiên trong danh sách Custom Rules Manager bao gồm:

| STT | Rule ID | Tên Custom Rule (Title) | Mô Tả Quy Tắc (Description) | Trạng Thái Ban Đầu |
|:---:|:---:|:---|:---|:---:|
| **1** | **`1231`** | **All Jobs Last Stop Policy** | Bắt buộc **TẤT CẢ** các công việc (`All jobs and stops`) phải được xếp làm **điểm dừng cuối cùng trong ngày (`last_stop`)**. | OFF (`status: 0`) |
| **2** | **`1202`** | **All Jobs Morning Time Window** | Bắt buộc **TẤT CẢ** các công việc phải được xếp lịch trong khung giờ cứng từ **8:00 AM đến 2:00 PM** (`time_window: 8:00-14:00`). | OFF (`status: 0`) |
| **3** | **`1238`** | **All Jobs Standard Operating Hours Window** | Bắt buộc **TẤT CẢ** các công việc phải xếp lịch trong khung giờ làm việc từ **6:00 AM đến 6:00 PM** (`time_window: 6:00-18:00`). | OFF (`status: 0`) |

---

## II. KẾT QUẢ THỰC HIỆN BẬT (TOGGLE ON) LIVE 3 RULES TRÊN API

Tôi đã gửi lệnh `PUT /api/routing/mantis/custom-rules/{id}/status` với body `{"status": 1}` lên server. Kết quả phản hồi thực tế từ hệ thống:

```json
1. Bật CR 1231 (All Jobs Last Stop): HTTP 200 OK -> status: 2 (CONFLICT DETECTED)
2. Bật CR 1202 (Morning Window 8-14h): HTTP 200 OK -> status: 1 (ACTIVE SUCCESS)
3. Bật CR 1238 (Standard Window 6-18h): HTTP 200 OK -> status: 2 (CONFLICT DETECTED)
```

---

## III. PHÂN TÍCH HIỆN TƯỢNG XUNG ĐỘT (UI & ENGINE CONFLICT ANALYSIS)

### 🔴 1. Xung Đột Trực Tiếp Giữa `CR 1202` vs `CR 1238`:
* Khi bật đồng thời **Rule 2 (`1202` - Khung 8h-14h)** và **Rule 3 (`1238` - Khung 6h-18h)**, hệ thống phát hiện **Hard Conflict trực tiếp giữa 2 Custom Rules**.
* Server trả về `status: 2` cho Rule 1238 kèm phản hồi chi tiết:
  ```json
  "case": { "text": "Conflicts with: All Jobs Morning Time Window." },
  "intent_conflicts": {
    "category": "hard_conflict",
    "blocked_by": [{ "rule_id": 1202, "rule_type": "custom" }]
  }
  ```
* **Hiển thị UI:** Thẻ Rule `1238` trên màn hình Custom Rules Manager xuất hiện **Thẻ Cảnh Báo Xung Đột Đỏ/Vàng (Conflict Warning Card)** báo mâu thuẫn với Rule 1202.

### 🔴 2. Xung Đột Của `CR 1231` (All Jobs Last Stop):
* `CR 1231` bắt buộc **tất cả** công việc đều phải làm điểm dừng cuối ngày (`last_stop`).
* Nếu một KTV có 5 công việc trong ngày, không thể xếp cả 5 công việc đều làm "Last Stop" đồng thời.
* Server gắn thẻ `status: 2` cho Rule 1231 và báo conflict với các rule điểm dừng khác (`ID 1089`, `ID 1097`, `ID 869`).

---

## IV. ĐỐI CHIẾU TÁC ĐỘNG VỚI LỊCH CALENDAR GRID

### 📅 Vị trí thực tế các Job trên Calendar Grid hiện tại (KTV Lam 1 - Schedule 31):
- `Event 7042`: 06:00 AM – 06:35 AM (Đầu ngày)
- `Event 7041`: 06:35 AM – 07:15 AM
- `Event 7039`: 07:19 AM – 08:30 AM
- `Event 7040`: 08:39 AM – 09:30 AM

### 📊 Bảng Đối Chiếu Tác Động Lịch Calendar:

| Custom Rule | Trạng Thái Bật Live | Phản Hồi UI / API | Tác Động Lên Calendar Grid Khi Chạy Autopilot |
|:---:|:---:|:---|:---|
| **`1231`** *(Last Stop All Jobs)* | **`status: 2` (Conflict)** | ⚠️ **Báo lỗi Conflict trên UI** | Bị tạm dừng kích hoạt do xung đột logic (Không thể xếp tất cả các ô lịch thành điểm dừng cuối). |
| **`1202`** *(Morning Window 8-14h)* | **`status: 1` (Active)** | ✅ **Sáng xanh (Hoạt động)** | Ép toàn bộ các ô lịch (Events 7042, 7041 đang ở 6:00 AM - 7:30 AM) phải dời lùi xuống **sau 8:00 AM**. |
| **`1238`** *(Standard Window 6-18h)* | **`status: 2` (Conflict)** | ⚠️ **Báo lỗi Conflict với Rule 1202** | Bị chặn kích hoạt bởi Rule 1202 (Rule 1202 khung 8-14h hẹp hơn và áp dụng trước). |

---

### 🔄 Khôi Phục Hệ Thống:
Sau khi ghi nhận kết quả live testing bật 3 Custom Rules và bắt được chính xác phản hồi Conflict từ server, tôi đã thực hiện gửi lệnh **Reset 3 Custom Rules `1231`, `1202`, `1238` trở về trạng thái `status: 0` (OFF)** an toàn cho hệ thống.
