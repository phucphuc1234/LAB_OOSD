using System;
using System.Collections.Generic;
using System.Windows.Forms;
using eShoppingPrototype.Models;
using eShoppingPrototype.Services;

namespace eShoppingPrototype.UI
{
    public partial class FormCheckout : Form
    {
        private readonly IOrderService _orderService;
        private List<ChiTietDonHang> _cartItems;

        public FormCheckout()
        {
            InitializeComponent();
            _orderService = new OrderService();
            LoadMockCartData();
        }

        private void LoadMockCartData()
        {
            _cartItems = new List<ChiTietDonHang>
            {
                new ChiTietDonHang { MaSP = "SP01", SoLuong = 1, DongGia = 29990000 },
                new ChiTietDonHang { MaSP = "SP04", SoLuong = 2, DongGia = 8490000 }
            };

            dgvCart.DataSource = _cartItems;
        }

        private void btnDatHang_Click(object sender, EventArgs e)
        {
            var donHang = new DonDatHang
            {
                MaKH = txtMaKH.Text.Trim(),
                MaHinhThuc = "HTGH01",
                SoThe = txtSoThe.Text.Trim(),
                NguoiNhanInfo = new NguoiNhan
                {
                    HoTen = txtNguoiNhanHoTen.Text.Trim(),
                    DiaChi = txtNguoiNhanDiaChi.Text.Trim(),
                    DienThoai = txtNguoiNhanDienThoai.Text.Trim()
                },
                ChiTietList = _cartItems
            };

            bool result = _orderService.TaoDonHang(donHang, out string responseMessage);

            if (result)
            {
                MessageBox.Show(responseMessage, "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Information);
                this.Close();
            }
            else
            {
                MessageBox.Show(responseMessage, "Lỗi đặt hàng", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
