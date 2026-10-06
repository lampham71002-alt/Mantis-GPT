# BÁO CÁO PHÂN TÍCH CHUYÊN SÂU NHẬT KÝ DI CHUYỂN CÔNG VIỆC (JOB MOVE LOGS & EXPLAINABILITY LAYER)

**Dự án:** Mantis AI Routing Autopilot  
**Thời gian thực hiện:** 05/10/2026  
**Nguồn dữ liệu:** `detai.har` (History ID 1422) & Live API `GET /api/routing/mantis/feeds/history/1448/logs`  
**Ngôn ngữ tài liệu:** Tiếng Việt (100%)

---

## 1. TỔNG QUAN TẦNG GIẢI TRÌNH (EXPLAINABILITY LAYER)

Trong hệ thống Mantis AI Routing, dữ liệu vị trí công việc (`jobs` stream) chỉ trả lời câu hỏi **Ở ĐÂU (WHERE)**. Tầng giải trình **Move Logs (`feeds/history/:id/logs`)** mới là nơi trả lời câu hỏi **TẠI SAO (WHY)** một công việc bị di chuyển từ ngày này sang ngày khác hoặc từ kỹ thuật viên này sang kỹ thuật viên khác.

---

## 2. CẤU TRÚC CHUẨN CỦA MỘT BẢN GHI MOVE LOG

Mỗi bản ghi di chuyển trong phản hồi API có cấu trúc đối tượng JSON như sau:

```json
{
  "id": "89609",
  "item": {
    "id": "7059",
    "name": "Flea & Tick Control",
    "type": "job"
  },
  "customer": {
    "id": "14867",
    "full_name": "NaplesAuto_2 Test"
  },
  "location": {
    "service_address": "26811 Tamiami Trail S, Bonita Springs, FL 34134"
  },
  "from": {
    "schedules": [{ "id": "31", "name": "Lam", "user_id": "84361445" }],
    "user": { "id": "84361445", "full_name": "Lam Test" },
    "start": "2026-10-07T13:15:00+00:00"
  },
  "to": {
    "schedules": [{ "id": "31", "name": "Lam", "user_id": "84361445" }],
    "user": { "id": "84361445", "full_name": "Lam Test" },
    "start": "2026-10-08T09:01:00+00:00"
  },
  "reasons": [
    "We rescheduled Flea & Tick Control to Lam Test (10/08/2026, schedule Lam). The route optimizer's day plan put the job on this day to keep driving low when it planned the days.",
    "Measured on the final routes after the run: this placement adds 14 min of driving; the original slot would add 0 min.",
    "Rules that limited this placement: Route Across All Tech Schedules and Default Service Hours.",
    "We compared 18 possible days (09/27/2026–10/14/2026) and 17 other suitable options. It starts when the previous job ends (8:45 AM) plus 15 minutes of travel."
  ],
  "reason_codes": ["routing_optimized"],
  "message": "We rescheduled Flea & Tick Control to Lam Test (10/08/2026, schedule Lam)...",
  "spilled_past_horizon": false
}
```

---

## 3. GIẢI MÃ BỘ 4 CÂU GIẢI TRÌNH AI (REASONS ARRAY ANALYSIS)

Engine Mantis tự động tổng hợp câu văn giải trình nghiệp vụ theo 4 thành tố cốt lõi:

1. **Lý do mục tiêu chính (`Primary Objective`):**  
   *"Rescheduled to Lam Test (10/08/2026). The route optimizer's day plan put the job on this day to keep driving low."*  
   $\rightarrow$ Giải thích mục đích di chuyển là để tối thiểu hóa thời gian lái xe di chuyển giữa các điểm.

2. **Chỉ số đo đạc thực tế (`Delta Metrics`):**  
   *"Measured on final routes: adds 14 min of driving; original slot would add 0 min."*  
   $\rightarrow$ So sánh quãng đường/thời gian trước và sau khi di chuyển để làm bằng chứng định lượng.

3. **Các quy tắc giới hạn (`Bound Rules`):**  
   *"Rules that limited this placement: Route Across All Tech Schedules and Default Service Hours."*  
   $\rightarrow$ Liệt kê danh sách các luật cứng (`Hard Rules`) quyết định không thể xếp sang giờ/ngày khác (ví dụ: không thể xếp ngoài khung 8:00 AM – 4:30 PM).

4. **Không gian bài toán đã duyệt (`Search Space`):**  
   *"Compared 18 possible days (09/27/2026–10/14/2026) and 17 other suitable options."*  
   $\rightarrow$ Minh chứng thuật toán đã duyệt qua toàn bộ phạm vi 18 ngày trong `optimization_horizon` trước khi đưa ra quyết định xếp vị trí mới này.

---

## 4. QUY TẮC KIỂM THỬ 3 NGUỒN (THREE-SOURCE VERIFICATION PROCEDURE)

Dựa trên tài liệu kiểm thử [api-verification.md](file:///C:/mantis-auto/AI-testing-mantis-main%20%284%29/AI-testing-mantis-main/api-verification.md):

* **Quy tắc 1:** Chỉ kiểm tra vị trí công việc di chuyển là **KHÔNG ĐỦ (False Pass)**.
* **Quy tắc 2:** Nếu một công việc bị di chuyển ngày/giờ trên Calendar nhưng trong `feeds/history/:id/logs` **không xuất hiện bản ghi tương ứng** $\rightarrow$ Kết luận **FAIL** (Lỗi hệ thống làm mất vết di chuyển).
* **Quy tắc 3:** Nếu công việc di chuyển đúng vị trí mong muốn nhưng `winning_rule_id` hoặc chuỗi `reasons[]` giải thích sai tên luật $\rightarrow$ Kết luận **FAIL** (Lỗi logic giải trình).
