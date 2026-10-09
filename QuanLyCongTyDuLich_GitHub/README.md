# Bài 6 – Quản lý công ty du lịch | C# WinForms + SQL Server

Dự án bài thực hành Phân tích thiết kế hướng đối tượng – triển khai từ đề **Bài 6: Quản lý công ty du lịch**, và đối chiếu với tài liệu UML đã làm.

## Công nghệ
- C# WinForms, **.NET Framework 4.7.2**, Visual Studio 2019/2022 trên **Windows** (cài workload `.NET desktop development` và targeting pack 4.7.2).
- SQL Server 2017+ (SQL Express hoặc Developer), Windows Authentication, ADO.NET (`System.Data.SqlClient`).
- Không cần NuGet, không dùng Entity Framework, không dùng .NET 6/8.

## Thư mục
```
TravelManager.sln
src/TravelManager/
  UI/            # Form màn hình, không viết câu SQL trực tiếp
  Services/      # Kiểm tra quy tắc, giao dịch, tính lương
  Data/          # ADO.NET, SQL parameter, repository
  Models/        # DTO của các nghiệp vụ
  App.config     # Kết nối SQL Server
  TravelManager.csproj
 database/       # schema → seed → đối soát
 docs/uml/       # class/use case/activity/sequence PlantUML
 docs/TRACEABILITY.md
 tests/TEST_CASES.md
```

## Chạy từng bước
1. Mở **SQL Server Management Studio (SSMS)**, kết nối SQL Server. Chạy `database/01_schema.sql`, sau đó `database/02_seed.sql` trên cùng instance.
2. Mở `src/TravelManager/App.config`: chỉnh `Data Source=.\\SQLEXPRESS` thành instance máy bạn, ví dụ `.` hoặc `DESKTOP-ABC\\SQLEXPRESS`; giữ `Initial Catalog=QuanLyCongTyDuLich`.
3. Mở `TravelManager.sln` bằng Visual Studio 2022. Nếu báo thiếu framework, cài `.NET Framework 4.7.2 targeting pack` trong Visual Studio Installer.
4. `Build → Build Solution`, sau đó nhấn **F5**. Dùng màn hình quản lý Tour, Chuyến, Khách hàng, HDV và các nghiệp vụ.
5. Kiểm thử theo `tests/TEST_CASES.md`, chạy `database/03_test_queries.sql` để kiểm chứng dữ liệu.

## Nghiệp vụ và lưu ý về phạm vi
- **Giả định giải quyết chỗ trống của đề:** khách lẻ 1–11; khách đoàn từ **12 người**. Đề gốc ghi dưới 12 và *trên 12*, chưa nói đúng 12. Bài UML tham khảo dùng ≥12.
- Mỗi phiếu khách lẻ thuộc một chuyến; tạo phiếu là thu đủ vé. Mỗi phiếu khách đoàn chọn ngày riêng; lập phiếu yêu cầu cọc dương, lưu thu cọc cùng transaction.
- Sức chứa chuyến kiểm tra trong transaction SERIALIZABLE; HDV bị ngăn phân công khi lịch trùng.
- Đoàn hủy mất cọc; hệ thống không tự sinh hoàn tiền. Hoàn tiền riêng là thao tác thủ công của nhân viên, cần xác nhận theo chính sách thực tế.
- Để tạo khảo sát, trước tiên phiếu phải được đánh dấu HOAN_THANH sau ngày kết thúc.
- Các màn hình danh mục CRUD tổng quát dùng textbox nhập giá trị; kiểu ngày yêu cầu dạng `YYYY-MM-DD`, bit nhập `0/1`, khóa ngoại nhập số ID. Đây là giao diện học phần, chưa tối ưu trải nghiệm người dùng.
- **Chưa có phân quyền/đăng nhập, xuất báo cáo, in hóa đơn, gửi email/web, tự động lương qua các chuyến lẻ chung HDV.** Không coi đây là hệ thống triển khai sản xuất.

## GitHub
Tạo repository trống trên GitHub, giải nén folder này và mở terminal ngay tại thư mục có `.gitignore`:
```bash
git init
git add .
git commit -m "Implement travel manager three-layer WinForms project"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```
Không đưa mật khẩu SQL Server vào git. Nếu chưa cài Git, có thể dùng **Visual Studio → Git → Create Git Repository**.

## Chưa xác minh chạy thực tế
Gói được tạo dưới Linux không có MSBuild/.NET Framework hoặc SQL Server Windows, nên **chưa xác nhận build F5 hay chạy các test ca trên Windows**. Đây là source project hoàn chỉnh để bạn mở, chỉnh connection string, build và thực nghiệm trên máy Windows; nếu có lỗi build/runtime gửi ảnh Error List để sửa chính xác.
