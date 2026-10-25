# Xác minh bản giao

- Đã biên dịch toàn bộ C# thành WinExe bằng Mono C# compiler (tham chiếu .NET tương thích); không lỗi/cảnh báo. Đây là kiểm tra cú pháp/tham chiếu, không thay thế build bằng targeting pack 4.7.2 trên Windows.
- Đã kiểm tra XML project/UML và liên kết class→table tĩnh.
- Chưa chạy SQL Server: các script tạo database, seed và Integration.sql phải chạy trên SQL Server thật.
- Chưa chạy UI Windows: cần F5 theo README và ghi kết quả thực tế vào TestCases.csv.
- Không đưa binary của môi trường kiểm tra vào bài nộp. Build lại từ source trên Windows.

`Integration.sql` chạy trên seed sạch chưa tính lương; có assertion tự động và rollback dữ liệu thử. Test dự kiến: đúng tổng lương và nguồn, chống tính lại, XOR, hệ số phụ trội, hợp đồng sớm, trùng bảo hiểm, sai kỳ công. Khi script báo lỗi cần lưu nguyên thông báo SQL Server, không tự đánh dấu PASS.
