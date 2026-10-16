# Truy vết yêu cầu → hiện thực → kiểm thử

| Yêu cầu | Form | Service | Bảng CSDL | Test |
|---|---|---|---|---|
| Đăng ký lần đầu | FrmDangKyLanDau | DangKyService | BENHNHAN, PHIEUDANGKY, LEPHINAM, HOSOBENHAN | TC01, TC02 |
| Tra cứu lịch sử | FrmTraCuuHoSo | HoSoService | HOSOBENHAN, PHIEUKHAM | TC03 |
| Lịch định kỳ theo quý | FrmLichHen | LichHenService | LICHHEN | TC04, TC05 |
| Ghi nhận khám | FrmKhamBenh | KhamBenhService | PHIEUKHAM | TC06 |
| Xét nghiệm | FrmKhamBenh | KhamBenhService | XETNGHIEM | TC06 |
| Lập toa | FrmLapToaThuoc | ToaThuocService | TOATHUOC, CHITIETTOATHUOC | TC07 |
| Hoàn tất sau thanh toán | FrmThanhToan | KhamBenhService | THANHTOANVIENPHI, PHIEUKHAM | TC08, TC09 |
