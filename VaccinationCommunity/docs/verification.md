# Kiểm chứng bản nâng cấp

- 56 kiểm thử unit/service/repository/HTTP contract đạt; một suite SQL thật được bỏ qua nếu chưa chủ động bật. Bcrypt và JWT được chạy thật trong kiểm thử xác thực. Các test repository sử dụng SQL mocks.
- 13 kiểm thử Playwright đạt, gồm 3 vai trò, các luồng sau tiêm, lỗi/xung đột, 31 màn hình và hiển thị điện thoại. Các test này dùng fixture HTTP riêng, không thay dữ liệu thật của ứng dụng.
- Build production Vite đạt. Lint không có lỗi; còn các cảnh báo React về setState trong effect và export helper.
- Bộ SQL tổng hợp được SQLFluff dialect T-SQL phân tích với 0 vi phạm và không có đoạn không phân tích được. Đây là kiểm tra cú pháp tĩnh, không thay thế thực thi SQL Server.
- Đã chạy thành công SQL Server 2022 thật trên GitHub Actions. Job sql-server cài schema, chạy seed, kiểm tra tranh liều cuối, quyền hủy lịch, chống ghi tiêm/trừ kho lặp, báo cáo/phản hồi HTTP, xung đột phiên bản và bảo vệ nhật ký. Môi trường thực hiện kiểm thử là database ngẫu nhiên độc lập được xóa sau khi hoàn tất, không phải database người dùng. Việc tải SQL Server trực tiếp trong workspace bị chặn; kiểm thử thật đã được chuyển sang GitHub Actions và đạt.

Để xác minh tại máy Windows, chạy npm run db:install, npm run db:seed, npm run db:check và npm run test:sql theo README. Không dùng kết quả test mocks để tuyên bố đã kiểm thử SQL Server thật.

Bằng chứng CI cho source commit `58924326a6c36461d02f1c18a90f4ef0e5f1d8bd`: [workflow run #1](https://github.com/phucphuc1234/LAB_OOSD/actions/runs/40651113680), [SQL Server 2022](https://github.com/phucphuc1234/LAB_OOSD/actions/runs/40651113680/job/122691138094), [backend/build/Playwright](https://github.com/phucphuc1234/LAB_OOSD/actions/runs/40651113680/job/122691138469). Các bước của cả hai job đều thành công.
