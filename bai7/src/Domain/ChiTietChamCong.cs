using System;
namespace DongA.Domain { public class ChiTietChamCong {
public string maChiTietChamCong { get; set; }
public DateTime ngayChamCong { get; set; }
public TimeSpan? gioVao { get; set; }
public TimeSpan? gioRa { get; set; }
public decimal soGioLamThucTe { get; set; }
public string trangThaiDiLam { get; set; }
public string ghiChu { get; set; }
public string maBangChamCong { get; set; }
public string maNhanVien { get; set; }
public string maCa { get; set; }
} }