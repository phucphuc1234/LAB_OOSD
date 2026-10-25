using System;
namespace DongA.Domain { public class QuyetDinhChucVu : QuyetDinh {
public decimal phuCapChucVu { get; set; }
public DateTime? ngayKetThucHieuLuc { get; set; }
public string lyDoBoNhiem { get; set; }
public string maNhanVien { get; set; }
public string maChucVu { get; set; }
} }