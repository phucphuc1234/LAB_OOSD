using System;
namespace DongA.Domain { public class QuyetDinhTuyenDung : QuyetDinh {
public DateTime ngayBatDauThuViec { get; set; }
public DateTime ngayKetThucThuViec { get; set; }
public decimal mucLuongThuViec { get; set; }
public string dieuKhoanHaiBen { get; set; }
public string ketQuaThuViec { get; set; }
public string maNhanVien { get; set; }
public string maPhongBan { get; set; }
} }