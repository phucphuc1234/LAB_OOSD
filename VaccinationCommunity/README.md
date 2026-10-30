# Cổng theo dõi tiêm chủng cộng đồng

Ứng dụng React + Express + SQL Server cho **người dân, nhân viên y tế và quản trị viên**. Phạm vi cơ sở tiêm **Thành phố Hồ Chí Minh**. Người dân chọn cơ sở từ danh mục; nhân viên làm việc tại các cơ sở được admin phân công. Giao diện navy/teal, hiệu ứng nền và chuyển động, hỗ trợ điện thoại và tùy chọn giảm chuyển động; dữ liệu nghiệp vụ lấy từ API/SQL Server.

## Đang dùng bản cũ?

Giữ `server/.env`, cập nhật toàn bộ mã nguồn và chạy tại thư mục dự án:

```bat
npm ci --include=optional
npm run db:upgrade
npm run db:seed
npm run db:check
npm run dev
```

Hoặc chạy **một file** [`database/VaccinationCommunity_HCM_Upgrade.sql`](database/VaccinationCommunity_HCM_Upgrade.sql) trong SSMS rồi seed chủ động. Nâng cấp giữ hồ sơ cũ; cơ sở nhập tự do cũ được đưa vào cơ sở chờ đối soát, không tự gán sang địa điểm mới. Admin cần đối soát trước khi phân công nhân viên. Xem [hướng dẫn nâng cấp và demo theo cơ sở](docs/facility-upgrade.md).

## Chạy trên Windows

Cần **Node.js 22.12 trở lên** (khuyến nghị Node 24 LTS), SQL Server 2017 trở lên (khuyến nghị 2022) và tài khoản SQL Server có quyền tạo database. SSMS dùng để chạy SQL thủ công nếu muốn.

Mở terminal **trong thư mục `VaccinationCommunity` có file `package.json` này**. Khi tải cả repo, thư mục có thể là `LAB_OOSD-main\VaccinationCommunity`.

```bat
npm ci --include=optional
npm run env:init
```

Mở `server/.env` vừa tạo, điền kết nối SQL Server trên máy bạn:

```dotenv
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=VaccinationCommunity_Demo
DB_USER=sa
DB_PASSWORD="mat_khau_SQL_Server_cua_ban"
```

`DB_SERVER` có thể là tên máy đang dùng trong SSMS. Nếu dùng named instance như `localhost\SQLEXPRESS`, có thể bỏ dòng `DB_PORT` để dùng tên instance; nếu cung cấp cổng TCP thì cổng được ưu tiên. SQL Server phải bật TCP/IP và SQL Server Authentication. `env:init` tạo JWT secret riêng; chạy lại không ghi đè `.env` hiện có. Không đưa mật khẩu thật vào Git.

Cài database và thêm dữ liệu mẫu:

```bat
npm run db:install
npm run db:seed
npm run db:check
```

Ba lệnh trên chỉ cài vào database riêng `VaccinationCommunity_Demo`. Bộ cài không xóa database hay hồ sơ đã có; seed chỉ thêm một lần và không đặt lại mật khẩu/ngày dữ liệu khi chạy lại.

Nếu chạy bằng **SSMS**: Execute toàn bộ [`database/VaccinationCommunity_Demo.sql`](database/VaccinationCommunity_Demo.sql), sau đó chạy:

```sql
USE VaccinationCommunity_Demo;
EXEC dbo.usp_SeedDemo @ConfirmDemo = 1;
```

Chạy web:

```bat
npm run dev
```

Mở **http://127.0.0.1:5173**. API chạy ở cổng **5000**. Dừng bằng `Ctrl+C`.

## Tài khoản demo

| Vai trò | Tên đăng nhập | Mật khẩu |
| --- | --- | --- |
| Quản trị viên | `admin.demo` | `Demo@123456` |
| Nhân viên y tế | `nv01` đến `nv12` | `Demo@123456` |
| Người dân | `nd001` đến `nd200` | `Demo@123456` |

Tất cả là tài khoản minh họa. Mật khẩu được lưu bằng bcrypt, không lưu dạng rõ. Dữ liệu mẫu có **213 tài khoản, 200 người dân, 14 vaccine, 198 lô vaccine, 300 mũi tiêm, 280 lịch hẹn và 90 phiếu theo dõi sau tiêm**, cùng 12 cơ sở tiêm giả lập trong TP.HCM, 5 khu vực phục vụ nội bộ, 24 phân công, triệu chứng, thông báo và nhật ký. Một cơ sở lưu giữ dữ liệu cũ ở trạng thái ngừng hoạt động được tạo riêng. Tên, giấy tờ và liên hệ đều giả lập; ngày được tính tương đối ở lần seed đầu.

## Nghiệp vụ

- **Người dân:** đăng ký tài khoản, hồ sơ cá nhân, đăng ký/hủy lịch của mình, lịch sử tiêm, chống chỉ định đã ghi nhận, thông báo và các lần cập nhật sức khỏe sau tiêm.
- **Nhân viên:** danh sách cơ sở được giao, bật/ngừng cung cấp vaccine tại cơ sở, nhập/quản lý lô, lịch tiêm, ghi mũi, chống chỉ định, truy vết và theo dõi sau tiêm trong phạm vi cơ sở. Hồ sơ người dân chỉ xuất hiện khi có lịch hoặc mũi tiêm tại cơ sở được giao.
- **Admin:** quản lý khu vực/cơ sở, giao nhiều cơ sở cho từng nhân viên, phân quyền/khóa tài khoản, quản lý danh mục vaccine dùng chung và nghiệp vụ toàn hệ thống. Đổi vai trò thực sự sẽ thu hồi phân công cũ; cấp lại quyền nhân viên phải phân công lại. Tự đăng ký chỉ tạo Người dân.
- **Đặt lịch:** người dân chỉ chọn cơ sở có vaccine đang cung cấp và còn liều đủ hạn cho ngày hẹn; không nhập địa chỉ cơ sở tự do. Không tự đặt số suất theo khung giờ vì chưa có nghiệp vụ công suất.
- **Tồn kho:** mỗi lô thuộc một cơ sở cố định; đặt lịch giữ một liều FEFO tại đúng cơ sở; hủy giải phóng giữ chỗ; ghi tiêm trừ kho một lần trong giao dịch. Lô đã nhập không được ghi đè tồn kho bằng biểu mẫu sửa; nhập bổ sung bằng lô mới.
- **Sau tiêm:** báo cáo gắn mũi tiêm của chính người dân, nhiều lần cập nhật; danh mục triệu chứng, nhiệt độ và thời điểm; hệ thống xác định ưu tiên tiếp nhận. Nhân viên phản hồi, hẹn theo dõi tiếp, kết thúc hoặc mở lại ca theo các trạng thái được phép. Sửa cùng một phiên bản bị báo xung đột; lịch sử xử lý được giữ lại.

Mốc **24/48/72 giờ** là gợi ý cập nhật của phần mềm, không phải thời hạn xác nhận người dân đã an toàn. Khi có dấu hiệu cảnh báo đỏ, giao diện luôn hướng dẫn gọi **115**/đến cấp cứu ngay và không chờ cổng phản hồi. Hệ thống không chẩn đoán, kết luận nguyên nhân do vaccine hoặc thay thế đánh giá của nhân viên y tế. Phác đồ, chỉ định và khoảng cách liều cần được cơ sở y tế xác định; các giá trị seed chỉ phục vụ demo.

## SQL Server

Có **19 bảng, 8 stored procedures, 8 views, 6 triggers và 2 hàm kiểm tra phạm vi**. Các SP đặt/hủy lịch, ghi tiêm, gửi báo cáo và xử lý theo dõi được backend gọi thực tế. Trigger bảo vệ tính nhất quán và ghi nhật ký; không có trigger trừ kho lần nữa.

Đọc [tài liệu database](docs/database.md) để xem từ điển dữ liệu, tên từng SP/view/trigger, giao dịch và mã lỗi. Chạy [`database/05-verify.sql`](database/05-verify.sql) trong SSMS: các truy vấn kiểm tra sai lệch cần trả về **0 dòng**.

## Kiểm thử

```bat
npm test
npm run build
```

Kiểm thử trình duyệt dùng fixture HTTP riêng, không phải chế độ dữ liệu giả trong ứng dụng:

```bat
npx playwright install chromium
npm run test:e2e
```

Kiểm thử **SQL Server thật** cần kết nối có quyền tạo/xóa database kiểm thử:

```bat
npm run test:sql
```

Lệnh này tạo một database ngẫu nhiên `VaccinationCommunity_Test_...`, cài schema/seed, kiểm tra tranh liều cuối, quyền hủy lịch, chống ghi tiêm trùng, báo cáo/phản hồi HTTP và trigger; cuối cùng chỉ xóa database kiểm thử đó. `npm test` bình thường bỏ qua bài SQL thật, không âm thầm kết nối hoặc thay đổi database của bạn. Workflow GitHub Actions có job SQL Server 2022 riêng. Các kết quả kiểm chứng của bản trước nằm tại [verification.md](docs/verification.md); kết quả bản phân công cơ sở được ghi riêng trong [verification-HCM.md](docs/verification-HCM.md).

## Chạy bản build

```bat
npm run build
npm start
```

Express phục vụ cả giao diện đã build và API tại **http://localhost:5000**. Các biến môi trường được mô tả trong `server/.env.example`; Vite mặc định proxy `/api` về API cục bộ. Khi API nằm ở địa chỉ khác, cấu hình `client/.env` với `VITE_API_URL` và cho phép đúng origin trong `CORS_ORIGINS`.

## Cấu trúc

```text
client/        React, giao diện và HTTP services
server/        Express, phân quyền, validation, services và SQL repositories
database/      Schema, stored procedures, views, triggers, dữ liệu mẫu, kiểm tra
docs/          Tài liệu database và bộ XML phân tích thiết kế
tests/e2e/     Kiểm thử giao diện bằng Playwright
```

Nếu kết nối lỗi, kiểm tra SQL Server đang chạy, TCP/IP/cổng, tài khoản SQL và `DB_DATABASE`; chạy lại `npm run db:check`. Nếu cổng web đang được sử dụng, dừng tiến trình cũ hoặc cấu hình lại cổng trước khi chạy.

## Sơ đồ phân tích thiết kế theo mẫu

**Bản mới cho quản lý cơ sở/phân công:** [Use case tổng quát và ERD TP.HCM](docs/analysis-design-HCM/README.md), ba tác nhân, 19 bảng và 34 khóa ngoại. Có một XML gồm hai trang để mở bằng draw.io.

**Lưu ý:** bộ sơ đồ này mô tả phiên bản trước khi thêm quản lý cơ sở/phân công; cần cập nhật các luồng và ERD theo phiên bản mới trước khi đưa vào báo cáo.

[Bộ XML theo mẫu](docs/analysis-design-mau/README.md) có **98 sơ đồ**, giữ mã **UC01–UC28**. Sơ đồ tổng quát gồm **18 mục tiêu chính**, các use case chung chỉ vẽ một lần; phần phân rã có **34 trang**. Bộ tài liệu còn có hoạt động, lớp/kiến trúc, ERD và tuần tự. Mỗi sơ đồ có bản mở trực tiếp và bản XML để dán vào **Extras → Edit Diagram** trên draw.io. Tải toàn bộ tại [VaccinationCommunity_XML_theo_mau.zip](../VaccinationCommunity_XML_theo_mau.zip).

### Sửa lỗi native binding trên Windows

Bản lock đã bổ sung đầy đủ native binding Windows cho Rolldown, Tailwind Oxide, cả hai phiên bản Lightning CSS và Oxlint. Khi cập nhật từ ZIP cũ, dùng `package-lock.json` của bản mới. Dừng tiến trình dev bằng Ctrl+C, mở **CMD tại thư mục gốc dự án**, rồi chạy:

```bat
if exist node_modules rmdir /s /q node_modules
if exist client\node_modules rmdir /s /q client\node_modules
if exist server\node_modules rmdir /s /q server\node_modules
npm ci --include=optional
npm run dev
```

Các lệnh chỉ cài lại thư viện được sinh tự động; giữ nguyên `server/.env` và database. Không cần chạy lại seed. Không chỉ cài riêng Rolldown vì Tailwind và Lightning CSS cũng cần binding Windows đúng phiên bản.
