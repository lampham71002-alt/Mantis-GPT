# BÁO CÁO DANH MỤC KHÁCH HÀNG THỰC TẾ TRÊN HỆ THỐNG MANTIS (CUSTOMER DIRECTORY)

**Dự án:** Mantis AI Routing Autopilot  
**Thời gian thực hiện:** 05/10/2026  
**Nguồn trích xuất:** Live Backend API (`GET /api/search/elastic` & `customer.har`)  
**Tổng số khách hàng ghi nhận:** **60 Khách hàng**  
**Ngôn ngữ:** Tiếng Việt (100%)

---

## 1. PHÂN NHÓM DANH MỤC KHÁCH HÀNG

Danh mục 60 khách hàng trên hệ thống Mantis được chia thành các nhóm chính:

1. **Nhóm Khách Hàng Siêu Cấp / VIP:**
   * **Tony Stark** (ID: `15373` | Mã KH: `SEB_5325_2`)
   * **Bruce Wayne** (ID: `15374` | Mã KH: `SEB_6366_3`)
   * **Clark Kent** (ID: `15376` | Mã KH: `SEB_8491_14`)
   * **Peter Parker** (ID: `15375` | Mã KH: `SEB_7407_4`)
   * **Diana Prince** (ID: `15369` | Mã KH: `SEB_3261_1`)
   * **John Wick** (ID: `15372` | Email: `john.wick@movie-test.com`)

2. **Nhóm Khách Hàng Thể Thao / Cầu Thủ:**
   * **Messi** (ID: `14787` | Mã KH: `5012`)
   * **Lamine Yamal** (ID: `15367` | Email: `lamine.yamal@test.com`)
   * **Florian Wirtz** (ID: `15368` | Email: `florian.wirtz@test.com`)
   * **Rodrygo Goes** (ID: `15370` | Email: `rodrygo.goes@test.com`)
   * **Julian Alvarez** (ID: `15371` | Mã KH: `TLH_0126_5`)

3. **Nhóm Khách Hàng Kiểm Thử Lập Lịch (FL Routing Test 01 – 20):**
   * **FL Routing Test 01 $\rightarrow$ 20** (ID dải: `15520` đến `15539` | Mã KH dải: `SEB_8491_15` đến `SEB_8491_34`).

4. **Nhóm Khách Hàng Naples & TestAuto (TestAuto_1 $\rightarrow$ 10 & NaplesAuto_1 $\rightarrow$ 5):**
   * **NaplesAuto_1 Test $\rightarrow$ NaplesAuto_5 Test** (ID dải: `14866` đến `14870`).
   * **TestAuto_2 Routing $\rightarrow$ TestAuto_5 Routing** (ID dải: `14857` đến `14860`).

---

## 2. BẢNG CHI TIẾT DỮ LIỆU KHÁCH HÀNG THỰC TẾ (MASTER CUSTOMER TABLE)

| STT | Customer ID | Mã Tài Khoản / Ref | Tên Khách Hàng | Email / Ghi Chú |
|:---:|:---:|:---|:---|:---|
| **1** | `15373` | `SEB_5325_2` | **Tony Stark** | VIP Customer |
| **2** | `15374` | `SEB_6366_3` | **Bruce Wayne** | VIP Customer |
| **3** | `15376` | `SEB_8491_14` | **Clark Kent** | VIP Customer |
| **4** | `15375` | `SEB_7407_4` | **Peter Parker** | VIP Customer |
| **5** | `15369` | `SEB_3261_1` | **Diana Prince** | VIP Customer |
| **6** | `15372` | `john.wick@movie-test.com` | **John Wick** | Movie Test Cohort |
| **7** | `14787` | `5012` | **Messi** | Standard Customer |
| **8** | `14783` | `5010` | **Minh** | Standard Customer |
| **9** | `15367` | `lamine.yamal@test.com` | **Lamine Yamal** | Test Cohort |
| **10** | `15368` | `florian.wirtz@test.com` | **Florian Wirtz** | Test Cohort |
| **11** | `15370` | `rodrygo.goes@test.com` | **Rodrygo Goes** | Test Cohort |
| **12** | `15371` | `TLH_0126_5` | **Julian Alvarez** | Test Cohort |
| **13** | `14866` | `naples_test_1@namlongsoft.net` | **NaplesAuto_1 Test** | Naples Area Test |
| **14** | `14867` | `NAPLES_7056_2` | **NaplesAuto_2 Test** | Naples Area Test |
| **15** | `14868` | `NAPLES_8135_3` | **NaplesAuto_3 Test** | Naples Area Test |
| **16** | `14869` | `NAPLES_9259_4` | **NaplesAuto_4 Test** | Naples Area Test |
| **17** | `14870` | `NAPLES_0430_5` | **NaplesAuto_5 Test** | Naples Area Test |
| **18**–**37** | `15520`–`15539` | `SEB_8491_15`–`SEB_8491_34` | **FL Routing Test 01 $\rightarrow$ 20** | Synthetic Routing Cohort |
| **38**–`60` | `14856`–`15510` | Dải tài khoản khác | **TestAuto_1 $\rightarrow$ 10, Vance, Sterling, Miller...** | General Test Cohort |

---

## 3. KẾT LUẬN & ỨNG DỤNG TRONG KIỂM THỬ

* Danh mục 60 khách hàng này trực tiếp cung cấp các thuộc tính `customer.tags`, `customer.id`, `customer_names` để cài đặt các quy tắc ưu tiên trong `rules-catalog.md` (ví dụ: `rule_vip_customer`, `customer_scheduling_preferences`, `prefer_tech`).
