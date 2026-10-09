# Bộ kiểm thử kịch bản có dữ liệu cụ thể

**Điều kiện:** Chạy `01_schema.sql`, `02_seed.sql`; chọn dữ liệu tour/khách có trong seed. Test thao tác trên SQL Server Windows; khi test tuần tự, hoàn nguyên DB hoặc lập DB mới để tránh ảnh hưởng số lượng đã đặt. Tình trạng dưới đây: **chưa thực thi tự động trong môi trường Windows/SQL Server**.

| Mã | Thao tác / dữ liệu | Kết quả mong đợi |
|---|---|---|
| TC-01 | Tour → thêm `Cần Thơ 2 ngày`, 2 ngày, 1 đêm, 1.500.000 | Có dòng trong Tour; số âm bị CHECK chặn |
| TC-02 | Chuyến đi → MaTour Đà Lạt, NgayDi `2027-03-10`, NgayVe `2027-03-12`, SoCho=20 | Sinh MaChuyen; ngày về trước ngày đi bị chặn |
| TC-03 | Khách lẻ An, Tour Đà Lạt, chuyến 2027-01-10, SoNguoi=2 | Tạo phiếu LE, TongTien=5.000.000; thanh toán VE=5.000.000 |
| TC-04 | Khách lẻ An, SoNguoi=12 | Báo lỗi phân loại; không thêm phiếu |
| TC-05 | Khách đoàn Công ty Minh Anh, Tour Phú Quốc, SoNguoi=15, NgayDi `2027-04-01`, cọc 10.000.000, người đại diện Minh, đón Thủ Đức | Tạo phiếu DOAN, TongTien=67.500.000, KhachDoan, ThanhToan COC=10.000.000 |
| TC-06 | Khách đoàn trên, cọc=0 | Báo lỗi và rollback toàn bộ |
| TC-07 | Chuyến Phú Quốc 25 chỗ, lần lượt đặt 20 rồi 6 khách | Lần hai bị chặn vì vượt sức chứa |
| TC-08 | Phân công HDV Lê Quốc Hùng cho đoàn 2027-04-01 dài 4 ngày, và đoàn khác 2027-04-03 | Không cho phân công trùng lịch |
| TC-09 | Phiếu đoàn TC-05 trả thêm 57.500.000 `QUYET_TOAN` | Công nợ còn 0; trả dư bị chặn |
| TC-10 | Hủy một phiếu đoàn mới sau cọc | TrangThai=HUY; cọc được giữ, không tự hoàn tiền |
| TC-11 | Nhân viên lương 8.000.000, một phân công lương tour 1.500.000, phiếu HOAN_THANH cùng tháng | Lương tổng 9.500.000 |
| TC-12 | Khảo sát phiếu đang DA_XAC_NHAN (điểm 5) → sau HOAN_THANH | Trước: từ chối; sau: thêm phiếu khảo sát thành công |
| TC-13 | Thêm nơi dừng chân MaTour Đà Lạt, ThuTu=2, Có khách sạn, LoaiKhachSan=3 | Lưu được; sao=6 bị CHECK chặn |
| TC-14 | Đoàn 12 khách mua bảo hiểm; danh sách 12 tên | Hệ thống yêu cầu đủ 12 tên và lưu NguoiDuLich |

**Đối soát DB:** sau các test chạy `database/03_test_queries.sql`. TC-DB-03 và TC-DB-04 **phải trả 0 dòng**; đây là kiểm tra phát hiện lỗi, không tự khẳng định rằng test đã chạy.
