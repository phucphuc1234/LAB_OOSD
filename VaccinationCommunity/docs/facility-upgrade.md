# Cơ sở tiêm và phân công nhân viên — TP. Hồ Chí Minh

Bản này thay địa chỉ tiêm nhập tự do bằng danh mục cơ sở có mã định danh. Mỗi lô, lịch hẹn, mũi tiêm và bản ghi chống chỉ định thuộc một cơ sở. Phiếu sau tiêm theo cơ sở của mũi tiêm gốc. Admin quản lý toàn hệ thống; nhân viên được giao một hoặc nhiều cơ sở.

## Cập nhật từ bản ZIP cũ

Giữ file `server/.env` đang kết nối được. Dùng toàn bộ mã nguồn mới, gồm `server`, `client`, `database`, `scripts`, `package.json`, `package-lock.json` và các file cấu hình. Dừng web cũ trước khi cập nhật. Không chỉ chép riêng một file JavaScript vì các cột và API thay đổi đồng thời.

Trong CMD, tại thư mục có `package.json`:

```bat
npm ci --include=optional
npm run db:upgrade
npm run db:seed
npm run db:check
npm run dev
```

`db:upgrade` dùng kết nối trong `server/.env`, nâng cấp database demo hiện có. Nó không tạo database mới, không tự seed và không xóa hồ sơ. `db:seed` bổ sung cấu hình cơ sở demo một lần; không đặt lại mật khẩu, lịch sử hay phân công đã sửa.

Nếu muốn tự chạy SQL bằng SSMS, chạy toàn bộ **một file** [`VaccinationCommunity_HCM_Upgrade.sql`](../database/VaccinationCommunity_HCM_Upgrade.sql). Sau đó chủ động thêm dữ liệu minh họa:

```sql
USE VaccinationCommunity_Demo;
EXEC dbo.usp_SeedDemo @ConfirmDemo = 1;
```

Nếu cài mới, dùng [`VaccinationCommunity_Demo.sql`](../database/VaccinationCommunity_Demo.sql), hoặc `npm run db:install`, rồi chạy seed như trên. Các script dành cho cấu trúc dự án này; tên mặc định là `VaccinationCommunity_Demo`. Lưu bản sao database trước khi nâng cấp dữ liệu cần giữ.

## Dữ liệu cơ sở nhập tự do trước đây

Chuỗi tên/địa chỉ cũ không đủ để xác định chắc chắn cơ sở nào. Migration gắn các bản ghi cũ với **“Cơ sở dữ liệu cũ — cần đối soát”**, đang ngừng hoạt động. Tên cơ sở lịch sử, người tiêm, thời điểm, số lượng, nhật ký và các phiếu sau tiêm không bị viết lại. Không tự đoán địa điểm hoặc chia bệnh sử cũ cho nhân viên.

Admin có thể xem dữ liệu cũ. Để tiếp tục vận hành tại cơ sở này:

1. Đăng nhập `admin.demo`, mở **Cơ sở & phân công → Cơ sở tiêm**.
2. Đối soát nguồn dữ liệu. Nếu các bản ghi thực sự thuộc cùng một cơ sở tại TP.HCM, sửa cơ sở chờ đối soát: tên, địa chỉ, phường/xã và khu vực phục vụ đúng; bật hoạt động. Không kích hoạt khi dữ liệu thực tế thuộc nhiều địa điểm khác nhau.
3. Mở **Vaccine tại cơ sở**, bật các vaccine phù hợp; tồn kho cũ vẫn thuộc cơ sở này.
4. Vào **Phân công nhân viên**, chọn nhân viên và cơ sở để cấp quyền.

Nếu dữ liệu cũ trộn nhiều địa điểm, cần kế hoạch đối soát riêng; biểu mẫu không cho chuyển bệnh sử hoặc lô đã dùng sang địa điểm khác. Muốn demo sạch mà giữ database cũ, tạo một bản SQL/đặt tên database demo khác và cấu hình kết nối tương ứng, hoặc sao lưu và dùng một database demo riêng; không cần xóa dữ liệu đang có.

## Thứ tự demo

1. **Admin:** đăng nhập `admin.demo` / `Demo@123456`. Mở **Cơ sở & phân công**: xem 5 khu phục vụ nội bộ và 12 cơ sở DEMO, thêm/sửa cơ sở trong TP.HCM. Chọn một nhân viên, tích nhiều cơ sở và lưu.
2. **Nhân viên:** đăng nhập tài khoản đã được giao, mở **Cơ sở phụ trách**. Chọn cơ sở rồi bật vaccine muốn tiếp nhận. Nhập lô mới ở đúng cơ sở qua **Quản lý lô vaccine**. Danh mục vaccine dùng chung do admin thêm/sửa.
3. **Người dân:** đăng ký tài khoản mới để có hồ sơ sạch. Mở **Lịch tiêm**, chọn vaccine và giờ tương lai. Danh sách chỉ có cơ sở đang tiếp nhận vaccine, còn liều đủ hạn vào ngày hẹn. Chọn cơ sở rồi đăng ký; không có ô nhập cơ sở tự do.
4. **Nhân viên đúng cơ sở:** lịch vừa đặt xuất hiện trong danh sách. Có thể xác nhận rồi ghi mũi theo lịch; cũng có thể ghi trực tiếp cho người dân đã thuộc phạm vi phụ trách. Chỉ chọn được lô tại cơ sở tương ứng. Ngày tiêm thực tế không được ở tương lai.
5. **Người dân:** mở **Theo dõi sau tiêm**, chọn mũi đã ghi và gửi cập nhật. Cảnh báo cấp cứu vẫn hiện ngay nếu có dấu hiệu đỏ.
6. **Nhân viên:** mở hàng đợi theo dõi tại cơ sở mình phụ trách, phản hồi và hẹn theo dõi tiếp. Người dân tải lại để xem phản hồi.
7. **Kiểm tra phân quyền:** dùng nhân viên chỉ được giao cơ sở khác; lịch/mũi/phiếu vừa tạo không xuất hiện. Admin thu hồi phân công rồi nhân viên tải lại; token cũ không giữ quyền cơ sở.

Mẫu mới có 213 tài khoản, 200 người dân, 14 vaccine, 198 lô, 300 mũi, 280 lịch và 90 phiếu. Có 12 cơ sở đang hoạt động, 5 khu phục vụ nội bộ và 24 phân công; thêm một cơ sở/khu vực chờ đối soát đang tắt. Các số này là trạng thái ngay sau seed mới; database đã có hoặc đã thao tác sẽ khác. Tất cả địa điểm, địa chỉ và dữ liệu con người trong seed là giả lập, không phải danh bạ cơ sở đến tiêm thực tế.

## Quy tắc phạm vi

- Một nhân viên có nhiều cơ sở; admin chọn các cơ sở được nhóm theo khu vực. Khu vực là nhóm vận hành nội bộ. Tạo thêm cơ sở trong một khu vực không tự cấp quyền cho mọi nhân viên từng phụ trách khu vực đó.
- Nhân viên tra cứu hồ sơ người dân đã có lịch hoặc mũi tại cơ sở được giao. Quan hệ lịch sử vẫn tính kể cả lịch đã hủy/vắng. Lịch sử mũi, lịch hẹn và phiếu xử lý của cơ sở khác vẫn bị lọc khỏi kết quả của nhân viên.
- Người mới chưa có quan hệ với cơ sở cần tự đăng ký lịch trước, hoặc admin lập lịch. Nhân viên không được duyệt toàn bộ hồ sơ để chọn tùy ý.
- Người dân xem toàn bộ dữ liệu của chính mình, kể cả từng tiêm tại nhiều cơ sở. Đổi cơ sở trong lúc tạo lịch sẽ chọn lại lô; không chuyển lô đã nhập hoặc mũi đã ghi sang cơ sở khác.
- Ngừng cơ sở/khu vực/vaccine đang còn lịch hoạt động bị từ chối. Cơ sở đã ngừng vẫn có thể được nhân viên đang được phân công tra cứu lịch sử. Phân công cũ với cơ sở đã tắt có thể giữ hoặc gỡ; không cấp phân công mới vào cơ sở chưa hoạt động.
- Đổi vai trò thực sự xóa phân công cơ sở cũ trong cùng giao dịch và có nhật ký. Cấp lại quyền nhân viên phải phân công lại. Khóa/mở khóa không xóa cấu hình phân công, nhưng tài khoản bị khóa không được truy cập.
- API và SP kiểm tra phạm vi hiện tại; không tin vai trò, mã cơ sở hoặc tên cơ sở do trình duyệt tự gửi. Tồn kho/đặt lịch/ghi mũi vẫn có giao dịch và kiểm soát gửi lặp.

## SQL đi kèm

19 bảng, 8 Stored Procedures, 8 Views, 6 Triggers và 2 hàm kiểm tra phạm vi. Hai view mới `vw_CoSoTiemTongQuan`, `vw_PhanCongNhanVien` hỗ trợ xem cơ sở, nguồn vaccine và phân công trong SSMS. Views tổng hợp không có biểu mẫu chỉnh toàn bộ dữ liệu; dùng chức năng quản lý của web hoặc thao tác đúng bảng/routine để giữ ràng buộc và nhật ký.

Các thay đổi thực tế có kiểm thử riêng cho nâng cấp, tranh liều, truy cập chéo cơ sở, thu hồi phân công và xung đột phiếu sau tiêm. Xem [kết quả kiểm chứng bản HCM](verification-HCM.md).
