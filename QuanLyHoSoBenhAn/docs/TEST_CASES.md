# Test cases

| ID | Kịch bản | Dữ liệu | Kết quả mong đợi |
|---|---|---|---|
| TC01 | Đăng ký lần đầu hợp lệ | Nguyễn Văn Bình, 0909000001, lệ phí 1.200.000 | Tạo BENHNHAN + PHIEUDANGKY + LEPHINAM + HOSOBENHAN |
| TC02 | Đăng ký trùng điện thoại | 0909000001 | UNIQUE báo lỗi, transaction rollback |
| TC03 | Tra cứu lịch sử | Mã hồ sơ hợp lệ | Hiển thị các PHIEUKHAM |
| TC04 | Lịch định kỳ quý 4/2026 | 20/11/2026 | Tạo thành công |
| TC05 | Đặt trùng lịch định kỳ cùng quý | cùng bệnh nhân, quý 4/2026 | Bị chặn |
| TC06 | Tạo xét nghiệm | MaPhieuKham hợp lệ | XETNGHIEM có FK đúng |
| TC07 | Lập toa thuốc | MaPhieuKham hợp lệ | TOATHUOC + CHITIETTOATHUOC được tạo |
| TC08 | Hoàn tất khi chưa thanh toán | phiếu đang khám | Không cập nhật trực tiếp qua UI |
| TC09 | Thanh toán rồi hoàn tất | 500.000 | Tạo THANHTOANVIENPHI + PHIEUKHAM=Hoàn tất |
| TC10 | FK sai | MaPhieuKham không tồn tại | SQL Server từ chối |
