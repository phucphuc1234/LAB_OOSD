# 🏥 QUẢN LÝ HỒ SƠ BỆNH ÁN CỦA BỆNH NHÂN

## Thông tin project

**Đề tài:** Quản lý hồ sơ bệnh án của bệnh nhân  
**Sinh viên:** Phan Trọng Phúc  
**MSSV:** 1250080148  
**Lớp:** 12CNPM2  

---

# 1. Giới thiệu

Project xây dựng chương trình **Quản lý hồ sơ bệnh án của bệnh nhân** cho bệnh viện.

Hệ thống hỗ trợ quản lý quá trình của bệnh nhân từ lúc:

```text
Đăng ký lần đầu
        ↓
Đóng lệ phí hằng năm
        ↓
Cấp hồ sơ bệnh án
        ↓
Đặt lịch khám
        ↓
Khám bệnh
        ↓
Xét nghiệm
        ↓
Lập toa thuốc
        ↓
Thanh toán viện phí
        ↓
Hoàn tất đợt khám
```

Ngoài ra hệ thống hỗ trợ:

- Tra cứu hồ sơ bệnh án.
- Xem lịch sử khám.
- Khám sức khỏe định kỳ theo quý.
- Theo dõi xét nghiệm.
- Quản lý toa thuốc.
- Quản lý thanh toán viện phí.

---

# 2. Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Ngôn ngữ | C# |
| Giao diện | Windows Forms |
| Framework | .NET Framework 4.7.2 |
| Cơ sở dữ liệu | SQL Server |
| Truy cập dữ liệu | ADO.NET |
| IDE | Visual Studio 2022 |
| Kiến trúc | UI → Service → Data |
| Quản lý mã nguồn | Git / GitHub |

---

# 3. Kiến trúc hệ thống

Project được xây dựng theo kiến trúc phân lớp:

```text
┌──────────────────────────────┐
│          UI / Forms          │
│  Giao diện, nhập/xuất dữ liệu│
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│           Service            │
│     Xử lý nghiệp vụ          │
│     Kiểm tra dữ liệu         │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│            Data              │
│ Repository + ADO.NET         │
│ SQL / Stored Procedure       │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│         SQL Server           │
│     QuanLyHoSoBenhAn         │
└──────────────────────────────┘
```

## UI

Tầng UI gồm các Form WinForms.

Nhiệm vụ:

- Nhận dữ liệu từ người dùng.
- Hiển thị dữ liệu.
- Hiển thị thông báo thành công/lỗi.
- Gọi các phương thức trong Service.

UI **không xử lý trực tiếp câu SQL**.

---

## Service

Tầng Service xử lý nghiệp vụ.

Ví dụ:

```text
Kiểm tra họ tên
Kiểm tra ngày sinh
Kiểm tra số điện thoại
Kiểm tra lệ phí
Kiểm tra lịch hẹn
Kiểm tra mã hồ sơ
Kiểm tra số lượng thuốc
```

Sau khi dữ liệu hợp lệ, Service gọi tầng Data.

---

## Data

Tầng Data giao tiếp với SQL Server thông qua:

```text
System.Data.SqlClient
```

Tầng này thực hiện:

- SELECT
- INSERT
- UPDATE
- Stored Procedure
- Transaction
- DataTable
- SqlDataReader

---

# 4. Cấu trúc toàn bộ project

```text
QuanLyHoSoBenhAn/
│
├── QuanLyHoSoBenhAn.sln
│
├── README.md
│
├── .gitignore
│
├── database/
│   │
│   ├── 01_CreateDatabase.sql
│   │
│   ├── 02_SeedData.sql
│   │
│   └── 03_TestQueries.sql
│
├── docs/
│   │
│   ├── ARCHITECTURE.md
│   │
│   ├── TEST_CASES.md
│   │
│   └── TRACEABILITY.md
│
└── src/
    │
    └── QuanLyHoSoBenhAn/
        │
        ├── QuanLyHoSoBenhAn.csproj
        │
        ├── App.config
        │
        ├── Program.cs
        │
        ├── Models/
        │   │
        │   └── Models.cs
        │
        ├── Data/
        │   │
        │   ├── Db.cs
        │   └── HospitalRepository.cs
        │
        ├── Services/
        │   │
        │   └── Services.cs
        │
        └── Forms/
            │
            ├── FrmMain.cs
            ├── FrmDangKyLanDau.cs
            ├── FrmTraCuuHoSo.cs
            ├── FrmLichHen.cs
            ├── FrmKhamBenh.cs
            ├── FrmLapToaThuoc.cs
            └── FrmThanhToan.cs
```

---

# 5. Giải thích cấu trúc code

## 5.1. Solution

```text
QuanLyHoSoBenhAn.sln
```

File Solution của Visual Studio.

Mở file này để chạy toàn bộ project.

---

## 5.2. Project

```text
src/QuanLyHoSoBenhAn/QuanLyHoSoBenhAn.csproj
```

Project C# WinForms sử dụng:

```text
.NET Framework 4.7.2
```

Các thư viện chính:

```text
System
System.Configuration
System.Data
System.Drawing
System.Windows.Forms
System.Xml
```

---

# 6. Program.cs

Đây là điểm bắt đầu của chương trình.

```csharp
using System;
using System.Windows.Forms;
using QuanLyHoSoBenhAn.Forms;

namespace QuanLyHoSoBenhAn
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            Application.Run(new FrmMain());
        }
    }
}
```

Khi chương trình chạy:

```text
Program.cs
    ↓
FrmMain
```

---

# 7. Models

Thư mục:

```text
Models/
└── Models.cs
```

Chứa các class dùng trong chương trình.

Ví dụ:

```csharp
public class BenhNhan
{
    public int MaBenhNhan { get; set; }

    public string HoTen { get; set; }

    public string DiaChi { get; set; }

    public DateTime NgaySinh { get; set; }

    public string DienThoai { get; set; }

    public string Anh3x4 { get; set; }
}
```

Ngoài ra còn có:

```text
BenhNhan
HoSoBenhAn
PhieuKham
ChiTietToaThuoc
DangKyResult
```

---

# 8. Data Layer

Thư mục:

```text
Data/
├── Db.cs
└── HospitalRepository.cs
```

---

## 8.1. Db.cs

Chịu trách nhiệm mở kết nối SQL Server.

```csharp
public static class Db
{
    public static SqlConnection Open()
    {
        var cs =
            ConfigurationManager
            .ConnectionStrings["HospitalDb"]
            .ConnectionString;

        var cn = new SqlConnection(cs);

        cn.Open();

        return cn;
    }
}
```

Luồng:

```text
Repository
   ↓
Db.Open()
   ↓
SQL Server
```

---

## 8.2. HospitalRepository.cs

Đây là lớp truy cập dữ liệu chính.

Các chức năng:

```text
DangKyLanDau()
TraCuuHoSo()
LayLichSuKham()
LayBacSi()
LayKhoa()
TaoPhieuKham()
ThemXetNghiem()
DatLich()
LapToaThuoc()
ThanhToanVaHoanTat()
```

Ví dụ tra cứu hồ sơ:

```csharp
public DataTable TraCuuHoSo(string keyword)
{
    using (var cn = Db.Open())
    using (var cmd = new SqlCommand(@"
        SELECT hs.MaHoSo,
               hs.MaHoSoCode,
               bn.MaBenhNhan,
               bn.HoTen,
               bn.NgaySinh,
               bn.DienThoai,
               bn.DiaChi,
               hs.NgayLap,
               hs.TrangThai
        FROM HOSOBENHAN hs
        JOIN BENHNHAN bn
          ON bn.MaBenhNhan = hs.MaBenhNhan
        WHERE hs.MaHoSoCode LIKE @kw
           OR bn.HoTen LIKE @kw
           OR bn.DienThoai LIKE @kw
        ORDER BY bn.HoTen;", cn))
    {
        cmd.Parameters.AddWithValue(
            "@kw",
            "%" + keyword + "%"
        );

        var dt = new DataTable();

        new SqlDataAdapter(cmd).Fill(dt);

        return dt;
    }
}
```

---

# 9. Service Layer

Thư mục:

```text
Services/
└── Services.cs
```

Bao gồm các Service:

```text
DangKyService
HoSoService
LichHenService
KhamBenhService
ToaThuocService
```

---

## DangKyService

Xử lý nghiệp vụ đăng ký bệnh nhân.

```csharp
public DangKyResult DangKyLanDau(
    BenhNhan bn,
    decimal lePhi)
{
    if (bn == null)
        throw new ArgumentNullException("bn");

    if (string.IsNullOrWhiteSpace(bn.HoTen))
        throw new Exception(
            "Họ tên không được trống."
        );

    if (string.IsNullOrWhiteSpace(bn.DienThoai))
        throw new Exception(
            "Số điện thoại không được trống."
        );

    if (bn.NgaySinh.Date >= DateTime.Today)
        throw new Exception(
            "Ngày sinh không hợp lệ."
        );

    if (lePhi <= 0)
        throw new Exception(
            "Lệ phí năm phải lớn hơn 0."
        );

    return _repo.DangKyLanDau(
        bn,
        lePhi
    );
}
```

---

## HoSoService

Chức năng:

```text
Tra cứu hồ sơ
Xem lịch sử khám
```

---

## LichHenService

Xử lý:

```text
Đặt lịch khám định kỳ
Kiểm tra ngày hẹn
Kiểm tra bệnh nhân
```

---

## KhamBenhService

Xử lý:

```text
Tạo phiếu khám
Lấy danh sách bác sĩ
Lấy danh sách khoa
Thêm xét nghiệm
Thanh toán và hoàn tất
```

---

## ToaThuocService

Xử lý:

```text
Lập toa thuốc
Kiểm tra mã phiếu khám
Kiểm tra thuốc
Kiểm tra số lượng
```

---

# 10. Forms

Thư mục:

```text
Forms/
```

Chứa toàn bộ giao diện WinForms.

---

## 10.1. FrmMain

Trang chủ chương trình.

Có các chức năng:

```text
Đăng ký lần đầu

Tra cứu hồ sơ

Đặt lịch định kỳ

Ghi nhận khám

Lập toa thuốc

Thanh toán viện phí
```

---

## 10.2. FrmDangKyLanDau

Form đăng ký bệnh nhân lần đầu.

Thông tin nhập:

```text
Họ tên

Địa chỉ

Ngày sinh

Điện thoại

Ảnh 3x4

Lệ phí năm
```

Khi bấm:

```text
Đăng ký + cấp hồ sơ
```

luồng xử lý:

```text
FrmDangKyLanDau
       ↓
DangKyService
       ↓
HospitalRepository
       ↓
sp_DangKyLanDau
       ↓
SQL Server
```

---

# 11. Transaction đăng ký bệnh nhân lần đầu

Đây là nghiệp vụ quan trọng của project.

Khi bệnh nhân đăng ký lần đầu, hệ thống phải thực hiện nhiều bảng:

```text
BENHNHAN
    ↓
PHIEUDANGKY
    ↓
LEPHINAM
    ↓
HOSOBENHAN
```

SQL Server sử dụng:

```sql
BEGIN TRAN
```

Nếu tất cả thành công:

```sql
COMMIT
```

Nếu có lỗi:

```sql
ROLLBACK
```

Stored Procedure:

```sql
sp_DangKyLanDau
```

Luồng:

```text
BEGIN TRANSACTION

INSERT BENHNHAN

INSERT PHIEUDANGKY

INSERT LEPHINAM

INSERT HOSOBENHAN

COMMIT
```

Điều này bảo đảm không xảy ra trường hợp:

```text
Có bệnh nhân
nhưng
không có hồ sơ
```

hoặc:

```text
Có hồ sơ
nhưng
chưa có lệ phí
```

---

# 12. FrmTraCuuHoSo

Cho phép tìm bệnh nhân bằng:

```text
Mã hồ sơ

Họ tên

Số điện thoại
```

Sau khi chọn hồ sơ, chương trình hiển thị:

```text
Mã phiếu khám

Ngày khám

Loại khám

Bác sĩ

Khoa

Triệu chứng

Chẩn đoán

Trạng thái
```

---

# 13. FrmLichHen

Dùng để đặt lịch khám sức khỏe định kỳ.

Người dùng nhập:

```text
Mã bệnh nhân

Ngày giờ hẹn

Ghi chú
```

Hệ thống tự xác định quý:

```text
Tháng 1 → 3   = Quý 1

Tháng 4 → 6   = Quý 2

Tháng 7 → 9   = Quý 3

Tháng 10 → 12 = Quý 4
```

CSDL sử dụng Unique Filtered Index:

```sql
CREATE UNIQUE INDEX UX_LICHHEN_DinhKy_TheoQuy
ON LICHHEN(
    MaBenhNhan,
    Nam,
    Quy
)
WHERE LoaiKham = N'Định kỳ';
```

Quy tắc:

```text
Một bệnh nhân
chỉ được có
1 lịch khám định kỳ
trong cùng một quý.
```

---

# 14. FrmKhamBenh

Form dùng để ghi nhận lần khám.

Thông tin:

```text
Mã hồ sơ

Bác sĩ

Khoa điều trị

Loại khám

Triệu chứng

Thân nhiệt

Huyết áp

Chẩn đoán
```

Sau khi tạo phiếu khám:

```text
PHIEUKHAM
```

sẽ được lưu trong database.

---

# 15. Xét nghiệm

Xét nghiệm liên kết trực tiếp với phiếu khám.

Quan hệ:

```text
PHIEUKHAM
    1
    │
    │
    N
XETNGHIEM
```

Foreign Key:

```text
XETNGHIEM.MaPhieuKham
```

tham chiếu:

```text
PHIEUKHAM.MaPhieuKham
```

Điều này bảo đảm không thể tạo xét nghiệm cho một phiếu khám không tồn tại.

---

# 16. FrmLapToaThuoc

Form dùng để lập toa thuốc.

Thông tin:

```text
Mã phiếu khám

Tên thuốc

Liều dùng

Số lượng

Cách dùng

Hướng dẫn sử dụng
```

Luồng:

```text
FrmLapToaThuoc
      ↓
ToaThuocService
      ↓
HospitalRepository
      ↓
TOATHUOC
      ↓
CHITIETTOATHUOC
```

---

# 17. Transaction lập toa thuốc

Khi lập toa:

```text
TOATHUOC
    ↓
CHITIETTOATHUOC
    ↓
PHIEUKHAM
```

được cập nhật trong cùng Transaction.

Nếu thành công:

```text
PHIEUKHAM.TrangThai
=
Chờ thanh toán
```

Nếu có lỗi:

```text
ROLLBACK
```

---

# 18. FrmThanhToan

Form dùng để ghi nhận thanh toán viện phí.

Thông tin:

```text
Mã phiếu khám

Số tiền

Ghi chú
```

Khi thanh toán thành công:

```text
THANHTOANVIENPHI
       ↓
PHIEUKHAM
       ↓
Hoàn tất
```

---

# 19. Transaction thanh toán và hoàn tất

Stored Procedure:

```sql
sp_ThanhToanVaHoanTatPhieuKham
```

Thực hiện:

```text
BEGIN TRANSACTION

Kiểm tra phiếu khám

Kiểm tra đã thanh toán chưa

INSERT THANHTOANVIENPHI

UPDATE PHIEUKHAM
SET TrangThai = 'Hoàn tất'

COMMIT
```

Nếu lỗi:

```text
ROLLBACK
```

---

# 20. Các bảng trong cơ sở dữ liệu

Database:

```text
QuanLyHoSoBenhAn
```

Các bảng:

```text
BENHNHAN

PHIEUDANGKY

LEPHINAM

HOSOBENHAN

KHOADIEUTRI

BACSI

PHIEUKHAM

XETNGHIEM

TOATHUOC

CHITIETTOATHUOC

LICHHEN

THANHTOANVIENPHI
```

---

# 21. Quan hệ CSDL chính

```text
BENHNHAN
   │
   ├──────── PHIEUDANGKY
   │
   ├──────── LEPHINAM
   │
   ├──────── HOSOBENHAN
   │
   └──────── LICHHEN


HOSOBENHAN
      │
      └──────── PHIEUKHAM


KHOADIEUTRI
      │
      ├──────── BACSI
      │
      └──────── PHIEUKHAM


BACSI
   │
   └──────── PHIEUKHAM


PHIEUKHAM
    │
    ├──────── XETNGHIEM
    │
    ├──────── TOATHUOC
    │
    └──────── THANHTOANVIENPHI


TOATHUOC
    │
    └──────── CHITIETTOATHUOC
```

---

# 22. Ràng buộc cơ sở dữ liệu

Project sử dụng:

## PRIMARY KEY

Ví dụ:

```sql
MaBenhNhan INT IDENTITY PRIMARY KEY
```

---

## FOREIGN KEY

Ví dụ:

```sql
FOREIGN KEY(MaBenhNhan)
REFERENCES BENHNHAN(MaBenhNhan)
```

---

## UNIQUE

Số điện thoại bệnh nhân:

```sql
UNIQUE(DienThoai)
```

Một bệnh nhân chỉ có một hồ sơ:

```sql
UNIQUE(MaBenhNhan)
```

Mỗi bệnh nhân chỉ đóng lệ phí một lần trong một năm:

```sql
UNIQUE(
    MaBenhNhan,
    NamApDung
)
```

---

## CHECK

Ví dụ lệ phí:

```sql
CHECK(SoTien > 0)
```

Quý:

```sql
CHECK(
    Quy BETWEEN 1 AND 4
)
```

Thân nhiệt:

```sql
CHECK(
    ThanNhiet IS NULL
    OR ThanNhiet BETWEEN 30 AND 45
)
```

---

# 23. App.config

File:

```text
src/
└── QuanLyHoSoBenhAn/
    └── App.config
```

Chuỗi kết nối:

```xml
<connectionStrings>

  <add
    name="HospitalDb"

    connectionString="
      Data Source=.;
      Initial Catalog=QuanLyHoSoBenhAn;
      Integrated Security=True;
      TrustServerCertificate=True"

    providerName="System.Data.SqlClient" />

</connectionStrings>
```

Nếu SQL Server của máy không phải:

```text
.
```

thì thay:

```text
Data Source=.
```

bằng tên Server.

Ví dụ:

```text
Data Source=LAPTOP-ABC123
```

hoặc:

```text
Data Source=.\SQLEXPRESS
```

---

# 24. Các file SQL

## 01_CreateDatabase.sql

Dùng để:

```text
Tạo database

Tạo bảng

Tạo Primary Key

Tạo Foreign Key

Tạo Unique

Tạo Check Constraint

Tạo Unique Index

Tạo Stored Procedure

Tạo Transaction
```

---

## 02_SeedData.sql

Tạo dữ liệu mẫu:

```text
Khoa

Bác sĩ

Bệnh nhân

Hồ sơ

Phiếu khám

Xét nghiệm

Toa thuốc
```

---

## 03_TestQueries.sql

Dùng để chạy các test case SQL.

---

# 25. Kiểm thử hệ thống

Project có các test case sau:

| ID | Kịch bản | Kết quả |
|---|---|---|
| TC01 | Đăng ký bệnh nhân lần đầu | Thành công |
| TC02 | Trùng số điện thoại | Bị chặn |
| TC03 | Tra cứu lịch sử khám | Hiển thị đúng |
| TC04 | Đặt lịch định kỳ | Thành công |
| TC05 | Trùng lịch trong cùng quý | Bị chặn |
| TC06 | Xét nghiệm liên kết phiếu khám | Thành công |
| TC07 | Toa thuốc liên kết phiếu khám | Thành công |
| TC08 | Kiểm tra trước thanh toán | Chưa hoàn tất |
| TC09 | Thanh toán viện phí | Chuyển Hoàn tất |
| TC10 | Foreign Key sai | SQL Server từ chối |

---

# 26. Truy vết yêu cầu

Project có tài liệu:

```text
docs/
└── TRACEABILITY.md
```

Dùng để truy vết:

```text
Yêu cầu
    ↓
Use Case
    ↓
Form
    ↓
Service
    ↓
Data
    ↓
Bảng SQL
    ↓
Test Case
```

Ví dụ:

```text
Đăng ký lần đầu
       ↓
FrmDangKyLanDau
       ↓
DangKyService
       ↓
HospitalRepository
       ↓
BENHNHAN
PHIEUDANGKY
LEPHINAM
HOSOBENHAN
       ↓
TC01 / TC02
```

---

# 27. Hướng dẫn cài đặt

## Bước 1

Cài:

```text
Visual Studio 2022
```

Workload:

```text
.NET desktop development
```

---

## Bước 2

Cài:

```text
SQL Server
SQL Server Management Studio
```

---

## Bước 3

Mở SSMS và chạy:

```text
database/
├── 01_CreateDatabase.sql
├── 02_SeedData.sql
└── 03_TestQueries.sql
```

theo đúng thứ tự.

---

# 28. Chạy project

Mở:

```text
QuanLyHoSoBenhAn.sln
```

trong Visual Studio.

Sau đó kiểm tra:

```text
App.config
```

và sửa tên SQL Server nếu cần.

Cuối cùng nhấn:

```text
F5
```

hoặc:

```text
Start
```

để chạy.

---

# 29. Luồng demo khi bảo vệ

Có thể demo theo thứ tự:

```text
1. Đăng ký bệnh nhân lần đầu

2. Hệ thống thu lệ phí năm

3. Hệ thống cấp mã hồ sơ

4. Tra cứu hồ sơ vừa tạo

5. Tạo lịch khám định kỳ

6. Tạo phiếu khám

7. Ghi nhận xét nghiệm

8. Lập toa thuốc

9. Thanh toán viện phí

10. Kiểm tra phiếu khám đã Hoàn tất
```

---

# 30. Điểm nổi bật của project

```text
✔ C# WinForms

✔ .NET Framework 4.7.2

✔ SQL Server

✔ ADO.NET

✔ Kiến trúc UI → Service → Data

✔ Primary Key

✔ Foreign Key

✔ UNIQUE

✔ CHECK Constraint

✔ Unique Filtered Index

✔ Stored Procedure

✔ Transaction nhiều bảng

✔ Rollback khi lỗi

✔ Tra cứu lịch sử bệnh án

✔ Lịch định kỳ theo quý

✔ Xét nghiệm liên kết phiếu khám

✔ Toa thuốc liên kết phiếu khám

✔ Hoàn tất sau thanh toán viện phí

✔ Test case

✔ Truy vết yêu cầu
```

---

# 31. Quy tắc nghiệp vụ đã kiểm thử

### Quy tắc 1

Bệnh nhân đăng ký lần đầu phải:

```text
Đăng ký
+
Đóng lệ phí
+
Cấp hồ sơ
```

trong cùng một nghiệp vụ.

---

### Quy tắc 2

Một bệnh nhân chỉ có:

```text
1 hồ sơ bệnh án
```

---

### Quy tắc 3

Mỗi bệnh nhân chỉ có:

```text
1 lệ phí / năm
```

---

### Quy tắc 4

Một bệnh nhân chỉ được:

```text
1 lịch định kỳ / quý
```

---

### Quy tắc 5

Xét nghiệm phải thuộc:

```text
1 phiếu khám hợp lệ
```

---

### Quy tắc 6

Toa thuốc phải thuộc:

```text
1 phiếu khám hợp lệ
```

---

### Quy tắc 7

Phiếu khám chỉ được chuyển:

```text
Hoàn tất
```

sau khi:

```text
Đã thanh toán viện phí
```

---

# 32. Kết luận

Project **Quản lý hồ sơ bệnh án của bệnh nhân** đã xây dựng được các chức năng nghiệp vụ chính theo yêu cầu.

Hệ thống áp dụng:

```text
C# WinForms
+
.NET Framework 4.7.2
+
SQL Server
+
ADO.NET
+
UI → Service → Data
```

Việc sử dụng:

```text
Primary Key
Foreign Key
Unique
Check Constraint
Stored Procedure
Transaction
```

giúp bảo đảm dữ liệu nhất quán và hạn chế sai sót trong các nghiệp vụ liên quan nhiều bảng.

Project cũng có:

```text
Test Case
+
Traceability
+
README
+
SQL Script
```

để thuận tiện cho kiểm thử, bảo trì và nộp bài trên GitHub.

---

# 👨‍💻 Tác giả

**Phan Trọng Phúc**

```text
MSSV: 1250080148
Lớp: 12CNPM2
```
