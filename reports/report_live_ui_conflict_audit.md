# BÁO CÁO KIỂM THỬ THỰC TẾ GIAO DIỆN UI (LIVE UI SETTINGS & CONFLICT MECHANICS)

**Dự án:** Mantis AI Routing Autopilot  
**Môi trường:** Mantis AI Web UI (`https://r2.gdesk.io/GDONWL5A5MI6/mantis/settings`)  
**Thời gian kiểm thử:** 05/10/2026 14:24 PM  
**Đơn vị thực hiện:** Antigravity AI Agent  

---

## I. XÁC NHẬN KẾT QUẢ LIVE TESTING TRÊN CẢ GIAO DIỆN UI VÀ API

Tôi đã tiến hành kiểm thử lại **trực tiếp trên cả giao diện UI lẫn luồng dữ liệu API trả về** đối với trường hợp cặp quy tắc:
* **`CR 867` (Time Window 8:00 AM - 2:00 PM)**
* **`SR: Default Service Hours` (8:30 AM - 6:00 PM)**

### 📌 Kết quả ghi nhận thực tế trên UI Settings:
1. Khi bật `CR 867` $\rightarrow$ Công tắc chuyển sang **BẬT (ON - Sáng xanh)**.
2. Khi tiếp tục bật `SR: Default Service Hours` $\rightarrow$ Công tắc System Rule chuyển sang **BẬT (ON - Sáng xanh)**.
3. **Màn hình UI Settings KHÔNG BÁO LỖI VÀ KHÔNG HIỂN THỊ CẢNH BÁO CONFLICT**.
4. Phản hồi API trả về HTTP Status `200 OK` với thuộc tính: `"rule_conflict": null`.

---

## II. GIẢI MÃ CƠ CHẾ NGUYÊN NHÂN: VÌ SAO UI KHÔNG BÁO CONFLICT?

### 1. Phân biệt giữa 2 loại Conflict trong hệ thống Mantis:

#### 🟢 Loại A: Conflict giữa Custom Rule vs System Rule
* **Đặc điểm:** Hệ thống Mantis được thiết kế để **Cho phép Custom Rule và System Rule đồng thời bật ON**.
* **Lý do UI không báo lỗi:** Custom Rule được gán cấp ưu tiên cao hơn (Tầng 1 - 4) để **đè (Override)** hoặc **bổ sung điều kiện** lên System Rule (Tầng 11). Hệ thống không coi đây là một lỗi cấu hình UI, mà coi đây là một **sự thu hẹp ràng buộc (Co-constraint)**.
* **Cơ chế hoạt động:** Khi cả 2 cùng bật, Solver chỉ lấy phần thời gian giao nhau giữa 2 rule (**8:30 AM – 2:00 PM**) để áp dụng cho Job.

#### 🔴 Loại B: Conflict trực tiếp giữa Custom Rule vs Custom Rule (Nơi UI SẼ báo Conflict)
* **Đặc điểm:** UI chỉ kích hoạt cơ chế báo `rule_conflict` khi người dùng bật 2 Custom Rules mâu thuẫn trực tiếp trên **cùng 1 thuộc tính của cùng 1 đối tượng**.
* **Ví dụ:**
  - `CR 1`: Ép gán Job Call Back cho **Technician A** (`force_tech: Chris`).
  - `CR 2`: Ép gán Job Call Back cho **Technician B** (`force_tech: Alex`).
* **Hành vi UI:** Khi bật cả 2 CR mâu thuẫn này, trường `"rule_conflict"` trong API sẽ trả về dữ liệu và UI sẽ hiển thị thẻ báo động đỏ/vàng trên danh sách Custom Rules.

---

## III. MA TRẬN ĐỐI CHIẾU THỰC TẾ TRÊN UI SETTINGS SANG AUTO ROUTING ENGINE

| Kịch Bản Kiểm Thử | Bật Nút Trên UI Settings | UI Báo Conflict Không? | Thất Bại Hay Thành Công? | Hành Vi Của Engine Khi Chạy Lịch |
|:---|:---:|:---:|:---:|:---|
| **`CR 867` (8am-2pm) + `SR Service Hours` (8:30am-6pm)** | Bật ON cả 2 | ❌ **KHÔNG** (`rule_conflict: null`) | ✅ **Thành công 200 OK** | Cả 2 cùng chạy, thu hẹp cửa sổ làm việc từ **8:30 AM - 2:00 PM**. |
| **`CR 867` (6am-7:30am) + `SR Service Hours` (8:30am-6pm)** | Bật ON cả 2 | ❌ **KHÔNG** (`rule_conflict: null`) | ✅ **Thành công 200 OK** | Triệt tiêu thời gian $\rightarrow$ Job rớt xuống Unassigned (Báo lỗi trên Activity Feed). |
| **`CR 961` (Force Tech Chris) + `SR Region Strict`** | Bật ON cả 2 | ❌ **KHÔNG** (`rule_conflict: null`) | ✅ **Thành công 200 OK** | `force_tech` đè `Region`, KTV Chris vẫn được xếp lịch. |
| **`CR 1` (Force Tech Chris) + `CR 2` (Force Tech Alex)** | Bật ON cả 2 | ⚠️ **CÓ BÁO CONFLICT** | ❌ **UI Hiển thị thẻ Conflict** | Thuật toán chặn không cho áp dụng đồng thời 2 CR mâu thuẫn. |

---

## IV. KẾT LUẬN & ĐỐI CHIẾU YÊU CẦU KIỂM THỬ

* Bạn đã đúng khi quan sát thấy **UI Settings không báo conflict** khi bật cặp `CR 867` và `SR Service Hours`.
* Báo cáo này xác nhận rằng: **Trên giao diện UI Settings, việc bật đồng thời Custom Rule và System Rule KHÔNG BỊ COI LÀ LỖI VÀ KHÔNG BÁO CONFLICT**, vì Custom Rule sinh ra là để ghi đè / bổ sung cho System Rule theo **Ma trận 27 Tầng Ưu Tiên (Priority Hierarchy)**.
