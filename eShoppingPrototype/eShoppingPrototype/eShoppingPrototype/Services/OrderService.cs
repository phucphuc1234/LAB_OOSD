using System;
using System.Linq;
using eShoppingPrototype.Data;
using eShoppingPrototype.Models;

namespace eShoppingPrototype.Services
{
    public class OrderService : IOrderService
    {
        private readonly DonHangRepository _donHangRepo = new DonHangRepository();

        public bool TaoDonHang(DonDatHang donHang, out string message)
        {
            if (donHang == null)
            {
                message = "Dữ liệu đơn hàng không hợp lệ.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(donHang.MaKH))
            {
                message = "Mã khách hàng không được để trống.";
                return false;
            }

            if (donHang.ChiTietList == null || !donHang.ChiTietList.Any())
            {
                message = "Đơn hàng phải chứa ít nhất 1 sản phẩm.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(donHang.NguoiNhanInfo.HoTen) ||
                string.IsNullOrWhiteSpace(donHang.NguoiNhanInfo.DiaChi) ||
                string.IsNullOrWhiteSpace(donHang.NguoiNhanInfo.DienThoai))
            {
                message = "Thông tin người nhận (Họ tên, Địa chỉ, Số điện thoại) chưa đầy đủ.";
                return false;
            }

            donHang.TongTriGia = donHang.ChiTietList.Sum(x => x.SoLuong * x.DongGia);

            if (string.IsNullOrEmpty(donHang.MaDonHang))
            {
                donHang.MaDonHang = "DH" + DateTime.Now.ToString("yyyyMMddHHmmss");
            }

            bool isSuccess = _donHangRepo.LuuDonHangTransaction(donHang, out string dbError);

            if (!isSuccess)
            {
                message = "Lỗi khi lưu đơn hàng vào CSDL: " + dbError;
                return false;
            }

            message = $"Tạo đơn hàng {donHang.MaDonHang} thành công với tổng tiền {donHang.TongTriGia:N0} VNĐ!";
            return true;
        }
    }
}
