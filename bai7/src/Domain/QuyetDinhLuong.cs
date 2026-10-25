using System;
namespace DongA.Domain { public class QuyetDinhLuong : QuyetDinh {
public decimal mucLuongCoBan { get; set; }
public decimal phuCapLuong { get; set; }
public decimal phuCapDocHai { get; set; }
public DateTime? ngayKetThucHieuLuc { get; set; }
public string lyDoDieuChinh { get; set; }
public string maNhanVien { get; set; }
} }