

---

## 2. Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Ngôn ngữ lập trình | C# |
| Giao diện | Windows Forms |
| Framework | .NET Framework 4.7.2 |
| IDE | Visual Studio 2022 |
| Cơ sở dữ liệu | SQL Server |
| Truy cập dữ liệu | ADO.NET |
| Thiết kế hệ thống | UML / PlantUML |
| Quản lý mã nguồn | GitHub |

---

## 3. Kiến trúc hệ thống

Ứng dụng được xây dựng theo kiến trúc 3 tầng:

```text
+-----------------------------------+
|           UI LAYER                |
|          Windows Forms            |
|                                   |
| MainForm, BookingForm,            |
| PaymentForm, AssignmentForm       |
+-----------------------------------+
                 |
                 v
+-----------------------------------+
|         SERVICE LAYER             |
|        Business Logic             |
|                                   |
| TravelService.cs                  |
| Kiểm tra và xử lý nghiệp vụ       |
+-----------------------------------+
                 |
                 v
+-----------------------------------+
|           DATA LAYER              |
|            ADO.NET                |
|                                   |
| Db.cs, Repositories.cs            |
| Kết nối và truy vấn dữ liệu       |
+-----------------------------------+
                 |
                 v
+-----------------------------------+
|          SQL SERVER               |
|          DATABASE                 |
+-----------------------------------+
```

### Vai trò các tầng

**UI Layer:** Hiển thị giao diện, tiếp nhận thông tin và thao tác của người dùng.

**Service Layer:** Xử lý các quy tắc nghiệp vụ như đăng ký tour, đặt cọc, thanh toán, phân công và tính lương.

**Data Layer:** Thực hiện kết nối, truy vấn và cập nhật dữ liệu trong SQL Server.

**Models:** Chứa các lớp đối tượng đại diện cho dữ liệu hệ thống.

---

## 4. Các chức năng hệ thống

### 4.1. Quản lý Tour

- Thêm thông tin tour.
- Cập nhật thông tin tour.
- Xóa thông tin tour.
- Hiển thị danh sách tour.

### 4.2. Quản lý Chuyến đi

- Quản lý lịch khởi hành.
- Quản lý ngày đi và ngày về.
- Theo dõi thông tin chuyến đi.

### 4.3. Quản lý Khách hàng

- Quản lý thông tin khách lẻ.
- Quản lý thông tin khách đoàn.
- Lưu trữ thông tin khách hàng.

### 4.4. Đăng ký Tour

**Khách lẻ:**
- Đăng ký theo chuyến đi.
- Kiểm tra sức chứa chuyến đi.
- Thanh toán tiền vé.

**Khách đoàn:**
- Đăng ký theo tour.
- Lựa chọn ngày khởi hành.
- Cung cấp thông tin đoàn.
- Ghi nhận tiền đặt cọc.

Quy ước triển khai: 1–11 người là khách lẻ, từ 12 người là khách đoàn.

### 4.5. Thanh toán

- Ghi nhận tiền đặt cọc.
- Quản lý các khoản thanh toán.
- Theo dõi trạng thái đăng ký.
- Hỗ trợ quyết toán.

### 4.6. Phân công Hướng dẫn viên

- Quản lý thông tin hướng dẫn viên.
- Phân công hướng dẫn viên cho chuyến đi hoặc đoàn.
- Kiểm tra lịch phân công trùng nhau.

### 4.7. Quản lý Lương

- Quản lý lương cơ bản.
- Tính lương dựa trên công việc hướng dẫn tour.

### 4.8. Khảo sát

- Lưu thông tin đánh giá và góp ý.
- Quản lý phản hồi của khách sau chuyến đi.

---

## 5. Cấu trúc thư mục Project

```text
QuanLyCongTyDuLich_GitHub/
│
├── TravelManager.sln
├── README.md
├── .gitignore
│
├── src/
│   └── TravelManager/
│       │
│       ├── TravelManager.csproj
│       ├── App.config
│       ├── Program.cs
│       │
│       ├── UI/
│       │   ├── MainForm.cs
│       │   ├── GridForm.cs
│       │   ├── BookingForm.cs
│       │   ├── AssignmentForm.cs
│       │   ├── PaymentForm.cs
│       │   └── SalaryForm.cs
│       │
│       ├── Services/
│       │   └── TravelService.cs
│       │
│       ├── Data/
│       │   ├── Db.cs
│       │   └── Repositories.cs
│       │
│       ├── Models/
│       │   └── Entities.cs
│       │
│       └── Properties/
│
├── database/
│   ├── 01_schema.sql
│   ├── 02_seed.sql
│   └── 03_test_queries.sql
│
├── docs/
│   ├── TRACEABILITY.md
│
├── tests/
│   ├── TEST_CASES.md
│

```

### Giải thích các thư mục

| Thư mục | Chức năng |
|---|---|
| src/TravelManager/UI | Giao diện Windows Forms |
| src/TravelManager/Services | Xử lý nghiệp vụ |
| src/TravelManager/Data | Truy cập cơ sở dữ liệu |
| src/TravelManager/Models | Định nghĩa các đối tượng |
| database | Script SQL Server |
| docs/uml | Các sơ đồ UML |
| docs/TRACEABILITY.md | Ma trận truy vết yêu cầu |
| tests | Tài liệu và kịch bản kiểm thử |

---

## 6. Thiết kế cơ sở dữ liệu

Hệ thống sử dụng Microsoft SQL Server để lưu trữ dữ liệu.

Các nhóm dữ liệu chính bao gồm:

- Tour du lịch và chuyến đi.
- Khách hàng và phiếu đăng ký.
- Hướng dẫn viên và phân công.
- Thanh toán và đặt cọc.
- Điểm tham quan và hành trình.
- Khảo sát khách hàng.

### Các file SQL

| File | Mô tả |
|---|---|
| 01_schema.sql | Tạo cơ sở dữ liệu, bảng và ràng buộc |
| 02_seed.sql | Thêm dữ liệu mẫu |
| 03_test_queries.sql | Truy vấn kiểm tra dữ liệu |

---

## 7. Hướng dẫn cài đặt và chạy chương trình

### Bước 1: Cài đặt phần mềm

Máy tính cần có:

1. Visual Studio 2022.
2. .NET Framework 4.7.2 Targeting Pack.
3. SQL Server.
4. SQL Server Management Studio (SSMS).

Trong Visual Studio cần cài workload:

**.NET desktop development**

### Bước 2: Tạo cơ sở dữ liệu

Mở SQL Server Management Studio.

Thực hiện chạy lần lượt:

```sql
-- File 1: Tạo cơ sở dữ liệu
01_schema.sql

-- File 2: Thêm dữ liệu mẫu
02_seed.sql

-- File 3: Kiểm tra dữ liệu (không bắt buộc)
03_test_queries.sql
```

Lưu ý: Đây là tên các file cần mở và thực thi lần lượt trong SSMS, không phải các câu lệnh SQL.

### Bước 3: Cấu hình kết nối

Mở file:

`src/TravelManager/App.config`

Tìm chuỗi kết nối SQL Server:

```xml
connectionString="Data Source=.\SQLEXPRESS;Initial Catalog=QuanLyCongTyDuLich;Integrated Security=True;TrustServerCertificate=True;Connect Timeout=5"
```

Thay đổi `Data Source` theo tên SQL Server được cài đặt trên máy.

### Bước 4: Mở Project

1. Mở Visual Studio 2022.
2. Chọn Open a project or solution.
3. Chọn file `TravelManager.sln`.
4. Chọn Build → Build Solution.
5. Nhấn F5 để chạy chương trình.

---

## 8. Thiết kế UML

Hệ thống được phân tích và thiết kế với các sơ đồ UML:

### Class Diagram

Mô tả các lớp, thuộc tính và quan hệ giữa các đối tượng trong hệ thống.

File: `docs/uml/class_diagram.puml`

### Use Case Diagram

Mô tả các tác nhân và chức năng hệ thống.

File: `docs/uml/use_case.puml`

### Activity Diagram

Mô tả quy trình đăng ký tour du lịch.

File: `docs/uml/activity_booking.puml`

### Sequence Diagram

Mô tả trình tự lập phiếu đăng ký tour theo đoàn.

File: `docs/uml/sequence_group_booking.puml`

---

## 9. Kiểm thử hệ thống (Test Case)

Hệ thống được xây dựng bộ tài liệu gồm 14 kịch bản kiểm thử để đối chiếu hoạt động và các quy tắc nghiệp vụ.

Các nhóm kiểm thử bao gồm:

- Kiểm thử thêm và quản lý dữ liệu tour.
- Kiểm thử đăng ký khách lẻ.
- Kiểm thử đăng ký khách đoàn.
- Kiểm thử điều kiện số lượng khách.
- Kiểm thử thanh toán và đặt cọc.
- Kiểm thử phân công hướng dẫn viên.
- Kiểm thử trùng lịch phân công.
- Kiểm thử tính lương.
- Kiểm thử khảo sát sau tour.

### Tài liệu kiểm thử

**TEST_CASES.md**

Chứa kịch bản kiểm thử ở định dạng Markdown.

**Test_Case_Quan_Ly_Cong_Ty_Du_Lich.docx**

Chứa bảng kiểm thử chi tiết phục vụ báo cáo.

**03_test_queries.sql**

Chứa các truy vấn SQL phục vụ đối chiếu dữ liệu.

Lưu ý: Bộ test case có dữ liệu đầu vào và kết quả mong đợi, nhưng chưa được xác nhận PASS trên môi trường Windows/SQL Server.

---

## 10. Truy vết yêu cầu

Dự án có tài liệu truy vết theo cấu trúc:

**Yêu cầu → UML → Form/Service → Bảng CSDL → Test Case**

Mục tiêu:

- Đảm bảo các chức năng được liên kết với yêu cầu.
- Đối chiếu thiết kế UML với mã nguồn.
- Kiểm tra sự nhất quán giữa chương trình và CSDL.
- Hỗ trợ kiểm thử và đánh giá hệ thống.

Tài liệu:

`docs/TRACEABILITY.md`

---

## 11. Hạn chế và hướng phát triển

### Hạn chế

- Giao diện chủ yếu phục vụ mục đích học tập.
- Chưa tích hợp hệ thống đăng nhập và phân quyền.
- Chưa triển khai website quảng bá tour.
- Chưa tích hợp thanh toán trực tuyến.
- Chưa hỗ trợ gửi email tự động.

### Hướng phát triển

- Xây dựng hệ thống đăng nhập và phân quyền.
- Phát triển website cho khách hàng.
- Tích hợp thanh toán trực tuyến.
- Bổ sung báo cáo doanh thu.
- Xây dựng dashboard thống kê.
- Tối ưu giao diện và hiệu năng xử lý.

---

## 12. Tình trạng dự án

- Đã chuẩn bị mã nguồn theo kiến trúc UI → Service → Data.
- Đã xây dựng script SQL Server.
- Đã chuẩn bị tài liệu UML.
- Đã xây dựng bộ Test Case.
- Đã chuẩn bị ma trận truy vết yêu cầu.

**Trạng thái kiểm thử:** Chưa xác nhận build và chạy thành công trên Visual Studio/SQL Server. Cần chạy thử và bổ sung kết quả thực tế trước khi nghiệm thu.



## 14. Kết luận

Đề tài Quản lý công ty du lịch vận dụng kiến thức phân tích thiết kế hướng đối tượng vào việc xây dựng ứng dụng C# Windows Forms kết hợp SQL Server.

Hệ thống được tổ chức theo kiến trúc 3 tầng UI → Service → Data, nhằm tăng tính rõ ràng, khả năng bảo trì và mở rộng.

Thông qua quá trình xây dựng mô hình UML, thiết kế cơ sở dữ liệu, hiện thực chương trình và xây dựng kịch bản kiểm thử, đề tài tạo nền tảng cho việc phát triển một hệ thống quản lý du lịch hoàn thiện hơn trong tương lai.
