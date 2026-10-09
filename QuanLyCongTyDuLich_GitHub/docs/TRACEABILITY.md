# Ma trận truy vết yêu cầu → UML → Form/Service → CSDL → Test

| Yêu cầu | UML | Form → Service/Repo | Bảng SQL | Test |
|---|---|---|---|---|
| REQ-01 Quản lý tour | class Tour, use case Quản lý tour | GridForm → CrudRepository | Tour | TC-01 |
| REQ-02 Quản lý chuyến & lịch | Tour–ChuyenDi | GridForm → CrudRepository | ChuyenDi | TC-02 |
| REQ-03 Đăng ký khách lẻ / mua vé | activity, use case Đăng ký chuyến lẻ | BookingForm → TravelService.Register | KhachHang,ChuyenDi,PhieuDangKy,ThanhToan | TC-03,04 |
| REQ-04 Đăng ký khách đoàn / cọc | sequence, class KhachDoan | BookingForm → TravelService.Register | Tour,PhieuDangKy,KhachDoan,ThanhToan | TC-05,06 |
| REQ-05 Không vượt sức chứa | activity | BookingForm → TravelService.Register | ChuyenDi,PhieuDangKy | TC-07 |
| REQ-06 Phân công không trùng lịch | use case Phân công HDDL, class PhanCong | AssignmentForm → TravelService.Assign | NhanVienHDDL,PhanCong,PhieuDangKy,Tour | TC-08 |
| REQ-07 Thanh toán/hủy đoàn | activity | PaymentForm → TravelService.Pay/Cancel | PhieuDangKy,ThanhToan | TC-09,10 |
| REQ-08 Tính lương hướng dẫn viên | use case Tính lương | SalaryForm → TravelService.Salary | NhanVienHDDL,PhanCong,PhieuDangKy | TC-11 |
| REQ-09 Khảo sát sau chuyến | use case Khảo sát | PaymentForm → TravelService.Survey | PhieuKhaoSat,PhieuDangKy | TC-12 |
| REQ-10 Quản lý tuyến/nơi dừng/điểm tham quan | class TourChang,NoiDungChan,DiemThamQuan | GridForm → CrudRepository | TourChang,NoiDungChan,DiemThamQuan,TourDiemThamQuan | TC-13 |
| REQ-11 Bảo hiểm & danh sách đoàn | class NguoiDuLich | BookingForm → TravelService.Register | NguoiDuLich,PhieuDangKy | TC-14 |

Ghi chú: UML là PlantUML dạng văn bản có thể kết xuất ảnh. Các mô hình phản ánh **thiết kế triển khai** và có bổ sung một số lớp liên kết/bảng để chuẩn hóa quan hệ n-n so với hình UML tham khảo. Cần đối chiếu trực tiếp với file bài làm trước khi nộp nếu giảng viên yêu cầu giữ nguyên mô hình gốc.
