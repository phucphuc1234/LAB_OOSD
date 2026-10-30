# SQL Server — Cộng đồng Tiêm chủng

Cơ sở dữ liệu dành riêng cho bản trình diễn là `VaccinationCommunity_Demo`. Bộ cài giữ nguyên tên bảng/cột tiếng Việt mà backend sử dụng, bổ sung giữ chỗ tồn kho và quy trình theo dõi sau tiêm. Ngày giờ lưu ở UTC; giao diện hiển thị theo `Asia/Ho_Chi_Minh`.

## Cài đặt trên Windows bằng SSMS

1. Mở **SQL Server Management Studio**, kết nối SQL Server 2017 trở lên bằng tài khoản có quyền tạo database và các đối tượng trong database mới.
2. Chọn **File → Open → File**, mở [`database/VaccinationCommunity_Demo.sql`](../database/VaccinationCommunity_Demo.sql), nhấn **Execute** hoặc **F5**. Chạy toàn bộ file, không chỉ một đoạn đang bôi đen.
3. Bộ cài tạo schema, danh mục vai trò/triệu chứng, stored procedure, trigger và view. Bộ cài **không tự thêm tài khoản hay hồ sơ minh họa**. Để chủ động tạo dữ liệu mẫu, mở cửa sổ query và chạy:

```sql
USE VaccinationCommunity_Demo;
EXEC dbo.usp_SeedDemo @ConfirmDemo = 1;
```

4. Chạy [`database/05-verify.sql`](../database/05-verify.sql). Các truy vấn kiểm tra sai lệch ở cuối file phải trả về **0 dòng**.
5. Trong `server/.env`, đặt `DB_DATABASE=VaccinationCommunity_Demo`; cấu hình `DB_SERVER`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` theo SQL Server trên máy. Không đưa mật khẩu thật vào Git. Phần hướng dẫn chạy ứng dụng nằm trong README ở thư mục dự án.

File tổng hợp chứa các phần theo thứ tự `01-schema.sql`, `06-facilities.sql`, `02-routines.sql`, `03-views-triggers.sql`, `04-seed-demo.sql`. Với bản cũ có cấu trúc dự án này, dùng `VaccinationCommunity_HCM_Upgrade.sql` để nâng cấp tại chỗ; xem [hướng dẫn cơ sở và phân công](facility-upgrade.md). Có thể chạy riêng từng phần theo thứ tự đó. Các file có dấu phân batch `GO`, phù hợp SSMS và `sqlcmd`; không gửi nguyên file nhiều batch vào một lệnh `pool.request().query()`.

Bộ cài chạy lại không xóa database, bảng hay hồ sơ. `CREATE OR ALTER` cập nhật định nghĩa routine/view/trigger. Các thay đổi cột bổ sung được kiểm tra trước khi thêm. Đây là bộ cài cho database demo mới; không trỏ nó vào database bệnh nhân thật. Với database có sẵn cấu trúc khác, cần đối chiếu và sao lưu trước khi viết migration riêng; script không tự sửa/xóa hồ sơ mâu thuẫn để ép cài thành công.

## Tài khoản và dữ liệu mẫu

| Vai trò | Tên đăng nhập | Mật khẩu dùng riêng cho demo |
| --- | --- | --- |
| Quản trị viên | `admin.demo` | `Demo@123456` |
| Nhân viên | `nv01` đến `nv12` | `Demo@123456` |
| Người dân | `nd001` đến `nd200` | `Demo@123456` |

Mật khẩu được lưu bằng bcrypt cost 10. `MatKhau` chỉ chứa hash; không có mật khẩu rõ trong bảng. Các tài khoản demo dùng chung mật khẩu để trình diễn cục bộ, cần thay đổi trước khi cho người ngoài truy cập.

Một lần seed thành công tạo 213 tài khoản, 200 hồ sơ người dân, 14 vaccine, 198 lô theo cơ sở, 300 mũi tiêm, 280 lịch hẹn gồm 60 lịch tương lai, 200 lịch đã tiêm và 20 lịch đã đóng, 18 hồ sơ chống chỉ định và 90 báo cáo sau tiêm có triệu chứng, mức độ, trạng thái và lịch sử xử lý khác nhau. Còn có thông báo website và nhật ký thay đổi. Số dòng thông báo/nhật ký tăng khi thao tác trên ứng dụng.

Tên người, CCCD, bảo hiểm, điện thoại, email và lô hàng đều giả lập. Email dùng miền `example.test`. Các số CCCD dạng `9999xxxxxxxx` chỉ là định danh dữ liệu mẫu, không xác nhận danh tính thật. Tên sản phẩm vaccine phục vụ danh mục phần mềm; số mũi và khoảng cách trong seed không phải phác đồ, hướng dẫn điều trị hay chỉ định cho từng người.

Ngày dữ liệu được tính tương đối tại **lần seed đầu tiên**; chạy lại không dời lịch, đặt lại mật khẩu hay thêm bản sao. Marker `SCHEMAVERSION.VersionNo=100` ghi nhận seed hoàn tất trong cùng giao dịch. Nếu phát hiện tên tài khoản mẫu trùng mà thiếu marker, procedure từ chối thay vì ghi đè. Dữ liệu đã thao tác được giữ nguyên. Sau nhiều tuần, lịch tương lai tự trở thành lịch cũ theo thời gian thực; seed không âm thầm làm mới các hồ sơ đó.

## Các bảng và quan hệ

| Bảng | Khóa chính | Nội dung và quan hệ chính |
| --- | --- | --- |
| `SCHEMAVERSION` | `VersionNo` | Dấu mốc schema và seed; không chứa hồ sơ bệnh nhân. |
| `VAITRO` | `MaVaiTro` | Vai trò đúng tên `Người dân`, `Nhân viên`, `Quản trị viên`; có cờ hoạt động. |
| `TAIKHOAN` | `MaTaiKhoan` | Tên đăng nhập/email duy nhất, bcrypt hash, điện thoại, vai trò và trạng thái. Nhiều tài khoản thuộc một vai trò. |
| `NGUOIDAN` | `MaNguoiDan` | Hồ sơ nhân khẩu, địa chỉ, liên hệ. Tối đa một hồ sơ cho một tài khoản; tài khoản có thể không có hồ sơ người dân. CCCD/email không null phải duy nhất. Điện thoại được dùng chung giữa thành viên gia đình. |
| `VACCINE` | `MaVaccine` | Danh mục vaccine, nhà sản xuất, thông tin mô tả, trạng thái. |
| `KHUVUCTIEM` | `MaKhuVuc` | Khu vực phục vụ nội bộ, thành phố cố định TP. Hồ Chí Minh; không thay danh mục hành chính chính thức. |
| `COSOTIEM` | `MaCoSoTiem` | Cơ sở thuộc khu vực; tên, địa chỉ, phường/xã, liên hệ, trạng thái; CHECK giới hạn thành phố. |
| `PHANCONG_COSOTIEM` | `(MaTaiKhoan, MaCoSoTiem)` | Nhiều cơ sở cho một nhân viên; admin phân công và ghi nhật ký. |
| `COSOTIEM_VACCINE` | `(MaCoSoTiem, MaVaccine)` | Danh mục vaccine cơ sở đang cung cấp; tách với danh mục vaccine chung. |
| `LOVACCINE` | `MaLo` | Mã lô duy nhất, vaccine, ngày sản xuất/hạn dùng, số nhập/còn/giữ chỗ. Mỗi vaccine có nhiều lô. |
| `LICHTIEM` | `MaLichTiem` | Người dân, vaccine, mũi số, ngày hẹn, cơ sở, trạng thái, người tạo; `MaLoDuKien` giữ một liều trong lô khi lịch đang hoạt động. |
| `MUITIEM` | `MaMuiTiem` | Mũi tiêm thực tế, người dân, vaccine, lô, nhân viên, thời điểm, kết quả. Lịch hẹn là tùy chọn; một lịch liên kết tối đa một mũi. Bộ `(MaNguoiDan, MaVaccine, MuiSo)` duy nhất. |
| `CHONGCHIDINH` | `MaChongChiDinh` | Nội dung sàng lọc/chống chỉ định, người xác nhận và trạng thái. Một người dân có nhiều bản ghi. |
| `THONGBAO` | `MaThongBao` | Thông báo website cho người dân; có thể gắn lịch hẹn; đã đọc/chưa đọc. Một lịch có tối đa một thông báo loại `Nhắc lịch tiêm`. |
| `LICHSUHIEUCHINH` | `MaLichSu` | Nhật ký kỹ thuật chỉ ghi thêm: bảng, bản ghi, hành động, JSON cũ/mới và tài khoản nếu có. Không lưu bcrypt hash trong payload audit. |
| `DANHMUCTRIEUCHUNG` | `MaTrieuChung` | Mã triệu chứng, tên hiển thị, cờ cảnh báo và hoạt động. |
| `THEODOISAUTIEM` | `MaTheoDoi` | Báo cáo gắn đúng người dân và mũi tiêm, thời điểm, nhiệt độ, triệu chứng tự mô tả, mức độ, trạng thái, phản hồi và số phiên bản. Một mũi có nhiều báo cáo theo thời gian. |
| `THEODOI_TRIEUCHUNG` | `(MaTheoDoi, MaTrieuChung)` | Quan hệ nhiều–nhiều giữa báo cáo và danh mục triệu chứng, không lặp mã trong cùng báo cáo. |
| `THEODOI_LICHSU` | `MaLichSu` | Các lần tiếp nhận/xử lý của mỗi báo cáo; trạng thái cũ/mới, actor, nội dung và phiên bản. Chỉ được thêm. |

Các FK dùng `NO ACTION`: không có xóa dây chuyền bệnh án. Backend không có chức năng xóa mũi tiêm, theo dõi hay nhật ký. Trigger từ chối sửa/xóa mũi tiêm và nhật ký đã ghi. Mô hình đây là bảng lưu trữ; các bảng không tự đồng nghĩa với lớp service/controller trong UML.

## Stored procedure và giao dịch

| Procedure | Caller thực tế | Trách nhiệm |
| --- | --- | --- |
| `usp_LuuLichTiem` | Repository lịch hẹn | Tạo/sửa lịch hoạt động, kiểm tra trùng, vaccine/hồ sơ/chống chỉ định, chọn lô FEFO đủ hạn ngày hẹn và giữ một liều. Khi đổi lịch, giải phóng giữ chỗ cũ và giữ chỗ mới trong cùng giao dịch. |
| `usp_DoiTrangThaiLichTiem` | Repository lịch hẹn | Xác thực actor; người dân chỉ hủy lịch của chính mình; quản lý chuyển trạng thái, giải phóng giữ chỗ khi đóng lịch. Không cho đánh dấu đã tiêm nếu thiếu mũi thực tế. |
| `usp_GhiNhanMuiTiem` | Repository mũi tiêm | Khóa tồn kho, kiểm tra lô/đối tượng/lịch/chống chỉ định, ghi mũi, trừ đúng một liều, giải phóng giữ chỗ và cập nhật lịch/thông báo trong một giao dịch. Retry cùng mũi/lô/lịch trả bản ghi cũ, không trừ kho lần hai; payload mâu thuẫn trả conflict. |
| `usp_BaoCaoSauTiem` | Repository theo dõi | Xác thực người dân sở hữu mũi tiêm, kiểm tra JSON danh sách mã triệu chứng; lưu báo cáo, triệu chứng chuẩn hóa và sự kiện đầu tiên cùng giao dịch. |
| `usp_XuLyTheoDoi` | Repository theo dõi | Xác thực nhân viên/admin, kiểm tra luồng trạng thái và phiên bản mong đợi, cập nhật phản hồi, lịch sử và thông báo cùng giao dịch. Hai người sửa cùng phiên bản thì một yêu cầu nhận conflict. |
| `usp_TaoNhacLich` | Công cụ SQL chủ động | Sinh nhắc cho lịch xác nhận còn ở tương lai trong khoảng ngày Việt Nam được yêu cầu; chạy lại không tạo trùng. API hiện dùng repository với cùng quy tắc và giao dịch. |
| `usp_SeedFacilityDemo` | Seed opt-in | Thêm danh mục cơ sở, vaccine tại cơ sở, phân công và tồn kho demo một lần; không sửa hồ sơ cũ. |
| `usp_SeedDemo` | Lệnh SQL opt-in | Tạo dữ liệu giả lập một lần; không được ứng dụng tự chạy khi khởi động. |

Ba procedure lịch/kho dùng giao dịch `SERIALIZABLE`, `UPDLOCK/HOLDLOCK` và transaction-owned exclusive application lock tên `VaccinationCommunity.Inventory`. Backend sửa lô cũng lấy cùng lock. Vì vậy hai lịch không cùng giữ liều cuối, tiêm không chiếm liều đã giữ cho lịch khác và đổi lô không để lại giữ chỗ cũ. Cách khóa chung ưu tiên tính nhất quán và dễ kiểm chứng cho quy mô demo; khi triển khai nhiều cơ sở lưu lượng lớn có thể thiết kế khóa theo vaccine/cơ sở với thứ tự khóa thống nhất.

`SoLuongCon` là tồn vật lý chưa tiêm. `SoLuongDatTruoc` là phần đã giữ cho lịch hoạt động. `SoLuongKhaDung = SoLuongCon - SoLuongDatTruoc`. Đặt lịch chỉ tăng giữ chỗ; hủy chỉ giảm giữ chỗ; tiêm vừa giảm tồn vật lý vừa tiêu thụ giữ chỗ liên quan. **Không có trigger trừ kho** để tránh trừ hai lần với procedure. Tài khoản ứng dụng vận hành thực tế cần được giới hạn quyền ghi, dùng các procedure cho luồng lịch/mũi; script không tự tạo login SQL hoặc tự cấp quyền máy chủ.

Mã lỗi nghiệp vụ: `51000 → 400`, `51001 → 404`, `51002 → 403`, `51003 → 409`, `51004 → 409`. Lỗi unique/FK được backend xử lý riêng; không trả mật khẩu hay chuỗi kết nối trong phản hồi.

## Theo dõi sau tiêm

Mức độ lưu bằng enum `none`, `mild`, `moderate`, `severe`, `emergency`. Không triệu chứng và nhiệt độ bình thường được ghi là `none`, không tính thành phản ứng nhẹ. Website ưu tiên hồ sơ từ các dấu hiệu do người dân cung cấp và danh mục cảnh báo; đây là hỗ trợ tiếp nhận, không xác định quan hệ nhân quả hay chẩn đoán phản vệ. Các tỷ lệ từ dữ liệu demo không đại diện tỷ lệ an toàn thực tế của vaccine.

Triệu chứng cảnh báo từ danh mục đặt `CoDauHieuCanhBao=1` và ưu tiên khẩn. Nhiệt độ từ 39°C hoặc dưới 35°C nâng ưu tiên `severe`; bản thân giá trị đo này không tự gán cờ triệu chứng cấp cứu. Trạng thái nặng/khẩn vào hàng đợi `escalated`. Báo cáo mới nhẹ/bình thường vào `new`. Quyền xử lý trạng thái:

- `new → reviewing | escalated`;
- `reviewing → monitoring | escalated | resolved`;
- `monitoring → reviewing | escalated | resolved`;
- `escalated → reviewing | monitoring | resolved`;
- `resolved → reviewing | escalated`;
- cùng trạng thái có thể bổ sung phản hồi, nhưng vẫn tăng phiên bản và ghi lịch sử.

Trạng thái `monitoring` yêu cầu hẹn theo dõi ở tương lai. `resolved` bỏ lịch hẹn tiếp. Nội dung báo cáo ban đầu không bị nhân viên ghi đè; phản hồi và lịch sử được lưu riêng. Không có SQL Agent job, dịch vụ gọi cấp cứu tự động, gửi SMS/email thật hay nhân viên trực 24/7 được ngầm hứa hẹn. Nhắc lịch chỉ chạy khi API/lệnh chủ động được gọi. Mốc kiểm tra sau tiêm hiển thị trong ứng dụng là hướng dẫn sử dụng theo dõi; không thay thế dặn dò từ cơ sở y tế.

## View và trigger

Tám view: `vw_CoSoTiemTongQuan`, `vw_PhanCongNhanVien`, `vw_TonKhoVaccine`, `vw_LichTiemChiTiet`, `vw_LichSuTiemChung`, `vw_TheoDoiSauTiemChiTiet`, `vw_TheoDoiSauTiemTongHop`, `vw_HoatDongTiemChungTheoNgay`. View chi tiết theo dõi được backend sử dụng; các view còn lại phục vụ truy vấn/đối chiếu và có thể dùng trong báo cáo đồ án.

Trigger xử lý theo tập `inserted/deleted`, không giả định mỗi lệnh chỉ có một dòng. Chúng kiểm tra mũi–lô–lịch, chặn chỉnh sửa lịch sử mũi, kiểm tra số lượng kho, kiểm tra lịch trùng và lô giữ chỗ, bảo vệ liên kết báo cáo với người được tiêm, ghi nhật ký lịch/kho/mũi và chặn sửa/xóa hai loại nhật ký. Trigger audit không chứa mật khẩu. Các thay đổi nội bộ kho có thể có actor null; không gán nhầm người tạo lịch thành người sửa lịch.

## Kiểm chứng

`05-verify.sql` đọc số lượng bảng, phân bố trạng thái và kiểm tra: giữ chỗ khớp lịch hoạt động, số tồn hợp lệ, vaccine–lô khớp, người báo cáo đúng mũi, không trùng mũi/lịch hoạt động, phiên bản có audit và sổ kho demo khớp số mũi. Chạy lại bộ cài và seed phải không sinh bản sao hoặc đổi dữ liệu đã có. Kiểm thử giao dịch cần SQL Server thật; test mock backend không đủ chứng minh khóa đồng thời hoặc rollback trigger.

## Phạm vi cơ sở từ bản HCM

`MaCoSoTiem` là FK bắt buộc trên lô, lịch, mũi và chống chỉ định. FEFO, giữ chỗ, ghi mũi và retry kiểm tra đúng cơ sở; tên/địa chỉ hiển thị được lấy từ danh mục thay vì tin chuỗi do trình duyệt gửi. Bản cũ được gắn cơ sở chờ đối soát bằng migration, không viết lại bệnh sử hoặc tắt trigger bất biến.

`fn_CoSoDuocPhep` kiểm tra vai trò, trạng thái tài khoản và phân công hiện tại. `fn_NguoiDanDuocPhep` cho nhân viên tra cứu hồ sơ có lịch hoặc mũi tại cơ sở được giao; bao gồm quan hệ lịch sử, kể cả lịch đã hủy/vắng. Lịch sử mũi và phiếu theo dõi vẫn lọc theo cơ sở của từng bản ghi. Người dân xem dữ liệu của chính mình tại mọi cơ sở; admin có phạm vi toàn hệ thống. Views trong SSMS phục vụ đối chiếu, không tự thay thế phân quyền API; người có quyền quản trị SQL vẫn có thể đọc dữ liệu theo quyền SQL của họ.
