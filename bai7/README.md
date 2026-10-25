# Quản lý nhân sự – Công ty sơn Đông Á (Bài 7)

C# WinForms **.NET Framework 4.7.2**, SQL Server 2016+; UI → Service → Data. Bài nộp gồm source, CSDL, UML, dữ liệu mẫu và truy vết kiểm thử. Không cần NuGet.

## Chạy trên Windows

1. Cài Visual Studio 2022, workload .NET desktop development và .NET Framework 4.7.2 targeting pack. Cài SQL Server Express/Developer và SSMS.
2. Trong SSMS, chạy lần lượt `database/01_schema.sql` → `02_rules.sql` → `03_workflows.sql` → `04_vouchers.sql` → `05_seed.sql` trên database mới. Script không xóa dữ liệu; seed chỉ chạy một lần.
3. Mở `QuanLyNhanSuDongA.sln`. Sửa `src/App.config`: `Data Source=.\SQLEXPRESS` thành instance của bạn. Dùng Windows Authentication; không đưa mật khẩu vào GitHub.
4. Build Solution rồi F5. Chọn bảng để xem/thêm/sửa; gõ từ khóa rồi Tìm. Xuất CSV mở bằng Excel.
5. Chọn bảng BangLuong, dòng BL012026, thao tác Tính lương → Thực hiện. Xem ChiTietBangLuong: **10.632.000 đồng**.

## Cấu trúc

- `src/UI`: MainForm quản lý hồ sơ, EditorForm nhập dữ liệu theo metadata với kiểm tra kiểu dữ liệu.
- `src/Service`: HrService kiểm tra bảng/cột cho phép, trạng thái, điều phối nghiệp vụ.
- `src/Data`: Database truy cập ADO.NET bằng tham số; không có SQL trong UI.
- `src/Domain`: 22 lớp theo UML, QuyetDinh trừu tượng, 5 lớp kế thừa.
- `database`: 22 bảng chính + bảng phân bổ và căn cứ. Các stored procedure là phần thực thi giao dịch của tầng Data.
- `docs`: UML draw.io XML, đề bài, ánh xạ lớp, ma trận truy vết, test cases.
- `tests`: kiểm thử tích hợp SQL có assertion; báo cáo kiểm tra bản dựng.

## Cách nhập và quy ước

Khóa ngoại nhập bằng mã, tra ở bảng tương ứng. Ngày `yyyy-MM-dd`, giờ `HH:mm`, số thập phân dấu chấm. Trường có thể trống được đánh dấu. Form dùng chung cho toàn bộ danh mục/hồ sơ, không phải 22 form thiết kế riêng. Không có xóa dữ liệu lịch sử; lưu quyết định mới khi tăng lương/bổ nhiệm.

- Trạng thái khi thêm: `Nhap`, nhân viên `ThuViec`; quyết định tuyển dụng: kết quả `Cho`, sau đó chọn Thử việc đạt/không đạt.
- Quyết định: thêm QuyetDinh gốc trước, thêm đúng một bảng con với cùng soQuyetDinh. Chọn lại bảng gốc, Ký quyết định, nhập người ký và ngày. Sau ký không sửa nội dung bằng form.
- Khen thưởng/kỷ luật: `loaiDoiTuong=CaNhan` hoặc `TapThe`; chỉ nhập maNhanVien hoặc maPhongBan, trường còn lại để trống. `phuongThucChi/Thu=TrucTiep` hoặc `QuaLuong`.
- Hợp đồng: `DaiHan` hoặc `NganHan`; ngày ký sau ngày kết thúc thử việc, kết quả đạt. Thêm hồ sơ BHYT/BHXH cho dài hạn, thêm và ký quyết định lương, rồi Hoàn tất hợp đồng. Bảo hiểm chuyển HieuLuc khi hoàn tất.
- Phụ trội: `TangCa`, `NgayLe`, `NgayNghi`, hệ số cố định 1.5 theo đề. Thêm phiếu và chi tiết, chọn Xác nhận phụ trội.
- Thưởng/phạt qua lương: thêm phiếu Nhap, nhập PhanBoThuong/PhanBoPhat (cả cá nhân và tập thể), tổng bằng tiền phiếu. Xác nhận phiếu trước khi tính lương. Phiếu trực tiếp không đưa vào bảng lương.
- Bảng lương: Nhap → Tính lương → DaTinh (khóa). Không tính lại; các chi tiết lương/căn cứ chỉ xem.

## Công thức và giả định của bài tập

Giờ công chuẩn nhập ở BangLuong (mẫu 208). Mỗi ngày lấy quyết định lương/chức vụ đã ký có hiệu lực; thiếu/trùng quyết định lương thì từ chối. Lương theo công và phụ cấp = tổng giờ thường × mức áp dụng ngày đó / giờ chuẩn. Phụ trội = giờ × lương cơ bản/giờ chuẩn × 1.5. Làm tròn đồng sau tổng hợp. Bảo hiểm lấy mức/tỷ lệ do người dùng nhập còn hiệu lực cuối tháng; dữ liệu 1.5% và 8% chỉ để minh họa, không là tư vấn pháp luật. Không tính thuế TNCN vì đề không yêu cầu.

Tổng thực lĩnh = lương theo công + phụ cấp + phụ trội + thưởng qua lương − phạt qua lương − BHYT − BHXH. Mức luongCoBanApDung là mức cao nhất trong tháng để hiển thị; CanCuLuong lưu tất cả quyết định thực tế áp dụng. Phân bổ chưa thanh toán được đưa vào kỳ có công gần nhất, không bị đưa vào hai kỳ.

## Kiểm thử và giới hạn xác minh

Xem `tests/VERIFICATION.md`, chạy `tests/Integration.sql` **trên database thử nghiệm sau seed, trước tính lương thủ công**. Script rollback thay đổi. Kịch bản thủ công trong docs/TestCases.csv. Không đánh dấu PASS cho kịch bản chưa chạy trên SQL Server/Windows. Đây là ứng dụng bài tập chạy nội bộ, chưa có đăng nhập/phân quyền thực thi; actor UML là vai trò nghiệp vụ. Cần chạy kiểm thử tích hợp và chụp màn hình trên Windows trước khi nộp.

## Đưa lên GitHub

Giải nén folder, mở repository GitHub của bạn → Add file → Upload files → kéo toàn bộ nội dung folder (không kéo file ZIP), Commit changes. Hoặc mở folder bằng GitHub Desktop, Create repository rồi Publish repository. Không đưa bin/obj/.vs hoặc thông tin đăng nhập lên kho mã. Điền họ tên/MSSV/lớp của bạn vào báo cáo trước khi nộp.
