# KẾ HOẠCH KIỂM THỬ: ĐỐI CHIẾU MANTIS DASHBOARD THEO TỪNG NGÀY VS SANDBOX JOBS (CHECK NGÀY NÀO - SO KHỚP NGÀY ĐÓ)

> **Hệ thống:** Mantis AI Routing Autopilot (GorillaDesk)  
> **Tài khoản kiểm thử:** `lam.pham@gmail.com` | Password: `Ahihi123`  
> **Branch ID:** `GD1LK8RC5OH0` | **Schedule mục tiêu:** `lam 1` (ID: `249`)  
> **Cơ sở kỹ thuật & Nghiệp vụ:** `DB.txt` (Product Spec) & `Dashboard.har` (Network API Spec)  
> **Nguyên tắc cốt lõi:** **"CHECK NGÀY NÀO THÌ SO KHỚP NGÀY ĐÓ"** — Toàn bộ 30 jobs trên Calendar được **GIỮ NGUYÊN VẸN 100% (KHÔNG XÓA)**.  
> **Phạm vi kiểm thử:** **11/10/2026 → 16/10/2026** (6 ngày làm việc liên tiếp).

---

## I. MỤC TIÊU & CƠ CHẾ ĐỐI CHIẾU 1:1 THEO TỪNG NGÀY

Với mỗi ngày $D$ (từ ngày 11/10 đến 16/10), hệ thống sẽ trích xuất đồng thời số liệu của chính ngày đó và thực hiện so khớp 1:1:
1. **Dữ liệu Sandbox:** Danh sách jobs, tổng Work Time, Drive Time, khoảng nghỉ Downtime, độ trễ Delays.
2. **Dữ liệu Dashboard API:** `time-ratio`, `downtime`, `delays`, `saved-mileage`, `saved-drive-time`, `total-saved`.
3. **So khớp Delta:** Đánh giá tính chính xác giữa 2 nguồn theo tiêu chuẩn `DB.txt`.

---

## II. MA TRẬN 6 NGÀY THỰC HIỆN SO KHỚP CHI TIẾT (BẢO TOÀN DỮ LIỆU)

| Ngày Kiểm Thử | Khách Hàng Mục Tiêu | Jobs Trên Sandbox | Chỉ Số Dashboard Đối Chiếu Trọng Tâm | Tiêu Chí Đánh Giá So Khớp |
| :---: | :--- | :---: | :--- | :--- |
| **11/10/2026** | HCM Customer 01 → 05 (Q1, Q3, Bình Thạnh) | `101493` - `101497` (5 jobs) | `Work Time`, `Drive Time`, `Downtime`, `Delays` | Work Time Dashboard $\approx$ Tổng thời lượng 5 jobs. Downtime phản ánh khoảng chờ ngày 11. |
| **12/10/2026** | HCM Customer 06 → 10 (Gò Vấp, Phú Nhuận, Tân Bình) | `101498` - `101502` (5 jobs) | `Work Time`, `Saved Mileage`, `Delays` | Quãng đường tiết kiệm phản ánh cụm Tây Bắc. Delays khớp với giờ đến thực tế. |
| **13/10/2026** | HCM Customer 11 → 15 (Q5, Q10, Q7) | `101503` - `101507` (5 jobs) | `Time Ratio`, `Drive Time` | Tỷ lệ lái xe qua các quận phía Nam khớp lộ trình Sandbox. |
| **14/10/2026** | HCM Customer 16 → 20 (Q4, Q11, Thủ Đức) | `101508` - `101512` (5 jobs) | `Drive Time`, `Delays`, `Total Saved` | Đo lường độ trễ khi di chuyển khoảng cách xa đến Thủ Đức. |
| **15/10/2026** | HCM Customer 21 → 25 (Q1, Q3, Q10, Phú Nhuận) | `101514` - `101518` (5 jobs rải giờ) | **`Downtime`**, `Work Time`, `Delays` | **Downtime Dashboard** ghi nhận chính xác các khoảng nghỉ giữa 5 ca rải giờ (08:00, 09:30, 11:00, 13:30, 15:00). |
| **16/10/2026** | HCM Customer 26 → 30 (Bình Thạnh, Tân Bình, Q7, Thủ Đức) | `101519` - `101523` (5 jobs rải giờ) | **`Downtime`**, **`Delays = 0`**, `Total Saved` | **Downtime** phản ánh khoảng nghỉ giữa ca; **Delays = 0** vì lịch rải giờ không bị dồn toa. |

---

## III. NGUYÊN TẮC CÔNG THỨC GROUND TRUTH (TỪ DB.TXT)

1. **Bộ lọc đơn lẻ từng ngày:** `?start=YYYY-MM-DD&end=YYYY-MM-DD&schedule_ids=249`
2. **Công thức Time Ratio:**
   $$\text{Total Minutes} = \text{Work Time} + \text{Drive Time} + \text{Downtime}$$
3. **Công thức Total Saved ($):**
   $$\text{Total Saved (\$) } = (\text{Fuel Gallons Saved} \times \$3.50) + (\text{Drive Minutes Saved} \times \$0.50)$$
4. **Delays:** Số ca đến muộn hơn giờ hẹn cam kết.

---

## IV. QUY TRÌNH THỰC THI (TUẦN TỰ TỪNG NGÀY)

* Chạy tuần tự từ 11/10 đến 16/10.
* Mỗi ngày so khớp đầy đủ các chỉ số Dashboard vs Sandbox của chính ngày đó.
* Xuất báo cáo tổng hợp và ảnh chụp giao diện Dashboard đối chiếu.
