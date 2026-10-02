using System;
using System.Collections.Generic;

namespace eShoppingPrototype.Models
{
    public class DonDatHang
    {
        public string MaDonHang { get; set; }
        public DateTime ThoiDiemDat { get; set; } = DateTime.Now;
        public decimal TongTriGia { get; set; }
        public string TrangThai { get; set; } = "Đang xử lý";
        public string MaKH { get; set; }
        public string MaHinhThuc { get; set; }
        public string MaThanhToan { get; set; }
        public string SoThe { get; set; }
        
        public NguoiNhan NguoiNhanInfo { get; set; } = new NguoiNhan();
        public List<ChiTietDonHang> ChiTietList { get; set; } = new List<ChiTietDonHang>();
    }
}
