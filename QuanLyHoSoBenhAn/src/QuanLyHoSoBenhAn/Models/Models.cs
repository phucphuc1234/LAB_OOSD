using System;

namespace QuanLyHoSoBenhAn.Models
{
    public class BenhNhan
    {
        public int MaBenhNhan { get; set; }
        public string HoTen { get; set; }
        public string DiaChi { get; set; }
        public DateTime NgaySinh { get; set; }
        public string DienThoai { get; set; }
        public string Anh3x4 { get; set; }
    }

    public class PhieuKham
    {
        public int MaPhieuKham { get; set; }
        public int MaHoSo { get; set; }
        public int MaBacSi { get; set; }
        public int MaKhoa { get; set; }
        public string LoaiKham { get; set; }
        public string TrieuChung { get; set; }
        public decimal? ThanNhiet { get; set; }
        public string HuyetAp { get; set; }
        public string ChanDoan { get; set; }
    }

    public class ChiTietToaThuoc
    {
        public string TenThuoc { get; set; }
        public string LieuDung { get; set; }
        public int SoLuong { get; set; }
        public string CachDung { get; set; }
    }

    public class DangKyResult
    {
        public int MaBenhNhan { get; set; }
        public int MaHoSo { get; set; }
        public string MaHoSoCode { get; set; }
    }
}
