# BÁO CÁO GIẢI MÃ CƠ CHẾ DI CHUYỂN CÔNG VIỆC (JOB MOVEMENT MECHANICS IN MANTIS AI)

**Dự án:** Mantis AI Routing Autopilot  
**Thời gian kiểm tra:** 05/10/2026  
**Nguồn xác minh:** Mantis AI Help Agent Engine & Backend API Specification  
**Ngôn ngữ tài liệu:** Tiếng Việt (100%)

---

## 1. NGUYÊN LÝ HOẠT ĐỘNG CỦA MANTIS ROUTING ENGINE

Qua phản hồi trực tiếp từ Động cơ AI Help Agent (`POST /api/routing/mantis/custom-rules/conversations`) và tài liệu đặc tả [rules-catalog.md](file:///C:/mantis-auto/AI-testing-mantis-main%20%284%29/AI-testing-mantis-main/rules-catalog.md), nguyên lý xử lý ngày di chuyển của Mantis được xác định như sau:

### 1.1. Giới hạn của Rule Engine (Quy tắc di chuyển):
* Hệ thống Mantis AI **chỉ hỗ trợ các quy tắc di chuyển tương đối (Relative Timeframe Constraints)**:
  * `movement_limit`: Giới hạn tối đa di chuyển $N$ ngày.
  * `keep_period`: Giữ công việc trong cùng tuần (`week`) hoặc cùng tháng (`month`).
  * `freeze_window`: Đóng băng công việc không cho di chuyển trong ngày hiện tại.
* **Không hỗ trợ gán cứng ngày tuyệt đối:** Engine **không chấp nhận** các quy tắc chỉ định cố định ngày lịch cụ thể (ví dụ: *"Bắt buộc phải chuyển đúng vào ngày 11/10/2026"*).

### 1.2. Hành vi của Thuật toán Tối ưu hóa (Optimizer Solver):
* Khi chạy tính năng Optimize (`manual/optimize` + `accept`), thuật toán tự động tính toán dựa trên chỉ số di chuyển di chuyển ngắn nhất.
* Do đó, thuật toán sẽ tự động phân bổ lại các job ngày 04/10 vào các ngày tối ưu trong tuần (ví dụ: 08/10, 09/10 hoặc 11/10) thay vì ép toàn bộ về duy nhất ngày 11/10 nếu ngày 11/10 làm gia tăng thời gian lái xe.

---

## 2. HƯỚNG DẪN THỰC HIỆN DỜI LỊCH CHÍNH XÁC SANG NGÀY 11/10 TRÊN GIAO DIỆN UI

Để ấn định chính xác toàn bộ các công việc từ ngày 04/10/2026 sang đúng ngày **11/10/2026** trên giao diện Web Portal (`https://r2.gdesk.io`), bạn thực hiện theo 1 trong 2 cách sau:

### Cách 1: Thao tác Kéo - Thả (Drag & Drop) trực tiếp trên Calendar (Khuyên dùng)
1. Truy cập giao diện Lịch Calendar tại `https://r2.gdesk.io`.
2. Chọn góc nhìn Lịch theo Tuần (Week View) bao gồm khoảng thời gian từ **04/10/2026 đến 11/10/2026**.
3. Dùng chuột **Kéo (Drag)** công việc của KTV Lam tại cột ngày **04/10** và **Thả (Drop)** sang cột ngày **11/10**.
4. Hệ thống Calendar của GDesk sẽ tự động ghi nhận vị trí mới.

### Cách 2: Đổi ngày trực tiếp trong chi tiết Job
1. Nhấp đúp vào công việc cần chuyển trên ngày 04/10/2026.
2. Chọn trường **Date (Ngày thực hiện)** và đổi từ `04/10/2026` sang `11/10/2026`.
3. Bấm **Save (Lưu)**.

---

## 3. TỔNG KẾT

| Thao tác | Mục đích | Kết quả trên UI |
|:---|:---|:---|
| **Kéo-Thả trên Calendar UI / Sửa Ngày Job** | Đổi lịch cố định theo ý muốn Quản trị viên | **Chuyển đúng chính xác ngày 11/10/2026** |
| **Bấm Thuật toán Mantis Optimize** | Để AI tự động tính toán vị trí di chuyển tối ưu chi phí | **AI tự xếp vào các ngày tối ưu nhất trong phạm vi 14 ngày** |
