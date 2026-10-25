# LAB07 – QUẢN LÝ NHÂN SỰ CÔNG TY SƠN ĐÔNG Á

## 1. Giới thiệu
Bài tập môn Phân tích và Thiết kế Hướng đối tượng (OOSD).

Xây dựng ứng dụng quản lý nhân sự, bao gồm hồ sơ nhân viên, tuyển dụng, thử việc, hợp đồng lao động, quyết định khen thưởng, kỷ luật và tính lương.

## 2. Công nghệ sử dụng
- **Ngôn ngữ:** C#
- **Giao diện:** Windows Forms (.NET Framework 4.7.2)
- **Cơ sở dữ liệu:** SQL Server
- **IDE:** Visual Studio 2022
- **Kiến trúc:** UI → Service → Data

## 3. Cấu trúc thư mục
```text
LAB07/
├── Bai_7.docx
├── README.md
└── bai7/
    ├── QuanLyNhanSuDongA.sln
    ├── database/    # SQL Server
    ├── docs/        # UML và tài liệu
    ├── src/         # Source code C#
    │   ├── UI/
    │   ├── Service/
    │   ├── Data/
    │   └── Domain/
    └── tests/       # Test cases và kiểm thử
```

## 4. Hướng dẫn chạy
1. Mở SQL Server Management Studio.
2. Chạy các file SQL trong `bai7/database` theo thứ tự từ `01_schema.sql` đến `05_seed.sql`.
3. Mở `bai7/QuanLyNhanSuDongA.sln` bằng Visual Studio 2022.
4. Cấu hình kết nối SQL Server trong `src/App.config`.
5. Build và nhấn **F5** để chạy ứng dụng.

## 5. Tài liệu và kiểm thử
- Sơ đồ UML: Use Case, Class, Activity, Sequence.
- Thiết kế cơ sở dữ liệu SQL Server.
- Mã nguồn ứng dụng WinForms.
- Test cases và script kiểm thử tích hợp.

