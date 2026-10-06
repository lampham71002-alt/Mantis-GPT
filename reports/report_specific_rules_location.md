# BÁO CÁO VỊ TRÍ TẠO SPECIFIC RULES TRÊN HỆ THỐNG MANTIS AI

**Dự án:** Mantis AI Routing Autopilot  
**Môi trường:** Live UI (`r2.gdesk.io`) & Live API (`apiv2.gdesk.io`)  
**Tài khoản:** `lamlam@gmail.com`  
**Thời gian:** 06/10/2026  
**Thực hiện:** Antigravity AI Agent  

---

## I. VỊ TRÍ TRÊN GIAO DIỆN NGUYÊN BẢN (LIVE UI LOCATION)

1. **Đường Dẫn Truy Cập Trực Tiếp (URL):**
   👉 `https://r2.gdesk.io/GDONWL5A5MI6/mantis/settings/specific`

2. **Vị Trí Menu Navigation Trên Giao Diện:**
   - Đăng nhập vào GorillaDesk / Mantis AI.
   - Chọn Menu **Settings** (Cài đặt).
   - Chọn Tab **Specific Rules** (nằm bên phải tab *Custom Rules* và *System Rules*).

3. **Giao Diện Ô Nhập Liệu Tạo Rule (Mantis Chat Box):**
   - Tại trang Specific Rules, có một khung Chat AI có placeholder:  
     `"Describe the routing constraint to Mantis..."`
   - Bạn chỉ cần gõ nội dung câu lệnh tiếng Anh hoặc tiếng Việt vào đây (VD: *"All jobs located in Region 1 must be scheduled between 8:00 AM and 12:00 PM"*).

---

## II. VỊ TRÍ KẾT NỐI API BACKEND (API ENDPOINTS)

Nếu thực hiện tạo và kiểm tra bằng mã code tự động, vị trí các API Endpoints tương ứng là:

| Thao Tác | Endpoint API Backend | Method | Body Payload |
|:---|:---|:---:|:---|
| **1. Khởi Tạo Cuộc Thoại AI** | `/api/routing/mantis/specific-rules/conversations` | `POST` | `{"message": "<Prompt tạo rule>", "conversation_id": null}` |
| **2. Phân Tích Logic Rule** | `/api/routing/mantis/specific-rules/conversations` | `POST` | `{"message": "strict", "conversation_id": "<ID>"}` |
| **3. Lưu Specific Rule Vào Hệ Thống** | `/api/routing/mantis/specific-rules/verify` | `POST` | `{"executable_logic": {...}, "conversation_id": "<ID>"}` |
| **4. Xem Danh Sách Specific Rules** | `/api/routing/mantis/specific-rules?limit=20` | `GET` | Header: `token`, `gd-branch-id` |
| **5. Bật/Tắt Specific Rule (Toggle)** | `/api/routing/mantis/specific-rules/{id}/status` | `PUT` | `{"status": 1}` (ON) hoặc `{"status": 0}` (OFF) |

---

## III. HÌNH ẢNH MINH HỌA VỊ TRÍ GIAO DIỆN

📷 **[Ảnh Chụp Màn Hình Vị Trí Trang Specific Rules UI](file:///C:/Users/nlsoft/.gemini/antigravity/brain/19593949-8e8e-4f72-a6b5-ac5a4b2ce014/specific_rules_location_ui.png)**
