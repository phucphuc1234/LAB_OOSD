using System;
namespace DongA.Domain { public abstract class QuyetDinh {
public string soQuyetDinh { get; set; }
public DateTime? ngayKy { get; set; }
public DateTime ngayHieuLuc { get; set; }
public string noiDung { get; set; }
public string nguoiKy { get; set; }
public string trangThai { get; set; }
} }