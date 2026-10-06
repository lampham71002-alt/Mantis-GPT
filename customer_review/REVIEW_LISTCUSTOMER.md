# Review listcustomer.har

Đọc dữ liệu đã ghi trong HAR; chưa gọi lại API live.

## API và phân trang

- `GET /api/customers`: HTTP 200, `success=true`.
- Request: `limit=50`, `offset=0`, `sort_by=first_name`, `order=customer asc`, `status=0,1`, `deleted=0`, `sub_locations=0`, không có keyword.
- Response: 50 customer, `total=62`, `show_more=true`, có cursor. HAR không có trang tiếp theo, nên còn 12 customer chưa đọc được từ file này.
- API phụ: `/customers/characters`, `/customers/summary`, `/customers/settings`; cả ba HTTP 200.
- Summary: 62 customer; with_service=55, without_service=7, total_leads=7. Không tự suy ra nhóm leads nằm ngoài tổng customer.

## Dữ liệu và giới hạn

- Có customer ID, tên, trạng thái, tag, địa chỉ service/billing và các trường liên hệ/tài khoản. Báo cáo chỉ trích thông tin cần cho đối chiếu customer.
- `service` trong response này là địa chỉ phục vụ, không phải danh sách loại dịch vụ.
- Không có job ID, schedule ID hoặc preferred technician trong danh sách này; cần ghép với dữ liệu job/detail để kiểm chứng rule.
- Cả 50 customer có cùng job summary `! AUTO SERVICE`, next_date/last_date `09/17/2020`. Chưa dùng summary này làm bằng chứng lịch job thực tế.
- Đủ 20 customer FL Routing Test 01–20, ID 15520–15539.
- Trong nhóm FL Routing Test, tag VIP xuất hiện ở 02, 04, 08, 10; các customer còn lại trả tags=null.

## Danh sách 50 customer trong HAR

| Customer ID | Tên customer | Trạng thái | Tag | Địa chỉ service |
|---|---|---|---|---|
| 15505 | 8 | Active | — | 8th Avenue, Brooklyn, NY 5554 |
| 15506 | Alexander | Active | — | 14500 Miramar Parkway, Miramar, FL 33027 |
| 15374 | Bruce Wayne | Active | — | 3400 US Hwy 27 N, Sebring, FL 33870 |
| 15376 | Clark Kent | Active | — | 500 Lakeview Dr, Sebring, FL 33870 |
| 15369 | Cole Palmer | Active | — | 1200 High Rd, Tallahassee, FL 32304 |
| 15520 | FL Routing Test 01 | Active | — | Vero Beach (Routing Test Location), Vero Beach, FL 32960 |
| 15521 | FL Routing Test 02 | Active | VIP | Melbourne (Routing Test Location), Melbourne, FL 32901 |
| 15522 | FL Routing Test 03 | Active | — | Kissimmee (Routing Test Location), Kissimmee, FL 34741 |
| 15523 | FL Routing Test 04 | Active | VIP | Fort Pierce (Routing Test Location), Fort Pierce, FL 34950 |
| 15524 | FL Routing Test 05 | Active | — | Titusville (Routing Test Location), Titusville, FL 32796 |
| 15525 | FL Routing Test 06 | Active | — | Lakeland (Routing Test Location), Lakeland, FL 33801 |
| 15526 | FL Routing Test 07 | Active | — | Clearwater (Routing Test Location), Clearwater, FL 33756 |
| 15527 | FL Routing Test 08 | Active | VIP | Tampa (Routing Test Location), Tampa, FL 33602 |
| 15528 | FL Routing Test 09 | Active | — | Orlando (Routing Test Location), Orlando, FL 32801 |
| 15529 | FL Routing Test 10 | Active | VIP | Cocoa (Routing Test Location), Cocoa, FL 32922 |
| 15530 | FL Routing Test 11 | Active | — | Port St. Lucie (Routing Test Location), Port St. Lucie, FL 34983 |
| 15531 | FL Routing Test 12 | Active | — | West Palm Beach (Routing Test Location), West Palm Beach, FL 33401 |
| 15532 | FL Routing Test 13 | Active | — | Miami (Routing Test Location), Miami, FL 33130 |
| 15533 | FL Routing Test 14 | Active | — | Deerfield Beach (Routing Test Location), Deerfield Beach, FL 33073 |
| 15534 | FL Routing Test 15 | Active | — | Fort Lauderdale (Routing Test Location), Fort Lauderdale, FL 33301 |
| 15535 | FL Routing Test 16 | Active | — | Hollywood (Routing Test Location), Hollywood, FL 33020 |
| 15536 | FL Routing Test 17 | Active | — | Boca Raton (Routing Test Location), Boca Raton, FL 33432 |
| 15537 | FL Routing Test 18 | Active | — | Stuart (Routing Test Location), Stuart, FL 34994 |
| 15538 | FL Routing Test 19 | Active | — | Sebastian (Routing Test Location), Sebastian, FL 32958 |
| 15539 | FL Routing Test 20 | Active | — | Jupiter (Routing Test Location), Jupiter, FL 33458 |
| 15368 | Florian Wirtz | Active | — | 800 Ocala Rd, Tallahassee, FL 32304 |
| 14786 | Forest | Active | — | Logan Airport Terminal B, Boston, MA 02128 |
| 15372 | John Wick | Active | — | 2205 US Highway 27 S, Sebring, FL 33870 |
| 15371 | Julian Alvarez | Active | — | 1800 Jackson Bluff Rd, Tallahassee, FL 32304 |
| 14780 | Lam | Active | — | Rotonda Boulevard West, Rotonda West, FL 33947 |
| 15367 | Lamine Yamal | Active | — | 1600 W Tharpe St, Tallahassee, FL 32303 |
| 14787 | Messi | Active | — | Myakka Street Northeast, Palm Bay, FL 32907 |
| 15508 | Miller | Active | — | 3475 Northwest 191st Street, Miami Gardens, FL 33056 |
| 14783 | Minh | Active | — | Myakka Street Northeast, Palm Bay, FL 32907 |
| 14773 | Name 1 | Active | — | Đường Ung Văn Khiêm, Thành phố Hồ Chí Minh, Hồ Chí Minh 5555 |
| 14866 | NaplesAuto_1 Test | Active | VIP | 8950 Tamiami Trail N, Naples, FL 34108 |
| 14867 | NaplesAuto_2 Test | Active | VIP | 26811 Tamiami Trail S, Bonita Springs, FL 34134 |
| 14868 | NaplesAuto_3 Test | Active | VIP | 11911 Collier Blvd, Naples, FL 34116 |
| 14869 | NaplesAuto_4 Test | Active | VIP | 4915 Golden Gate Pkwy, Naples, FL 34116 |
| 14870 | NaplesAuto_5 Test | Active | VIP | 7785 Davis Blvd, Naples, FL 34104 |
| 15375 | Peter Parker | Active | — | 150 Arbuckle Creek Rd, Sebring, FL 33870 |
| 15370 | Rodrygo Goes | Active | — | 500 Mississippi St, Tallahassee, FL 32304 |
| 15510 | Rostova | Active | — | 7900 Northwest 183rd Street, Miami Gardens, FL 33055 |
| 15507 | Sterling | Active | — | 10100 Pines Boulevard, Pembroke Pines, FL 33026 |
| 14779 | System | Active | — | Manasota Beach Road, Englewood, FL 5555 |
| 14861 | Test6 Routing | Active | — | 300 Parade Cir, Rotonda West, FL 33947 |
| 14857 | TestAuto_2 Routing | Active | — | 250 S Indiana Ave, Englewood, FL 34223 |
| 14858 | TestAuto_3 Routing | Active | — | 500 Placida Rd, Englewood, FL 34223 |
| 14859 | TestAuto_4 Routing | Active | — | 1200 Rotonda Blvd W, Rotonda West, FL 33947 |
| 14860 | TestAuto_5 Routing | Active | — | 150 Rebel Ct, Rotonda West, FL 33947 |
