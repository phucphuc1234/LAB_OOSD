# Kiến trúc hệ thống

## UI → Service → Data

```text
Forms (UI)
    ↓
Services (nghiệp vụ)
    ↓
Data (ADO.NET / SQL Server)
```

- **UI**: nhận dữ liệu, hiển thị kết quả, không chứa SQL.
- **Service**: kiểm tra quy tắc nghiệp vụ.
- **Data**: thực thi SQL, stored procedure và transaction.

## Transaction đăng ký lần đầu

```text
BEGIN TRANSACTION
  INSERT BENHNHAN
  INSERT PHIEUDANGKY
  INSERT LEPHINAM
  INSERT HOSOBENHAN
COMMIT
```

Nếu một bước lỗi thì `ROLLBACK` toàn bộ.

## Ràng buộc chính
- PK cho mọi bảng.
- FK bảo đảm toàn vẹn tham chiếu.
- UNIQUE cho điện thoại bệnh nhân, mã hồ sơ.
- UNIQUE filtered index ngăn 2 lịch định kỳ cùng quý.
- CHECK cho trạng thái, quý, số tiền, thân nhiệt.
- Xét nghiệm/toa thuốc phải thuộc phiếu khám.
- Phiếu khám chuyển `Hoàn tất` qua nghiệp vụ thanh toán viện phí.
