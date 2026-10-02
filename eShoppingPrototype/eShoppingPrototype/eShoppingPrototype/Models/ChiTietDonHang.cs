namespace eShoppingPrototype.Models
{
    public class ChiTietDonHang
    {
        public string MaDonHang { get; set; }
        public string MaSP { get; set; }
        public int SoLuong { get; set; }
        public decimal DongGia { get; set; }
        public decimal ThanhTien => SoLuong * DongGia;
    }
}
