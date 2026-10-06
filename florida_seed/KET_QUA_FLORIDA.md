# Customer và job Florida đã tạo

Customer: 20/20. Job: 44/44. Job đã GET readback xác nhận: 44.

Schedule 31 (Lam); ngày 09–31/10/2026; service ngẫu nhiên và thời lượng theo template. Không yêu cầu notify customer/technician. Job một lần, không recurring và không locked.

Location là điểm test tại trung tâm thành phố, không phải địa chỉ nhà khách hàng thực. Tọa độ/mã ZIP tra OpenStreetMap. Thời gian lái xe do OSRM ước tính, chưa tính traffic; điều kiện15–120 phút áp dụng cho19 cặp liên tiếp theo thứ tự bảng, không áp dụng mọi cặp hoặc thứ tự job trên lịch. Job được xếp không trùng giờ, nhưng khoảng nghỉ15 phút không bảo đảm đủ thời gian lái xe giữa mọi job.

| # | Customer | Customer ID | Location ID | Thành phố | ZIP | Chặng từ location trước (phút) | Số job đã tạo |
|---|---|---|---|---|---|---|---|
| 1 | FL Routing Test 01 | 15520 | 15527 | Vero Beach | 32960 | — | 3 |
| 2 | FL Routing Test 02 | 15521 | 15528 | Melbourne | 32901 | 53.7 | 2 |
| 3 | FL Routing Test 03 | 15522 | 15529 | Kissimmee | 34741 | 77.0 | 1 |
| 4 | FL Routing Test 04 | 15523 | 15530 | Fort Pierce | 34950 | 119.0 | 3 |
| 5 | FL Routing Test 05 | 15524 | 15531 | Titusville | 32796 | 110.3 | 2 |
| 6 | FL Routing Test 06 | 15525 | 15532 | Lakeland | 33801 | 115.9 | 3 |
| 7 | FL Routing Test 07 | 15526 | 15533 | Clearwater | 33756 | 78.3 | 1 |
| 8 | FL Routing Test 08 | 15527 | 15534 | Tampa | 33602 | 37.4 | 3 |
| 9 | FL Routing Test 09 | 15528 | 15535 | Orlando | 32801 | 98.5 | 3 |
| 10 | FL Routing Test 10 | 15529 | 15536 | Cocoa | 32922 | 60.2 | 3 |
| 11 | FL Routing Test 11 | 15530 | 15537 | Port St. Lucie | 34983 | 100.5 | 3 |
| 12 | FL Routing Test 12 | 15531 | 15538 | West Palm Beach | 33401 | 62.6 | 1 |
| 13 | FL Routing Test 13 | 15532 | 15539 | Miami | 33130 | 88.5 | 3 |
| 14 | FL Routing Test 14 | 15533 | 15540 | Deerfield Beach | 33073 | 52.1 | 1 |
| 15 | FL Routing Test 15 | 15534 | 15541 | Fort Lauderdale | 33301 | 25.7 | 2 |
| 16 | FL Routing Test 16 | 15535 | 15542 | Hollywood | 33020 | 16.8 | 2 |
| 17 | FL Routing Test 17 | 15536 | 15543 | Boca Raton | 33432 | 38.2 | 3 |
| 18 | FL Routing Test 18 | 15537 | 15544 | Stuart | 34994 | 79.9 | 3 |
| 19 | FL Routing Test 19 | 15538 | 15545 | Sebastian | 32958 | 75.8 | 1 |
| 20 | FL Routing Test 20 | 15539 | 15546 | Jupiter | 33458 | 92.8 | 1 |

## Job

Thời gian giữ nguyên clock/offset API +00:00 theo convention HAR; không chuyển sang múi giờ máy người dùng.

| Customer # | Job ID | Event ID | Service | Bắt đầu | Kết thúc | Readback |
|---|---|---|---|---|---|---|
| 1 | 8499 | 8495 | Every 21 Days | 2026-10-29T11:15:00+00:00 | 2026-10-29T11:45:00+00:00 | OK |
| 1 | 8500 | 8496 | Eco-Friendly Pest Solutions | 2026-10-23T14:45:00+00:00 | 2026-10-23T15:45:00+00:00 | OK |
| 1 | 8501 | 8497 | Quarterly Service | 2026-10-21T14:00:00+00:00 | 2026-10-21T14:30:00+00:00 | OK |
| 2 | 8502 | 8498 | Flea & Tick Control | 2026-10-11T15:15:00+00:00 | 2026-10-11T15:45:00+00:00 | OK |
| 2 | 8503 | 8499 | Call Back Service | 2026-10-13T12:00:00+00:00 | 2026-10-13T12:15:00+00:00 | OK |
| 3 | 8504 | 8500 | Flea & Tick Control | 2026-10-09T09:00:00+00:00 | 2026-10-09T09:30:00+00:00 | OK |
| 4 | 8505 | 8501 | Flea & Tick Control | 2026-10-18T14:30:00+00:00 | 2026-10-18T15:00:00+00:00 | OK |
| 4 | 8506 | 8502 | Initial Service | 2026-10-17T08:00:00+00:00 | 2026-10-17T09:00:00+00:00 | OK |
| 4 | 8507 | 8503 | Every 21 Days | 2026-10-20T15:30:00+00:00 | 2026-10-20T16:00:00+00:00 | OK |
| 5 | 8508 | 8504 | Call Back Service | 2026-10-13T10:15:00+00:00 | 2026-10-13T10:30:00+00:00 | OK |
| 5 | 8509 | 8505 | Call Back Service | 2026-10-25T11:30:00+00:00 | 2026-10-25T11:45:00+00:00 | OK |
| 6 | 8510 | 8506 | Flea & Tick Control | 2026-10-09T10:15:00+00:00 | 2026-10-09T10:45:00+00:00 | OK |
| 6 | 8511 | 8507 | Wildlife Trapping & Relocation | 2026-10-30T13:15:00+00:00 | 2026-10-30T15:15:00+00:00 | OK |
| 6 | 8512 | 8508 | Preventative Monitoring & Maintenance | 2026-10-12T16:15:00+00:00 | 2026-10-12T16:45:00+00:00 | OK |
| 7 | 8513 | 8509 | Every 21 Days | 2026-10-27T11:45:00+00:00 | 2026-10-27T12:15:00+00:00 | OK |
| 8 | 8514 | 8510 | Call Back Service | 2026-10-26T09:00:00+00:00 | 2026-10-26T09:15:00+00:00 | OK |
| 8 | 8515 | 8511 | Termite Baiting & Monitoring | 2026-10-31T10:00:00+00:00 | 2026-10-31T11:00:00+00:00 | OK |
| 8 | 8516 | 8512 | Wildlife Trapping & Relocation | 2026-10-26T13:30:00+00:00 | 2026-10-26T15:30:00+00:00 | OK |
| 9 | 8517 | 8513 | Preventative Monitoring & Maintenance | 2026-10-12T17:15:00+00:00 | 2026-10-12T17:45:00+00:00 | OK |
| 9 | 8518 | 8514 | Rodent Control & Exclusion | 2026-10-25T14:00:00+00:00 | 2026-10-25T15:00:00+00:00 | OK |
| 9 | 8519 | 8515 | Rodent Control & Exclusion | 2026-10-28T13:30:00+00:00 | 2026-10-28T14:30:00+00:00 | OK |
| 10 | 8520 | 8516 | Monthly Service | 2026-10-25T12:30:00+00:00 | 2026-10-25T12:45:00+00:00 | OK |
| 10 | 8521 | 8517 | Eco-Friendly Pest Solutions | 2026-10-28T15:45:00+00:00 | 2026-10-28T16:45:00+00:00 | OK |
| 10 | 8522 | 8518 | Follow Up Inspections | 2026-10-10T11:00:00+00:00 | 2026-10-10T11:30:00+00:00 | OK |
| 11 | 8523 | 8519 | Flea & Tick Control | 2026-10-29T15:30:00+00:00 | 2026-10-29T16:00:00+00:00 | OK |
| 11 | 8524 | 8520 | Termite Baiting & Monitoring | 2026-10-24T08:45:00+00:00 | 2026-10-24T09:45:00+00:00 | OK |
| 11 | 8525 | 8521 | Wasp Nest Removal | 2026-10-10T12:15:00+00:00 | 2026-10-10T13:15:00+00:00 | OK |
| 12 | 8526 | 8522 | Follow Up Inspections | 2026-10-24T08:00:00+00:00 | 2026-10-24T08:30:00+00:00 | OK |
| 13 | 8527 | 8523 | Call Back Service | 2026-10-13T13:45:00+00:00 | 2026-10-13T14:00:00+00:00 | OK |
| 13 | 8528 | 8524 | Every 21 Days | 2026-10-27T10:30:00+00:00 | 2026-10-27T11:00:00+00:00 | OK |
| 13 | 8529 | 8525 | Preventative Monitoring & Maintenance | 2026-10-19T12:30:00+00:00 | 2026-10-19T13:00:00+00:00 | OK |
| 14 | 8530 | 8526 | Wildlife Trapping & Relocation | 2026-10-27T14:15:00+00:00 | 2026-10-27T16:15:00+00:00 | OK |
| 15 | 8531 | 8527 | Flea & Tick Control | 2026-10-13T13:00:00+00:00 | 2026-10-13T13:30:00+00:00 | OK |
| 15 | 8532 | 8528 | Wasp Nest Removal | 2026-10-10T16:15:00+00:00 | 2026-10-10T17:15:00+00:00 | OK |
| 16 | 8533 | 8529 | Wildlife Trapping & Relocation | 2026-10-23T08:30:00+00:00 | 2026-10-23T10:30:00+00:00 | OK |
| 16 | 8534 | 8530 | Call Back Service | 2026-10-29T13:15:00+00:00 | 2026-10-29T13:30:00+00:00 | OK |
| 17 | 8535 | 8531 | Flea & Tick Control | 2026-10-24T16:15:00+00:00 | 2026-10-24T16:45:00+00:00 | OK |
| 17 | 8536 | 8532 | Quarterly Pest Control | 2026-10-14T14:00:00+00:00 | 2026-10-14T15:00:00+00:00 | OK |
| 17 | 8537 | 8533 | Every 21 Days | 2026-10-21T12:30:00+00:00 | 2026-10-21T13:00:00+00:00 | OK |
| 18 | 8538 | 8534 | Termite Baiting & Monitoring | 2026-10-20T12:30:00+00:00 | 2026-10-20T13:30:00+00:00 | OK |
| 18 | 8539 | 8535 | Bed Bug Heat Treatment | 2026-10-12T11:45:00+00:00 | 2026-10-12T15:45:00+00:00 | OK |
| 18 | 8540 | 8536 | Rodent Control & Exclusion | 2026-10-17T15:00:00+00:00 | 2026-10-17T16:00:00+00:00 | OK |
| 19 | 8541 | 8537 | Rodent Control & Exclusion | 2026-10-10T13:45:00+00:00 | 2026-10-10T14:45:00+00:00 | OK |
| 20 | 8542 | 8538 | Call Back Service | 2026-10-31T17:00:00+00:00 | 2026-10-31T17:15:00+00:00 | OK |
